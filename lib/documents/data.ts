import "server-only"
import { appendSheetRow, getSheetHeaders, getSheetRows, updateSheetCells } from "@/lib/google/sheets"
import { deleteDriveFile, getDriveFileSize, uploadPrivateFileToDrive } from "@/lib/google/drive"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getFederationOptions } from "@/lib/federations/options"
import { getActivities, getActors } from "@/lib/activites/data"
import { getCompetitions } from "@/lib/competitions/data"
import { getNationalTeams } from "@/lib/equipes-nationales/data"
import { getDocumentsDriveFolderId, getDocumentsSpreadsheetId } from "./config"
import { DOCUMENT_ENTITY_TYPES, DOCUMENT_HEADERS, type DocumentEntityType, type DocumentOption, type DocumentRecord, type DocumentReferences } from "./types"
import { assertPdfSignature, safeDriveFileName, validateDocumentInput } from "./validation"

const SHEET_NAME = "DOCUMENTS"
const DOCUMENT_SHEET_HEADERS = ["id_document", "nom_document", "id_type_document", "date_document", "id_entite_origine", "type_objet_lie", "id_objet_lie", "version", "drive_document_id", "observation"] as const
const clean = (value: unknown) => String(value ?? "").trim()
const mapDocument = (row: Record<string, string>) => ({ ...Object.fromEntries(DOCUMENT_HEADERS.map((header) => [header, clean(row[header])])), type_entite_liee: clean(row.type_objet_lie), id_entite_liee: clean(row.id_objet_lie), note: clean(row.observation), observations: clean(row.observation), drive_document_url: row.drive_document_id ? `https://drive.google.com/file/d/${row.drive_document_id}/view` : "" }) as DocumentRecord

async function assertDocumentHeaders() {
  const headers = await getSheetHeaders({ sheetName: SHEET_NAME, spreadsheetId: getDocumentsSpreadsheetId() })
  const missing = DOCUMENT_SHEET_HEADERS.filter((header) => !headers.includes(header))
  if (missing.length) throw new Error(`Colonnes Documents manquantes : ${missing.join(", ")}`)
}

export async function getDocuments(options: { fresh?: boolean } = {}) {
  const rows = await getSheetRows({ sheetName: SHEET_NAME, spreadsheetId: getDocumentsSpreadsheetId(), bypassCache: options.fresh })
  await assertDocumentHeaders()
  const documents = rows.map(mapDocument).filter((document) => document.id_document)
  const sizes = await Promise.all(documents.map((document) => document.drive_document_id ? getDriveFileSize(document.drive_document_id).catch(() => "") : Promise.resolve("")))
  return documents.map((document, index) => ({ ...document, taille: sizes[index] }))
}

export async function getDocument(id: string) {
  // Une fiche est souvent ouverte immédiatement après sa création. Cette
  // lecture doit éviter un cache d'une autre instance serveur encore ancien.
  return (await getDocuments({ fresh: true })).find((document) => document.id_document === clean(id))
}

export async function getDocumentsForEntity(type: string, id: string) {
  const normalizedType = clean(type).toUpperCase()
  return (await getDocuments()).filter((document) => document.type_entite_liee === normalizedType && document.id_entite_liee === clean(id))
}

async function getDocumentTypes(): Promise<{ options: DocumentOption[]; available: boolean }> {
  try {
    const rows = await getSheetRows({ sheetName: "TYPES_DOCUMENT", spreadsheetId: getReferentialSpreadsheetId() })
    return { options: rows.filter((row) => row.id_type_document).map((row) => ({ id: clean(row.id_type_document), label: clean(row.nom_type_document) || clean(row.id_type_document) })), available: true }
  } catch {
    return { options: [], available: false }
  }
}

export async function getDocumentReferences(): Promise<DocumentReferences> {
  const safeReference = async <T,>(request: Promise<T>, fallback: T) => request.catch(() => fallback)
  const [documentTypes, activities, competitions, nationalTeams, officials, federations, entities] = await Promise.all([
    getDocumentTypes(),
    safeReference(getActivities(), []),
    safeReference(getCompetitions(), []),
    safeReference(getNationalTeams(), []),
    safeReference(getActors("OFFICIEL"), []),
    safeReference(getFederationOptions(), []),
    safeReference(getSheetRows({ sheetName: "ENTITES", spreadsheetId: getReferentialSpreadsheetId() }), []),
  ])
  const options: Record<DocumentEntityType, DocumentOption[]> = {
    ACTIVITE: activities.map((item) => ({ id: item.id_activite, label: item.nom_activite })),
    COMPETITION: competitions.map((item) => ({ id: item.id_competition, label: item.nom_competition })),
    EQUIPE_NATIONALE: nationalTeams.map((item) => ({ id: item.id_equipe_nationale, label: item.nom_equipe_nationale })),
    OFFICIEL: officials,
    FEDERATION: federations.map((item) => ({ id: item.id, label: item.nom, secondary: item.sigle })),
    ENTITE: entities.filter((item) => item.id_entite).map((item) => ({ id: clean(item.id_entite), label: clean(item.nom_officiel) || clean(item.id_entite), secondary: clean(item.sigle) })),
  }
  return {
    documentTypes: documentTypes.options,
    hasDocumentTypeReferential: documentTypes.available,
    entityTypes: [
      { id: "ACTIVITE", label: "Activité" }, { id: "COMPETITION", label: "Compétition" }, { id: "EQUIPE_NATIONALE", label: "Équipe nationale" }, { id: "OFFICIEL", label: "Officiel" },
      { id: "FEDERATION", label: "Fédération" }, { id: "ENTITE", label: "Entité" },
    ],
    entities: Object.fromEntries(DOCUMENT_ENTITY_TYPES.map((type) => [type, options[type].sort((a, b) => a.label.localeCompare(b.label, "fr"))])) as Record<DocumentEntityType, DocumentOption[]>,
  }
}

async function validateReferences(row: ReturnType<typeof validateDocumentInput>) {
  const references = await getDocumentReferences()
  if (references.hasDocumentTypeReferential && !references.documentTypes.some((type) => type.id === row.id_type_document)) throw new Error("Type de document inconnu.")
  if (row.type_entite_liee) {
    const options = references.entities[row.type_entite_liee as DocumentEntityType]
    if (!options.some((option) => option.id === row.id_entite_liee)) throw new Error("Objet lié introuvable.")
  }
}

function nextDocumentId(rows: DocumentRecord[]) {
  const max = rows.reduce((value, row) => {
    const match = row.id_document.match(/^DOC(\d+)$/i)
    return match ? Math.max(value, Number(match[1])) : value
  }, 0)
  return `DOC${String(max + 1).padStart(4, "0")}`
}

export async function createDocument(input: Record<string, unknown>, pdf?: Buffer) {
  const row = validateDocumentInput(input)
  await validateReferences(row)
  // La génération du prochain ID doit toujours partir de la feuille à jour.
  const existing = await getDocuments({ fresh: true })
  const id = nextDocumentId(existing)
  if (existing.some((document) => document.id_document === id)) throw new Error("Impossible de générer un identifiant document unique.")
  let uploaded: { fileId: string; url: string } | undefined
  if (pdf) {
    assertPdfSignature(pdf)
    uploaded = await uploadPrivateFileToDrive({ fileName: safeDriveFileName(id, row.id_type_document, row.nom_document), mimeType: "application/pdf", buffer: pdf, folderId: getDocumentsDriveFolderId() })
  }
  const created: DocumentRecord = { id_document: id, ...row, taille: pdf ? String(pdf.byteLength) : "", drive_document_id: uploaded?.fileId || "", drive_document_url: uploaded?.url || "" }
  const sheetRow = { id_document: id, nom_document: row.nom_document, id_type_document: row.id_type_document, date_document: new Date().toISOString().slice(0, 10), id_entite_origine: "", type_objet_lie: row.type_entite_liee, id_objet_lie: row.id_entite_liee, version: "1", drive_document_id: uploaded?.fileId || "", observation: row.observations || row.note }
  try {
    await appendSheetRow({ sheetName: SHEET_NAME, spreadsheetId: getDocumentsSpreadsheetId(), row: sheetRow })
  } catch (error) {
    if (uploaded) await deleteDriveFile(uploaded.fileId).catch(() => undefined)
    throw error
  }
  return created
}

export async function updateDocument(id: string, input: Record<string, unknown>) {
  const current = await getDocument(id)
  if (!current) throw new Error("Document introuvable.")
  const row = validateDocumentInput(input)
  await validateReferences(row)
  await updateSheetCells({ sheetName: SHEET_NAME, spreadsheetId: getDocumentsSpreadsheetId(), idColumn: "id_document", idValue: current.id_document, updates: [
    { column: "nom_document", value: row.nom_document }, { column: "id_type_document", value: row.id_type_document }, { column: "type_objet_lie", value: row.type_entite_liee }, { column: "id_objet_lie", value: row.id_entite_liee }, { column: "observation", value: row.observations || row.note },
  ] })
  return { ...current, ...row }
}

export async function replaceDocumentFile(id: string, pdf: Buffer) {
  assertPdfSignature(pdf)
  const current = await getDocument(id)
  if (!current) throw new Error("Document introuvable.")
  const uploaded = await uploadPrivateFileToDrive({ fileName: safeDriveFileName(current.id_document, current.id_type_document, current.nom_document), mimeType: "application/pdf", buffer: pdf, folderId: getDocumentsDriveFolderId() })
  try {
    await updateSheetCells({ sheetName: SHEET_NAME, spreadsheetId: getDocumentsSpreadsheetId(), idColumn: "id_document", idValue: current.id_document, updates: [
      { column: "drive_document_id", value: uploaded.fileId },
    ] })
  } catch (error) {
    await deleteDriveFile(uploaded.fileId).catch(() => undefined)
    throw error
  }
  if (current.drive_document_id && current.drive_document_id !== uploaded.fileId) await deleteDriveFile(current.drive_document_id).catch((error) => console.error("Ancien document Drive non supprimé", error))
  return { ...current, taille: String(pdf.byteLength), drive_document_id: uploaded.fileId, drive_document_url: uploaded.url }
}

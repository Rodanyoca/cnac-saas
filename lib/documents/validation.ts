import { DOCUMENT_ENTITY_TYPES, type DocumentEntityType } from "./types.ts"
import { DOCUMENT_PDF_MAX_SIZE_BYTES, DOCUMENT_PDF_MAX_SIZE_MB } from "./limits.ts"

const clean = (value: unknown) => String(value ?? "").trim()

export function validateDocumentInput(input: Record<string, unknown>) {
  const row = {
    nom_document: clean(input.nom_document),
    id_type_document: clean(input.id_type_document).toUpperCase(),
    type_entite_liee: clean(input.type_entite_liee).toUpperCase(),
    id_entite_liee: clean(input.id_entite_liee),
    note: clean(input.note),
    observations: clean(input.observations),
  }
  if (!row.nom_document) throw new Error("Le nom du document est obligatoire.")
  if (!row.id_type_document) throw new Error("Le type de document est obligatoire.")
  if (!!row.type_entite_liee !== !!row.id_entite_liee) throw new Error("Le type de rattachement et l’objet lié doivent être renseignés ensemble.")
  if (row.type_entite_liee && !DOCUMENT_ENTITY_TYPES.includes(row.type_entite_liee as DocumentEntityType)) throw new Error("Type de rattachement non pris en charge.")
  return row
}

export function validatePdf(file: File) {
  if (file.size > DOCUMENT_PDF_MAX_SIZE_BYTES) {
    throw new Error(`Le fichier dépasse la taille maximale de ${DOCUMENT_PDF_MAX_SIZE_MB} Mo.`)
  }
  if (file.size < 5) throw new Error("Le fichier PDF est vide ou invalide.")
}

export function assertPdfSignature(buffer: Buffer) {
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("Le fichier sélectionné n’est pas un PDF valide.")
}

export function safeDriveFileName(id: string, type: string, name: string) {
  const slug = `${id}_${type}_${name}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9_-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 120)
  return `${slug || id}.pdf`
}

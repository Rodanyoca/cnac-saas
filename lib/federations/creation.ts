import "server-only"
import { CnacDataError } from "@/lib/cnac/model"
import { deleteDriveFile, uploadFileToDrive } from "@/lib/google/drive"
import { appendSheetRow, getSheetsRows } from "@/lib/cnac/sheets"
import { cnacUploadAvailability } from "@/lib/cnac/media-config"
import { getFederationLogosFolderId, getReferentialSpreadsheetId } from "./config"
import { hasValidFederationLogoSignature, validateFederationLogo } from "./logo"
import { FederationCreationError, nextSequentialId, normalizeFederationCreation, validateFederationCreation } from "./creation-model"

const queues = new Map<string, Promise<unknown>>()
const completed = new Map<string, Awaited<ReturnType<typeof createFederationRecord>>>()
export async function getFederationCreationReferences() {
  const rows = await getSheetsRows({ sheetNames: ["CATEGORIES_ENTITES", "SPORTS", "ENTITES"], spreadsheetId: getReferentialSpreadsheetId(), cacheTtlMs: 5000 })
  return { categories: rows.CATEGORIES_ENTITES.filter((r) => r.id_categorie_entite).map((r) => ({ id: r.id_categorie_entite, label: r.nom_categorie_entite })), sports: rows.SPORTS.filter((r) => r.id_sport).map((r) => ({ id: r.id_sport, label: r.nom_sport })), entities: rows.ENTITES.filter((r) => r.id_entite).map((r) => ({ id: r.id_entite, categoryId: r.id_categorie_entite, name: r.nom_officiel, acronym: r.sigle })) }
}

async function createFederationRecord(input: Record<string, unknown>, logo?: File) {
  if (logo && !cnacUploadAvailability().logo) throw new FederationCreationError("La gestion des logos n’est pas encore activée pour le CNAC.", "logo")
    const spreadsheetId = getReferentialSpreadsheetId(), row = normalizeFederationCreation(input)
    validateFederationCreation(row)
    const data = await getSheetsRows({ sheetNames: ["ENTITES", "FEDERATIONS", "CATEGORIES_ENTITES", "SPORTS"], spreadsheetId, cacheTtlMs: 0 })
    if (!data.CATEGORIES_ENTITES.some((item) => item.id_categorie_entite === row.id_categorie_entite)) throw new FederationCreationError("La catégorie sélectionnée n’existe pas.", "id_categorie_entite")
    if (!data.SPORTS.some((item) => item.id_sport === row.id_sport)) throw new FederationCreationError("Le sport sélectionné n’existe pas.", "id_sport")
    const entityIds = new Set(data.ENTITES.map((item) => item.id_entite))
    if (row.id_entite_continentale && !entityIds.has(row.id_entite_continentale)) throw new FederationCreationError("La fédération continentale n’existe pas.", "id_entite_continentale")
    if (row.id_entite_internationale && !entityIds.has(row.id_entite_internationale)) throw new FederationCreationError("La fédération internationale n’existe pas.", "id_entite_internationale")
    const normalizedName = row.nom_officiel.toLocaleUpperCase("fr"), normalizedAcronym = row.sigle.toLocaleUpperCase("fr")
    if (data.ENTITES.some((item) => item.nom_officiel.trim().toLocaleUpperCase("fr") === normalizedName)) throw new FederationCreationError("Une fédération portant ce nom officiel existe déjà.", "nom_officiel")
    if (normalizedAcronym && data.ENTITES.some((item) => item.sigle.trim().toLocaleUpperCase("fr") === normalizedAcronym)) throw new FederationCreationError("Une fédération portant ce sigle existe déjà.", "sigle")
    const idEntity = nextSequentialId(data.ENTITES, "id_entite", "RDCENT"), idFederation = nextSequentialId(data.FEDERATIONS, "id_federation", "FED")
    let uploaded: { fileId: string; url: string } | undefined, entityCreated = false
    try {
      if (logo) { const valid = validateFederationLogo(logo); if (!valid.ok) throw new FederationCreationError(valid.error, "logo"); const buffer = Buffer.from(await logo.arrayBuffer()); if (!hasValidFederationLogoSignature(buffer, logo.type)) throw new FederationCreationError("Le contenu du logo n’est pas une image autorisée.", "logo"); uploaded = await uploadFileToDrive({ fileName: `LOGO_FEDERATION_${idFederation}.${logo.type === "image/png" ? "png" : logo.type === "image/webp" ? "webp" : "jpg"}`, mimeType: logo.type, buffer, folderId: getFederationLogosFolderId() }) }
      await appendSheetRow({ sheetName: "ENTITES", spreadsheetId, row: { id_entite: idEntity, id_categorie_entite: row.id_categorie_entite, nom_officiel: row.nom_officiel, sigle: row.sigle, adresse_siege: row.adresse_siege, telephone: row.telephone, email: row.email, site_web: row.site_web, statut: row.statut, observations: row.observations } }); entityCreated = true
      await appendSheetRow({ sheetName: "FEDERATIONS", spreadsheetId, row: { id_federation: idFederation, id_entite: idEntity, id_sport: row.id_sport, statut_reconnaissance_ministere: row.statut_reconnaissance_ministere, date_reconnaissance_nationale: row.date_reconnaissance_nationale, statut_affiliation_coc: row.statut_affiliation_coc, date_affiliation_coc: row.date_affiliation_coc, id_entite_continentale: row.id_entite_continentale, date_affiliation_continentale: row.date_affiliation_continentale, id_entite_internationale: row.id_entite_internationale, date_affiliation_internationale: row.date_affiliation_internationale, statut: row.statut, observations: row.observations } })
      const confirmed = await getSheetsRows({ sheetNames: ["ENTITES", "FEDERATIONS"], spreadsheetId, cacheTtlMs: 0 })
      if (!confirmed.ENTITES.some((item) => item.id_entite === idEntity) || !confirmed.FEDERATIONS.some((item) => item.id_federation === idFederation && item.id_entite === idEntity)) throw new Error("Écriture non confirmée.")
      return { id_federation: idFederation, id_entite: idEntity, nom_federation: row.nom_officiel, sigle_federation: row.sigle, categorie_entite: data.CATEGORIES_ENTITES.find((item) => item.id_categorie_entite === row.id_categorie_entite)?.nom_categorie_entite || "", nom_sport: data.SPORTS.find((item) => item.id_sport === row.id_sport)?.nom_sport || "", logo_drive_id: uploaded?.fileId || "", logo_drive_url: uploaded?.url || "", ...row }
    } catch (error) {
      if(entityCreated)throw new CnacDataError("PARTIAL_CREATION",`Création non confirmée complètement (${idEntity}, ${idFederation}). Vérifier les deux feuilles avant de réessayer ; les données et fichiers créés sont conservés.`,502)
      if(uploaded)await deleteDriveFile(uploaded.fileId).catch(()=>undefined)
      throw error
    }
}

export async function createFederation(input: Record<string, unknown>, requestId: string, logo?: File) {
  if (!requestId) throw new FederationCreationError("request_id obligatoire.")
  const previous = queues.get(requestId) ?? Promise.resolve()
  const operation = previous.then(async () => { const cached = completed.get(requestId); if (cached) return cached; const result = await createFederationRecord(input, logo); completed.set(requestId, result); if (completed.size > 500) completed.delete(completed.keys().next().value!); return result })
  queues.set(requestId, operation)
  try { return await operation } finally { if (queues.get(requestId) === operation) queues.delete(requestId) }
}

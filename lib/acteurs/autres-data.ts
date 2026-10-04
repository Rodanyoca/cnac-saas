import "server-only"
import { getActeursSpreadsheetId } from "./config"
import { ACTOR_SHEETS } from "./sheets"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getSheetRows, getSheetsRows } from "@/lib/cnac/sheets"
import { mapOtherActorRow, type OtherActorReferences, type OtherActorView } from "./autres-model"

const REFERENCE_SHEETS = ["ENTITES", "FEDERATIONS", "CATEGORIES_ENTITES", "SEXES"] as const

async function loadOtherActorReferences() {
  const spreadsheetId = getReferentialSpreadsheetId()
  return getSheetsRows({ sheetNames: [...REFERENCE_SHEETS], spreadsheetId, cacheTtlMs: 5000 })
}

export async function loadOtherActors(): Promise<{ actors: OtherActorView[]; references: OtherActorReferences }> {
  const [rows, refs] = await Promise.all([
    getSheetRows({ sheetName: ACTOR_SHEETS.AUTRE, spreadsheetId: getActeursSpreadsheetId(), bypassCache: true }),
    loadOtherActorReferences(),
  ])
  const categories = new Map(refs.CATEGORIES_ENTITES.map((row) => [row.id_categorie_entite, row.nom_categorie_entite]))
  const entities = refs.ENTITES.filter((row) => row.id_entite).map((row) => ({ id: row.id_entite, name: row.nom_entite || row.nom_officiel || "", acronym: row.sigle_entite || row.sigle || "", category: categories.get(row.id_categorie_entite) || "", address: row.adresse_siege || "", phone: row.telephone || "", email: row.email || "", website: row.site_web || "" }))
  const entityById = new Map(entities.map((entity) => [entity.id, entity]))
  const federations = refs.FEDERATIONS.filter((row) => row.id_federation).map((row) => { const entity = entityById.get(row.id_entite); return { id: row.id_federation, entityId: row.id_entite || "", name: entity?.name || "", acronym: entity?.acronym || "" } })
  const federationByEntity = new Map(federations.map((federation) => [federation.entityId, federation]))
  const mapped = rows.map(mapOtherActorRow).filter((row) => row.id_autre_acteur_coc)
  const actors = mapped.map((row) => { const entity = entityById.get(row.id_entite); const federation = federationByEntity.get(row.id_entite); return { ...row, entiteNom: entity?.name || (row.id_entite ? `Référence inconnue (${row.id_entite})` : ""), entiteSigle: entity?.acronym || "", federationId: federation?.id || "", federationNom: federation?.name || "", federationSigle: federation?.acronym || "" } }).sort((a, b) => a.nom_complet.localeCompare(b.nom_complet, "fr"))
  return { actors, references: { entities, federations, functions: [...new Set(mapped.map((row) => row.type_autre_acteur).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")), sexes: refs.SEXES.filter((row) => ["01","02"].includes(row.id_sexe)).map((row) => ({ id: row.id_sexe, label: row.nom_sexe || row.id_sexe })), statuses: [...new Set(["ACTIF", "INACTIF", ...mapped.map((row) => row.statut).filter(Boolean)])] } }
}

export async function loadOtherActor(id: string) {
  const data = await loadOtherActors()
  return { actor: data.actors.find((actor) => actor.id_autre_acteur_coc === id), references: data.references }
}

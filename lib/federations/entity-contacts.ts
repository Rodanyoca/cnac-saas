import "server-only"
import { randomUUID } from "node:crypto"
import { CnacDataError, booleanCell } from "@/lib/cnac/model"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { appendSheetRow, getSheetRows, getSheetsRows, updateSheetCells } from "@/lib/cnac/sheets"
import { getReferentialSpreadsheetId, getTerritorialSpreadsheetId } from "./config"
import { CONTACT_ACTOR_TYPES, ENTITY_CONTACT_SHEET, normalizeContactInput, validateContactRules, type ContactActorTypeId, type EntityContact } from "./entity-contacts-model"

const actorSheets = Object.values(CONTACT_ACTOR_TYPES).map((item) => item.sheet)

async function sources() {
  const [contacts, refs, actors] = await Promise.all([
    getSheetRows({ sheetName: ENTITY_CONTACT_SHEET, spreadsheetId: getTerritorialSpreadsheetId(), bypassCache: true }),
    getSheetsRows({ sheetNames: ["ENTITES", "FEDERATIONS", "TYPES_ACTEURS"], spreadsheetId: getReferentialSpreadsheetId() }),
    getSheetsRows({ sheetNames: actorSheets, spreadsheetId: getActeursSpreadsheetId() }),
  ])
  return { contacts, refs, actors }
}

function attached(row: Record<string, string>, type: ContactActorTypeId, entityId: string, refs: Record<string, Record<string, string>[]>) {
  if (type === "TYPACT002" || type === "TYPACT004") return refs.FEDERATIONS.some((fed) => fed.id_federation === row.id_federation && fed.id_entite === entityId)
  if (type === "TYPACT003" || type === "TYPACT006") return row.id_entite === entityId
  return row.id_entite === entityId
}

function actorFor(id: string, type: ContactActorTypeId, actors: Record<string, Record<string, string>[]>) {
  const config = CONTACT_ACTOR_TYPES[type]
  return actors[config.sheet].find((row) => row[config.idColumn] === id)
}

export async function getEntityContactData(entityId: string) {
  const data = await sources()
  if (!data.refs.ENTITES.some((row) => row.id_entite === entityId)) throw new CnacDataError("CONTACT_INVALID", "Entité introuvable.")
  const options = Object.entries(CONTACT_ACTOR_TYPES).flatMap(([typeId, config]) => data.actors[config.sheet]
    .filter((row) => attached(row, typeId as ContactActorTypeId, entityId, data.refs))
    .map((row) => ({ id: row[config.idColumn], typeId, nom: row.nom_complet || "Non renseigné" })).filter((row) => row.id))
  const contacts: EntityContact[] = data.contacts.filter((row) => row.id_entite === entityId).map((row) => {
    const type = row.id_type_acteur as ContactActorTypeId
    const actor = type in CONTACT_ACTOR_TYPES ? actorFor(row.id_acteur_coc, type, data.actors) : undefined
    return { ...row, est_contact_principal: booleanCell(row.est_contact_principal), statut: row.statut, nom_complet: actor?.nom_complet || "", telephone: actor?.telephone || "", email: actor?.email || "", type_acteur: CONTACT_ACTOR_TYPES[type]?.label || row.id_type_acteur } as EntityContact
  })
  return { contacts, options, types: Object.entries(CONTACT_ACTOR_TYPES).map(([id, item]) => ({ id, label: item.label })) }
}

async function validate(input: Record<string, unknown>, currentId = "") {
  const row = normalizeContactInput(input), data = await sources()
  try { validateContactRules(row, data.contacts, currentId) } catch (error) {
    throw new CnacDataError("CONTACT_INVALID", error instanceof Error ? error.message : "Contact invalide.", 400)
  }
  if (!data.refs.ENTITES.some((item) => item.id_entite === row.id_entite)) throw new CnacDataError("CONTACT_INVALID", "Entité introuvable.")
  const type = row.id_type_acteur as ContactActorTypeId
  const actor = actorFor(row.id_acteur_coc, type, data.actors)
  if (!actor) throw new CnacDataError("CONTACT_INVALID", "L’acteur n’existe pas ou son identifiant est incompatible avec le type sélectionné.")
  if (!attached(actor, type, row.id_entite, data.refs)) throw new CnacDataError("CONTACT_INVALID", "Cet acteur n’est pas rattaché à l’entité.")
  return { row, data }
}


export async function createEntityContact(input: Record<string, unknown>) {
  const { row } = await validate(input)
  const created = { id_contact_entite: `PCE-${randomUUID()}`, ...row, est_contact_principal: row.est_contact_principal ? "TRUE" : "FALSE" }
  await appendSheetRow({ sheetName: ENTITY_CONTACT_SHEET, spreadsheetId: getTerritorialSpreadsheetId(), row: created })
  return getEntityContactData(row.id_entite)
}

export async function updateEntityContact(id: string, input: Record<string, unknown>) {
  const currentRows = await getSheetRows({ sheetName: ENTITY_CONTACT_SHEET, spreadsheetId: getTerritorialSpreadsheetId(), bypassCache: true })
  const current = currentRows.find((row) => row.id_contact_entite === id)
  if (!current) throw new CnacDataError("CONTACT_INVALID", "Relation de contact introuvable.")
  const { row } = await validate({ ...current, ...input, id_entite: current.id_entite }, id)
  await updateSheetCells({ sheetName: ENTITY_CONTACT_SHEET, spreadsheetId: getTerritorialSpreadsheetId(), idColumn: "id_contact_entite", idValue: id, updates: Object.entries({ ...row, est_contact_principal: row.est_contact_principal ? "TRUE" : "FALSE" }).map(([column, value]) => ({ column, value: String(value) })) })
  return getEntityContactData(row.id_entite)
}

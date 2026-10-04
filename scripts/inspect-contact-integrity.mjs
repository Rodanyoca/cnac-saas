import { google } from "googleapis"

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
})
const api = google.sheets({ version: "v4", auth })
const read = async (spreadsheetId, sheetName) => {
  const response = await api.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName.replaceAll("'", "''")}'!A:ZZ` })
  const rows = response.data.values ?? []
  const headers = rows.shift() ?? []
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? "").trim()]))).filter((row) => Object.values(row).some(Boolean))
}
const territorialId = process.env.GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID
const referentialId = process.env.GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID
const actorsId = process.env.GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID
const affiliationsId = process.env.GOOGLE_SHEETS_ACTEURS_AFFILIATIONS_SPREADSHEET_ID
const [contacts, entities, federations, types, athletes, coaches, officials, doctors, referees, others, affiliations] = await Promise.all([
  read(territorialId, "PERSONNES_CONTACT_ENTITES"), read(referentialId, "ENTITES"), read(referentialId, "FEDERATIONS"), read(referentialId, "TYPES_ACTEURS"),
  read(actorsId, "ATHLETES"), read(actorsId, "COACHS"), read(actorsId, "OFFICIELS"), read(actorsId, "MEDECINS"), read(actorsId, "ARBITRES"), read(actorsId, "AUTRES"), read(affiliationsId, "OFFICIELS_AFFILIATIONS"),
])
const entityIds = new Set(entities.map((row) => row.id_entite).filter(Boolean))
const actorSets = new Map([
  ["TYPACT001", new Set(athletes.map((row) => row.id_athlete_coc).filter(Boolean))],
  ["TYPACT002", new Set(coaches.map((row) => row.id_coach_coc).filter(Boolean))],
  ["TYPACT003", new Set(doctors.map((row) => row.id_medecin_coc).filter(Boolean))],
  ["TYPACT004", new Set(referees.map((row) => row.id_arbitre_coc).filter(Boolean))],
  ["TYPACT005", new Set(officials.map((row) => row.id_officiel_coc).filter(Boolean))],
  ["TYPACT006", new Set(others.map((row) => row.id_autre_acteur_coc).filter(Boolean))],
])
const invalidEntities = contacts.filter((row) => !entityIds.has(row.id_entite))
const invalidActors = contacts.filter((row) => !actorSets.get(row.id_type_acteur)?.has(row.id_acteur_coc))
const meaningfulContacts = contacts.filter((row) => row.id_entite && row.id_acteur_coc)
const byEntity = new Map()
for (const row of meaningfulContacts) byEntity.set(row.id_entite, (byEntity.get(row.id_entite) ?? 0) + 1)
console.log(`ENTITES=${entities.length}; FEDERATIONS=${federations.length}; TYPES_ACTEURS=${types.length}; CONTACT_ROWS=${contacts.length}; MEANINGFUL_CONTACTS=${meaningfulContacts.length}; CONTACT_ENTITIES=${byEntity.size}`)
console.log(`INVALID_ENTITY_REFERENCES=${meaningfulContacts.filter((row) => !entityIds.has(row.id_entite)).length}; INVALID_ACTOR_REFERENCES=${meaningfulContacts.filter((row) => !actorSets.get(row.id_type_acteur)?.has(row.id_acteur_coc)).length}; OFFICIAL_AFFILIATIONS=${affiliations.length}`)
console.log(`CONTACT_STATUS=${JSON.stringify(Object.fromEntries([...new Set(meaningfulContacts.map((row) => row.statut || "VIDE"))].map((status) => [status, meaningfulContacts.filter((row) => (row.statut || "VIDE") === status).length])))}`)
console.log(`CONTACT_TYPES=${JSON.stringify(Object.fromEntries([...new Set(meaningfulContacts.map((row) => row.id_type_acteur || "VIDE"))].map((type) => [type, meaningfulContacts.filter((row) => (row.id_type_acteur || "VIDE") === type).length])))}`)
console.log(`FEDERATION_ENTITIES=${JSON.stringify(federations.map((row) => ({ id_federation: row.id_federation, id_entite: row.id_entite })).filter((row) => row.id_entite))}`)
console.log(`NON_EMPTY_CONTACTS=${JSON.stringify(meaningfulContacts.map((row) => ({ id_entite: row.id_entite, id_type_acteur: row.id_type_acteur, id_acteur_coc: row.id_acteur_coc, statut: row.statut })))}`)
console.log(`SAMPLE_ENTITY_CONTACT_COUNTS=${JSON.stringify([...byEntity.entries()].slice(0, 10))}`)

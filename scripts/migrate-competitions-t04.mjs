import { google } from "googleapis"
import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const apply = process.argv.includes("--apply")
const stamp = new Date().toISOString().replace(/[:.]/g, "-")
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
})
const sheets = google.sheets({ version: "v4", auth })
const drive = google.drive({ version: "v3", auth })
const ids = {
  competitions: process.env.GOOGLE_SHEETS_COMPETITIONS_SPREADSHEET_ID,
  teams: process.env.GOOGLE_SHEETS_EQUIPES_NATIONALES_SPREADSHEET_ID,
  refs: process.env.GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID,
}
if (Object.values(ids).some((value) => !value)) throw new Error("Identifiant de classeur manquant")

const headers = {
  ENGAGEMENTS_CAMPAGNES_PROGRAMMES: ["id_engagement_campagne", "id_programme_competition", "id_campagne", "id_statut_engagement", "date_engagement", "date_debut", "date_fin", "id_federation_source", "date_transmission", "reference_source", "observation"],
  PARTICIPATIONS_ATHLETES_COMPETITION: ["id_participation_athlete", "id_engagement_campagne", "id_selection", "id_statut_participation", "date_statut", "id_selection_remplacement", "observation"],
  RESULTATS: ["id_resultat", "id_resultat_logique", "numero_version", "id_resultat_precedent", "est_version_courante", "id_engagement_campagne", "id_programme_competition", "date_resultat", "phase", "adversaire", "pays_adversaire", "id_resultat_synthetique", "valeur_rdc", "valeur_adversaire", "id_unite_mesure", "id_decision_resultat", "id_federation_source", "date_transmission", "reference_source", "id_statut_validation_resultat", "date_validation", "id_validateur_coc", "motif_correction", "observation"],
  SELECTIONS_ATHLETES: ["id_selection", "id_campagne", "id_athlete", "id_poste", "id_categorie_poids", "id_grade_sportif", "numero_maillot", "date_selection", "id_statut_selection", "observation"],
}

const refRows = {
  TYPES_COMPETITION: [["id_type_competition", "nom_type_competition", "portee_sportive", "niveau_competition", "description", "statut", "observations"], ["TCOMP_JEUX_MULTISPORTS", "Jeux multisports", "MULTISPORTS", "", "", "ACTIF", ""], ["TCOMP_CHAMPIONNAT", "Championnat", "MONOSPORT", "", "", "ACTIF", ""], ["TCOMP_COUPE", "Coupe", "MONOSPORT", "", "", "ACTIF", ""], ["TCOMP_TOURNOI", "Tournoi", "MONOSPORT", "", "", "ACTIF", ""], ["TCOMP_QUALIFICATION", "Qualification", "MONOSPORT", "", "", "ACTIF", ""], ["TCOMP_RENCONTRE_AMICALE", "Rencontre amicale", "MONOSPORT", "", "", "ACTIF", ""]],
  NIVEAUX_COMPETITION: [["id_niveau_competition", "nom_niveau_competition", "observation"], ["NIV_INTERNATIONAL", "International", ""], ["NIV_CONTINENTAL", "Continental", ""], ["NIV_REGIONAL", "Régional", ""], ["NIV_NATIONAL", "National", ""]],
  STATUTS_COMPETITION: [["id_statut_competition", "nom_statut_competition", "observation"], ["PLANIFIEE", "Planifiée", ""], ["EN_COURS", "En cours", ""], ["TERMINEE", "Terminée", ""], ["REPORTEE", "Reportée", ""], ["ANNULEE", "Annulée", ""]],
  STATUTS_PARTICIPATION_ATHLETE: [["id_statut_participation", "nom_statut_participation", "observation"], ["INSCRIT", "Inscrit", "Présence non prouvée"], ["PARTICIPANT", "Participant", "Présence effective"], ["ABSENT", "Absent", ""], ["FORFAIT", "Forfait", ""], ["REMPLACE", "Remplacé", ""]],
  STATUTS_SELECTION: [["id_statut_selection", "nom_statut_selection", "observation"], ["PRESELECTIONNE", "Présélectionné", ""], ["SELECTIONNE", "Sélectionné", ""], ["REMPLACANT", "Remplaçant", ""], ["NON_RETENU", "Non retenu", ""], ["RETIRE", "Retiré", ""]],
  STATUTS_ENGAGEMENT_PROGRAMME: [["id_statut_engagement", "nom_statut_engagement", "observation"], ["PREVU", "Prévu", ""], ["SOUMIS", "Soumis", ""], ["CONFIRME", "Confirmé", ""], ["RETIRE", "Retiré", ""], ["ANNULE", "Annulé", ""]],
  STATUTS_VALIDATION_RESULTAT: [["id_statut_validation_resultat", "nom_statut_validation_resultat", "observation"], ["BROUILLON", "Brouillon", ""], ["TRANSMIS", "Transmis", ""], ["VALIDE_FEDERATION", "Validé par la fédération", ""], ["VALIDE_COC", "Validé par le COC", ""], ["HOMOLOGUE", "Homologué", ""], ["CORRIGE", "Corrigé", ""], ["ANNULE", "Annulé", ""]],
  FORMATS_PARTICIPATION: [["id_format_participation", "nom_format_participation", "description", "observations"], ["FMT_EQUIPE", "Équipe", "", ""], ["FMT_INDIVIDUEL", "Individuel", "", ""], ["FMT_PAIRE", "Paire / double", "", ""], ["FMT_RELAIS", "Relais", "", ""]],
  UNITES_MESURE: [["id_unite_mesure", "nom_unite_mesure", "type_mesure", "observations"], ["UNIT_POINT", "Point", "POINT", ""], ["UNIT_BUT", "But", "POINT", ""], ["UNIT_SECONDE", "Seconde", "TEMPS", ""], ["UNIT_METRE", "Mètre", "DISTANCE", ""], ["UNIT_CENTIMETRE", "Centimètre", "DISTANCE", ""], ["UNIT_KILOGRAMME", "Kilogramme", "POIDS", ""], ["UNIT_NOTE", "Note", "NOTE", ""]],
  TYPES_RESULTAT: [["id_type_resultat", "id_federation", "id_sport", "id_discipline", "nom_type_resultat", "id_unite_mesure", "sens_performance", "description", "statut", "observations"], ["TR_SCORE", "", "", "", "Score", "UNIT_POINT", "SUPERIEUR", "", "ACTIF", ""], ["TR_POINTS", "", "", "", "Points", "UNIT_POINT", "SUPERIEUR", "", "ACTIF", ""], ["TR_TEMPS", "", "", "", "Temps", "UNIT_SECONDE", "INFERIEUR", "", "ACTIF", ""], ["TR_DISTANCE", "", "", "", "Distance", "UNIT_METRE", "SUPERIEUR", "", "ACTIF", ""], ["TR_HAUTEUR", "", "", "", "Hauteur", "UNIT_METRE", "SUPERIEUR", "", "ACTIF", ""], ["TR_POIDS", "", "", "", "Poids", "UNIT_KILOGRAMME", "SUPERIEUR", "", "ACTIF", ""], ["TR_NOTE", "", "", "", "Note", "UNIT_NOTE", "SUPERIEUR", "", "ACTIF", ""], ["TR_RANG", "", "", "", "Rang", "", "INFERIEUR", "", "ACTIF", ""]],
  RESULTATS_SYNTHETIQUES: [["id_resultat_synthetique", "nom_resultat_synthetique", "description", "observations"], ...[["SYN_VICTOIRE", "Victoire"], ["SYN_NUL", "Nul"], ["SYN_DEFAITE", "Défaite"], ["SYN_QUALIFIE", "Qualifié"], ["SYN_ELIMINE", "Éliminé"], ["SYN_OR", "Médaille d’or"], ["SYN_ARGENT", "Médaille d’argent"], ["SYN_BRONZE", "Médaille de bronze"]].map(([id, label]) => [id, label, "", ""])],
  DECISIONS_RESULTATS: [["id_decision_resultat", "id_federation", "id_sport", "id_discipline", "nom_decision", "description", "statut", "observations"], ...[["DEC_FORFAIT", "Forfait"], ["DEC_ABANDON", "Abandon"], ["DEC_DISQUALIFICATION", "Disqualification"], ["DEC_DECISION_ARBITRALE", "Décision arbitrale"], ["DEC_WALKOVER", "Walkover"]].map(([id, label]) => [id, "", "", "", label, "", "ACTIF", ""])],
  ROLES_STAFF_EQUIPE_NATIONALE: [["id_role_staff", "id_type_acteur", "nom_role_staff", "observation"], ["ROLE_ENTRAINEUR_PRINCIPAL", "TYPACT002", "Entraîneur principal", ""], ["ROLE_ENTRAINEUR_ADJOINT", "TYPACT002", "Entraîneur adjoint", ""], ["ROLE_MEDECIN", "TYPACT003", "Médecin", ""], ["ROLE_OFFICIEL", "TYPACT005", "Officiel", ""], ["ROLE_CHEF_DELEGATION", "TYPACT006", "Chef de délégation", ""], ["ROLE_TEAM_MANAGER", "TYPACT006", "Team manager", ""]],
  DISTINCTIONS_SPORTIVES: [["id_distinction", "id_federation", "id_sport", "id_discipline", "nom_distinction", "description", "statut", "observations"]],
}

async function metadata(spreadsheetId) {
  return sheets.spreadsheets.get({ spreadsheetId, fields: "properties.title,sheets.properties(sheetId,title,gridProperties)" })
}
async function assertEmpty(spreadsheetId, tabNames) {
  const result = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges: tabNames.map((name) => `'${name}'!A2:ZZ1000`) })
  for (const [index, range] of (result.data.valueRanges ?? []).entries()) {
    if ((range.values ?? []).some((row) => row.some((value) => String(value).trim()))) throw new Error(`${tabNames[index]} n'est plus vide; migration annulée`)
  }
}
const headerFormat = { backgroundColorStyle: { rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } }, textFormat: { bold: true } }
const cell = (value) => typeof value === "number" ? { userEnteredValue: { numberValue: value } } : { userEnteredValue: { stringValue: String(value) } }
const updateHeader = (sheetId, values) => ({ updateCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: values.length }, rows: [{ values: values.map(cell) }], fields: "userEnteredValue" } })
const styleHeader = (sheetId, width) => ({ repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: width }, cell: { userEnteredFormat: headerFormat }, fields: "userEnteredFormat(backgroundColorStyle,textFormat)" } })
const freeze = (sheetId) => ({ updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } })

const competitionMeta = await metadata(ids.competitions)
const teamMeta = await metadata(ids.teams)
const refMeta = await metadata(ids.refs)
await assertEmpty(ids.competitions, ["COMPETITIONS", "PROGRAMMES_COMPETITION", "COMPETITIONS_EQUIPES_NATIONALES", "PARTICIPATIONS_ATHLETES_COMPETITION", "RESULTATS"])
await assertEmpty(ids.teams, ["EQUIPES_NATIONALES", "CAMPAGNES_EQUIPES_NATIONALES", "SELECTIONS_ATHLETES", "AFFECTATIONS_STAFF"])
for (const name of Object.keys(refRows).filter((name) => (refMeta.data.sheets ?? []).some((sheet) => sheet.properties?.title === name))) await assertEmpty(ids.refs, [name])

console.log(`Préflight conforme; mode=${apply ? "APPLY" : "DRY_RUN"}`)
if (!apply) process.exit(0)

const backupDirectory = path.resolve("backups", "competitions-t04", stamp)
await mkdir(backupDirectory, { recursive: true })
const backupManifest = []
for (const [key, meta] of [["competitions", competitionMeta], ["teams", teamMeta], ["refs", refMeta]]) {
  const title = meta.data.properties?.title
  const response = await drive.files.export({ fileId: ids[key], mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }, { responseType: "arraybuffer" })
  const buffer = Buffer.from(response.data)
  if (buffer.length < 1000) throw new Error(`Export de sauvegarde invalide pour ${title}`)
  const fileName = `${title}.xlsx`
  await writeFile(path.join(backupDirectory, fileName), buffer)
  backupManifest.push({ fileName, bytes: buffer.length, sha256: createHash("sha256").update(buffer).digest("hex") })
  console.log(`Sauvegarde locale vérifiée pour ${title}`)
}
await writeFile(path.join(backupDirectory, "manifest.json"), `${JSON.stringify({ createdAt: new Date().toISOString(), files: backupManifest }, null, 2)}\n`, "utf8")

const compMap = new Map((competitionMeta.data.sheets ?? []).map((sheet) => [sheet.properties?.title, sheet.properties?.sheetId]))
const oldEngagementId = compMap.get("COMPETITIONS_EQUIPES_NATIONALES")
const compRequests = [
  { updateSheetProperties: { properties: { sheetId: oldEngagementId, title: "ENGAGEMENTS_CAMPAGNES_PROGRAMMES" }, fields: "title" } },
  updateHeader(oldEngagementId, headers.ENGAGEMENTS_CAMPAGNES_PROGRAMMES), styleHeader(oldEngagementId, headers.ENGAGEMENTS_CAMPAGNES_PROGRAMMES.length), freeze(oldEngagementId),
  ...["PARTICIPATIONS_ATHLETES_COMPETITION", "RESULTATS"].flatMap((name) => [updateHeader(compMap.get(name), headers[name]), styleHeader(compMap.get(name), headers[name].length), freeze(compMap.get(name))]),
]
await sheets.spreadsheets.batchUpdate({ spreadsheetId: ids.competitions, requestBody: { requests: compRequests } })

const teamMap = new Map((teamMeta.data.sheets ?? []).map((sheet) => [sheet.properties?.title, sheet.properties?.sheetId]))
await sheets.spreadsheets.batchUpdate({ spreadsheetId: ids.teams, requestBody: { requests: [updateHeader(teamMap.get("SELECTIONS_ATHLETES"), headers.SELECTIONS_ATHLETES), styleHeader(teamMap.get("SELECTIONS_ATHLETES"), headers.SELECTIONS_ATHLETES.length), freeze(teamMap.get("SELECTIONS_ATHLETES"))] } })

let currentRefMeta = refMeta
const refMap = new Map((currentRefMeta.data.sheets ?? []).map((sheet) => [sheet.properties?.title, sheet.properties?.sheetId]))
const participationSheetId = refMap.get("STATUTS_PARTICIPATION_COMPETITION")
await sheets.spreadsheets.batchUpdate({ spreadsheetId: ids.refs, requestBody: { requests: [
  { updateSheetProperties: { properties: { sheetId: participationSheetId, title: "STATUTS_PARTICIPATION_ATHLETE" }, fields: "title" } },
  ...["STATUTS_SELECTION", "STATUTS_ENGAGEMENT_PROGRAMME", "STATUTS_VALIDATION_RESULTAT", "DISTINCTIONS_SPORTIVES"].map((title) => ({ addSheet: { properties: { title, gridProperties: { rowCount: 1000, columnCount: 26, frozenRowCount: 1 } } } })),
] } })
currentRefMeta = await metadata(ids.refs)
const currentRefMap = new Map((currentRefMeta.data.sheets ?? []).map((sheet) => [sheet.properties?.title, sheet.properties?.sheetId]))
for (const [name, rows] of Object.entries(refRows)) {
  await sheets.spreadsheets.values.update({ spreadsheetId: ids.refs, range: `'${name}'!A1`, valueInputOption: "RAW", requestBody: { values: rows } })
  const sheetId = currentRefMap.get(name)
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: ids.refs, requestBody: { requests: [styleHeader(sheetId, rows[0].length), freeze(sheetId)] } })
}

console.log("Migration appliquée; exécuter la vérification post-migration")

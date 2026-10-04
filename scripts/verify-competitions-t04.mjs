import { google } from "googleapis"

const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] })
const api = google.sheets({ version: "v4", auth })
const expected = {
  [process.env.GOOGLE_SHEETS_COMPETITIONS_SPREADSHEET_ID]: {
    ENGAGEMENTS_CAMPAGNES_PROGRAMMES: ["id_engagement_campagne", "id_programme_competition", "id_campagne", "id_statut_engagement", "date_engagement", "date_debut", "date_fin", "id_federation_source", "date_transmission", "reference_source", "observation"],
    PARTICIPATIONS_ATHLETES_COMPETITION: ["id_participation_athlete", "id_engagement_campagne", "id_selection", "id_statut_participation", "date_statut", "id_selection_remplacement", "observation"],
    RESULTATS: ["id_resultat", "id_resultat_logique", "numero_version", "id_resultat_precedent", "est_version_courante", "id_engagement_campagne", "id_programme_competition", "date_resultat", "phase", "adversaire", "pays_adversaire", "id_resultat_synthetique", "valeur_rdc", "valeur_adversaire", "id_unite_mesure", "id_decision_resultat", "id_federation_source", "date_transmission", "reference_source", "id_statut_validation_resultat", "date_validation", "id_validateur_coc", "motif_correction", "observation"],
  },
  [process.env.GOOGLE_SHEETS_EQUIPES_NATIONALES_SPREADSHEET_ID]: {
    SELECTIONS_ATHLETES: ["id_selection", "id_campagne", "id_athlete", "id_poste", "id_categorie_poids", "id_grade_sportif", "numero_maillot", "date_selection", "id_statut_selection", "observation"],
  },
}
const refCounts = { TYPES_COMPETITION: 6, NIVEAUX_COMPETITION: 4, STATUTS_COMPETITION: 5, STATUTS_PARTICIPATION_ATHLETE: 5, STATUTS_SELECTION: 5, STATUTS_ENGAGEMENT_PROGRAMME: 5, STATUTS_VALIDATION_RESULTAT: 7, FORMATS_PARTICIPATION: 4, UNITES_MESURE: 7, TYPES_RESULTAT: 8, RESULTATS_SYNTHETIQUES: 8, DECISIONS_RESULTATS: 5, ROLES_STAFF_EQUIPE_NATIONALE: 6, DISTINCTIONS_SPORTIVES: 0 }
expected[process.env.GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID] = Object.fromEntries(Object.keys(refCounts).map((name) => [name, null]))

for (const [spreadsheetId, tabs] of Object.entries(expected)) {
  const meta = await api.spreadsheets.get({ spreadsheetId, fields: "properties.title,sheets.properties(sheetId,title,gridProperties.frozenRowCount)" })
  const map = new Map((meta.data.sheets ?? []).map((sheet) => [sheet.properties?.title, sheet.properties]))
  for (const [name, expectedHeaders] of Object.entries(tabs)) {
    const properties = map.get(name)
    if (!properties) throw new Error(`${name}: onglet absent`)
    const result = await api.spreadsheets.values.get({ spreadsheetId, range: `'${name}'!A1:ZZ1000` })
    const [actualHeaders = [], ...rows] = result.data.values ?? []
    if (expectedHeaders && JSON.stringify(actualHeaders) !== JSON.stringify(expectedHeaders)) throw new Error(`${name}: en-têtes non conformes`)
    const count = rows.filter((row) => row.some((value) => String(value).trim())).length
    if (name in refCounts ? count !== refCounts[name] : count !== 0) throw new Error(`${name}: volume inattendu ${count}`)
    if (properties.gridProperties?.frozenRowCount !== 1) throw new Error(`${name}: ligne d'en-tête non figée`)
    console.log(`${meta.data.properties?.title}/${name}: conforme (${count} ligne(s))`)
  }
}

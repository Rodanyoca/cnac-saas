import { google } from "googleapis"

const apply = process.argv.includes("--apply")
const workbooks = [
  { envKey: "GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID", sheets: ["TABLEAU_DE_BORD", "NIVEAUX_COMPETITIFS_CLUB", "CATEGORIES_POIDS", "STATUS_ACTIVITES", "NIVEAUX_ENTRAINEURS", "GRADES_SPORTIF", "POSTES_ATHLETES", "TYPES_SEGMENTS_RESULTATS", "TYPES_UNITES_PARTICIPANTES", "BLOCS_AUTORISATION", "CATEGORIES_ACTUALITE", "EMPLACEMENTS_SITE", "SERIES_COMPETITIONS", "TYPES_ORGANES_GOUVERNANCE", "TYPES_PAGES_SITE"], columns: [{ sheet: "TYPES_STRUCTURE", header: "observations", occurrence: 2 }] },
  { envKey: "GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID", sheets: [], columns: [{ sheet: "HIERARCHIE", header: "id_type_structure_parent", occurrence: 1 }] },
]

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
})
const sheets = google.sheets({ version: "v4", auth })

for (const workbook of workbooks) {
  const spreadsheetId = process.env[workbook.envKey]
  if (!spreadsheetId) throw new Error(`${workbook.envKey} absent`)
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "properties.title,sheets.properties(sheetId,title)" })
  const available = new Map((metadata.data.sheets ?? []).map((item) => [item.properties?.title, item.properties]))
  const requests = []

  for (const title of workbook.sheets) {
    const properties = available.get(title)
    if (!properties) {
      console.log(`[absent] ${metadata.data.properties?.title}: ${title}`)
      continue
    }
    console.log(`[feuille] ${metadata.data.properties?.title}: ${title}`)
    requests.push({ deleteSheet: { sheetId: properties.sheetId } })
  }

  for (const column of workbook.columns) {
    const properties = available.get(column.sheet)
    if (!properties) {
      console.log(`[absent] ${metadata.data.properties?.title}: ${column.sheet}`)
      continue
    }
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${column.sheet.replaceAll("'", "''")}'!1:1` })
    const headers = response.data.values?.[0] ?? []
    const matches = headers.flatMap((value, index) => value === column.header ? [index] : [])
    const index = matches[column.occurrence - 1]
    if (index === undefined) {
      console.log(`[colonne absente] ${metadata.data.properties?.title}/${column.sheet}: ${column.header} #${column.occurrence}`)
      continue
    }
    console.log(`[colonne] ${metadata.data.properties?.title}/${column.sheet}: ${column.header} #${column.occurrence}`)
    requests.push({ deleteDimension: { range: { sheetId: properties.sheetId, dimension: "COLUMNS", startIndex: index, endIndex: index + 1 } } })
  }

  if (apply && requests.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } })
    console.log(`[applique] ${metadata.data.properties?.title}: ${requests.length} suppression(s)`)
  } else if (!apply) {
    console.log(`[aperçu] ${metadata.data.properties?.title}: ${requests.length} suppression(s) prévue(s)`)
  }
}

if (!apply) console.log("Aucune modification appliquee. Relancer avec --apply pour executer les suppressions.")

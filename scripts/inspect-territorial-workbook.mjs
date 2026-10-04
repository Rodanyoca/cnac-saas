import { google } from "googleapis"

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
})
const api = google.sheets({ version: "v4", auth })
const spreadsheetId = process.env.GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID
if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID absent")
const metadata = await api.spreadsheets.get({ spreadsheetId, fields: "properties.title,sheets.properties.title" })
for (const item of metadata.data.sheets ?? []) {
  const title = item.properties?.title ?? ""
  const range = `'${title.replaceAll("'", "''")}'!A:ZZ`
  const response = await api.spreadsheets.values.get({ spreadsheetId, range })
  const rows = response.data.values ?? []
  console.log(`${title}: headers=${JSON.stringify(rows[0] ?? [])}; dataRows=${Math.max(0, rows.length - 1)}`)
}

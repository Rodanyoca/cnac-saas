import { google } from "googleapis"

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
})
const api = google.sheets({ version: "v4", auth })
const spreadsheetId = process.env.GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID
if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID absent")
const sheetName = "CERCLES"
const requiredHeader = "id_structure_parent_coc"
const response = await api.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName}'!A:ZZ` })
const headers = response.data.values?.[0] ?? []
if (headers.includes(requiredHeader)) {
  console.log(`${sheetName}.${requiredHeader} deja presente`)
} else {
  const columnIndex = headers.length
  let index = columnIndex + 1
  let column = ""
  while (index > 0) {
    const remainder = (index - 1) % 26
    column = String.fromCharCode(65 + remainder) + column
    index = Math.floor((index - 1) / 26)
  }
  await api.spreadsheets.values.update({ spreadsheetId, range: `'${sheetName}'!${column}1`, valueInputOption: "RAW", requestBody: { values: [[requiredHeader]] } })
  console.log(`${sheetName}.${requiredHeader} restauree en colonne ${column}`)
}

import "server-only"

export function getCompetitionsSpreadsheetId() {
  const id = process.env.GOOGLE_SHEETS_COMPETITIONS_SPREADSHEET_ID
  if (!id) throw new Error("GOOGLE_SHEETS_COMPETITIONS_SPREADSHEET_ID est manquant.")
  return id
}

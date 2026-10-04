import "server-only"

export function getActivitesSpreadsheetId() {
  const id = process.env.GOOGLE_SHEETS_ACTIVITES_SPREADSHEET_ID
  if (!id) throw new Error("Variable GOOGLE_SHEETS_ACTIVITES_SPREADSHEET_ID manquante.")
  return id
}

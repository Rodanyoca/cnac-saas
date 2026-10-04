import "server-only"

export function getUsersSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_USERS_SPREADSHEET_ID?.trim()
  if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_USERS_SPREADSHEET_ID est manquant.")
  return spreadsheetId
}

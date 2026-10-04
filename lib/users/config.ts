import "server-only"

export function getUsersSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_USERS_SPREADSHEET_ID?.trim()
  if (!spreadsheetId || spreadsheetId === "A_COMPLETER") throw new Error("GOOGLE_SHEETS_USERS_SPREADSHEET_ID est manquant.")
  if ([process.env.GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID, process.env.GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID, process.env.GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID].includes(spreadsheetId)) throw new Error("Le classeur USERS doit être un classeur CNAC dédié.")
  return spreadsheetId
}

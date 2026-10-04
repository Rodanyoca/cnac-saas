import "server-only"

export function getNationalTeamsSpreadsheetId() {
  const id = process.env.GOOGLE_SHEETS_EQUIPES_NATIONALES_SPREADSHEET_ID
  if (!id) throw new Error("GOOGLE_SHEETS_EQUIPES_NATIONALES_SPREADSHEET_ID est manquant.")
  return id
}

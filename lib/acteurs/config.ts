import "server-only"
import { CnacDataError } from "@/lib/cnac/model"

export function getActeursSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID
  if (!spreadsheetId) throw new CnacDataError("GOOGLE_CONFIGURATION","Connexion Google CNAC non configurée : GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID est manquant dans .env.local.",503)
  return spreadsheetId
}

export function getActeursAffiliationsSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ACTEURS_AFFILIATIONS_SPREADSHEET_ID?.trim()
  if (!spreadsheetId || spreadsheetId === "A_COMPLETER") throw new CnacDataError("GOOGLE_CONFIGURATION", "Connexion Google CNAC non configurée : GOOGLE_SHEETS_ACTEURS_AFFILIATIONS_SPREADSHEET_ID est manquant dans .env.local.", 503)
  return spreadsheetId
}

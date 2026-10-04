import "server-only"
import { CnacDataError } from "@/lib/cnac/model"

export function getTerritorialSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID
  if (!spreadsheetId) throw new CnacDataError("GOOGLE_CONFIGURATION","Connexion Google CNAC non configurée : GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID est manquant dans .env.local.",503)
  return spreadsheetId
}

export function getReferentialSpreadsheetId(): string {
  const spreadsheetId = process.env.GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID
  if (!spreadsheetId) throw new CnacDataError("GOOGLE_CONFIGURATION","Connexion Google CNAC non configurée : GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID est manquant dans .env.local.",503)
  return spreadsheetId
}

export function getFederationLogosFolderId(): string {
  const folderId = process.env.GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID
  if (!folderId) throw new Error("GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID est manquant.")
  return folderId
}

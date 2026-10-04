import "server-only"

export function getDocumentsSpreadsheetId() {
  const id = process.env.GOOGLE_SHEETS_DOCUMENTS_SPREADSHEET_ID
  if (!id) throw new Error("Variable GOOGLE_SHEETS_DOCUMENTS_SPREADSHEET_ID manquante.")
  return id
}

export function getDocumentsDriveFolderId() {
  const id = process.env.GOOGLE_DRIVE_DOCUMENTS_FOLDER_ID
  if (!id) throw new Error("Variable GOOGLE_DRIVE_DOCUMENTS_FOLDER_ID manquante.")
  return id
}

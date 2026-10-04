import { deleteCnacOwnedFile } from "@/lib/cnac/drive-ownership"
import { cnacUploadAvailability } from "@/lib/cnac/media-config"
import { CnacDataError } from "@/lib/cnac/model"
import "server-only"

import { uploadFileToDrive } from "@/lib/google/drive"
import { getSheetRows, updateSheetCells } from "@/lib/cnac/sheets"
import { getFederationLogosFolderId, getReferentialSpreadsheetId } from "./config"
import { replaceFederationLogo, type FederationLogoUploadInput } from "./logo"

const SHEET = "FEDERATIONS"
const REQUIRED_LOGO_COLUMNS = ["logo_drive_id", "logo_drive_url"] as const

function extensionFor(mimeType: string) {
  if (mimeType === "image/png") return "png"
  if (mimeType === "image/webp") return "webp"
  return "jpg"
}

export async function replaceFederationLogoInGoogle(input: Omit<FederationLogoUploadInput, "folderId">) {
  if (!cnacUploadAvailability().logo) throw new CnacDataError("MEDIA_DISABLED", "La gestion des logos n’est pas encore activée pour le CNAC.", 501)
  const spreadsheetId = getReferentialSpreadsheetId()
  const folderId = getFederationLogosFolderId()
  const safeFederationId = input.federationId.replace(/[^a-zA-Z0-9_-]/g, "_")
  return replaceFederationLogo({ ...input, folderId, fileName: `LOGO_FEDERATION_${safeFederationId}.${extensionFor(input.mimeType)}` }, {
    find: async (federationId) => {
      const rows = await getSheetRows({ sheetName: SHEET, spreadsheetId, bypassCache: true })
      const row = rows.find((candidate) => candidate.id_federation === federationId)
      if (!row) return undefined
      const headers = Object.keys(row)
      const missing = REQUIRED_LOGO_COLUMNS.filter((column) => !headers.includes(column))
      if (missing.length) throw new Error(`Colonnes logo manquantes dans FEDERATIONS : ${missing.join(", ")}.`)
      return { logoDriveId: row.logo_drive_id || "" }
    },
    upload: uploadFileToDrive,
    update: async (federationId, file) => updateSheetCells({
      sheetName: SHEET,
      spreadsheetId,
      idColumn: "id_federation",
      idValue: federationId,
      updates: [{ column: "logo_drive_id", value: file.fileId }, { column: "logo_drive_url", value: file.url }],
    }),
    remove: (fileId) => deleteCnacOwnedFile(fileId,folderId),
  })
}

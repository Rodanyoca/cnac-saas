import "server-only"
import { canAccess } from "@/lib/auth"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { downloadDriveFile } from "@/lib/google/drive"
import { getSheetsTables } from "./sheets"
import { prepareOrSave, readSaveBody, mediaFolder } from "./media-save"
import { cnacOwnedFileMetadata } from "./drive-ownership"
import { validateImageBuffer } from "./image-validation"
import { type CnacImageKind } from "./media-url"
import { CnacDataError } from "./model"
import { errorResponse, writeAccess } from "./actor-handler"
import { revalidatePath } from "next/cache"
import { withCnacCreationQueue } from "./identifiers"

const target = (kind: CnacImageKind) => kind === "logo" ? { sheet: "FEDERATIONS" as const, key: "id_federation", spreadsheetId: getReferentialSpreadsheetId(), field: "logo_drive_id" } : { sheet: "ATHLETES" as const, key: "id_athlete_cnac", spreadsheetId: getActeursSpreadsheetId(), field: "avatar_drive_id" }

export async function saveExistingImage(request: Request, kind: CnacImageKind, id: string) {
  return withCnacCreationQueue(kind === "logo" ? "media:FEDERATIONS" : "media:ATHLETES", () => saveImage(request, kind, id))
}
async function saveImage(request: Request, kind: CnacImageKind, id: string) {
  const denied = await writeAccess(); if (denied) return denied
  try {
    const { body, file } = await readSaveBody(request, "file")
    if (!file) throw new CnacDataError("IMAGE_REQUIRED", "Sélectionnez une image.")
    const config = target(kind)
    const result = await prepareOrSave({ scope: `image:${kind}:${id}`, body, file, kind, buildRows: async () => {
      const table = (await getSheetsTables({ spreadsheetId: config.spreadsheetId, sheetNames: [config.sheet], bypassCache: true }))[config.sheet]
      const current = table.rows.find(row => row[config.key] === id)
      if (!current) throw new CnacDataError("NOT_FOUND", "Fiche introuvable.", 404)
      return [{ sheet: config.sheet, id, mode: "update", values: { [config.key]: id }, before: current }]
    } })
    if (result instanceof Response) return result
    revalidatePath(kind === "logo" ? "/dashboard/federations" : "/dashboard/acteurs/athletes", "layout")
    return Response.json({ fileId: result.plan.media!.fileId, url: result.rows[0]![kind === "logo" ? "logo_drive_url" : "avatar_drive_url"] }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) { return errorResponse(error) }
}

export async function readExistingImage(kind: CnacImageKind, id: string) {
  if (!await canAccess("AUT-SPT", "READ")) return Response.json({ error: "Accès refusé." }, { status: 403 })
  try {
    const config = target(kind)
    const table = (await getSheetsTables({ spreadsheetId: config.spreadsheetId, sheetNames: [config.sheet], bypassCache: true }))[config.sheet]
    const rows = table.rows.filter(row => row[config.key] === id)
    if (rows.length !== 1 || !rows[0][config.field]) return new Response(null, { status: 404 })
    const fileId = rows[0][config.field], folder = mediaFolder(kind)
    if (!folder) throw new CnacDataError("MEDIA_CONFIGURATION", "Stockage des images CNAC indisponible.", 503)
    const metadata = await cnacOwnedFileMetadata(fileId, folder)
    if (!metadata || metadata.size > 4 * 1024 * 1024 || !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(metadata.mimeType)) return new Response(null, { status: 404 })
    const image = await downloadDriveFile(fileId)
    await validateImageBuffer(image.buffer, image.mimeType)
    return new Response(new Uint8Array(image.buffer), { headers: { "Content-Type": image.mimeType === "image/jpg" ? "image/jpeg" : image.mimeType, "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", Vary: "Cookie" } })
  } catch (error) { return errorResponse(error) }
}

import "server-only"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { getSession } from "@/lib/auth"
import { getAuthSecret } from "@/lib/auth/config"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { reservePrivateDriveFileId, uploadPrivateFileToDrive } from "@/lib/google/drive"
import { cnacMediaIsReferenced, getSheetsTables, writeCnacSaveRows } from "./sheets"
import { cnacOwnedFileMetadata, deleteCnacOwnedFile } from "./drive-ownership"
import { CnacDataError } from "./model"
import { cnacUploadAvailability } from "./media-config"
import { cnacMediaUrl, type CnacImageKind } from "./media-url"
import { validateImageFile } from "./image-validation"
import { executeConfirmedSave, ConfirmedSaveError, type SavePlan, type SaveRow } from "./confirmed-save"

type SaveBody = { row?: Record<string, unknown>; data?: Record<string, unknown>; id?: unknown; ticket?: string }
type Ticket = { user: string; expires: number; fingerprint: string; plan: SavePlan }
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex")
async function driveOperation<T>(run: () => Promise<T>): Promise<T> {
  try { return await run() } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 401 || error instanceof Error && /invalid_grant|Google Drive expirée/i.test(error.message)) throw new CnacDataError("MEDIA_AUTHORIZATION", "La connexion Google Drive du serveur doit être réautorisée. Les données de la fiche sont conservées.", 503)
    throw error
  }
}
const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item)
export const mediaFolder = (kind: CnacImageKind) => (kind === "logo" ? process.env.GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID : process.env.GOOGLE_DRIVE_ACTEURS_AVATARS_FOLDER_ID)?.trim() || ""

export async function readSaveBody(request: Request, fileField: "avatar" | "logo" | "file" = "avatar") {
  if (Number(request.headers.get("content-length") || 0) > 6 * 1024 * 1024) throw new CnacDataError("IMAGE_TOO_LARGE", "Le fichier ne doit pas dépasser 4 Mo.", 413)
  try {
    if (!request.headers.get("content-type")?.includes("multipart/form-data")) return { body: await request.json() as SaveBody, file: undefined }
    const form = await request.formData()
    const body = JSON.parse(String(form.get("data") || "{}")) as SaveBody
    const file = form.get(fileField)
    return { body: { ...body, ticket: String(form.get("ticket") || body.ticket || "") }, file: file instanceof File ? file : undefined, form }
  } catch { throw new CnacDataError("INVALID_BODY", "Le formulaire envoyé est invalide.") }
}

function sign(ticket: Ticket) {
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url")
  return `${payload}.${createHmac("sha256", getAuthSecret()).update(`cnac-save:v1:${payload}`).digest("base64url")}`
}
function verify(value: string): Ticket {
  try {
    const [payload, signature, extra] = value.split(".")
    if (!payload || !signature || extra) throw new Error()
    const actual = Buffer.from(signature, "base64url"), expected = createHmac("sha256", getAuthSecret()).update(`cnac-save:v1:${payload}`).digest()
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error()
    const ticket = JSON.parse(Buffer.from(payload, "base64url").toString()) as Ticket
    if (ticket.expires < Date.now()) throw new Error()
    return ticket
  } catch { throw new CnacDataError("SAVE_TICKET_INVALID", "La reprise de cette sauvegarde n’est plus valide. Vérifiez la fiche avant de recommencer.", 409) }
}

// La préparation retourne un ticket AVANT toute écriture. Le navigateur le garde
// pour rejouer exactement la même fiche, même après une réponse réseau perdue.
export async function prepareOrSave(input: { scope: string; body: SaveBody; file?: File; kind?: CnacImageKind; buildRows: () => Promise<SaveRow[]> }) {
  const session = await getSession()
  if (!session || session.doitChangerMotDePasse) throw new CnacDataError("ACCESS_DENIED", "Session requise.", 403)
  const buffer = input.file ? await validateImageFile(input.file) : undefined
  const fingerprint = hash(canonical({ row: input.body.row ?? input.body.data, id: input.body.id, image: buffer ? hash(buffer) : "" }))
  let ticket: Ticket
  if (input.body.ticket) {
    ticket = verify(input.body.ticket)
    if (ticket.user !== session.idUser || ticket.plan.scope !== input.scope || ticket.fingerprint !== fingerprint) throw new CnacDataError("SAVE_TICKET_MISMATCH", "Réessayez avec les mêmes informations et la même image, ou rechargez la fiche avant de commencer une autre sauvegarde.", 409)
  } else {
    const rows = await input.buildRows(), plan: SavePlan = { scope: input.scope, rows }
    if (buffer && input.kind) {
      if (!cnacUploadAvailability()[input.kind]) throw new CnacDataError("MEDIA_CONFIGURATION", "Le stockage des images CNAC n’est pas configuré sur le serveur.", 503)
      const target = rows.find(row => row.sheet === (input.kind === "logo" ? "FEDERATIONS" : "ATHLETES"))!
      const fileId = await driveOperation(reservePrivateDriveFileId), idColumn = input.kind === "logo" ? "logo_drive_id" : "avatar_drive_id", urlColumn = input.kind === "logo" ? "logo_drive_url" : "avatar_drive_url"
      // Vérifier les colonnes avant l'upload, sans jamais les créer.
      const spreadsheetId = input.kind === "logo" ? getReferentialSpreadsheetId() : getActeursSpreadsheetId()
      const table = (await getSheetsTables({ spreadsheetId, sheetNames: [target.sheet], bypassCache: true }))[target.sheet]
      if (![idColumn, urlColumn].every(column => table.headers.includes(column))) throw new CnacDataError("MAPPING_COLUMNS", "Les colonnes médias attendues sont absentes de la feuille CNAC.", 502)
      plan.media = { kind: input.kind, recordId: target.id, fileId, mimeType: input.file!.type, digest: hash(buffer), oldId: target.before?.[idColumn] || "" }
      target.values[idColumn] = fileId; target.values[urlColumn] = cnacMediaUrl(input.kind, target.id, fileId)
    }
    ticket = { user: session.idUser, expires: Date.now() + 8 * 60 * 60 * 1000, fingerprint, plan }
    return Response.json({ prepared: true, ticket: sign(ticket) }, { status: 202, headers: { "Cache-Control": "no-store" } })
  }
  const plan = ticket.plan, spreadsheetId = plan.rows[0].sheet === "ATHLETES" ? getActeursSpreadsheetId() : getReferentialSpreadsheetId()
  const read = async (rows: SaveRow[]) => {
    const tables = await getSheetsTables({ spreadsheetId, sheetNames: [...new Set(rows.map(row => row.sheet))], bypassCache: true })
    return rows.map(row => {
      const key = row.sheet === "ATHLETES" ? "id_athlete_cnac" : row.sheet === "FEDERATIONS" ? "id_federation" : "id_entite"
      const matches = tables[row.sheet].rows.filter(item => item[key] === row.id)
      if (matches.length > 1) throw new CnacDataError("DUPLICATE_ID", "Identifiant dupliqué : sauvegarde refusée.", 409)
      return matches[0]
    })
  }
  try {
    await executeConfirmedSave(plan, {
      read,
      mediaExists: async () => !!await cnacOwnedFileMetadata(plan.media!.fileId, mediaFolder(plan.media!.kind)),
      upload: async () => {
        if (!buffer || hash(buffer) !== plan.media!.digest) throw new Error("image")
        const media = plan.media!, extension = media.mimeType === "image/png" ? "png" : media.mimeType === "image/webp" ? "webp" : "jpg"
        await driveOperation(() => uploadPrivateFileToDrive({ fileId: media.fileId, fileName: `CNAC_${media.kind}_${media.recordId}.${extension}`, mimeType: media.mimeType, buffer, folderId: mediaFolder(media.kind) }))
      },
      write: rows => writeCnacSaveRows(spreadsheetId, rows),
      removeUnused: async fileId => { if (!await cnacMediaIsReferenced(fileId)) await deleteCnacOwnedFile(fileId, mediaFolder(plan.media!.kind)) },
    })
  } catch (error) {
    if (error instanceof ConfirmedSaveError) return Response.json({ error: error.message, code: error.code, resetTicket: error.resetTicket }, { status: error.status, headers: { "Cache-Control": "no-store" } })
    throw error
  }
  return { plan, rows: await read(plan.rows) }
}

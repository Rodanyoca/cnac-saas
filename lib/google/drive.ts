import "server-only"

import { Readable } from "stream"
import { drive as createDrive, auth as googleAuth } from "googleapis/build/src/apis/drive"
import { runGoogleRequest } from "./request"

function getDriveAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Variables OAuth2 Drive manquantes")
  }
  const auth = new googleAuth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })
  return auth
}

function driveError(error: unknown): Error {
  const candidate = error as {
    response?: { data?: { error?: string | { message?: string } } }
    message?: string
  }
  const responseError = candidate.response?.data?.error
  const message = typeof responseError === "string"
    ? responseError
    : responseError?.message || candidate.message || String(error)
  if (message.includes("invalid_grant")) {
    return new Error("Connexion Google Drive expirée : renouvelez GOOGLE_DRIVE_REFRESH_TOKEN")
  }
  return error instanceof Error ? error : new Error(message)
}

export type DriveUploadResult = {
  fileId: string
  url: string
}

const driveSizeCache = (globalThis as typeof globalThis & { __cocDriveSizeCache?: Map<string, { size: string; timestamp: number }> }).__cocDriveSizeCache ??= new Map()
const DRIVE_SIZE_CACHE_TTL_MS = 5 * 60 * 1000

export async function getDriveFileSize(fileId: string): Promise<string> {
  const cached = driveSizeCache.get(fileId)
  if (cached && Date.now() - cached.timestamp < DRIVE_SIZE_CACHE_TTL_MS) return cached.size
  try {
    const drive = createDrive({ version: "v3", auth: getDriveAuth() })
    const response = await runGoogleRequest(() => drive.files.get({ fileId, fields: "id,size" }))
    const size = String(response.data.size ?? "")
    if (size) driveSizeCache.set(fileId, { size, timestamp: Date.now() })
    return size
  } catch (error) {
    throw driveError(error)
  }
}

export async function reservePrivateDriveFileId(): Promise<string> {
  const drive = createDrive({ version: "v3", auth: getDriveAuth() })
  const response = await runGoogleRequest(() => drive.files.generateIds({ count: 1, space: "drive", type: "files" }))
  const id = response.data.ids?.[0]
  if (!id) throw new Error("Réservation du fichier Drive impossible.")
  return id
}

export async function uploadPrivateFileToDrive(params: { fileName: string; mimeType: string; buffer: Buffer; folderId: string; fileId?: string }): Promise<DriveUploadResult> {
  try {
    const drive = createDrive({ version: "v3", auth: getDriveAuth() })
    const response = await runGoogleRequest(() => drive.files.create({ requestBody: { id: params.fileId, name: params.fileName, parents: [params.folderId] }, media: { mimeType: params.mimeType, body: Readable.from(params.buffer) }, fields: "id" }), { idempotent: false })
    const fileId = response.data.id
    if (!fileId) throw new Error("Upload Drive échoué : aucun ID retourné")
    return { fileId, url: `https://drive.google.com/file/d/${fileId}/view` }
  } catch (error) {
    throw driveError(error)
  }
}

export async function downloadDriveFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
  try {
    const drive = createDrive({ version: "v3", auth: getDriveAuth() })
    const [metadata, content] = await Promise.all([
      runGoogleRequest(() => drive.files.get({ fileId, fields: "name,mimeType" })),
      runGoogleRequest(() => drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" })),
    ])
    return { buffer: Buffer.from(content.data as ArrayBuffer), mimeType: metadata.data.mimeType || "application/pdf", name: metadata.data.name || "document.pdf" }
  } catch (error) {
    throw driveError(error)
  }
}

export async function verifyDriveFolderAccess(folderId: string): Promise<void> {
  try {
    const drive = createDrive({ version: "v3", auth: getDriveAuth() })
    const response = await runGoogleRequest(() => drive.files.get({
      fileId: folderId,
      fields: "id,mimeType,capabilities(canAddChildren)",
    }))
    if (
      response.data.mimeType !== "application/vnd.google-apps.folder" ||
      !response.data.capabilities?.canAddChildren
    ) {
      throw new Error("Le dossier Drive n'est pas accessible en écriture")
    }
  } catch (error) {
    throw driveError(error)
  }
}

export async function uploadFileToDrive(params: {
  fileName: string
  mimeType: string
  buffer: Buffer
  folderId: string
}): Promise<DriveUploadResult> {
  try {
    const drive = createDrive({ version: "v3", auth: getDriveAuth() })
    const response = await runGoogleRequest(() => drive.files.create({
      requestBody: {
        name: params.fileName,
        parents: [params.folderId],
      },
      media: {
        mimeType: params.mimeType,
        body: Readable.from(params.buffer),
      },
      fields: "id",
    }), { idempotent: false })

    const fileId = response.data.id
    if (!fileId) throw new Error("Upload Drive échoué : aucun ID retourné")

    await runGoogleRequest(() => drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    }), { idempotent: false })

    return {
      fileId,
      url: params.mimeType.startsWith("image/")
        ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w400&v=${Date.now()}`
        : `https://drive.google.com/file/d/${fileId}/view`,
    }
  } catch (error) {
    throw driveError(error)
  }
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  try {
    const drive = createDrive({ version: "v3", auth: getDriveAuth() })
    await runGoogleRequest(() => drive.files.delete({ fileId }), { idempotent: false })
  } catch (error) {
    throw driveError(error)
  }
}

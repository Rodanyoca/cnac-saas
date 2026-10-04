export const FEDERATION_LOGO_MAX_BYTES = 4 * 1024 * 1024
export const FEDERATION_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"] as const
export const FEDERATION_LOGO_ACCEPT = ".png,.jpg,.jpeg,.webp"

export function validateFederationLogo(file: Pick<File, "name" | "type" | "size">): { ok: true } | { ok: false; error: string } {
  if (!FEDERATION_LOGO_MIME_TYPES.includes(file.type as typeof FEDERATION_LOGO_MIME_TYPES[number])) return { ok: false, error: "Format non supporté. Utilisez PNG, JPG, JPEG ou WebP." }
  if (file.size > FEDERATION_LOGO_MAX_BYTES) return { ok: false, error: "Le fichier dépasse la taille maximale de 4 Mo." }
  if (file.size === 0) return { ok: false, error: "Le fichier sélectionné est vide." }
  return { ok: true }
}

export function hasValidFederationLogoSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (mimeType === "image/webp") return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP"
  return false
}

export type LogoDialogState = { open: boolean; phase: "selection" | "confirmation" | "uploading" | "success"; error: string | null }
export type LogoDialogAction = { type: "open" | "close" | "confirm" | "upload" | "success" } | { type: "failure"; error: string }

export function logoDialogReducer(_state: LogoDialogState, action: LogoDialogAction): LogoDialogState {
  if (action.type === "open") return { open: true, phase: "selection", error: null }
  if (action.type === "close") return { open: false, phase: "selection", error: null }
  if (action.type === "confirm") return { open: true, phase: "confirmation", error: null }
  if (action.type === "upload") return { open: true, phase: "uploading", error: null }
  if (action.type === "success") return { open: true, phase: "success", error: null }
  if (action.type === "failure") return { open: true, phase: "selection", error: action.error }
  return _state
}

export type FederationLogoUploadInput = { federationId: string; fileName: string; mimeType: string; buffer: Buffer; folderId: string }
export type FederationLogoResult = { fileId: string; url: string }
export type FederationLogoDependencies = {
  find: (federationId: string) => Promise<{ logoDriveId: string } | undefined>
  upload: (input: { fileName: string; mimeType: string; buffer: Buffer; folderId: string }) => Promise<FederationLogoResult>
  update: (federationId: string, file: FederationLogoResult) => Promise<void>
  remove: (fileId: string) => Promise<void>
}

export async function replaceFederationLogo(input: FederationLogoUploadInput, dependencies: FederationLogoDependencies): Promise<FederationLogoResult> {
  const federation = await dependencies.find(input.federationId)
  if (!federation) throw new Error("Fédération introuvable.")
  const uploaded = await dependencies.upload({ fileName: input.fileName, mimeType: input.mimeType, buffer: input.buffer, folderId: input.folderId })
  try {
    await dependencies.update(input.federationId, uploaded)
  } catch (error) {
    await dependencies.remove(uploaded.fileId).catch(() => undefined)
    throw error
  }
  if (federation.logoDriveId && federation.logoDriveId !== uploaded.fileId) await dependencies.remove(federation.logoDriveId).catch(() => undefined)
  return uploaded
}

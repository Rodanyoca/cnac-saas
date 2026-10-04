import sharp from "sharp"
import { validateFederationLogo, hasValidFederationLogoSignature } from "../federations/logo.ts"
import { CnacDataError } from "./model.ts"

export async function validateImageBuffer(buffer: Buffer, mimeType: string) {
  const valid = validateFederationLogo({ name: mimeType === "image/png" ? "image.png" : mimeType === "image/webp" ? "image.webp" : "image.jpg", size: buffer.length, type: mimeType })
  if (!valid.ok) throw new CnacDataError("IMAGE_INVALID", valid.error, buffer.length > 4 * 1024 * 1024 ? 413 : 400)
  if (!hasValidFederationLogoSignature(buffer, mimeType)) throw new CnacDataError("IMAGE_INVALID", "Le contenu du fichier ne correspond pas à une image PNG, JPEG ou WebP.")
  try {
    const image = sharp(buffer, { limitInputPixels: 25_000_000, failOn: "warning", animated: false })
    const metadata = await image.metadata()
    const format = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpeg"
    if (metadata.format !== format || !metadata.width || !metadata.height || (metadata.pages || 1) > 1) throw new Error("format")
    // Décoder réellement les pixels, pas seulement les premiers octets ou le nom.
    await image.resize(1, 1).toBuffer()
  } catch {
    throw new CnacDataError("IMAGE_INVALID", "L’image est endommagée, animée ou ses dimensions sont trop grandes.")
  }
}
export async function validateImageFile(file: File) {
  const valid = validateFederationLogo(file)
  if (!valid.ok) throw new CnacDataError("IMAGE_INVALID", valid.error, file.size > 4 * 1024 * 1024 ? 413 : 400)
  const buffer = Buffer.from(await file.arrayBuffer())
  await validateImageBuffer(buffer, file.type)
  return buffer
}

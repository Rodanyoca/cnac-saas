import { writeAccess, errorResponse } from "@/lib/cnac/actor-handler"
import { readSaveBody } from "@/lib/cnac/media-save"
import { saveExistingImage } from "@/lib/cnac/media-handler"
import { CnacDataError } from "@/lib/cnac/model"
export const runtime = "nodejs"
export async function POST(request: Request) {
  const denied = await writeAccess(); if (denied) return denied
  try {
    const { body, form } = await readSaveBody(request.clone(), "file")
    const input = (body.row || body) as Record<string, unknown>
    const kind = String(input.actorType || form?.get("actorType") || ""), type = String(input.mediaType || form?.get("mediaType") || ""), id = String(input.actorId || form?.get("actorId") || "")
    if (kind !== "athletes" || type !== "avatar" || !id) throw new CnacDataError("MEDIA_SCOPE", "Seule la photo de profil des athlètes est disponible.")
    return saveExistingImage(request, "avatar", id)
  } catch (error) { return errorResponse(error) }
}

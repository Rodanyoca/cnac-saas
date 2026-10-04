import { readExistingImage, saveExistingImage } from "@/lib/cnac/media-handler"
export const runtime = "nodejs"
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return readExistingImage("logo", (await context.params).id) }
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { return saveExistingImage(request, "logo", (await context.params).id) }

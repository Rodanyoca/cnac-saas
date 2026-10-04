import { readExistingImage } from "@/lib/cnac/media-handler"
export const runtime = "nodejs"
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return readExistingImage("avatar", (await context.params).id) }

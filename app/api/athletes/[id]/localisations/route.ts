import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { readAthleteLocalisations, saveAthleteLocalisation } from "@/lib/cnac/localisation-service"
import { cnacError } from "@/lib/cnac/errors"
import { CnacDataError } from "@/lib/cnac/model"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
const failure = (error: unknown) => { const result = cnacError(error); return NextResponse.json({ error: result.message, code: result.code }, { status: result.status }) }

export async function GET(_request: Request, context: Context) {
  try { return NextResponse.json(await readAthleteLocalisations((await context.params).id), { headers: { "Cache-Control": "no-store" } }) } catch (error) { return failure(error) }
}
async function save(request: Request, context: Context, update: boolean) {
  try {
    const body = await request.json().catch(() => { throw new CnacDataError("INVALID_BODY", "Corps JSON invalide.") })
    if (!body || typeof body !== "object" || !body.row || typeof body.row !== "object" || Array.isArray(body.row)) throw new CnacDataError("INVALID_BODY", "Les informations du lieu sont obligatoires.")
    if (update && (typeof body.id !== "string" || !body.id.trim())) throw new CnacDataError("INVALID_BODY", "Le lieu à modifier est obligatoire.")
    const athleteId = (await context.params).id
    const row = await saveAthleteLocalisation(athleteId, body.row, update ? body.id.trim() : undefined)
    revalidatePath(`/dashboard/acteurs/athletes/${athleteId}`)
    return NextResponse.json({ ok: true, row })
  } catch (error) { return failure(error) }
}
export async function POST(request: Request, context: Context) { return save(request, context, false) }
export async function PUT(request: Request, context: Context) { return save(request, context, true) }

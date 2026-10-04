import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { createCompetitionProgram, getCompetitionPrograms, updateCompetitionProgram } from "@/lib/competitions/data"
import { runSportMutation } from "@/lib/competitions/mutation"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

export async function GET(_: Request, context: Context) {
  if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try { const { id } = await context.params; return NextResponse.json({ rows: await getCompetitionPrograms(id) }) }
  catch (error) { console.error("Chargement programmes", error); return NextResponse.json({ error: "Impossible de charger les programmes." }, { status: 500 }) }
}

async function write(request: Request, context: Context, update: boolean) {
  const { id: competitionId } = await context.params
  return runSportMutation(request, { action: update ? "MODIFICATION_PROGRAMME_COMPETITION" : "CREATION_PROGRAMME_COMPETITION", typeObjet: "PROGRAMME_COMPETITION" }, async (body) => {
    const row = update ? await updateCompetitionProgram(competitionId, String(body.id || ""), body.row || {}) : await createCompetitionProgram(competitionId, body.row || {})
    revalidatePath(`/dashboard/competitions/${competitionId}`); revalidatePath("/dashboard/competitions"); revalidatePath("/dashboard"); revalidateTag("competitions-dashboard", "max")
    return { row, objectId: row.id_programme_competition }
  })
}

export async function POST(request: Request, context: Context) { return write(request, context, false) }
export async function PUT(request: Request, context: Context) { return write(request, context, true) }

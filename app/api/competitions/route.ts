import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { createCompetition, getCompetitionReferences, getCompetitions, updateCompetition } from "@/lib/competitions/data"
import { canAccess } from "@/lib/auth"
import { runSportMutation } from "@/lib/competitions/mutation"

export const runtime = "nodejs"

export async function GET() {
  if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try { return NextResponse.json({ rows: await getCompetitions(), references: await getCompetitionReferences() }) }
  catch (error) { console.error("Chargement compétitions", error); return NextResponse.json({ error: "Impossible de charger les compétitions." }, { status: 500 }) }
}

async function write(request: Request, update: boolean) {
  return runSportMutation(request, { action: update ? "MODIFICATION_COMPETITION" : "CREATION_COMPETITION", typeObjet: "COMPETITION" }, async (body) => {
    const row = update ? await updateCompetition(String(body.id || ""), body.row || {}) : await createCompetition(body.row || {})
    revalidatePath("/dashboard/competitions")
    revalidatePath(`/dashboard/competitions/${row.id_competition}`)
    revalidatePath("/dashboard")
    revalidateTag("competitions-dashboard", "max")
    return { row, objectId: row.id_competition }
  })
}

export async function POST(request: Request) { return write(request, false) }
export async function PUT(request: Request) { return write(request, true) }

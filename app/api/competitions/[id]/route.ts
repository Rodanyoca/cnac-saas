import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { getCompetition, getTeamParticipations } from "@/lib/competitions/data"

export const runtime = "nodejs"
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try {
    const { id } = await params
    const row = await getCompetition(id)
    if (!row) return NextResponse.json({ error: "Compétition introuvable." }, { status: 404 })
    return NextResponse.json({ row, teams: await getTeamParticipations(id) })
  } catch (error) { console.error("Chargement compétition", error); return NextResponse.json({ error: "Impossible de charger la compétition." }, { status: 500 }) }
}

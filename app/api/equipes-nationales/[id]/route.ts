import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { getNationalTeam, getNationalTeamMembers } from "@/lib/equipes-nationales/data"

export const runtime = "nodejs"
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try { const { id } = await params, row = await getNationalTeam(id); return row ? NextResponse.json({ row, members: await getNationalTeamMembers(id) }) : NextResponse.json({ error: "Équipe nationale introuvable." }, { status: 404 }) }
  catch (error) { console.error(error); return NextResponse.json({ error: "Impossible de charger l’équipe nationale." }, { status: 500 }) }
}

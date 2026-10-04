import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { getTeamParticipations } from "@/lib/competitions/data"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Context) {
  if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try { const { id } = await params; return NextResponse.json({ rows: await getTeamParticipations(id) }) }
  catch (error) { console.error("Chargement équipes compétition", error); return NextResponse.json({ error: "Impossible de charger les équipes nationales." }, { status: 500 }) }
}

async function retiredWrite() {
  if (!(await canAccess("AUT-SPT", "WRITE"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  return NextResponse.json({ error: "La relation directe équipe-compétition est retirée. Utilisez un engagement de campagne dans un programme." }, { status: 410 })
}
export async function POST() { return retiredWrite() }
export async function PUT() { return retiredWrite() }

import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { getNationalTeamMembers, getNationalTeams } from "@/lib/equipes-nationales/data"

export const runtime = "nodejs"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try {
    const { id } = await params
    const actorType = new URL(request.url).searchParams.get("type") || undefined
    const [members, teams] = await Promise.all([getNationalTeamMembers(undefined, id, actorType), getNationalTeams()])
    return NextResponse.json({ rows: members.map((member) => ({ member, team: teams.find((team) => team.id_equipe_nationale === member.id_equipe_nationale) })).filter((row) => row.team) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Impossible de charger les équipes nationales de l’acteur." }, { status: 500 })
  }
}

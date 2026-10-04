import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { getAthleteSportHistory } from "@/lib/athletes/sport-history-data"

export const runtime = "nodejs"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try {
    const { id } = await params
    return NextResponse.json(await getAthleteSportHistory(id))
  } catch (error) {
    console.error("Athlete sport history:", error)
    return NextResponse.json({ error: "Impossible de charger l’historique sportif de l’athlète." }, { status: 500 })
  }
}

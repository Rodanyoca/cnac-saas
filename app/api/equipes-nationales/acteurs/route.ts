import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { getActorOptions } from "@/lib/equipes-nationales/data"
import type { ActorType } from "@/lib/equipes-nationales/types"

export const runtime = "nodejs"
export async function GET(request: Request) {
  if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try { const type = new URL(request.url).searchParams.get("type") as ActorType; return NextResponse.json({ rows: await getActorOptions(type, { fresh: true }) }) }
  catch (error) { console.error(error); return NextResponse.json({ error: "Impossible de charger les acteurs." }, { status: 400 }) }
}

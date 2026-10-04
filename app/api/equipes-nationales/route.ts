import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { createNationalTeam, getNationalTeamMembers, getNationalTeamReferences, getNationalTeams, updateNationalTeam } from "@/lib/equipes-nationales/data"
import { canAccess } from "@/lib/auth"
import { runSportMutation } from "@/lib/competitions/mutation"
export const runtime = "nodejs"
export async function GET() { if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 }); try { return NextResponse.json({ rows: await getNationalTeams(), members: await getNationalTeamMembers(), references: await getNationalTeamReferences() }) } catch (error) { console.error("Chargement équipes nationales", error); return NextResponse.json({ error: "Impossible de charger les équipes nationales." }, { status: 500 }) } }
async function write(request: Request, update = false) { return runSportMutation(request, { action: update ? "MODIFICATION_EQUIPE_NATIONALE" : "CREATION_EQUIPE_NATIONALE", typeObjet: "EQUIPE_NATIONALE" }, async (body) => { const row = update ? await updateNationalTeam(String(body.id || ""), body.row || {}) : await createNationalTeam(body.row || {}); revalidatePath("/dashboard/equipes-nationales"); revalidatePath(`/dashboard/equipes-nationales/${row.id_equipe_nationale}`); revalidatePath("/dashboard"); revalidateTag("national-teams-dashboard", "max"); return { row, objectId: row.id_equipe_nationale } }) }
export async function POST(request: Request) { return write(request) }
export async function PATCH(request: Request) { return write(request, true) }

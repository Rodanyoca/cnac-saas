import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { createNationalTeamMember, getNationalTeamMembers, updateNationalTeamMember } from "@/lib/equipes-nationales/data"
import { runSportMutation } from "@/lib/competitions/mutation"
export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(_: Request, { params }: Context) { if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 }); const { id } = await params; try { return NextResponse.json({ rows: await getNationalTeamMembers(id) }) } catch (error) { console.error(error); return NextResponse.json({ error: "Impossible de charger les membres de l’équipe nationale." }, { status: 500 }) } }
async function write(request: Request, context: Context, update = false) { const { id } = await context.params; return runSportMutation(request, { action: update ? "MODIFICATION_MEMBRE_EQUIPE" : "CREATION_MEMBRE_EQUIPE", typeObjet: "MEMBRE_EQUIPE_NATIONALE" }, async (body) => { const row = update ? await updateNationalTeamMember(id, String(body.id || ""), body.row || {}) : await createNationalTeamMember(id, body.row || {}); revalidatePath(`/dashboard/equipes-nationales/${id}`); revalidatePath("/dashboard/equipes-nationales"); revalidatePath("/dashboard"); revalidateTag("national-teams-dashboard", "max"); return { row, objectId: row.id_membre_equipe_nationale } }) }
export async function POST(request: Request, context: Context) { return write(request, context) }
export async function PATCH(request: Request, context: Context) { return write(request, context, true) }

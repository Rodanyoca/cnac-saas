import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { createNationalTeamCampaign, getNationalTeamCampaigns, updateNationalTeamCampaign } from "@/lib/equipes-nationales/data"
import { runSportMutation } from "@/lib/competitions/mutation"

type Context = { params: Promise<{ id: string }> }
export async function GET(_: Request, context: Context) { if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 }); const { id } = await context.params; return NextResponse.json({ rows: await getNationalTeamCampaigns(id) }) }
async function write(request: Request, context: Context, update: boolean) {
  const { id: teamId } = await context.params
  return runSportMutation(request, { action: update ? "MODIFICATION_CAMPAGNE" : "CREATION_CAMPAGNE", typeObjet: "CAMPAGNE_EQUIPE_NATIONALE" }, async (body) => { const row = update ? await updateNationalTeamCampaign(teamId, String(body.id || ""), body.row || {}) : await createNationalTeamCampaign(teamId, body.row || {}); revalidatePath(`/dashboard/equipes-nationales/${teamId}`); revalidateTag("competitions-dashboard", "max"); return { row, objectId: row.id_campagne } })
}
export async function POST(request: Request, context: Context) { return write(request, context, false) }
export async function PUT(request: Request, context: Context) { return write(request, context, true) }

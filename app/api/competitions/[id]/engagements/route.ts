import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { createCampaignEngagement, getCampaignEngagements, getEngagementReferences, updateCampaignEngagement } from "@/lib/competitions/data"
import { runSportMutation } from "@/lib/competitions/mutation"

type Context = { params: Promise<{ id: string }> }
export async function GET(_: Request, context: Context) { if (!(await canAccess("AUT-SPT", "READ"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 }); const { id } = await context.params; return NextResponse.json({ rows: await getCampaignEngagements({ competitionId: id, fresh: true }), references: await getEngagementReferences() }) }
async function write(request: Request, context: Context, update: boolean) {
  const { id: competitionId } = await context.params
  return runSportMutation(request, { action: update ? "MODIFICATION_ENGAGEMENT_CAMPAGNE" : "CREATION_ENGAGEMENT_CAMPAGNE", typeObjet: "ENGAGEMENT_CAMPAGNE" }, async (body) => { const row = update ? await updateCampaignEngagement(competitionId, String(body.id || ""), body.row || {}) : await createCampaignEngagement(competitionId, body.row || {}); revalidatePath(`/dashboard/competitions/${competitionId}`); revalidatePath("/dashboard/equipes-nationales"); revalidateTag("competitions-dashboard", "max"); return { row, objectId: row.id_engagement_campagne } })
}
export async function POST(request: Request, context: Context) { return write(request, context, false) }
export async function PUT(request: Request, context: Context) { return write(request, context, true) }

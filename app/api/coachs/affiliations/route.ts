import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { canAccess } from "@/lib/auth"
import { errorResponse } from "@/lib/cnac/actor-handler"
import { readCoachAffiliations, requireCoach, prepareCoachAffiliations, commitCoachAffiliations } from "@/lib/cnac/coach-affiliations-service"
import { withCnacCreationQueue } from "@/lib/cnac/identifiers"
import { CnacDataError } from "@/lib/cnac/model"

export const runtime = "nodejs"
export async function GET(request: Request) {
  try { return NextResponse.json(await readCoachAffiliations(new URL(request.url).searchParams.get("coachId")?.trim() || undefined),{headers:{"Cache-Control":"no-store"}}) }
  catch(error) { return errorResponse(error) }
}
async function save(request: Request) {
  if (!(await canAccess("AUT-SPT","WRITE"))) return NextResponse.json({error:"Accès refusé."},{status:403})
  return withCnacCreationQueue("coach-affiliations",async()=>{
    try {
      let body
      try { body = await request.json() } catch { throw new CnacDataError("INVALID_BODY","Corps JSON invalide.") }
      if (!body || typeof body.coachId!=="string" || !Array.isArray(body.affiliations)) throw new CnacDataError("INVALID_BODY","Coach et affiliations obligatoires.")
      const coach = await requireCoach(body.coachId.trim())
      const drafts = await prepareCoachAffiliations(coach,body.affiliations)
      await commitCoachAffiliations(coach.id_coach_cnac,drafts)
      revalidatePath(`/dashboard/acteurs/entraineurs/${coach.id_coach_cnac}`)
      revalidatePath("/dashboard/acteurs/entraineurs")
      revalidatePath("/dashboard/acteurs/athletes","layout")
      return NextResponse.json({ok:true})
    } catch(error) { return errorResponse(error) }
  })
}
export const POST = save
export const PUT = save

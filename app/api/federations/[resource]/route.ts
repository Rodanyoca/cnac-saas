import { territorialWrite } from "@/lib/cnac/territorial-handler"
import { canAccess } from "@/lib/auth"
import { loadTeamReferences } from "@/lib/cnac/affiliation-data"
import { errorResponse } from "@/lib/cnac/actor-handler"
// Les accès utilisateur et l'exception locale CNAC sont contrôlés par ce service.
export const runtime = "nodejs"
type Context = { params: Promise<{ resource:string }> }
export async function GET(_request: Request, context: Context) {
  if ((await context.params).resource !== "equipes") return Response.json({error: "Ressource inconnue."}, {status: 404})
  if (!(await canAccess("AUT-SPT", "READ"))) return Response.json({error: "Accès refusé."}, {status: 403})
  try { return Response.json({references: await loadTeamReferences()}) } catch(error) { return errorResponse(error) }
}
export async function POST(request:Request,context:Context) { return territorialWrite((await context.params).resource,request,"POST") }
export async function PUT(request:Request,context:Context) { return territorialWrite((await context.params).resource,request,"PUT") }
export async function DELETE(request:Request,context:Context) { return territorialWrite((await context.params).resource,request,"DELETE") }

import {revalidatePath,revalidateTag} from "next/cache"
import {NextResponse} from "next/server"
import {canAccess} from "@/lib/auth"
import {createAthleteParticipation,createCocParticipant,getCocParticipantReferences,getCompetitionParticipants,getParticipationReferences,updateAthleteParticipation} from "@/lib/competitions/data"
import {runSportMutation} from "@/lib/competitions/mutation"
type Context={params:Promise<{id:string}>}
export async function GET(request:Request,context:Context){if(!(await canAccess("AUT-SPT","READ")))return NextResponse.json({error:"Accès refusé."},{status:403});const{id}=await context.params,actorType=new URL(request.url).searchParams.get("actorType");if(actorType)return NextResponse.json(await getCocParticipantReferences(actorType));return NextResponse.json({rows:await getCompetitionParticipants(id,true),references:await getParticipationReferences()})}
async function write(request:Request,context:Context,update:boolean){const{id:competitionId}=await context.params;return runSportMutation(request,{action:update?"MODIFICATION_PARTICIPATION_ATHLETE":"CREATION_PARTICIPATION_ACTEUR",typeObjet:"PARTICIPATION_ACTEUR"},async(body)=>{const payload=body.row||{},isCoc=!update&&String(payload.id_type_acteur||"").toUpperCase()!=="ATHLETE"&&Boolean(payload.id_type_acteur);const row=update?await updateAthleteParticipation(competitionId,String(body.id||""),payload):isCoc?await createCocParticipant(competitionId,payload):await createAthleteParticipation(competitionId,payload);if(!row)throw new Error("Participation créée mais relecture impossible.");revalidatePath(`/dashboard/competitions/${competitionId}`);revalidateTag("competitions-dashboard","max");return{row,objectId:row.id_participation_acteur}})}
export async function POST(request:Request,context:Context){return write(request,context,false)}
export async function PUT(request:Request,context:Context){return write(request,context,true)}

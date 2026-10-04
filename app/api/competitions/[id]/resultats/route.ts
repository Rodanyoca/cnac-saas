import {revalidatePath,revalidateTag} from "next/cache"
import {NextResponse} from "next/server"
import {canAccess} from "@/lib/auth"
import {correctCompetitionResult,createCompetitionResult,getCompetitionResults,getResultReferences} from "@/lib/competitions/data"
import {runSportMutation} from "@/lib/competitions/mutation"
type Context={params:Promise<{id:string}>}
export async function GET(_:Request,context:Context){if(!(await canAccess("AUT-SPT","READ")))return NextResponse.json({error:"Accès refusé."},{status:403});const{id}=await context.params;return NextResponse.json({rows:await getCompetitionResults(id),references:await getResultReferences()})}
async function write(request:Request,context:Context,correction:boolean){const{id:competitionId}=await context.params;return runSportMutation(request,{action:correction?"CORRECTION_RESULTAT":"CREATION_RESULTAT",typeObjet:"RESULTAT_COMPETITION"},async(body)=>{const result=correction?await correctCompetitionResult(competitionId,String(body.id||""),body.row||{}):await createCompetitionResult(competitionId,body.row||{});revalidatePath(`/dashboard/competitions/${competitionId}`);revalidateTag("competitions-dashboard","max");return{row:result,objectId:result.id_resultat}})}
export async function POST(request:Request,context:Context){return write(request,context,false)}
export async function PUT(request:Request,context:Context){return write(request,context,true)}

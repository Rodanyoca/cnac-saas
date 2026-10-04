import {revalidatePath,revalidateTag} from "next/cache"
import {NextResponse} from "next/server"
import {canAccess} from "@/lib/auth"
import {createCampaignSelection,getCampaignSelections,getSelectionReferences,updateCampaignSelection} from "@/lib/equipes-nationales/data"
import {runSportMutation} from "@/lib/competitions/mutation"
type Context={params:Promise<{id:string}>}
export async function GET(_:Request,context:Context){if(!(await canAccess("AUT-SPT","READ")))return NextResponse.json({error:"Accès refusé."},{status:403});const{id}=await context.params;return NextResponse.json({rows:await getCampaignSelections(id),references:await getSelectionReferences()})}
async function write(request:Request,context:Context,update:boolean){const{id:teamId}=await context.params;return runSportMutation(request,{action:update?"MODIFICATION_SELECTION":"CREATION_SELECTION",typeObjet:"SELECTION_ATHLETE"},async(body)=>{const row=update?await updateCampaignSelection(teamId,String(body.id||""),body.row||{}):await createCampaignSelection(teamId,body.row||{});revalidatePath(`/dashboard/equipes-nationales/${teamId}`);revalidateTag("national-teams-dashboard","max");return{row,objectId:row.id_selection}})}
export async function POST(request:Request,context:Context){return write(request,context,false)}
export async function PUT(request:Request,context:Context){return write(request,context,true)}

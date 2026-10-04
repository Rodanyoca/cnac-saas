import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { createCompetitionMedal, deleteCompetitionMedal, getCompetitionMedals, getMedalReferences, updateCompetitionMedal } from "@/lib/competitions/data"
import { runSportMutation } from "@/lib/competitions/mutation"

type Context={params:Promise<{id:string}>}

export async function GET(_:Request,context:Context){
 if(!(await canAccess("AUT-SPT","READ")))return NextResponse.json({error:"Accès refusé."},{status:403})
 const{id}=await context.params
 return NextResponse.json({rows:await getCompetitionMedals(id),references:await getMedalReferences()})
}

async function mutate(request:Request,context:Context,action:"create"|"update"|"delete"){
 const{id:competitionId}=await context.params
 return runSportMutation(request,{action:action==="create"?"CREATION_MEDAILLE":action==="update"?"MODIFICATION_MEDAILLE":"SUPPRESSION_MEDAILLE",typeObjet:"MEDAILLE_COMPETITION"},async body=>{
  const row=action==="create"?await createCompetitionMedal(competitionId,body.row||{}):action==="update"?await updateCompetitionMedal(competitionId,String(body.id||""),body.row||{}):await deleteCompetitionMedal(competitionId,String(body.id||""))
  revalidatePath(`/dashboard/competitions/${competitionId}`);revalidateTag("competitions-dashboard","max")
  return{row,objectId:row.id_medaille}
 })
}

export async function POST(request:Request,context:Context){return mutate(request,context,"create")}
export async function PUT(request:Request,context:Context){return mutate(request,context,"update")}
export async function DELETE(request:Request,context:Context){return mutate(request,context,"delete")}

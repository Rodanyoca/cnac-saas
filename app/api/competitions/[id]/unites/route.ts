import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { authorizeWithSource } from "@/lib/auth/authorization"
import { getAuthorizationsForUser } from "@/lib/users/data"
import { createParticipatingUnit, getParticipatingUnits, updateParticipatingUnit } from "@/lib/competitions/data"
import { runSportMutation } from "@/lib/competitions/mutation"
import { apiErrorPayload } from "@/lib/api/errors"
import { randomUUID } from "node:crypto"

type Context={params:Promise<{id:string}>}
export async function GET(_:Request,context:Context){
 const session=await getSession()
 if(!session){const failure=apiErrorPayload(new Error("Authentification requise."),randomUUID(),401);return NextResponse.json(failure.payload,{status:failure.status})}
 const access=await authorizeWithSource({user:session,requirement:{scope:"BUSINESS",blocks:["AUT-SPT"]},action:"READ",loadAuthorizations:()=>getAuthorizationsForUser(session.idUser)})
 if(!access.allowed){const sourceUnavailable=access.reason==="SOURCE_UNAVAILABLE",status=sourceUnavailable?503:403,failure=apiErrorPayload(new Error(sourceUnavailable?"Service d’autorisation temporairement indisponible.":"Accès refusé."),randomUUID(),status);return NextResponse.json(failure.payload,{status:failure.status})}
 const{id}=await context.params
 try{return NextResponse.json({rows:await getParticipatingUnits(id)})}catch(error){console.error("Chargement unités participantes",error);const failure=apiErrorPayload(error,randomUUID());return NextResponse.json(failure.payload,{status:failure.status})}
}
export async function POST(request:Request,context:Context){const{id}=await context.params;return runSportMutation(request,{action:"CREATION_UNITE_PARTICIPANTE",typeObjet:"UNITE_PARTICIPANTE"},async(body)=>{const row=await createParticipatingUnit(id,body.row||{});revalidatePath(`/dashboard/competitions/${id}`);revalidateTag("competitions-dashboard","max");return{row,objectId:row.id_unite_participante}})}
export async function PUT(request:Request,context:Context){const{id}=await context.params;return runSportMutation(request,{action:"MODIFICATION_UNITE_PARTICIPANTE",typeObjet:"UNITE_PARTICIPANTE"},async(body)=>{const row=await updateParticipatingUnit(id,String(body.id||""),body.row||{});revalidatePath(`/dashboard/competitions/${id}`);revalidateTag("competitions-dashboard","max");return{row,objectId:row.id_unite_participante}})}

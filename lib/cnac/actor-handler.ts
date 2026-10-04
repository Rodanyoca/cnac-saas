import { loadAffiliationReferences } from "./affiliation-data"
import "server-only"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { isCnacDemoMode, canWriteLocalTerritorialMutation } from "@/lib/demo-mode"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { ACTOR_CONFIGS, actorPatch, type ActorKind } from "./actors-model"
import { appendSheetRow,getSheetRows,getSheetsRows,updateSheetCells } from "./sheets"
import { CNAC_KEYS } from "./schema"
import { CnacDataError } from "./model"
import { cnacError } from "./errors"
import { nextCompactCnacId, recordIds, withCnacCreationQueue } from "./identifiers"

export async function writeAccess() {
  if(isCnacDemoMode())return NextResponse.json({error:"Consultation locale CNAC : aucune session utilisateur réelle. Écriture refusée tant que les accès CNAC ne sont pas configurés.",code:"CNAC_DEMO_READ_ONLY"},{status:403})
  if(!(await canAccess("AUT-SPT","WRITE")))return NextResponse.json({error:"Accès en écriture refusé.",code:"ACCESS_DENIED"},{status:403})
}
export function errorResponse(error:unknown) { const failure=cnacError(error);console.error("[CNAC API]",{code:failure.code});return NextResponse.json({error:failure.message,code:failure.code},{status:failure.status}) }
export async function actorRead(kind:ActorKind) {
  if(!(await canAccess("AUT-SPT","READ")))return NextResponse.json({error:"Accès refusé."},{status:403})
  try{return NextResponse.json({rows:await getSheetRows({sheetName:ACTOR_CONFIGS[kind].sheet,spreadsheetId:getActeursSpreadsheetId()})})}catch(error){return errorResponse(error)}
}
export async function actorWrite(kind:ActorKind,request:Request,method:"POST"|"PUT") {
  if(method==="POST")return withCnacCreationQueue(`actor:${kind}`,()=>actorWriteRecord(kind,request,method))
  return actorWriteRecord(kind,request,method)
}

async function actorWriteRecord(kind:ActorKind,request:Request,method:"POST"|"PUT") {
  if (!canWriteLocalTerritorialMutation(kind, method, process.env, request.headers.get("host") || "", request.headers.get("origin") || "")) { const denied=await writeAccess();if(denied)return denied }
  try{
    let body:{id?:unknown;row?:Record<string,unknown>}
    try{body=await request.json()}catch{throw new CnacDataError("INVALID_BODY","Corps JSON invalide.")}
    if(!body.row || typeof body.row!=="object" || Array.isArray(body.row))throw new CnacDataError("INVALID_BODY","La fiche à enregistrer est obligatoire.")
    const config=ACTOR_CONFIGS[kind],idColumn=CNAC_KEYS[config.sheet],spreadsheetId=getActeursSpreadsheetId()
    const [existing,refs]=await Promise.all([getSheetRows({sheetName:config.sheet,spreadsheetId,bypassCache:true}),getSheetsRows({sheetNames:config.relation==="id_federation"?["FEDERATIONS","SEXES"]:kind==="medecins"?["ENTITES","SEXES","SPECIALITES_MEDECIN"]:["ENTITES","SEXES"],spreadsheetId:getReferentialSpreadsheetId()})])
    const id=String(body.id??"").trim(),current=method==="PUT"?existing.find(row=>row[idColumn]===id):undefined
    if(method==="PUT"&&!current)throw new CnacDataError("NOT_FOUND","Fiche introuvable.",404)
    if(kind === "athletes") Object.assign(refs, await loadAffiliationReferences())
    const patch=actorPatch(kind,body.row,current,refs,existing)
    const createdId=method==="POST"?nextCompactCnacId(config.prefix,recordIds(existing,idColumn)):id
    if(method==="POST")await appendSheetRow({sheetName:config.sheet,spreadsheetId,row:{...patch,[idColumn]:createdId,statut:patch.statut||"ACTIF"}})
    else await updateSheetCells({sheetName:config.sheet,spreadsheetId,idColumn,idValue:id,updates:Object.entries(patch).map(([column,value])=>({column,value}))})
    revalidatePath(`/dashboard/acteurs/${kind}`);revalidatePath(`/dashboard/acteurs/${kind}/${createdId}`)
    return NextResponse.json({ok:true,row:{...current,...patch,[idColumn]:createdId,[idColumn.replace("_cnac","_coc")]:createdId}})
  }catch(error){return errorResponse(error)}
}

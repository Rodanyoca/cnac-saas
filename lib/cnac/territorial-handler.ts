import "server-only"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getReferentialSpreadsheetId,getTerritorialSpreadsheetId } from "@/lib/federations/config"
import { appendSheetRow,deleteSheetRow,getSheetsRows,updateSheetCells } from "./sheets"
import { CnacDataError,civilDate } from "./model"
import { CNAC_GROUPS,CNAC_KEYS } from "./schema"
import { TERRITORIAL_SHEETS,territorialPatch,territorialEditorRow,type TerritorialKind } from "./territorial-model"
import { errorResponse,writeAccess } from "./actor-handler"
import { canWriteLocalTerritorialMutation } from "@/lib/demo-mode"
import { CNAC_ID_PREFIXES, nextCompactCnacId, recordIds, withCnacCreationQueue } from "./identifiers"

export async function territorialWrite(resource:string,request:Request,method:"POST"|"PUT"|"DELETE") {
  if(method==="POST")return withCnacCreationQueue(`territorial:${resource}`,()=>territorialWriteRecord(resource,request,method))
  return territorialWriteRecord(resource,request,method)
}

async function territorialWriteRecord(resource:string,request:Request,method:"POST"|"PUT"|"DELETE") {
  if(!canWriteLocalTerritorialMutation(resource,method,process.env,request.headers.get("host")||"",request.headers.get("origin")||"")){const denied=await writeAccess();if(denied)return denied}
  try{
    let body:{id?:unknown;row?:Record<string,unknown>;federationId?:unknown}
    try{body=await request.json()}catch{throw new CnacDataError("INVALID_BODY","Corps JSON invalide.")}
    const id=String(body.id??"").trim(),input=body.row||{}
    if(resource==="identification"){
      if(method!=="PUT")throw new CnacDataError("METHOD","Action non prévue.",405)
      const spreadsheetId=getReferentialSpreadsheetId(),refs=await getSheetsRows({sheetNames:["FEDERATIONS","ENTITES"],spreadsheetId,bypassCache:true})
      const current=refs.FEDERATIONS.find(row=>row.id_federation===id)
      if(!current)throw new CnacDataError("NOT_FOUND","Fédération introuvable.",404)
      const allowed=["statut_reconnaissance_ministere","date_reconnaissance_nationale","statut_affiliation_coc","date_affiliation_coc","id_entite_continentale","date_affiliation_continentale","id_entite_internationale","date_affiliation_internationale","statut","observations"]
      const patch=Object.fromEntries(Object.entries(input).filter(([key])=>allowed.includes(key)).map(([key,value])=>[key,String(value??"").trim()]))
      for(const key of ["id_entite_continentale","id_entite_internationale"])if(patch[key]&&!refs.ENTITES.some(row=>row.id_entite===patch[key]))throw new CnacDataError("ENTITY_INVALID","Entité liée introuvable.")
      for(const key of Object.keys(patch).filter(key=>key.startsWith("date_")))patch[key]=civilDate(patch[key])
      await updateSheetCells({sheetName:"FEDERATIONS",spreadsheetId,idColumn:"id_federation",idValue:id,updates:Object.entries(patch).map(([column,value])=>({column,value}))})
      revalidatePath(`/dashboard/federations/${id}`)
      return NextResponse.json({ok:true})
    }
    if(!(resource in TERRITORIAL_SHEETS))throw new CnacDataError("RESOURCE","Ressource inconnue.",404)
    const kind=resource as TerritorialKind,sheet=TERRITORIAL_SHEETS[kind],idColumn=CNAC_KEYS[sheet],spreadsheetId=getTerritorialSpreadsheetId()
    const [territorial,refs]=await Promise.all([getSheetsRows({sheetNames:[...CNAC_GROUPS.STRUCTURE_TERRITORIALE].filter(name=>name!=="PERSONNES_CONTACT_ENTITES"),spreadsheetId,bypassCache:true}),getSheetsRows({sheetNames:[...CNAC_GROUPS.REFERENTIEL],spreadsheetId:getReferentialSpreadsheetId()})])
    const current=method!=="POST"?territorial[sheet].find(row=>row[idColumn]===id):undefined
    if(method!=="POST"&&!current)throw new CnacDataError("NOT_FOUND","Structure introuvable.",404)
    if(method==="DELETE"){
      if(kind!=="hierarchie")throw new CnacDataError("NO_DELETE","Suppression définitive non prévue.",405)
      if(current!.id_federation!==String(body.federationId??""))throw new CnacDataError("FEDERATION_INVALID","Fédération incohérente.")
      await deleteSheetRow({sheetName:sheet,spreadsheetId,idColumn,idValue:id})
      revalidatePath(`/dashboard/federations/${current!.id_federation}`)
      return NextResponse.json({ok:true})
    }
    const patch=territorialPatch(kind,input,current,territorial,refs)
    const internalId=method==="POST"?nextCompactCnacId(CNAC_ID_PREFIXES[sheet],Object.values(TERRITORIAL_SHEETS).flatMap(name=>recordIds(territorial[name]||[],CNAC_KEYS[name]))):id
    if(method==="POST")await appendSheetRow({sheetName:sheet,spreadsheetId,row:{...patch,[idColumn]:internalId,...(kind==="hierarchie"?{}:{statut:patch.statut||"ACTIF"})}})
    else await updateSheetCells({sheetName:sheet,spreadsheetId,idColumn,idValue:id,updates:Object.entries(patch).map(([column,value])=>({column,value}))})
    revalidatePath(`/dashboard/federations/${patch.id_federation||current?.id_federation}`, "layout")
    if(kind === "equipes") revalidatePath("/dashboard/acteurs/athletes", "layout")
    return NextResponse.json({ok:true,row:territorialEditorRow(kind,{...current,...patch,[idColumn]:internalId})})
  }catch(error){return errorResponse(error)}
}

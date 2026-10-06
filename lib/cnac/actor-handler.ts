import { loadAffiliationReferences } from "./affiliation-data"
import { prepareCoachAffiliations, commitCoachAffiliations } from "./coach-affiliations-service"
import "server-only"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { ACTOR_CONFIGS, actorPatch, type ActorKind } from "./actors-model"
import { appendSheetRow,getSheetRows,getSheetsRows,updateSheetCells } from "./sheets"
import { CNAC_HEADERS, CNAC_KEYS } from "./schema"
import { CnacDataError } from "./model"
import { cnacError } from "./errors"
import { nextCompactCnacId, recordIds, reserveCnacIdentifier, withCnacCreationQueue } from "./identifiers"
import { prepareOrSave, readSaveBody } from "./media-save"
import { cnacMediaUrl } from "./media-url"

export async function writeAccess() {
  if(!(await canAccess("AUT-SPT","WRITE")))return NextResponse.json({error:"Accès en écriture refusé.",code:"ACCESS_DENIED"},{status:403})
}
export function errorResponse(error:unknown) { const failure=cnacError(error);console.error("[CNAC API]",{code:failure.code});return NextResponse.json({error:failure.message,code:failure.code},{status:failure.status}) }
export async function actorRead(kind:ActorKind) {
  if(!(await canAccess("AUT-SPT","READ")))return NextResponse.json({error:"Accès refusé."},{status:403})
  try{
    const rows = await getSheetRows({sheetName:ACTOR_CONFIGS[kind].sheet,spreadsheetId:getActeursSpreadsheetId()})
    return NextResponse.json({rows: kind === "athletes" ? rows.map(row => ({ ...row, avatar_drive_url: cnacMediaUrl("avatar", row.id_athlete_cnac, row.avatar_drive_id || "") })) : rows})
  }catch(error){return errorResponse(error)}
}
export async function actorWrite(kind:ActorKind,request:Request,method:"POST"|"PUT") {
  if (kind === "entraineurs") return withCnacCreationQueue("coach-affiliations", () => actorWriteRecord(kind, request, method))
  if (kind === "athletes" && request.headers.get("content-type")?.includes("multipart/form-data")) return withCnacCreationQueue("media:ATHLETES", () => actorWriteRecord(kind, request, method))
  if(method==="POST")return withCnacCreationQueue(`actor:${kind}`,()=>actorWriteRecord(kind,request,method))
  return actorWriteRecord(kind,request,method)
}

async function actorWriteRecord(kind:ActorKind,request:Request,method:"POST"|"PUT") {
  const denied=await writeAccess();if(denied)return denied
  try{
    if (kind === "athletes" && request.headers.get("content-type")?.includes("multipart/form-data")) {
      const { body, file } = await readSaveBody(request)
      if (!body.row || typeof body.row !== "object" || Array.isArray(body.row)) throw new CnacDataError("INVALID_BODY", "La fiche à enregistrer est obligatoire.")
      const result = await prepareOrSave({ scope: `athletes:${method}:${String(body.id || "")}`, body, file, kind: "avatar", buildRows: async () => {
        const spreadsheetId = getActeursSpreadsheetId()
        const [existing, refs, affiliation] = await Promise.all([getSheetRows({ sheetName: "ATHLETES", spreadsheetId, bypassCache: true }), getSheetsRows({ sheetNames: ["FEDERATIONS", "SEXES"], spreadsheetId: getReferentialSpreadsheetId() }), loadAffiliationReferences()])
        Object.assign(refs, affiliation)
        const id = String(body.id || "").trim(), current = method === "PUT" ? existing.find(row => row.id_athlete_cnac === id) : undefined
        if (method === "PUT" && !current) throw new CnacDataError("NOT_FOUND", "Fiche introuvable.", 404)
        const patch = actorPatch(kind, body.row!, current, refs, existing)
        const createdId = method === "POST" ? reserveCnacIdentifier("ATHLETES", recordIds(existing, "id_athlete_cnac"), ids => nextCompactCnacId("ATH", ids)) : id
        return [{ sheet: "ATHLETES", id: createdId, mode: method === "POST" ? "create" : "update", values: { ...patch, id_athlete_cnac: createdId, ...(method === "POST" ? { statut: patch.statut || "ACTIF" } : {}) }, before: current ? Object.fromEntries(CNAC_HEADERS.ATHLETES.map(column => [column, current[column] || ""])) : undefined }]
      } })
      if (result instanceof Response) return result
      const row = result.rows[0]!
      revalidatePath("/dashboard/acteurs/athletes"); revalidatePath(`/dashboard/acteurs/athletes/${row.id_athlete_cnac}`)
      return NextResponse.json({ ok: true, row: { ...row, avatar_drive_url: cnacMediaUrl("avatar", row.id_athlete_cnac, row.avatar_drive_id || ""), id_athlete_coc: row.id_athlete_cnac } })
    }
    let body:{id?:unknown;row?:Record<string,unknown>;affiliations?:unknown}
    try{body=await request.json()}catch{throw new CnacDataError("INVALID_BODY","Corps JSON invalide.")}
    if(!body.row || typeof body.row!=="object" || Array.isArray(body.row))throw new CnacDataError("INVALID_BODY","La fiche à enregistrer est obligatoire.")
    const config=ACTOR_CONFIGS[kind],idColumn=CNAC_KEYS[config.sheet],spreadsheetId=getActeursSpreadsheetId()
    const [existing,refs]=await Promise.all([getSheetRows({sheetName:config.sheet,spreadsheetId,bypassCache:true}),getSheetsRows({sheetNames:config.relation==="id_federation"?["FEDERATIONS","SEXES"]:kind==="medecins"?["ENTITES","SEXES","SPECIALITES_MEDECIN"]:["ENTITES","SEXES"],spreadsheetId:getReferentialSpreadsheetId()})])
    const id=String(body.id??"").trim(),current=method==="PUT"?existing.find(row=>row[idColumn]===id):undefined
    if(method==="PUT"&&!current)throw new CnacDataError("NOT_FOUND","Fiche introuvable.",404)
    if(kind === "athletes") Object.assign(refs, await loadAffiliationReferences())
    const patch=actorPatch(kind,body.row,current,refs,existing)
    const createdId=method==="POST"?nextCompactCnacId(config.prefix,recordIds(existing,idColumn)):id
    const coachDrafts = kind === "entraineurs" ? await prepareCoachAffiliations({...current,...patch,id_coach_cnac:createdId},body.affiliations) : []
    if(method==="POST")await appendSheetRow({sheetName:config.sheet,spreadsheetId,row:{...patch,[idColumn]:createdId,statut:patch.statut||"ACTIF"}})
    else await updateSheetCells({sheetName:config.sheet,spreadsheetId,idColumn,idValue:id,updates:Object.entries(patch).map(([column,value])=>({column,value}))})
    revalidatePath(`/dashboard/acteurs/${kind}`);revalidatePath(`/dashboard/acteurs/${kind}/${createdId}`)
    if (kind === "entraineurs") {
      try { await commitCoachAffiliations(createdId,coachDrafts) }
      catch(error) { revalidatePath("/dashboard/acteurs/athletes","layout");return NextResponse.json({ok:true,row:{...current,...patch,[idColumn]:createdId,id_coach_coc:createdId},affiliationsError:`Identité enregistrée, mais les affiliations ne sont pas toutes confirmées : ${cnacError(error).message}`}) }
      revalidatePath("/dashboard/acteurs/athletes","layout")
    }
    return NextResponse.json({ok:true,row:{...current,...patch,[idColumn]:createdId,[idColumn.replace("_cnac","_coc")]:createdId}})
  }catch(error){return errorResponse(error)}
}

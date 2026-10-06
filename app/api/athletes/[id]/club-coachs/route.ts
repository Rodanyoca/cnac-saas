import { NextResponse } from "next/server"
import { canAccess } from "@/lib/auth"
import { getActeursAffiliationsSpreadsheetId, getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getSheetRows, getSheetsRows } from "@/lib/cnac/sheets"
import { activeClubCoaches } from "@/lib/cnac/coach-affiliations-model"
import { errorResponse } from "@/lib/cnac/actor-handler"
import { CnacDataError } from "@/lib/cnac/model"

export async function GET(_request: Request, {params}: {params:Promise<{id:string}>}) {
  if (!(await canAccess("AUT-SPT","READ"))) return NextResponse.json({error:"Accès refusé."},{status:403})
  try {
    const {id} = await params
    const [actors,affiliations] = await Promise.all([
      getSheetsRows({sheetNames:["ATHLETES","COACHS"],spreadsheetId:getActeursSpreadsheetId(),bypassCache:true}),
      getSheetRows({sheetName:"AFFILIATIONS_COACHS",spreadsheetId:getActeursAffiliationsSpreadsheetId(),bypassCache:true}),
    ])
    const matches=actors.ATHLETES.filter(row=>row.id_athlete_cnac===id)
    if(matches.length!==1)throw new CnacDataError("NOT_FOUND","Athlète introuvable ou ambigu.",404)
    return NextResponse.json({coaches:activeClubCoaches(matches[0].id_club_cnac,affiliations,actors.COACHS)},{headers:{"Cache-Control":"no-store"}})
  }catch(error){return errorResponse(error)}
}

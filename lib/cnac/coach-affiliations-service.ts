import "server-only"
import { randomUUID } from "node:crypto"
import { canAccess } from "@/lib/auth"
import { getActeursAffiliationsSpreadsheetId, getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { getReferentialSpreadsheetId, getTerritorialSpreadsheetId } from "@/lib/federations/config"
import { getSheetRows, appendSheetRow, updateSheetCells } from "./sheets"
import { CnacDataError, type SheetRecord } from "./model"
import { coachAffiliationDrafts, type CoachClubDraft, type CoachClubAffiliation } from "./coach-affiliations-model"

async function sources(fresh = false) {
  const [affiliations, clubs] = await Promise.all([
    getSheetRows({sheetName:"AFFILIATIONS_COACHS",spreadsheetId:getActeursAffiliationsSpreadsheetId(),bypassCache:fresh,cacheTtlMs:60000}),
    getSheetRows({sheetName:"CLUBS",spreadsheetId:getTerritorialSpreadsheetId(),bypassCache:fresh,cacheTtlMs:60000}),
  ])
  return {affiliations,clubs}
}
export async function requireCoach(id: string) {
  const matches = (await getSheetRows({sheetName:"COACHS",spreadsheetId:getActeursSpreadsheetId(),bypassCache:true})).filter(row=>row.id_coach_cnac===id)
  if (!matches.length) throw new CnacDataError("NOT_FOUND","Entraîneur introuvable.",404)
  if (matches.length!==1) throw new CnacDataError("DUPLICATE_ID","Identifiant entraîneur ambigu.",409)
  return matches[0]
}
export async function readCoachAffiliations(coachId?: string) {
  if (!(await canAccess("AUT-SPT","READ"))) throw new CnacDataError("ACCESS_DENIED","Accès refusé.",403)
  const coach = coachId ? await requireCoach(coachId) : undefined
  const {affiliations,clubs} = await sources(true)
  const rows: CoachClubAffiliation[] = affiliations.filter(row=>coachId && row.id_coach_cnac===coachId).map(row=>({id_affiliation_coach:row.id_affiliation_coach,id_coach_cnac:row.id_coach_cnac,id_club_cnac:row.id_club_cnac,statut:row.statut as "ACTIF"|"INACTIF",observations:row.observations||"",nom_club:clubs.find(club=>club.id_club_cnac===row.id_club_cnac)?.nom_club||`Club introuvable (${row.id_club_cnac})`}))
  const sexes = await getSheetRows({sheetName:"SEXES",spreadsheetId:getReferentialSpreadsheetId(),cacheTtlMs:60000})
  return {affiliations:rows,clubs:clubs.map(row=>({id:row.id_club_cnac,nom:row.nom_club||row.id_club_cnac,federationId:row.id_federation})),sexes,federationId:coach?.id_federation||"",canWrite:await canAccess("AUT-SPT","WRITE")}
}
export async function prepareCoachAffiliations(coach: SheetRecord, input?: unknown) {
  const {affiliations,clubs} = await sources(true)
  const drafts = input === undefined ? [] : coachAffiliationDrafts(input)
  const own = affiliations.filter(row=>row.id_coach_cnac===coach.id_coach_cnac)
  const seen = new Set<string>()
  for (const row of own) {if (seen.has(row.id_club_cnac)) throw new CnacDataError("DUPLICATE_AFFILIATION","Relations coach–club dupliquées dans la source.",409);seen.add(row.id_club_cnac)}
  for (const draft of drafts) {
    const current = draft.id_affiliation_coach ? affiliations.find(row=>row.id_affiliation_coach===draft.id_affiliation_coach) : own.find(row=>row.id_club_cnac===draft.id_club_cnac)
    if (draft.id_affiliation_coach && (!current || current.id_coach_cnac!==coach.id_coach_cnac || current.id_club_cnac!==draft.id_club_cnac)) throw new CnacDataError("NOT_FOUND","Rattachement introuvable pour cet entraîneur.",404)
    const matches = clubs.filter(club=>club.id_club_cnac===draft.id_club_cnac)
    if (matches.length!==1 || (matches[0].id_federation!==coach.id_federation && !(current && draft.statut==="INACTIF"))) throw new CnacDataError("CLUB_INVALID","Le club doit appartenir à la fédération du coach.")
  }
  for (const row of own) {
    const replacement = drafts.find(draft=>draft.id_club_cnac===row.id_club_cnac)
    if ((replacement?.statut || row.statut)==="ACTIF" && !clubs.some(club=>club.id_club_cnac===row.id_club_cnac && club.id_federation===coach.id_federation)) throw new CnacDataError("CLUB_INVALID","Désactivez les rattachements incompatibles avant de changer de fédération.")
  }
  return drafts
}
// Appelé dans la file commune des écritures coach. Réessayer met à jour le même couple.
export async function commitCoachAffiliations(coachId: string, drafts: CoachClubDraft[]) {
  const spreadsheetId = getActeursAffiliationsSpreadsheetId()
  for (const draft of drafts) {
    const rows = await getSheetRows({sheetName:"AFFILIATIONS_COACHS",spreadsheetId,bypassCache:true})
    const matches = rows.filter(row=>row.id_coach_cnac===coachId && row.id_club_cnac===draft.id_club_cnac)
    if (matches.length>1) throw new CnacDataError("DUPLICATE_AFFILIATION","Relations coach–club dupliquées.",409)
    const current = matches[0]
    if (draft.id_affiliation_coach && current?.id_affiliation_coach!==draft.id_affiliation_coach) throw new CnacDataError("SAVE_CONFLICT","Le rattachement a changé. Rechargez la fiche.",409)
    if (current) await updateSheetCells({sheetName:"AFFILIATIONS_COACHS",spreadsheetId,idColumn:"id_affiliation_coach",idValue:current.id_affiliation_coach,expectedValues:{id_coach_cnac:coachId,id_club_cnac:draft.id_club_cnac},updates:[{column:"statut",value:draft.statut},{column:"observations",value:draft.observations}]})
    else await appendSheetRow({sheetName:"AFFILIATIONS_COACHS",spreadsheetId,row:{id_affiliation_coach:`AFC-${randomUUID()}`,id_coach_cnac:coachId,id_club_cnac:draft.id_club_cnac,statut:draft.statut,observations:draft.observations}})
  }
}

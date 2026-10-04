import "server-only"
import { getSheetsRows } from "./sheets"
import { getReferentialSpreadsheetId, getTerritorialSpreadsheetId } from "@/lib/federations/config"
import type { AffiliationReferences } from "./affiliation-model"

export async function loadAffiliationReferences(): Promise<AffiliationReferences> {
  const [refs, structures] = await Promise.all([
    getSheetsRows({ sheetNames: ["FEDERATIONS", "ENTITES", "SPORTS", "DISCIPLINES", "CATEGORIES_AGE", "SEXES", "TYPES_STRUCTURE"], spreadsheetId: getReferentialSpreadsheetId(), bypassCache: true }),
    getSheetsRows({ sheetNames: ["ZONES", "LIGUES", "ENTENTES", "CERCLES", "CLUBS", "EQUIPES"], spreadsheetId: getTerritorialSpreadsheetId(), bypassCache: true }),
  ])
  refs.FEDERATIONS = refs.FEDERATIONS.map(row => ({ ...row, nom_federation: refs.ENTITES.find(entity => entity.id_entite === row.id_entite)?.nom_officiel || row.id_federation }))
  return { ...refs, ...structures }
}


// Références sportives utilisées par les formulaires Équipe.
export async function loadTeamReferences(): Promise<AffiliationReferences> {
  const [refs, clubs] = await Promise.all([
    getSheetsRows({ sheetNames: ["FEDERATIONS", "ENTITES", "SPORTS", "DISCIPLINES", "CATEGORIES_AGE", "SEXES"], spreadsheetId: getReferentialSpreadsheetId(), bypassCache: true }),
    getSheetsRows({ sheetNames: ["CLUBS"], spreadsheetId: getTerritorialSpreadsheetId(), bypassCache: true }),
  ])
  refs.FEDERATIONS = refs.FEDERATIONS.map(row => ({ ...row, nom_federation: refs.ENTITES.find(entity => entity.id_entite === row.id_entite)?.nom_officiel || row.id_federation }))
  return { ...refs, ...clubs }
}

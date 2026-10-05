import "server-only"
import { randomUUID } from "node:crypto"
import { canAccess } from "@/lib/auth"
import { getActeursSpreadsheetId } from "@/lib/acteurs/config"
import { appendSheetRow, getSheetsRows, updateSheetCells } from "./sheets"
import { CnacDataError, type SheetRecord } from "./model"
import { localisationPatch, mapLocalisationRow, type AthleteLocalisation } from "./localisation-model"

async function sources(athleteId: string, write = false) {
  if (!(await canAccess("AUT-SPT", write ? "WRITE" : "READ"))) throw new CnacDataError("ACCESS_DENIED", "Accès refusé.", 403)
  const spreadsheetId = getActeursSpreadsheetId()
  const data = await getSheetsRows({ spreadsheetId, sheetNames: ["ATHLETES", "LOCALISATION"], bypassCache: write, cacheTtlMs: 60000 })
  const matches = data.ATHLETES.filter(row => row.id_athlete_cnac === athleteId)
  if (!matches.length) throw new CnacDataError("NOT_FOUND", "Athlète introuvable.", 404)
  if (matches.length !== 1) throw new CnacDataError("DUPLICATE_ID", "Identifiant athlète ambigu.", 409)
  return { spreadsheetId, rows: data.LOCALISATION }
}

export async function readAthleteLocalisations(athleteId: string) {
  const { rows } = await sources(athleteId)
  const localisations = rows.filter(row => row.id_athlete_cnac === athleteId).map(mapLocalisationRow)
  return { localisations, canWrite: await canAccess("AUT-SPT", "WRITE") }
}

export async function saveAthleteLocalisation(athleteId: string, input: Record<string, unknown>, localisationId?: string): Promise<AthleteLocalisation> {
  const { spreadsheetId, rows } = await sources(athleteId, true)
  let current: SheetRecord | undefined
  if (localisationId) {
    const matches = rows.filter(row => row.id_localisation === localisationId)
    if (!matches.length || matches[0].id_athlete_cnac !== athleteId) throw new CnacDataError("NOT_FOUND", "Lieu introuvable pour cet athlète.", 404)
    if (matches.length !== 1) throw new CnacDataError("DUPLICATE_ID", "Identifiant de localisation ambigu.", 409)
    current = matches[0]
  }
  const patch = localisationPatch(input, current)
  const id = localisationId || `LOC-${randomUUID()}`
  if (current) {
    if (!Object.keys(patch).length) throw new CnacDataError("EMPTY_UPDATE", "Aucune modification à enregistrer.")
    await updateSheetCells({ spreadsheetId, sheetName: "LOCALISATION", idColumn: "id_localisation", idValue: id,
      expectedValues: { id_athlete_cnac: athleteId }, updates: Object.entries(patch).map(([column,value]) => ({ column,value })) })
  } else {
    await appendSheetRow({ spreadsheetId, sheetName: "LOCALISATION", row: { ...patch, id_localisation: id, id_athlete_cnac: athleteId } })
  }
  return mapLocalisationRow({ ...current, ...patch, id_localisation: id, id_athlete_cnac: athleteId })
}

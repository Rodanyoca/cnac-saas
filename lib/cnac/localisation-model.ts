import { CnacDataError, type SheetRecord } from "./model.ts"
import { trainingPatch } from "./team-training.ts"
import { CNAC_HEADERS } from "./schema.ts"

export type AthleteLocalisation = {
  id_localisation: string
  id_athlete_cnac: string
  lieu_entrainement: string
  adresse_entrainement: string
  fuseau_horaire_entrainement: string
  planning_entrainement_json: string
  statut: string
  observations: string
}

const editable = new Set(["lieu_entrainement", "adresse_entrainement", "fuseau_horaire_entrainement", "planning_entrainement_json", "statut", "observations"])
export function mapLocalisationRow(row: SheetRecord): AthleteLocalisation {
  return Object.fromEntries(CNAC_HEADERS.LOCALISATION.map(key => [key, row[key] || ""])) as AthleteLocalisation
}
export function localisationPatch(input: Record<string, unknown>, current?: SheetRecord): SheetRecord {
  const patch: SheetRecord = {}
  for (const [key, value] of Object.entries(input)) {
    if (!editable.has(key)) throw new CnacDataError("INVALID_FIELD", `Le champ ${key} ne peut pas être modifié.`)
    if (typeof value !== "string") throw new CnacDataError("VALIDATION", "Les champs du lieu doivent être du texte.")
    patch[key] = value.trim()
  }
  if (!current && !("statut" in patch)) patch.statut = "ACTIF"
  const row = { ...current, ...patch }
  if (!row.lieu_entrainement) throw new CnacDataError("VALIDATION", "Le lieu d’entraînement est obligatoire.")
  if (!["ACTIF", "INACTIF"].includes(row.statut)) throw new CnacDataError("VALIDATION", "Le statut doit être ACTIF ou INACTIF.")
  trainingPatch(patch, current)
  return patch
}

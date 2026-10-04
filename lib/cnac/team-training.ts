import { CnacDataError } from "./model.ts"

export const trainingFields = ["lieu_entrainement", "adresse_entrainement", "fuseau_horaire_entrainement", "planning_entrainement_json"] as const
export type TeamTraining = Partial<Record<typeof trainingFields[number], string>>
export type TrainingSlot = { jour: number; heure_debut: string; heure_fin: string }
export const trainingDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const
const fail = (message: string): never => { throw new CnacDataError("TRAINING_INVALID", message) }

// Also accepts incomplete editor rows, so adding a slot never discards other rows.
export function readTrainingSlots(value = ""): TrainingSlot[] {
  if (!value.trim()) return []
  let parsed: unknown
  try { parsed = JSON.parse(value) } catch { return fail("Le planning enregistré est illisible. Il est conservé ; remplacez-le explicitement pour le corriger.") }
  if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item !== "object" || typeof item.jour !== "number" || typeof item.heure_debut !== "string" || typeof item.heure_fin !== "string")) return fail("Le planning enregistré a un format invalide. Il est conservé ; remplacez-le explicitement pour le corriger.")
  return parsed.map(item => ({ jour: item.jour, heure_debut: item.heure_debut, heure_fin: item.heure_fin }))
}

export function validTrainingTimezone(value: string) {
  // Intl accepts some abbreviations: require an IANA area/location identifier (or UTC).
  if (value !== "UTC" && !/^[A-Za-z_+-]+\/[A-Za-z0-9_+/-]+$/.test(value)) return false
  try { new Intl.DateTimeFormat("fr", { timeZone: value }).format(0); return true } catch { return false }
}

export function validateTraining(training: TeamTraining): TrainingSlot[] {
  const slots = readTrainingSlots(training.planning_entrainement_json)
  const timezone = training.fuseau_horaire_entrainement?.trim() || ""
  if ((timezone || slots.length) && !validTrainingTimezone(timezone)) return fail("Sélectionnez un fuseau horaire IANA valide pour le lieu d’entraînement.")
  for (const [index, slot] of slots.entries()) {
    const prefix = `Créneau ${index + 1} : `
    if (!Number.isInteger(slot.jour) || slot.jour < 1 || slot.jour > 7) return fail(prefix + "sélectionnez un jour du lundi au dimanche.")
    if (![slot.heure_debut, slot.heure_fin].every(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time))) return fail(prefix + "renseignez deux heures valides au format HH:mm.")
    if (slot.heure_fin <= slot.heure_debut) return fail(prefix + "la fin doit suivre le début. Répartissez les entraînements traversant minuit sur deux jours.")
  }
  const sorted = [...slots].sort((a, b) => a.jour - b.jour || a.heure_debut.localeCompare(b.heure_debut))
  for (let index = 1; index < sorted.length; index++) {
    const previous = sorted[index - 1], slot = sorted[index]
    if (previous.jour === slot.jour && slot.heure_debut < previous.heure_fin) return fail(`${trainingDays[slot.jour - 1]} : les créneaux se chevauchent ou sont en double.`)
  }
  return sorted
}

// Absent fields preserve existing cells. Unchanged historical anomalies remain
// visible and intact even when a client sends the complete editor row.
export function trainingPatch(patch: Record<string, string>, current?: TeamTraining) {
  const scheduleChanged = "planning_entrainement_json" in patch && patch.planning_entrainement_json !== (current?.planning_entrainement_json || "")
  const timezoneChanged = "fuseau_horaire_entrainement" in patch && patch.fuseau_horaire_entrainement !== (current?.fuseau_horaire_entrainement || "")
  if (!current || scheduleChanged || timezoneChanged) {
    const slots = validateTraining({ ...current, ...patch })
    if ("planning_entrainement_json" in patch && patch.planning_entrainement_json) patch.planning_entrainement_json = JSON.stringify(slots)
  }
  return patch
}

export function activeTrainingTeam(teams: Record<string, string>[], affiliation: { id_equipe_cnac?: string; id_club_cnac?: string; id_federation?: string }) {
  return teams.find(team => team.id_equipe_cnac === affiliation.id_equipe_cnac && team.id_club_cnac === affiliation.id_club_cnac && team.id_federation === affiliation.id_federation)
}

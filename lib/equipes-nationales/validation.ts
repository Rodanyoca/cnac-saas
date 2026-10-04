import { ACTOR_TYPES, type ActorType } from "./types.ts"
const clean = (value: unknown) => String(value ?? "").trim()
export const NATIONAL_TEAM_STATUSES = ["ACTIF", "INACTIF"] as const
export function validateTeamInput(input: Record<string, unknown>) {
  const row = { id_federation: clean(input.id_federation), id_sport: clean(input.id_sport), id_discipline: clean(input.id_discipline), nom_equipe_nationale: clean(input.nom_equipe_nationale), id_categorie_age: clean(input.id_categorie_age), id_saison:clean(input.id_saison), statut: clean(input.statut).toUpperCase(), observations: clean(input.observations) }
  if (!row.id_federation || !row.id_sport || !row.nom_equipe_nationale || !row.id_saison || !row.statut) throw new Error("La fédération, le sport, le nom, la saison et le statut sont obligatoires.")
  if (!NATIONAL_TEAM_STATUSES.includes(row.statut as (typeof NATIONAL_TEAM_STATUSES)[number])) throw new Error("Statut d’équipe nationale invalide.")
  return row
}
export function validateMemberInput(input: Record<string, unknown>) {
  const row = { id_acteur_coc: clean(input.id_acteur_coc), id_type_acteur: clean(input.id_type_acteur).toUpperCase(), role_equipe: clean(input.role_equipe || input.role_selection), date_debut: clean(input.date_debut), date_fin: clean(input.date_fin), statut: clean(input.statut).toUpperCase(), observations: clean(input.observations) }
  if (!row.id_acteur_coc || !ACTOR_TYPES.includes(row.id_type_acteur as ActorType) || !row.role_equipe || !row.date_debut || !row.statut) throw new Error("Le type, l’acteur, le rôle, la date de début et le statut sont obligatoires.")
  if (!NATIONAL_TEAM_STATUSES.includes(row.statut as (typeof NATIONAL_TEAM_STATUSES)[number])) throw new Error("Statut de membre invalide.")
  if (row.date_fin && row.date_fin < row.date_debut) throw new Error("La date de fin doit être postérieure ou égale à la date de début.")
  return row
}
export function validateCampaignInput(input: Record<string, unknown>) {
  const row = { nom_campagne: clean(input.nom_campagne), date_debut: clean(input.date_debut), date_fin: clean(input.date_fin), objectif: clean(input.objectif), id_statut_campagne: clean(input.id_statut_campagne).toUpperCase(), observation: clean(input.observation) }
  if (!row.nom_campagne || !row.date_debut || !row.date_fin || !row.id_statut_campagne) throw new Error("Le nom, les dates de début et de fin, ainsi que le statut de la campagne sont obligatoires.")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date_debut) || !/^\d{4}-\d{2}-\d{2}$/.test(row.date_fin)) throw new Error("Les dates de la campagne sont invalides.")
  if (row.date_fin < row.date_debut) throw new Error("La date de fin doit être postérieure ou égale à la date de début.")
  return row
}
export function validateSelectionInput(input: Record<string, unknown>) {
  const row = { id_campagne:clean(input.id_campagne), id_athlete:clean(input.id_athlete), id_poste:clean(input.id_poste), id_categorie_poids:clean(input.id_categorie_poids), id_grade_sportif:clean(input.id_grade_sportif), date_selection:clean(input.date_selection), id_statut_selection:clean(input.id_statut_selection).toUpperCase(), observation:clean(input.observation) }
  if (!row.id_campagne || !row.id_athlete || !row.date_selection || !row.id_statut_selection) throw new Error("La campagne, l’athlète, la date et le statut de sélection sont obligatoires.")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date_selection)) throw new Error("Date de sélection invalide.")
  if (!["PRESELECTIONNE","SELECTIONNE","REMPLACANT","NON_RETENU","RETIRE"].includes(row.id_statut_selection)) throw new Error("Statut de sélection invalide.")
  return row
}

export function selectionCampaignDateError(date: string, start: string, end: string) {
  if (!date || !start || (date >= start && (!end || date <= end))) return ""
  return end
    ? `La sélection doit être datée entre le ${start} et le ${end}.`
    : `La sélection doit être datée à partir du ${start}.`
}

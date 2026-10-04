import { getCompetitionMedalCounts, getCompetitionReferences, getCompetitions, getTeamParticipations } from "./data"
import type { CompetitionStatus } from "./types"

export type CompetitionTypeStats = { key: string; label: string; total: number; aVenir: number; enCours: number; terminees: number; equipesNationales: number }
export type MedalDashboardStats = { total:number; or:number; argent:number; bronze:number }
export type CompetitionsDashboardStats = { totalCompetitions: number; aVenir: number; enCours: number; terminees: number; types: CompetitionTypeStats[]; medals:MedalDashboardStats }
export const COMPETITIONS_DASHBOARD_CACHE_TAG = "competitions-dashboard"

function statusCounts(statuses: CompetitionStatus[]) {
  return { total: statuses.length, aVenir: statuses.filter((s) => s === "A_VENIR" || s === "PLANIFIEE").length, enCours: statuses.filter((s) => s === "EN_COURS").length, terminees: statuses.filter((s) => s === "TERMINEE").length }
}

async function aggregate(): Promise<CompetitionsDashboardStats> {
  const [competitions, participations, references, medals] = await Promise.all([getCompetitions(), getTeamParticipations(), getCompetitionReferences(), getCompetitionMedalCounts()])
  const typeIds = [...new Set(competitions.map((item) => item.id_type_competition))]
  const types = typeIds.map((key) => {
    const rows = competitions.filter((item) => item.id_type_competition === key)
    const ids = new Set(rows.map((item) => item.id_competition))
    return { key: key || "NON_RENSEIGNE", label: references.types.find((type) => type.id === key)?.label || key || "Type non renseigné", ...statusCounts(rows.map((item) => item.statut_normalise)), equipesNationales: participations.filter((item) => ids.has(item.id_competition)).length }
  }).sort((a, b) => a.label.localeCompare(b.label, "fr"))
  const totals = statusCounts(competitions.map((item) => item.statut_normalise))
  return { totalCompetitions: competitions.length, aVenir: totals.aVenir, enCours: totals.enCours, terminees: totals.terminees, types, medals }
}

export const loadCompetitionsDashboardStats = aggregate

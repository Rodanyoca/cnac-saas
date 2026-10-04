import { getNationalTeamMembers, getNationalTeamReferences, getNationalTeams } from "./data"
import { isActiveNationalTeamMember } from "./types"

export const NATIONAL_TEAMS_DASHBOARD_CACHE_TAG = "national-teams-dashboard"
export type NationalTeamsDashboardStats = { totalTeams: number; activeTeams: number; inactiveTeams: number; totalMembers: number; sports: { key: string; label: string; total: number; active: number; inactive: number; members: number }[] }

async function aggregate(): Promise<NationalTeamsDashboardStats> {
  const [teams, members, refs] = await Promise.all([getNationalTeams(), getNationalTeamMembers(), getNationalTeamReferences()])
  const activeMembers = members.filter((member) => isActiveNationalTeamMember(member))
  const sports = [...new Set(teams.map((team) => team.id_sport))].map((key) => {
    const rows = teams.filter((team) => team.id_sport === key)
    const ids = new Set(rows.map((team) => team.id_equipe_nationale))
    return { key: key || "NON_RENSEIGNE", label: refs.sports.find((sport) => sport.id === key)?.label || key || "Sport non renseigné", total: rows.length, active: rows.filter((team) => team.statut === "ACTIF").length, inactive: rows.filter((team) => team.statut !== "ACTIF").length, members: new Set(activeMembers.filter((member) => ids.has(member.id_equipe_nationale)).map((member) => member.id_acteur_coc)).size }
  }).sort((a, b) => a.label.localeCompare(b.label, "fr"))
  return { totalTeams: teams.length, activeTeams: teams.filter((team) => team.statut === "ACTIF").length, inactiveTeams: teams.filter((team) => team.statut !== "ACTIF").length, totalMembers: new Set(activeMembers.map((member) => member.id_acteur_coc)).size, sports }
}

export const loadNationalTeamsDashboardStats = aggregate

import { loadFederationData } from "./data"
import { aggregateFederationsDashboardStats, type FederationsDashboardStats } from "./dashboard-stats"
import type { FederationData } from "./types"

export type { FederationsDashboardStats } from "./dashboard-stats"

export const TERRITORIAL_DASHBOARD_CACHE_TAG = "territorial-dashboard"

export type TerritorialLevelStats = {
  key: "ligues" | "ententes" | "cercles" | "clubs" | "equipes"
  label: string
  total: number
  actif: number
  inactif: number
  nonRenseigne: number
  part: number
}

export type TerritorialDashboardStats = {
  totalStructures: number
  actif: number
  inactif: number
  nonRenseigne: number
  levels: TerritorialLevelStats[]
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("fr")

function aggregateLevel(
  key: TerritorialLevelStats["key"],
  label: string,
  rows: Array<{ id: string; statut: string }>
): Omit<TerritorialLevelStats, "part"> {
  const validRows = rows.filter((row) => row.id.trim())
  const actif = validRows.filter((row) => normalize(row.statut) === "actif").length
  const inactif = validRows.filter((row) => normalize(row.statut) === "inactif").length
  return { key, label, total: validRows.length, actif, inactif, nonRenseigne: validRows.length - actif - inactif }
}

function aggregateTerritorialDashboardStats(data: FederationData): TerritorialDashboardStats {
  const rawLevels = [
    aggregateLevel("ligues", "Ligues", data.ligues.map((item) => ({ id: item.id_ligue_coc, statut: item.statut }))),
    aggregateLevel("ententes", "Ententes", data.ententes.map((item) => ({ id: item.id_entente_coc, statut: item.statut }))),
    aggregateLevel("cercles", "Cercles", data.cercles.map((item) => ({ id: item.id_cercle_coc, statut: item.statut }))),
    aggregateLevel("clubs", "Clubs", data.clubs.map((item) => ({ id: item.id_club_coc, statut: item.statut }))),
  ]
  const totalStructures = rawLevels.reduce((sum, level) => sum + level.total, 0)
  const levels = rawLevels.map((level) => ({ ...level, part: totalStructures ? Math.round((level.total / totalStructures) * 100) : 0 }))
  return {
    totalStructures,
    actif: levels.reduce((sum, level) => sum + level.actif, 0),
    inactif: levels.reduce((sum, level) => sum + level.inactif, 0),
    nonRenseigne: levels.reduce((sum, level) => sum + level.nonRenseigne, 0),
    levels,
  }
}

export type FederationDashboardBundle = {
  federations: FederationsDashboardStats
  territorial: TerritorialDashboardStats
}

export async function loadFederationDashboardBundle(): Promise<FederationDashboardBundle> {
  const data = await loadFederationData()
  return {
    federations: aggregateFederationsDashboardStats(data),
    territorial: aggregateTerritorialDashboardStats(data),
  }
}

export async function loadTerritorialDashboardStats() {
  return aggregateTerritorialDashboardStats(await loadFederationData())
}

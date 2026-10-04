import type { Federation, FederationData } from "./types"

export type FederationStatusCount = { label: string; total: number; missing: boolean }
export type FederationStatusDimension = {
  key: "technique" | "ministere" | "coc"
  label: string
  statuses: FederationStatusCount[]
}
export type FederationsDashboardStats = { totalFederations: number; dimensions: FederationStatusDimension[] }

const MISSING_STATUS = "Non renseigné"

function formatStatus(value: string) {
  const normalized = value.trim()
  if (!normalized) return MISSING_STATUS
  return normalized.replaceAll("_", " ").toLocaleLowerCase("fr").replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("fr"))
}

function aggregateStatus(rows: Federation[], field: keyof Pick<Federation, "statut" | "statut_reconnaissance_ministere" | "statut_affiliation_coc">) {
  const counts = new Map<string, FederationStatusCount>()
  for (const row of rows) {
    const missing = !row[field].trim()
    const label = formatStatus(row[field])
    const key = missing ? "__missing__" : label.toLocaleLowerCase("fr")
    counts.set(key, { label, missing, total: (counts.get(key)?.total ?? 0) + 1 })
  }
  return [...counts.values()].sort((a, b) => Number(a.missing) - Number(b.missing) || b.total - a.total || a.label.localeCompare(b.label, "fr"))
}

export function aggregateFederationsDashboardStats(data: Pick<FederationData, "federations">): FederationsDashboardStats {
  const federations = data.federations.filter((federation) => federation.id_federation.trim())
  return {
    totalFederations: federations.length,
    dimensions: [
      { key: "technique", label: "Statut technique", statuses: aggregateStatus(federations, "statut") },
      { key: "ministere", label: "Reconnaissance ministérielle", statuses: aggregateStatus(federations, "statut_reconnaissance_ministere") },
      { key: "coc", label: "Affiliation COC", statuses: aggregateStatus(federations, "statut_affiliation_coc") },
    ],
  }
}

import { getActivities, getActivityReferences } from "./data"
import type { ActivityStatus } from "./types"

export const ACTIVITIES_DASHBOARD_CACHE_TAG = "activities-dashboard"

export type ActivityTypeStats = {
  key: string
  label: string
  total: number
  planifiees: number
  enCours: number
  realisees: number
  reportees: number
  annulees: number
  nonRenseignees: number
}

export type ActivitiesDashboardStats = {
  totalActivities: number
  types: ActivityTypeStats[]
}

function countStatuses(statuses: ActivityStatus[]) {
  return {
    total: statuses.length,
    planifiees: statuses.filter((status) => status === "PLANIFIE").length,
    enCours: statuses.filter((status) => status === "EN_COURS").length,
    realisees: statuses.filter((status) => status === "REALISE" || status === "TERMINE").length,
    reportees: statuses.filter((status) => status === "REPORTE").length,
    annulees: statuses.filter((status) => status === "ANNULE").length,
    nonRenseignees: statuses.filter((status) => status === "NON_RENSEIGNE").length,
  }
}

async function aggregateActivitiesDashboardStats(): Promise<ActivitiesDashboardStats> {
  const [activities, references] = await Promise.all([getActivities(), getActivityReferences()])
  const knownTypes = references.types.map((type) => ({ key: type.id, label: type.label || type.id }))
  const unknownIds = [...new Set(activities.map((activity) => activity.id_type_activite).filter((id) => id && !knownTypes.some((type) => type.key === id)))]
  const typeOptions = [...knownTypes, ...unknownIds.map((id) => ({ key: id, label: id }))]

  const types = typeOptions
    .map((type) => ({
      key: type.key,
      label: type.label,
      ...countStatuses(activities.filter((activity) => activity.id_type_activite === type.key).map((activity) => activity.statut_normalise)),
    }))
    .filter((type) => type.total > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }))

  const withoutType = activities.filter((activity) => !activity.id_type_activite)
  if (withoutType.length) types.push({ key: "NON_RENSEIGNE", label: "Type non renseigné", ...countStatuses(withoutType.map((activity) => activity.statut_normalise)) })

  return { totalActivities: activities.length, types }
}

export const loadActivitiesDashboardStats = aggregateActivitiesDashboardStats

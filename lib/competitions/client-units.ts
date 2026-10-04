import { apiFetch } from "@/lib/api/client"
import type { ParticipatingUnit } from "./types"

const pendingUnitRequests = new Map<string, Promise<ParticipatingUnit[]>>()

async function fetchUnits(key: string, attempt = 0): Promise<ParticipatingUnit[]> {
  const response = await apiFetch(`/api/competitions/${encodeURIComponent(key)}/unites`)
  const payload = await response.json()
  if (!response.ok) {
    if (payload.retryable && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
      return fetchUnits(key, attempt + 1)
    }
    throw new Error(payload.error || "Impossible de charger les unités participantes.")
  }
  return (payload.rows || []) as ParticipatingUnit[]
}

export function loadCompetitionUnits(competitionId: string, refresh = false) {
  const key = competitionId.trim()
  const pending = pendingUnitRequests.get(key)
  if (!refresh && pending) return pending

  const request = fetchUnits(key)
    .catch((error) => {
      if (pendingUnitRequests.get(key) === request) pendingUnitRequests.delete(key)
      throw error
    })

  pendingUnitRequests.set(key, request)
  return request
}

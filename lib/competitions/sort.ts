import type { Competition } from "./types"

function startDateValue(value: string) {
  const text = value.trim()
  let match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  match = text.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/)
  if (match) return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  const parsed = Date.parse(text)
  return Number.isNaN(parsed) ? null : parsed
}

export function compareCompetitionsByMostRecent(left: Competition, right: Competition) {
  const leftDate = startDateValue(left.date_debut)
  const rightDate = startDateValue(right.date_debut)
  if (leftDate !== rightDate) {
    if (leftDate === null) return 1
    if (rightDate === null) return -1
    return rightDate - leftDate
  }
  const nameOrder = left.nom_competition.localeCompare(right.nom_competition, "fr", { sensitivity: "base" })
  return nameOrder || left.id_competition.localeCompare(right.id_competition)
}

import type { CompetitionStatus } from "./types"

const normalized = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[\s-]+/g, "_")

export function normalizeCompetitionStatus(value: string): CompetitionStatus {
  const status = normalized(value)
  if (["PLANIFIE", "PLANIFIEE", "PROGRAMME", "PROGRAMMEE"].includes(status)) return "PLANIFIEE"
  if (["A_VENIR", "AVENIR"].includes(status)) return "A_VENIR"
  if (["EN_COURS", "ENCOUR", "IN_PROGRESS"].includes(status)) return "EN_COURS"
  if (["TERMINE", "TERMINEE", "REALISE", "REALISEE", "CLOTURE", "CLOTUREE", "ACHEVE", "ACHEVEE"].includes(status)) return "TERMINEE"
  if (["REPORTE", "REPORTEE"].includes(status)) return "REPORTEE"
  if (["ANNULE", "ANNULEE"].includes(status)) return "ANNULEE"
  return "NON_RENSEIGNE"
}

export const competitionStatusLabels: Record<CompetitionStatus, string> = {
  PLANIFIEE: "Planifiée", A_VENIR: "À venir", EN_COURS: "En cours", TERMINEE: "Terminée",
  REPORTEE: "Reportée", ANNULEE: "Annulée", NON_RENSEIGNE: "Non renseigné",
}

export function formatDateFr(value: string) {
  if (!value) return "—"
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

export function normalizeCompetitionDate(value: string) {
  const french = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return french ? `${french[3]}-${french[2]}-${french[1]}` : value
}

export function formatCompetitionPeriod(start: string, end: string) {
  if (!start && !end) return "—"
  if (!end || end === start) return formatDateFr(start || end)
  return `${formatDateFr(start)} – ${formatDateFr(end)}`
}

export function formatCompetitionCeremonies(opening: string, closing: string) {
  return `Ouverture : ${formatDateFr(opening)} · Clôture : ${formatDateFr(closing)}`
}

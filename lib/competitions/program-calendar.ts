import type { Competition, CompetitionProgram } from "./types"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

export function calendarDayNumber(value: string): number | null {
  if (!ISO_DATE.test(value)) return null
  const [year, month, day] = value.split("-").map(Number)
  const ordinal = Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
  const check = new Date(ordinal * DAY_MS)
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? ordinal : null
}

export function calendarDaysBetween(start: string, end: string): number | null {
  const first = calendarDayNumber(start), last = calendarDayNumber(end)
  return first === null || last === null ? null : last - first
}

export function inclusiveCalendarDays(start: string, end: string): number | null {
  const difference = calendarDaysBetween(start, end)
  return difference === null ? null : difference + 1
}

export function addCalendarDays(value: string, amount: number): string {
  const ordinal = calendarDayNumber(value)
  if (ordinal === null) return ""
  return new Date((ordinal + amount) * DAY_MS).toISOString().slice(0, 10)
}

export function todayCalendarDate(now = new Date()): string {
  const year = now.getFullYear(), month = String(now.getMonth() + 1).padStart(2, "0"), day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function programScheduleError(
  program: Pick<CompetitionProgram, "date_debut" | "date_fin">,
  competition: Pick<Competition, "date_debut" | "date_fin">,
): string | null {
  if (!program.date_debut && !program.date_fin) return null
  if (!competition.date_debut || !competition.date_fin) return "Les dates de la compétition doivent être renseignées avant de planifier les épreuves."
  if (program.date_fin && !program.date_debut) return "La date de début doit être renseignée avant la date de fin."
  if (program.date_debut && calendarDayNumber(program.date_debut) === null) return "La date de début de l’épreuve est invalide."
  if (program.date_fin && calendarDayNumber(program.date_fin) === null) return "La date de fin de l’épreuve est invalide."
  if (program.date_fin && program.date_fin < program.date_debut) return "La date de fin doit être postérieure ou égale à la date de début."
  if (program.date_debut > competition.date_fin) return "Une épreuve ne peut pas commencer après la cérémonie de clôture."
  if (program.date_fin && program.date_fin > competition.date_fin) return "Une épreuve ne peut pas se terminer après la cérémonie de clôture."
  return null
}

export function competitionCeremonyError(competition: Pick<Competition, "date_debut" | "date_fin">): string | null {
  if (!competition.date_debut) return "La date de la cérémonie d’ouverture est obligatoire."
  if (!competition.date_fin) return "La date de la cérémonie de clôture est obligatoire."
  if (competition.date_fin < competition.date_debut) return "La cérémonie de clôture doit avoir lieu après ou le même jour que la cérémonie d’ouverture."
  return null
}

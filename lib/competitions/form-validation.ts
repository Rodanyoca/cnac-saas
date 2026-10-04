import type { CompetitionOption } from "./types.ts"

export type CompetitionFormFields = {
  nom_competition: string
  id_type_competition: string
  est_multisport: string
  niveau_competition: string
  date_debut: string
  date_fin: string
  statut: string
}

export function competitionFormError(
  value: CompetitionFormFields,
  types: readonly CompetitionOption[],
  levels: readonly CompetitionOption[],
  statuses: readonly CompetitionOption[],
): string | null {
  if (!value.nom_competition.trim()) return "Le nom de la compétition est obligatoire."
  const type = types.find((item) => item.id === value.id_type_competition)
  if (!type) return "Sélectionnez un type de compétition."
  if (!levels.some((item) => item.id === value.niveau_competition)) return "Sélectionnez un niveau de compétition."
  if (!value.date_debut) return "La date de la cérémonie d’ouverture est obligatoire."
  if (!value.date_fin) return "La date de la cérémonie de clôture est obligatoire."
  if (value.date_fin < value.date_debut) return "La cérémonie de clôture doit avoir lieu après ou le même jour que la cérémonie d’ouverture."
  if (!statuses.some((item) => item.id === value.statut)) return "Sélectionnez un statut de compétition."
  if (type.scope === "MULTISPORTS" && value.est_multisport !== "OUI") return "Ce type de compétition doit être multisport."
  if (type.scope === "MONOSPORT" && value.est_multisport !== "NON") return "Ce type de compétition doit être monosport."
  return null
}

export function scopeForCompetitionType(typeId: string, types: readonly CompetitionOption[]): "OUI" | "NON" | null {
  const scope = types.find((item) => item.id === typeId)?.scope
  if (scope === "MULTISPORTS") return "OUI"
  if (scope === "MONOSPORT") return "NON"
  return null
}

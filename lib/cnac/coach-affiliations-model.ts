import { CnacDataError, type SheetRecord } from "./model.ts"

export type CoachClubDraft = { id_affiliation_coach?: string; id_club_cnac: string; statut: "ACTIF" | "INACTIF"; observations: string }
export type CoachClubAffiliation = CoachClubDraft & { id_affiliation_coach: string; id_coach_cnac: string; nom_club: string }

export function coachAffiliationDrafts(input: unknown): CoachClubDraft[] {
  if (!Array.isArray(input)) throw new CnacDataError("INVALID_BODY", "Les affiliations doivent être une liste.")
  const seen = new Set<string>()
  return input.map(value => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new CnacDataError("INVALID_BODY", "Affiliation invalide.")
    const row = value as Record<string, unknown>
    if (Object.keys(row).some(key => !["id_affiliation_coach", "id_club_cnac", "statut", "observations"].includes(key))) throw new CnacDataError("IMMUTABLE_ID", "Les identifiants du coach sont gérés par le serveur.")
    for (const value of Object.values(row)) if (typeof value !== "string") throw new CnacDataError("INVALID_BODY", "Valeur d’affiliation invalide.")
    const club = String(row.id_club_cnac || "").trim(), status = String(row.statut || "ACTIF").trim()
    if (!club) throw new CnacDataError("CLUB_REQUIRED", "Le club est obligatoire.")
    if (!["ACTIF", "INACTIF"].includes(status)) throw new CnacDataError("STATUS_INVALID", "Le statut doit être ACTIF ou INACTIF.")
    if (seen.has(club)) throw new CnacDataError("DUPLICATE_AFFILIATION", "Un club ne peut apparaître qu’une fois pour ce coach.", 409)
    seen.add(club)
    return { ...(row.id_affiliation_coach ? { id_affiliation_coach: String(row.id_affiliation_coach).trim() } : {}), id_club_cnac: club, statut: status as CoachClubDraft["statut"], observations: String(row.observations || "").trim() }
  })
}

export function activeClubCoaches(clubId: string, affiliations: SheetRecord[], coaches: SheetRecord[]) {
  const ids = new Set(affiliations.filter(row => row.id_club_cnac === clubId && row.statut === "ACTIF").map(row => row.id_coach_cnac))
  const found = new Map<string, { id: string; nom: string }>()
  for (const coach of coaches) if (ids.has(coach.id_coach_cnac) && !found.has(coach.id_coach_cnac)) found.set(coach.id_coach_cnac, { id: coach.id_coach_cnac, nom: coach.nom_complet || "Non renseigné" })
  return clubId ? [...found.values()].sort((a,b) => a.nom.localeCompare(b.nom,"fr")) : []
}

import { CnacDataError, type SheetRecord } from "./model.ts"
import { TERRITORIAL_RESOURCE_BINDINGS } from "./territorial-resources.ts"

export type AffiliationReferences = Record<string, SheetRecord[]>

// Champs sportifs du contrat Équipe.
export const sportingFields = ["id_federation", "id_club_cnac", "id_sport", "id_discipline", "id_categorie_age", "id_sexe"] as const

export function validateTeamAttachment(row: SheetRecord, refs: AffiliationReferences) {
  if (!row.id_categorie_age) throw new CnacDataError("CATEGORY_REQUIRED", "La catégorie équipe est obligatoire.")
  if (!refs.CATEGORIES_AGE?.some(category => category.id_categorie_age === row.id_categorie_age)) {
    throw new CnacDataError("REFERENCE_INVALID", "Catégorie équipe introuvable.")
  }
  // Le service territorial contrôle ensuite le club, les références et leurs propriétaires.
}

export function sportUsesTeams(refs: AffiliationReferences, federationId: string): boolean | undefined {
  const federation = refs.FEDERATIONS?.find(row => row.id_federation === federationId)
  const sport = refs.SPORTS?.find(row => row.id_sport === federation?.id_sport)
  const raw = sport?.utilise_equipes?.trim().toUpperCase()
  if (["OUI", "TRUE", "1"].includes(raw || "")) return true
  if (["NON", "FALSE", "0"].includes(raw || "")) return false
  return undefined
}
export function teamsForClub(refs: AffiliationReferences, clubId: string, federationId: string) {
  return (refs.EQUIPES || []).filter(row => row.id_club_cnac === clubId && row.id_federation === federationId)
}
export function teamCategory(team: SheetRecord | undefined, refs: AffiliationReferences) {
  const category = refs.CATEGORIES_AGE?.find(row => row.id_categorie_age === team?.id_categorie_age)?.nom_categorie_age || "Non renseignée"
  return { label: category }
}
export type ActiveAthleteAffiliation = {
  id_federation: string
  id_club_cnac: string
  id_equipe_cnac: string
}
export function athleteAffiliationContext(row: ActiveAthleteAffiliation, refs: AffiliationReferences) {
  if (!refs.FEDERATIONS?.some(item => item.id_federation === row.id_federation)) return { applicable: false, structure: "" }
  if (!row.id_club_cnac) return { applicable: !row.id_equipe_cnac, structure: "" }
  const club = refs.CLUBS?.find(item => item.id_club_cnac === row.id_club_cnac && item.id_federation === row.id_federation)
  if (!club) return { applicable: false, structure: "" }
  if (row.id_equipe_cnac && !teamsForClub(refs, row.id_club_cnac, row.id_federation).some(team => team.id_equipe_cnac === row.id_equipe_cnac)) return { applicable: false, structure: "" }
  const parentId = club.id_structure_parent_cnac || club.id_structure_parent_coc
  const parent = TERRITORIAL_RESOURCE_BINDINGS.filter(binding => !["clubs", "equipes"].includes(binding.key)).flatMap(binding => (refs[binding.sheet] || []).filter(item => item[binding.idColumn] === parentId && item.id_federation === row.id_federation).map(item => ({ binding, item })))
  if (parent.length !== 1) return { applicable: true, structure: "" }
  const { binding, item } = parent[0]
  return { applicable: true, structure: item[binding.nameColumn] || "" }
}
export function activeAffiliationLabel(row: ActiveAthleteAffiliation, refs: AffiliationReferences) {
  const club = refs.CLUBS?.find(item => item.id_club_cnac === row.id_club_cnac && item.id_federation === row.id_federation)
  const team = teamsForClub(refs, row.id_club_cnac, row.id_federation).find(item => item.id_equipe_cnac === row.id_equipe_cnac)
  const context = athleteAffiliationContext(row, refs)
  const federation = refs.FEDERATIONS?.find(item => item.id_federation === row.id_federation)
  const parts = row.id_equipe_cnac ? [club?.nom_club || "Club introuvable", team?.nom_equipe || "Équipe introuvable"] : [context.structure || club?.nom_club || federation?.nom_federation || "Non renseignée"]
  return parts.filter(Boolean).join(" – ")
}
export function validateAthleteAffiliation(row: SheetRecord, refs: AffiliationReferences) {
  const fail = (message: string): never => { throw new CnacDataError("AFFILIATION_INVALID", message) }
  if (row.id_club_cnac && !refs.CLUBS?.some(item => item.id_club_cnac === row.id_club_cnac && item.id_federation === row.id_federation)) fail("Club introuvable ou hors fédération.")
  if (row.id_equipe_cnac) {
    if (sportUsesTeams(refs, row.id_federation) === false) fail("Ce sport ne fonctionne pas avec des équipes.")
    if (!row.id_club_cnac || !teamsForClub(refs, row.id_club_cnac, row.id_federation).some(item => item.id_equipe_cnac === row.id_equipe_cnac)) fail("Équipe introuvable ou incompatible avec le club et la fédération.")
  }
}
export function updateAffiliation<T extends ActiveAthleteAffiliation>(row: T, key: keyof T, value: T[keyof T]): T {
  const changed = value !== row[key]
  return { ...row, [key]: value,
    ...(key === "id_federation" && changed ? { id_club_cnac: "", id_equipe_cnac: "" } : {}),
    ...(key === "id_club_cnac" && changed ? { id_equipe_cnac: "" } : {}),
  }
}

// Remonte uniquement les parents de la federation de cet athlete.
export function athleteAffiliationDetails(value: ActiveAthleteAffiliation, refs: AffiliationReferences) {
  const federation = refs.FEDERATIONS?.find(row => row.id_federation === value.id_federation)
  const sport = refs.SPORTS?.find(row => row.id_sport === federation?.id_sport)
  const club = refs.CLUBS?.find(row => row.id_club_cnac === value.id_club_cnac && row.id_federation === value.id_federation)
  const team = teamsForClub(refs, value.id_club_cnac, value.id_federation).find(row => row.id_equipe_cnac === value.id_equipe_cnac)
  const discipline = refs.DISCIPLINES?.find(row => row.id_discipline === team?.id_discipline)
  const ancestors = new Map<string, string>()
  const visited = new Set<string>()
  let parentId = club?.id_structure_parent_cnac || club?.id_structure_parent_coc || club?.id_entente_coc || ""
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId)
    const matches = TERRITORIAL_RESOURCE_BINDINGS.filter(binding => !["clubs", "equipes"].includes(binding.key)).flatMap(binding => (refs[binding.sheet] || []).filter(row => row.id_federation === value.id_federation && (row[binding.idColumn] === parentId || row[binding.rowIdColumn] === parentId)).map(row => ({ binding, row })))
    if (matches.length !== 1) break
    const { binding, row } = matches[0]
    ancestors.set(binding.key, row[binding.nameColumn] || "")
    parentId = row[binding.parentColumn] || row[binding.parentInputColumn] || row[binding.parentFallbackColumn] || ""
  }
  return [
    { label: "F\u00e9d\u00e9ration", value: federation?.nom_federation || "" },
    { label: "Sport", value: sport?.nom_sport || "" },
    { label: "Discipline", value: discipline?.nom_discipline || "" },
    { label: "Zone", value: ancestors.get("zones") || "" },
    { label: "Ligue", value: ancestors.get("ligues") || "" },
    { label: "Entente", value: ancestors.get("ententes") || "" },
    { label: "Cercle", value: ancestors.get("cercles") || "" },
    { label: "Club", value: club?.nom_club || "" },
    { label: "\u00c9quipe", value: team?.nom_equipe || "" },
    { label: "Cat\u00e9gorie \u00e9quipe", value: team ? teamCategory(team, refs).label : "" },
  ]
}

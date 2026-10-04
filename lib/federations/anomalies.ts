import type { FederationData } from "./types"

export type Severity = "orange" | "rouge"
export type TerritorialAnomaly = {
  severity: Severity
  type: string
  entityType: string
  id: string
  name: string
  problem: string
  expected: string
}

const normalize = (value: string) => value.trim().toLocaleLowerCase("fr")

function duplicateIds<T>(rows: T[], getId: (row: T) => string) {
  const counts = new Map<string, number>()
  rows.forEach((row) => { const id = getId(row).trim(); if (id) counts.set(id, (counts.get(id) ?? 0) + 1) })
  return new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id))
}

export function buildTerritorialAnomalies(data: FederationData, federationId?: string): TerritorialAnomaly[] {
  const result: TerritorialAnomaly[] = []
  for (const rows of [data.ligues,data.ententes,data.cercles,data.clubs,data.equipes]) {
    for (const row of rows) if (row.relationIssue && (!federationId || row.id_federation===federationId)) result.push({severity:"rouge",type:"Parent territorial",entityType:"Structure",id:"",name:"",problem:row.relationIssue,expected:"Parent direct de la même fédération"})
  }
  const ligues = data.ligues.filter((item) => !federationId || item.id_federation === federationId)
  const ententes = data.ententes.filter((item) => !federationId || item.id_federation === federationId)
  const clubs = data.clubs.filter((item) => !federationId || item.id_federation === federationId)
  const hierarchy = data.hierarchie.filter((item) => !federationId || item.id_federation === federationId)
  const federationIds = new Set(data.federations.map((item) => item.id_federation))
  const provinceIds = new Set(data.provinces.map((item) => item.id_province))
  const cityIds = new Set(data.villes.map((item) => item.id_ville))
  const structureTypeIds = new Set(data.typesStructure.map((item) => item.id_type_structure))
  const leagueIds = new Set(ligues.map((item) => item.id_ligue_coc).filter(Boolean))
  const ententeIds = new Set(ententes.map((item) => item.id_entente_coc).filter(Boolean))
  const leagueOwners = new Map(ligues.map((item) => [item.id_ligue_coc, item.id_federation]))
  const ententeOwners = new Map(ententes.map((item) => [item.id_entente_coc, item.id_federation]))
  const duplicateLeagueIds = duplicateIds(ligues, (item) => item.id_ligue_coc)
  const duplicateEntenteIds = duplicateIds(ententes, (item) => item.id_entente_coc)
  const duplicateClubIds = duplicateIds(clubs, (item) => item.id_club_coc)
  const duplicateLeagueFederalIds = duplicateIds(ligues, (item) => item.id_ligue_federation)
  const duplicateEntenteFederalIds = duplicateIds(ententes, (item) => item.id_entente_federation)
  const duplicateClubFederalIds = duplicateIds(clubs, (item) => item.id_club_federation)

  const identity = (entityType: string, id: string, name: string, duplicates: Set<string>) => {
    if (!id) result.push({ severity: "orange", type: "ID manquant", entityType, id: "—", name, problem: "ID COC absent", expected: "Identifiant COC" })
    else if (duplicates.has(id)) result.push({ severity: "orange", type: "Doublon", entityType, id, name, problem: "Identifiant utilisé plusieurs fois", expected: "Identifiant unique" })
  }
  const federalIdentity = (entityType: string, id: string, cocId: string, name: string, duplicates: Set<string>) => {
    if (id && duplicates.has(id)) result.push({ severity: "orange", type: "Doublon", entityType, id: cocId || "—", name, problem: `ID fédéral ${id} utilisé plusieurs fois`, expected: "Identifiant fédéral unique" })
  }
  const federationCheck = (entityType: string, id: string, name: string, ownerId: string) => {
    if (!ownerId || !federationIds.has(ownerId)) result.push({ severity: "rouge", type: "Fédération inconnue", entityType, id: id || "—", name, problem: "Fédération absente du référentiel", expected: "Fédération existante" })
  }

  ligues.forEach((item) => {
    identity("Ligue", item.id_ligue_coc, item.nom_ligue, duplicateLeagueIds); federalIdentity("Ligue", item.id_ligue_federation, item.id_ligue_coc, item.nom_ligue, duplicateLeagueFederalIds); federationCheck("Ligue", item.id_ligue_coc, item.nom_ligue, item.id_federation)
    if (!item.id_province) result.push({ severity: "orange", type: "Territoire manquant", entityType: "Ligue", id: item.id_ligue_coc || "—", name: item.nom_ligue, problem: "Aucune province associée", expected: "Province" })
    else if (!provinceIds.has(item.id_province)) result.push({ severity: "rouge", type: "Référentiel incohérent", entityType: "Ligue", id: item.id_ligue_coc || "—", name: item.nom_ligue, problem: "Province inconnue du référentiel", expected: "Province existante" })
  })
  ententes.forEach((item) => {
    identity("Entente", item.id_entente_coc, item.nom_entente, duplicateEntenteIds); federalIdentity("Entente", item.id_entente_federation, item.id_entente_coc, item.nom_entente, duplicateEntenteFederalIds); federationCheck("Entente", item.id_entente_coc, item.nom_entente, item.id_federation)
    const levels = hierarchy.filter((level) => level.id_federation === item.id_federation).sort((a, b) => Number(a.niveau) - Number(b.niveau))
    const index = levels.findIndex((level) => normalize(level.nom_structure).includes("entente"))
    const requiresLeague = index > 0 && normalize(levels[index - 1].nom_structure).includes("ligue")
    if (!item.id_ligue_coc && requiresLeague) result.push({ severity: "orange", type: "Parent manquant", entityType: "Entente", id: item.id_entente_coc || "—", name: item.nom_entente, problem: "Aucune ligue associée", expected: "Ligue" })
    else if (item.id_ligue_coc && (!leagueIds.has(item.id_ligue_coc) || leagueOwners.get(item.id_ligue_coc) !== item.id_federation)) result.push({ severity: "rouge", type: "Relation incohérente", entityType: "Entente", id: item.id_entente_coc || "—", name: item.nom_entente, problem: "Ligue parente introuvable dans cette fédération", expected: "Ligue de la même fédération" })
    if (item.id_ville && !cityIds.has(item.id_ville)) result.push({ severity: "rouge", type: "Référentiel incohérent", entityType: "Entente", id: item.id_entente_coc || "—", name: item.nom_entente, problem: "Ville inconnue du référentiel", expected: "Ville existante" })
  })
  clubs.forEach((item) => {
    identity("Club", item.id_club_coc, item.nom_club, duplicateClubIds); federalIdentity("Club", item.id_club_federation, item.id_club_coc, item.nom_club, duplicateClubFederalIds); federationCheck("Club", item.id_club_coc, item.nom_club, item.id_federation)
    const levels = hierarchy.filter((level) => level.id_federation === item.id_federation).sort((a, b) => Number(a.niveau) - Number(b.niveau))
    const index = levels.findIndex((level) => normalize(level.nom_structure).includes("club"))
    const parentName = index > 0 ? normalize(levels[index - 1].nom_structure) : ""
    const usesEntentes = parentName.includes("entente")
    const parentId = usesEntentes ? item.id_entente_coc : item.id_ligue_coc
    const parentExists = usesEntentes ? ententeIds.has(parentId) && ententeOwners.get(parentId) === item.id_federation : leagueIds.has(parentId) && leagueOwners.get(parentId) === item.id_federation
    const expected = usesEntentes ? "Entente" : "Ligue"
    if (!parentId && index > 0) result.push({ severity: "orange", type: "Parent manquant", entityType: "Club", id: item.id_club_coc || "—", name: item.nom_club, problem: `Aucun parent ${expected.toLowerCase()} associé`, expected })
    else if (parentId && !parentExists) result.push({ severity: "rouge", type: "Relation incohérente", entityType: "Club", id: item.id_club_coc || "—", name: item.nom_club, problem: "Parent introuvable", expected: `${expected} existante` })
    if (item.id_ville && !cityIds.has(item.id_ville)) result.push({ severity: "rouge", type: "Référentiel incohérent", entityType: "Club", id: item.id_club_coc || "—", name: item.nom_club, problem: "Ville inconnue du référentiel", expected: "Ville existante" })
    if (item.id_province && !provinceIds.has(item.id_province)) result.push({ severity: "rouge", type: "Référentiel incohérent", entityType: "Club", id: item.id_club_coc || "—", name: item.nom_club, problem: "Province inconnue du référentiel", expected: "Province existante" })
  })
  const hierarchyTypes = duplicateIds(hierarchy, (item) => `${item.id_federation}:${item.id_type_structure}`)
  const hierarchyLevels = duplicateIds(hierarchy, (item) => `${item.id_federation}:${item.niveau}`)
  hierarchy.forEach((item) => {
    federationCheck("Niveau", item.id_hierarchie, item.nom_structure, item.id_federation)
    if (!item.id_type_structure || !structureTypeIds.has(item.id_type_structure)) result.push({ severity: "rouge", type: "Type inconnu", entityType: "Niveau", id: item.id_hierarchie || "—", name: item.nom_structure || "Niveau sans nom", problem: "Type de structure absent du référentiel", expected: "Type présent dans TYPES_STRUCTURE" })
    if (!item.niveau || Number(item.niveau) < 1) result.push({ severity: "orange", type: "Configuration incomplète", entityType: "Niveau", id: item.id_hierarchie || "—", name: item.nom_structure || "Niveau", problem: "Niveau invalide ou non renseigné", expected: "Entier supérieur ou égal à 1" })
    if (hierarchyTypes.has(`${item.id_federation}:${item.id_type_structure}`) || hierarchyLevels.has(`${item.id_federation}:${item.niveau}`)) result.push({ severity: "orange", type: "Doublon hiérarchique", entityType: "Niveau", id: item.id_hierarchie || "—", name: item.nom_structure || "Niveau", problem: "Type de structure ou niveau utilisé plusieurs fois", expected: "Type et niveau uniques" })
  })
  return result
}

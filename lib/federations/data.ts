import { getSheetsRows as isolatedRows } from "@/lib/google/sheets"
import { getSheetsRows } from "@/lib/cnac/sheets"
import { resolveTerritorialRows } from "@/lib/cnac/territorial-model"
import { getReferentialSpreadsheetId, getTerritorialSpreadsheetId } from "./config"
import { mapCercleRow, mapClubRow, mapEntenteRow, mapEntiteRow, mapEquipeRow, mapFederationRow, mapHierarchieRow, mapLigueRow, mapProvinceRow, mapSportRow, mapTypeStructureRow, mapVilleRow, mapZoneRow } from "./mappers"
import { REFERENTIAL_SHEETS, TERRITORIAL_RESOURCES } from "./schema"
import type { FederationData } from "./types"

export async function loadFederations() {
  const referential = await getSheetsRows({ sheetNames: ["ENTITES", "SPORTS", "FEDERATIONS", "CATEGORIES_ENTITES"], spreadsheetId: getReferentialSpreadsheetId(), cacheTtlMs: 5000 })
  const entities = new Map(referential.ENTITES.map(mapEntiteRow).map((item) => [item.id_entite, item]))
  const sports = new Map(referential.SPORTS.map(mapSportRow).map((item) => [item.id_sport, item]))
  const entityCategories = new Map(referential.CATEGORIES_ENTITES.map((item) => [item.id_categorie_entite, item.nom_categorie_entite]))
  const federations = referential.FEDERATIONS.map(mapFederationRow).filter((item) => item.id_federation).map((item) => {
    const entity = entities.get(item.id_entite)
    return { ...item, nom_federation: entity?.nom_entite || "", sigle_federation: entity?.sigle_entite || "", nom_sport: sports.get(item.id_sport)?.nom_sport || "", categorie_entite: entityCategories.get(entity?.id_categorie_entite || "") || "", adresse_siege: entity?.adresse_siege || "", telephone: entity?.telephone || "", email: entity?.email || "", site_web: entity?.site_web || "", nom_entite_continentale: entities.get(item.id_entite_continentale)?.nom_entite || "", nom_entite_internationale: entities.get(item.id_entite_internationale)?.nom_entite || "", observations: item.observations || entity?.observations || "" }
  })
  return [...new Map(federations.map((item) => [item.id_federation, item])).values()].sort((a, b) => a.nom_federation.localeCompare(b.nom_federation, "fr"))
}

export async function loadFederationData(options: { connected?: boolean } = {}): Promise<FederationData> {
  const readRows = options.connected ? getSheetsRows : isolatedRows
  const [referential, rawTerritorial] = await Promise.all([
    readRows({ sheetNames: Object.values(REFERENTIAL_SHEETS), spreadsheetId: getReferentialSpreadsheetId(), cacheTtlMs: 5000 }),
    readRows({ sheetNames: [...new Set([...Object.values(TERRITORIAL_RESOURCES).map((item) => item.sheet), "CERCLES", "EQUIPES"])], spreadsheetId: getTerritorialSpreadsheetId(), cacheTtlMs: 5000 }),
  ])
  const territorial = resolveTerritorialRows(rawTerritorial)
  const entities = new Map(referential.ENTITES.map(mapEntiteRow).map((item) => [item.id_entite, item]))
  const sports = new Map(referential.SPORTS.map(mapSportRow).map((item) => [item.id_sport, item]))
  const entityCategories = new Map(referential.CATEGORIES_ENTITES.map((item) => [item.id_categorie_entite, item.nom_categorie_entite]))
  const federations = referential.FEDERATIONS.map(mapFederationRow)
    .filter((item) => item.id_federation)
    .map((item) => {
      const entity = entities.get(item.id_entite)
      return {
        ...item,
        nom_federation: entity?.nom_entite || "",
        sigle_federation: entity?.sigle_entite || "",
        nom_sport: sports.get(item.id_sport)?.nom_sport || "",
        nom_entite_continentale: entities.get(item.id_entite_continentale)?.nom_entite || "",
        nom_entite_internationale: entities.get(item.id_entite_internationale)?.nom_entite || "",
        categorie_entite: entityCategories.get(entity?.id_categorie_entite || "") || "",
        adresse_siege: entity?.adresse_siege || "",
        telephone: entity?.telephone || "",
        email: entity?.email || "",
        site_web: entity?.site_web || "",
        observations: item.observations || entity?.observations || "",
      }
    })
  const typesStructure = referential.TYPES_STRUCTURE.map(mapTypeStructureRow).filter((item) => item.id_type_structure)
  const typeNames = new Map(typesStructure.map((item) => [item.id_type_structure, item.nom_structure]))
  return {
    federations: [...new Map(federations.map((item) => [item.id_federation, item])).values()].sort((a, b) => a.nom_federation.localeCompare(b.nom_federation, "fr")),
    typesStructure,
    provinces: referential.PROVINCES.map(mapProvinceRow).filter((item) => item.id_province),
    villes: referential.VILLES.map(mapVilleRow).filter((item) => item.id_ville),
    zones: territorial.ZONES.map(mapZoneRow).filter((item) => item.id_zone_coc),
    ligues: territorial.LIGUES.map(mapLigueRow).filter((item) => item.id_ligue_coc),
    ententes: territorial.ENTENTES.map(mapEntenteRow).filter((item) => item.id_entente_coc),
    cercles: territorial.CERCLES.map(mapCercleRow).filter((item) => item.id_cercle_coc),
    clubs: territorial.CLUBS.map(mapClubRow).filter((item) => item.id_club_coc),
    equipes: territorial.EQUIPES.map(row => ({ ...mapEquipeRow(row), nom_categorie_age: referential.CATEGORIES_AGE?.find(category => category.id_categorie_age === row.id_categorie_age)?.nom_categorie_age || "Non renseignée" })).filter((item) => item.id_equipe_coc),
    hierarchie: territorial.HIERARCHIE.map(mapHierarchieRow).map((item) => ({ ...item, nom_structure: item.nom_structure || typeNames.get(item.id_type_structure) || "" })).filter((item) => item.id_hierarchie),
  }
}

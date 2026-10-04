import type { CategorieClub, Cercle, Club, Entente, Entite, Equipe, Federation, Ligue, Province, RelationHierarchique, Sport, TypeStructure, Ville, Zone } from "./types"

const metadata = (r: Record<string,unknown>) => ({ directParentId: String(r.id_structure_parent_cnac ?? r.id_structure_parent_coc ?? ""), parentLabel: String(r.parent_label ?? ""), relationIssue: String(r.relation_issue ?? "") })

const value = (row: Record<string, unknown>, key: string) => String(row[key] ?? "").trim()
const map = <T>(row: Record<string, unknown>, keys: readonly string[]) =>
  Object.fromEntries(keys.map((key) => [key, value(row, key)])) as T

export const mapProvinceRow = (r: Record<string, unknown>): Province => ({
  id_province: value(r, "id_province") || value(r, "code_province") || value(r, "nom_province"),
  nom_province: value(r, "nom_province"),
})
export const mapVilleRow = (r: Record<string, unknown>): Ville => ({
  nom_ville: value(r, "nom_ville"),
  id_ville: value(r, "id_ville") || value(r, "nom_ville"),
  id_province: value(r, "id_province"),
})
export const mapCategorieClubRow = (r: Record<string, unknown>): CategorieClub => ({ id_categorie: value(r, "id_categorie_club"), id_sport: value(r, "id_sport"), id_federation: value(r, "id_federation"), nom_categorie: value(r, "nom_categorie_club") })
export const mapLigueRow = (r: Record<string, unknown>): Ligue => ({
  ...metadata(r), ...map<Ligue>(r, ["id_ligue_coc", "id_ligue_federation", "id_federation", "nom_ligue", "id_province", "statut"]),
  id_ligue_federation: value(r, "id_ligue_federation") || value(r, "id_ligue_federal"),
  pseudo_ligue: value(r, "sigle_ligue"), telephone_ligue: value(r, "telephone"), email_ligue: value(r, "email"), nom_province: value(r, "nom_province"),
})
export const mapEntenteRow = (r: Record<string, unknown>): Entente => ({ ...metadata(r), ...map<Entente>(r, ["id_entente_coc", "id_entente_federation", "id_federation", "nom_entente", "id_ville", "statut"]), pseudo_entente:value(r,"sigle_entente"), id_ligue_coc: "id_ligue_coc" in r ? value(r,"id_ligue_coc") : value(r,"id_structure_parent_coc"), nom_ligue:value(r,"nom_ligue"), nom_ville:value(r,"nom_ville"), telephone_entente:value(r,"telephone"), email_entente:value(r,"email") })
export const mapClubRow = (r: Record<string, unknown>): Club => ({ ...metadata(r), ...map<Club>(r, ["id_club_coc", "id_club_federation", "nom_club", "id_federation", "id_province", "id_ville", "statut"]), id_categorie:value(r,"id_categorie_club"), nom_categorie:"", id_entente_coc: "id_entente_coc" in r ? value(r,"id_entente_coc") : value(r,"id_structure_parent_coc"), id_cercle_coc: "id_cercle_coc" in r ? value(r,"id_cercle_coc") : value(r,"id_structure_parent_coc"), nom_entente:value(r,"nom_entente"), pseudo_entente:value(r,"pseudo_entente"), id_ligue_coc: "id_ligue_coc" in r ? value(r,"id_ligue_coc") : value(r,"id_structure_parent_coc"), nom_ligue:value(r,"nom_ligue"), pseudo_ligue:value(r,"pseudo_ligue"), nom_ville:"", sigle_club:value(r,"sigle_club"), telephone_club:value(r,"telephone"), email_club:value(r,"email") })
export const mapCercleRow = (r: Record<string, unknown>): Cercle => ({ ...metadata(r), ...map<Cercle>(r, ["id_cercle_coc", "id_cercle_federation", "id_federation", "id_structure_parent_coc", "nom_cercle", "id_ville", "statut"]), sigle_cercle: value(r, "sigle_cercle"), telephone_cercle:value(r,"telephone"), email_cercle:value(r,"email") })
export const mapEquipeRow = (r: Record<string, unknown>): Equipe => ({...metadata(r),...map<Equipe>(r, ["id_equipe_coc", "id_equipe_federation", "id_federation", "id_club_coc", "nom_equipe", "statut", "observations", "id_sport", "id_discipline", "id_categorie_age", "id_sexe"])})
export const mapHierarchieRow = (r: Record<string, unknown>): RelationHierarchique => ({
  ...map<RelationHierarchique>(r, ["id_hierarchie", "id_federation", "id_type_structure", "observations"]), nom_structure:"", niveau:value(r,"niveau_hierarchique"),
})
export const mapTypeStructureRow = (r: Record<string, unknown>): TypeStructure => ({ id_type_structure:value(r,"id_type_structure"), nom_structure:value(r,"nom_type_structure") })
export const mapZoneRow = (r: Record<string, unknown>): Zone => ({ id_zone_coc:value(r,"id_zone_coc") || value(r,"id_zone_cnac"), id_zone_federation:value(r,"id_zone_federation"), id_federation:value(r,"id_federation"), nom_zone:value(r,"nom_zone"), sigle_zone:value(r,"sigle_zone"), statut:value(r,"statut"), directParentId:value(r,"id_structure_parent_cnac"), parentLabel:value(r,"parent_label"), relationIssue:value(r,"relation_issue") })
export const mapEntiteRow = (r: Record<string, unknown>): Entite => ({ id_entite:value(r,"id_entite"), id_categorie_entite:value(r,"id_categorie_entite"), nom_entite:value(r,"nom_officiel"), sigle_entite:value(r,"sigle"), adresse_siege:value(r,"adresse_siege"), telephone:value(r,"telephone"), email:value(r,"email"), site_web:value(r,"site_web"), observations:value(r,"observations") })
export const mapSportRow = (r: Record<string, unknown>) => map<Sport>(r, ["id_sport", "nom_sport"])

export function mapFederationRow(r: Record<string, unknown>): Federation {
  const logoDriveId = value(r, "logo_drive_id")
  return {
    id_federation: value(r, "id_federation"),
    id_entite: value(r, "id_entite"),
    id_sport: value(r, "id_sport"),
    nom_federation: "",
    sigle_federation: "",
    nom_sport: "",
    logo_drive_id: logoDriveId,
    logo_drive_url: value(r, "logo_drive_url") || (logoDriveId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(logoDriveId)}&sz=w400` : ""),
    statut: value(r, "statut"),
    statut_reconnaissance_ministere: value(r, "statut_reconnaissance_ministere"),
    date_reconnaissance_nationale: value(r, "date_reconnaissance_nationale"),
    statut_affiliation_coc: value(r, "statut_affiliation_coc"),
    date_affiliation_coc: value(r, "date_affiliation_coc"),
    id_entite_continentale: value(r, "id_entite_continentale"),
    nom_entite_continentale: "",
    date_affiliation_continentale: value(r, "date_affiliation_continentale"),
    id_entite_internationale: value(r, "id_entite_internationale"),
    nom_entite_internationale: "",
    date_affiliation_internationale: value(r, "date_affiliation_internationale"),
    categorie_entite: "",
    adresse_siege: "",
    telephone: "",
    email: "",
    site_web: "",
    observations: value(r, "observations"),
  }
}

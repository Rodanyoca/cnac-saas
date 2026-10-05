export interface TerritorialMetadata { directParentId?: string; parentLabel?: string; relationIssue?: string }
export interface Federation {
  id_federation: string
  id_entite: string
  id_sport: string
  nom_federation: string
  sigle_federation: string
  nom_sport: string
  logo_drive_id: string
  logo_drive_url: string
  statut: string
  statut_reconnaissance_ministere: string
  date_reconnaissance_nationale: string
  statut_affiliation_coc: string
  date_affiliation_coc: string
  id_entite_continentale: string
  nom_entite_continentale: string
  date_affiliation_continentale: string
  id_entite_internationale: string
  nom_entite_internationale: string
  date_affiliation_internationale: string
  categorie_entite: string
  adresse_siege: string
  telephone: string
  email: string
  site_web: string
  observations: string
}

export interface Entite { id_entite: string; id_categorie_entite: string; nom_entite: string; sigle_entite: string; adresse_siege: string; telephone: string; email: string; site_web: string; observations: string }
export interface Sport { id_sport: string; nom_sport: string }

export interface Division {
  id_division: string
  nom: string
  observation: string
}

export interface TypeStructure {
  id_type_structure: string
  nom_structure: string
}

export interface Province { id_province: string; nom_province: string }
export interface Ville { id_ville: string; id_province: string; nom_ville: string }
export interface CategorieClub { id_federation?: string; id_categorie: string; id_sport: string; nom_categorie: string }

export interface Zone extends TerritorialMetadata {
  id_zone_coc: string; id_zone_federation: string; id_federation: string
  nom_zone: string; sigle_zone: string; statut: string
}

export interface Ligue extends TerritorialMetadata {
  id_ligue_coc: string; id_ligue_federation: string; id_federation: string
  nom_ligue: string; email_ligue: string; pseudo_ligue: string
  telephone_ligue: string
  id_province: string; nom_province: string
  statut: string
}

export interface Entente extends TerritorialMetadata {
  id_entente_coc: string; id_entente_federation: string; id_federation: string
  nom_entente: string; pseudo_entente: string
  id_ligue_coc: string; nom_ligue: string
  id_ville: string; nom_ville: string; email_entente: string; statut: string
  telephone_entente: string
}

export interface Club extends TerritorialMetadata {
  id_club_coc: string; id_club_federation: string; nom_club: string
  id_categorie: string; nom_categorie: string
  id_entente_coc: string; nom_entente: string; pseudo_entente: string
  id_cercle_coc: string
  id_ligue_coc: string; nom_ligue: string; pseudo_ligue: string
  id_federation: string; id_province: string; id_ville: string; nom_ville: string; statut: string
  sigle_club: string; telephone_club: string; email_club: string
}

export interface Cercle extends TerritorialMetadata {
  id_cercle_coc: string; id_cercle_federation: string; id_federation: string
  nom_cercle: string; sigle_cercle: string; id_structure_parent_coc: string; id_ville: string; statut: string
  telephone_cercle: string; email_cercle: string
}

export interface Equipe extends TerritorialMetadata {
  observations?: string
  nom_categorie_age?: string
  id_equipe_coc: string; id_equipe_federation: string; id_federation: string
  id_club_coc: string; nom_equipe: string; statut: string
}

export interface RelationHierarchique {
  id_hierarchie: string; id_federation: string
  id_type_structure: string; nom_structure: string
  niveau: string; observations: string
}

export interface FederationData {
  federations: Federation[]; typesStructure: TypeStructure[]
  provinces: Province[]; villes: Ville[]; ligues: Ligue[]
  zones: Zone[]; ententes: Entente[]; cercles: Cercle[]; clubs: Club[]; equipes: Equipe[]; hierarchie: RelationHierarchique[]
}

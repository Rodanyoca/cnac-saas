export const REFERENTIAL_SHEETS = {
  entites: "ENTITES",
  sports: "SPORTS",
  federations: "FEDERATIONS",
  provinces: "PROVINCES",
  villes: "VILLES",
  typesStructure: "TYPES_STRUCTURE",
  categoriesClub: "CATEGORIES_CLUB",
  categoriesEntites: "CATEGORIES_ENTITES",
  categoriesAge: "CATEGORIES_AGE",
} as const

export const TERRITORIAL_RESOURCES = {
  hierarchie: { sheet: "HIERARCHIE", idColumn: "id_hierarchie" },
  zones: { sheet: "ZONES", idColumn: "id_zone_cnac" },
  ligues: { sheet: "LIGUES", idColumn: "id_ligue_coc" },
  ententes: { sheet: "ENTENTES", idColumn: "id_entente_coc" },
  cercles: { sheet: "CERCLES", idColumn: "id_cercle_coc" },
  clubs: { sheet: "CLUBS", idColumn: "id_club_coc" },
  equipes: { sheet: "EQUIPES", idColumn: "id_equipe_coc" },
} as const

export type TerritorialResource = keyof typeof TERRITORIAL_RESOURCES

export const SHEET_COLUMNS = {
  HIERARCHIE: ["id_hierarchie", "id_federation", "id_type_structure", "niveau_hierarchique", "niveau_obligatoire", "observations"],
  TYPES_STRUCTURE: ["id_type_structure", "nom_type_structure", "description", "observations"],
  ZONES: ["id_zone_cnac", "id_zone_federation", "id_federation", "nom_zone", "sigle_zone", "statut", "observations"],
  LIGUES: ["id_ligue_coc", "id_ligue_federation", "id_federation", "id_province", "nom_ligue", "sigle_ligue", "date_creation", "date_reconnaissance", "telephone", "email", "statut", "observations"],
  ENTENTES: ["id_entente_coc", "id_entente_federation", "id_federation", "id_structure_parent_coc", "id_ville", "nom_entente", "sigle_entente", "date_creation", "date_reconnaissance", "telephone", "email", "statut", "observations"],
  CERCLES: ["id_cercle_coc", "id_cercle_federation", "id_federation", "id_structure_parent_coc", "id_ville", "nom_cercle", "sigle_cercle", "date_creation", "date_reconnaissance", "telephone", "email", "statut", "observations"],
  CLUBS: ["id_club_coc", "id_club_federation", "id_federation", "id_structure_parent_coc", "id_categorie_club", "id_province", "id_ville", "nom_club", "sigle_club", "date_creation", "date_affiliation", "telephone", "email", "statut", "observations"],
  EQUIPES: ["id_equipe_coc", "id_equipe_federation", "id_federation", "id_club_coc", "id_sport", "id_discipline", "id_categorie_age", "id_sexe", "nom_equipe", "statut", "observations"],
} as const

export function selectSheetColumns(sheet: keyof typeof SHEET_COLUMNS, row: Record<string, string>) {
  const aliases: Record<string, string> = sheet === "HIERARCHIE" ? { niveau_hierarchique: row.niveau, observations: row.observations }
    : sheet === "LIGUES" ? { sigle_ligue: row.pseudo_ligue, telephone: row.telephone_ligue, email: row.email_ligue }
    : sheet === "ENTENTES" ? { id_structure_parent_coc: row.id_ligue_coc, sigle_entente: row.pseudo_entente, telephone: row.telephone_entente, email: row.email_entente }
    : sheet === "CERCLES" ? { sigle_cercle: row.pseudo_cercle, telephone: row.telephone_cercle, email: row.email_cercle }
    : sheet === "CLUBS" ? { id_structure_parent_coc: row.id_cercle_coc || row.id_entente_coc || row.id_ligue_coc, id_categorie_club: row.id_categorie, sigle_club: row.pseudo_club, telephone: row.telephone_club, email: row.email_club }
    : {}
  return Object.fromEntries(SHEET_COLUMNS[sheet].map((column) => [column, aliases[column] ?? row[column] ?? ""]))
}

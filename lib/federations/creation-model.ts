export type FederationCreationInput = {
  id_categorie_entite: string; nom_officiel: string; sigle: string; id_sport: string; statut: string
  adresse_siege: string; telephone: string; email: string; site_web: string
  statut_reconnaissance_ministere: string; date_reconnaissance_nationale: string
  statut_affiliation_coc: string; date_affiliation_coc: string
  id_entite_continentale: string; date_affiliation_continentale: string
  id_entite_internationale: string; date_affiliation_internationale: string; observations: string
}

const text = (value: unknown) => String(value ?? "").trim()
export function normalizeFederationCreation(input: Record<string, unknown>): FederationCreationInput {
  return {
    id_categorie_entite: text(input.id_categorie_entite), nom_officiel: text(input.nom_officiel), sigle: text(input.sigle).toLocaleUpperCase("fr"), id_sport: text(input.id_sport), statut: text(input.statut).toUpperCase(),
    adresse_siege: text(input.adresse_siege), telephone: text(input.telephone), email: text(input.email).toLocaleLowerCase("fr"), site_web: text(input.site_web),
    statut_reconnaissance_ministere: text(input.statut_reconnaissance_ministere).toUpperCase(), date_reconnaissance_nationale: text(input.date_reconnaissance_nationale), statut_affiliation_coc: text(input.statut_affiliation_coc).toUpperCase(), date_affiliation_coc: text(input.date_affiliation_coc),
    id_entite_continentale: text(input.id_entite_continentale), date_affiliation_continentale: text(input.date_affiliation_continentale), id_entite_internationale: text(input.id_entite_internationale), date_affiliation_internationale: text(input.date_affiliation_internationale), observations: text(input.observations),
  }
}

export class FederationCreationError extends Error {
  field?: keyof FederationCreationInput | "logo"
  constructor(message: string, field?: keyof FederationCreationInput | "logo") { super(message); this.field = field }
}
const date = /^\d{4}-\d{2}-\d{2}$/
export function validateFederationCreation(row: FederationCreationInput) {
  for (const [field, label] of [["id_categorie_entite", "La catégorie"], ["nom_officiel", "Le nom officiel"], ["id_sport", "Le sport"], ["statut", "Le statut général"], ["statut_reconnaissance_ministere", "La reconnaissance ministérielle"], ["statut_affiliation_coc", "L’affiliation au COC"]] as const) if (!row[field]) throw new FederationCreationError(`${label} est obligatoire.`, field)
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) throw new FederationCreationError("L’adresse e-mail n’est pas valide.", "email")
  if (row.site_web) { try { new URL(/^https?:\/\//i.test(row.site_web) ? row.site_web : `https://${row.site_web}`) } catch { throw new FederationCreationError("Le site web n’est pas valide.", "site_web") } }
  for (const field of ["date_reconnaissance_nationale", "date_affiliation_coc", "date_affiliation_continentale", "date_affiliation_internationale"] as const) if (row[field] && !date.test(row[field])) throw new FederationCreationError("La date doit respecter le format AAAA-MM-JJ.", field)
  if (row.date_affiliation_continentale && !row.id_entite_continentale) throw new FederationCreationError("Sélectionnez une fédération continentale pour cette date.", "id_entite_continentale")
  if (row.date_affiliation_internationale && !row.id_entite_internationale) throw new FederationCreationError("Sélectionnez une fédération internationale pour cette date.", "id_entite_internationale")
}

export function nextSequentialId(rows: Record<string, string>[], column: string, prefix: string) {
  const max = rows.reduce((value, row) => Math.max(value, Number(row[column]?.match(new RegExp(`^${prefix}(\\d{3})$`))?.[1] || 0)), 0)
  if (max >= 999) throw new Error(`La séquence ${prefix} est épuisée.`)
  return `${prefix}${String(max + 1).padStart(3, "0")}`
}

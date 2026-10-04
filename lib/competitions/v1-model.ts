export const COMPETITION_V1_SHEETS = {
  competitions: "COMPETITIONS",
  programs: "PROGRAMMES_COMPETITION",
  engagements: "ENGAGEMENTS_CAMPAGNES_PROGRAMMES",
  participations: "PARTICIPATIONS_ACTEURS_COMPETITION",
  units: "UNITES_PARTICIPANTES",
  unitMembers: "MEMBRES_UNITES_PARTICIPANTES",
  results: "RESULTATS",
  medals: "MEDAILLES",
} as const

export const TEAM_V1_SHEETS = {
  teams: "EQUIPES_NATIONALES",
  campaigns: "CAMPAGNES_EQUIPES_NATIONALES",
  selections: "SELECTIONS_ATHLETES",
  staff: "AFFECTATIONS_STAFF",
} as const

export const V1_HEADERS = {
  COMPETITIONS: ["id_competition", "nom_competition", "id_type_competition", "id_niveau_competition", "edition", "est_multisport", "date_debut", "date_fin", "pays", "ville", "lieu", "id_statut_competition", "observation"],
  PROGRAMMES_COMPETITION: ["id_programme_competition", "id_competition", "id_epreuve", "id_categorie_age", "id_sexe", "date_debut", "date_fin", "observation"],
  ENGAGEMENTS_CAMPAGNES_PROGRAMMES: ["id_engagement_campagne", "id_programme_competition", "id_campagne", "id_statut_engagement", "date_engagement", "observation"],
  PARTICIPATIONS_ACTEURS_COMPETITION: ["id_participation_acteur", "id_engagement_campagne", "id_acteur_coc", "id_type_acteur", "id_selection", "id_affectation_staff", "id_statut_participation", "date_statut", "id_participation_remplacement", "observation"],
  UNITES_PARTICIPANTES: ["id_unite_participante", "id_engagement_campagne", "type_unite", "id_participation_acteur", "nom_unite", "observation"],
  MEMBRES_UNITES_PARTICIPANTES: ["id_membre_unite", "id_unite_participante", "id_participation_acteur", "role_membre", "observation"],
  RESULTATS: ["id_resultat", "id_resultat_logique", "numero_version", "id_resultat_precedent", "est_version_courante", "id_engagement_campagne", "id_programme_competition", "id_unite_participante", "date_resultat", "phase", "type_adversaire", "nom_adversaire", "pays_adversaire", "id_resultat_synthetique", "valeur_coc", "valeur_adversaire", "id_unite_mesure", "id_decision_resultat", "id_statut_resultat", "motif_correction", "observation"],
  MEDAILLES: ["id_medaille", "id_resultat_logique", "id_distinction", "date_obtention", "observation"],
  EQUIPES_NATIONALES: ["id_equipe_nationale", "id_federation", "id_sport", "id_discipline", "nom_equipe_nationale", "id_categorie_age", "id_saison", "statut", "observation"],
  CAMPAGNES_EQUIPES_NATIONALES: ["id_campagne", "id_equipe_nationale", "nom_campagne", "date_debut", "date_fin", "objectif", "id_statut_campagne", "observation"],
  SELECTIONS_ATHLETES: ["id_selection", "id_campagne", "id_athlete", "id_poste", "id_categorie_poids", "id_grade_sportif", "date_selection", "id_statut_selection", "observation"],
  AFFECTATIONS_STAFF: ["id_affectation_staff", "id_campagne", "id_acteur_coc", "id_type_acteur", "id_role_staff", "date_debut", "date_fin", "observation"],
} as const

type Headers = typeof V1_HEADERS
export type V1SheetName = keyof Headers
export type V1Row<N extends V1SheetName> = Record<Headers[N][number], string>
export type CompetitionV1 = V1Row<"COMPETITIONS">
export type ProgramV1 = V1Row<"PROGRAMMES_COMPETITION">
export type EngagementV1 = V1Row<"ENGAGEMENTS_CAMPAGNES_PROGRAMMES">
export type AthleteParticipationV1 = V1Row<"PARTICIPATIONS_ACTEURS_COMPETITION"> & { id_selection_remplacement?: string }
export type ResultV1 = V1Row<"RESULTATS">
export type MedalV1 = V1Row<"MEDAILLES">
export type CampaignV1 = V1Row<"CAMPAGNES_EQUIPES_NATIONALES">
export type AthleteSelectionV1 = V1Row<"SELECTIONS_ATHLETES">

export const SELECTION_STATUSES = ["PRESELECTIONNE", "SELECTIONNE", "REMPLACANT", "NON_RETENU", "RETIRE"] as const
export const PARTICIPATION_STATUSES = ["INSCRIT", "PARTICIPANT", "ABSENT", "FORFAIT", "REMPLACE"] as const
export const ENGAGEMENT_STATUSES = ["PREVU", "SOUMIS", "CONFIRME", "RETIRE", "ANNULE"] as const
export const RESULT_VALIDATION_STATUSES = ["BROUILLON", "TRANSMIS", "VALIDE_FEDERATION", "VALIDE_COC", "HOMOLOGUE", "CORRIGE", "ANNULE"] as const

const clean = (value: unknown) => String(value ?? "").trim()
export function mapV1Row(sheet: "PARTICIPATIONS_ATHLETES_COMPETITION", row: Record<string, string>): AthleteParticipationV1 & {id_selection_remplacement:string}
export function mapV1Row<N extends V1SheetName>(sheet: N, row: Record<string, string>): V1Row<N>
export function mapV1Row(sheet: V1SheetName | "PARTICIPATIONS_ATHLETES_COMPETITION", row: Record<string, string>) {
  if(sheet==="PARTICIPATIONS_ATHLETES_COMPETITION") return {...Object.fromEntries(V1_HEADERS.PARTICIPATIONS_ACTEURS_COMPETITION.map((header) => [header, clean(row[header])])),id_participation_acteur:clean(row.id_participation_acteur||row.id_participation_athlete),id_acteur_coc:clean(row.id_acteur_coc||row.id_athlete),id_type_acteur:clean(row.id_type_acteur||"ATHLETE"),id_participation_remplacement:clean(row.id_participation_remplacement||row.id_selection_remplacement),id_selection_remplacement:clean(row.id_selection_remplacement)}
  return Object.fromEntries(V1_HEADERS[sheet].map((header) => [header, clean(row[header])]))
}
export function missingHeaders<N extends V1SheetName>(sheet: N, actual: string[]) {
  return V1_HEADERS[sheet].filter((header) => !actual.includes(header))
}
export function assertIsoDate(value: string, field: string, required = false) {
  if (!value && !required) return
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${field} doit être une date ISO YYYY-MM-DD.`)
}
export function assertPeriod(start: string, end: string, label: string) {
  assertIsoDate(start, `${label}.date_debut`, true); assertIsoDate(end, `${label}.date_fin`)
  if (end && end < start) throw new Error(`${label} : la date de fin précède la date de début.`)
}
export function assertOneOf(value: string, values: readonly string[], field: string) {
  if (!values.includes(value)) throw new Error(`${field} invalide.`)
}
export function validateEngagement(row: EngagementV1) {
  for (const field of ["id_engagement_campagne", "id_programme_competition", "id_campagne", "id_statut_engagement", "date_engagement"] as const) if (!row[field]) throw new Error(`${field} est obligatoire.`)
  assertOneOf(row.id_statut_engagement, ENGAGEMENT_STATUSES, "id_statut_engagement")
  assertIsoDate(row.date_engagement, "date_engagement", true)
  return row
}
export function validateParticipation(row: AthleteParticipationV1) {
  for (const field of ["id_participation_acteur", "id_engagement_campagne", "id_acteur_coc", "id_type_acteur", "id_statut_participation", "date_statut"] as const) if (!row[field]) throw new Error(`${field} est obligatoire.`)
  assertOneOf(row.id_statut_participation, PARTICIPATION_STATUSES, "id_statut_participation")
  assertIsoDate(row.date_statut, "date_statut", true)
  if (row.id_statut_participation === "REMPLACE" && !row.id_participation_remplacement) throw new Error("La participation remplaçante est obligatoire.")
  return row
}
export function validateResult(row: ResultV1) {
  for (const field of ["id_resultat", "id_resultat_logique", "numero_version", "est_version_courante", "id_engagement_campagne", "id_programme_competition", "date_resultat", "id_statut_resultat"] as const) if (!row[field]) throw new Error(`${field} est obligatoire.`)
  if (!/^\d+$/.test(row.numero_version) || Number(row.numero_version) < 1) throw new Error("numero_version invalide.")
  if (!row.id_resultat_synthetique && !row.id_decision_resultat && !row.valeur_coc) throw new Error("Un résultat doit contenir une synthèse, une décision ou une valeur.")
  if (Number(row.numero_version) > 1 && (!row.id_resultat_precedent || !row.motif_correction)) throw new Error("Une correction doit référencer et motiver la version précédente.")
  assertOneOf(row.id_statut_resultat, ["BROUILLON", "OFFICIEL", "CORRIGE", "ANNULE"], "id_statut_resultat")
  assertOneOf(row.est_version_courante, ["OUI", "NON"], "est_version_courante")
  assertIsoDate(row.date_resultat, "date_resultat", true)
  return row
}

export function validateV1Relations(input: {
  programs: ProgramV1[]; campaigns: CampaignV1[]; engagements: EngagementV1[]; selections: AthleteSelectionV1[]; participations: AthleteParticipationV1[]; results: ResultV1[]
}) {
  const programs = new Map(input.programs.map((row) => [row.id_programme_competition, row]))
  const campaigns = new Map(input.campaigns.map((row) => [row.id_campagne, row]))
  const engagements = new Map(input.engagements.map((row) => [row.id_engagement_campagne, row]))
  const selections = new Map(input.selections.map((row) => [row.id_selection, row]))
  for (const row of input.engagements) if (!programs.has(row.id_programme_competition) || !campaigns.has(row.id_campagne)) throw new Error(`Engagement orphelin ${row.id_engagement_campagne}.`)
  for (const row of input.participations) { const engagement = engagements.get(row.id_engagement_campagne), selection = row.id_selection ? selections.get(row.id_selection) : undefined; if (!engagement || (selection && engagement.id_campagne !== selection.id_campagne)) throw new Error(`Participation incohérente ${row.id_participation_acteur}.`) }
  for (const row of input.results) { const engagement = engagements.get(row.id_engagement_campagne); if (!engagement || engagement.id_programme_competition !== row.id_programme_competition) throw new Error(`Résultat incohérent ${row.id_resultat}.`) }
}

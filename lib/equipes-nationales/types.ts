export const NATIONAL_TEAM_HEADERS = ["id_equipe_nationale", "id_federation", "id_sport", "id_discipline", "nom_equipe_nationale", "id_categorie_age", "id_saison", "statut", "observations"] as const
export const NATIONAL_TEAM_MEMBER_HEADERS = ["id_membre_equipe_nationale", "id_equipe_nationale", "id_acteur_coc", "id_type_acteur", "role_equipe", "date_debut", "date_fin", "statut", "observations"] as const
export type NationalTeam = Record<Exclude<(typeof NATIONAL_TEAM_HEADERS)[number],"id_saison">, string> & { id_saison?:string;saison_label?:string;saison_debut?:string;saison_fin?:string;date_debut:string;date_fin:string }
export type NationalTeamMember = Record<(typeof NATIONAL_TEAM_MEMBER_HEADERS)[number], string>
export type NationalTeamCampaign = { id_campagne: string; id_equipe_nationale: string; nom_campagne: string; date_debut: string; date_fin: string; objectif: string; id_statut_campagne: string; observation: string }
export type CampaignReferences = { statuses: ReferenceOption[]; seasons?: (ReferenceOption & { dateStart: string; dateEnd: string })[] }
export type AthleteSelection = { id_selection:string; id_campagne:string; id_athlete:string; id_poste:string; id_categorie_poids:string; id_grade_sportif:string; date_selection:string; id_statut_selection:string; observation:string; athlete_label?:string; campaign_label?:string }
export type StaffAssignment = { id_affectation_staff:string; id_campagne:string; id_acteur_coc:string; id_type_acteur:string; id_role_staff:string; date_debut:string; date_fin:string; observation:string; actor_label?:string }
export type ReferenceOption = { id: string; label: string; secondary?: string; parentId?: string }
export type NationalTeamReferences = { federations: ReferenceOption[]; sports: ReferenceOption[]; disciplines: ReferenceOption[]; events?: (ReferenceOption & { disciplineId?: string })[]; ageCategories: ReferenceOption[]; seasons?:(ReferenceOption&{dateStart:string;dateEnd:string})[]; roles: ReferenceOption[]; ageCategoriesAvailable: boolean; rolesReferentialAvailable: boolean }
export const ACTOR_TYPES = ["ATHLETE", "COACH", "MEDECIN", "OFFICIEL", "ARBITRE"] as const
export type ActorType = (typeof ACTOR_TYPES)[number]
export const NATIONAL_TEAM_ROLES = ["ATHLETE", "COACH_PRINCIPAL", "ASSISTANT_COACH", "MEDECIN", "PREPARATEUR", "SPARRING_PARTNER", "OFFICIEL", "AUTRE"] as const
export function isActiveNationalTeamMember(member: NationalTeamMember, today = new Date().toISOString().slice(0, 10)) { return member.statut === "ACTIF" && (!member.date_fin || member.date_fin >= today) }

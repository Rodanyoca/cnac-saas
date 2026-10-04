import { programScheduleError } from "./program-calendar.ts"
import type { Competition, CompetitionProgram, CompetitionStatus } from "./types"

const allowedStatuses: CompetitionStatus[] = ["PLANIFIEE", "EN_COURS", "TERMINEE", "REPORTEE", "ANNULEE"]
const clean = (value: unknown) => String(value ?? "").trim()

export function validateCompetitionInput(input: Record<string, unknown>) {
  const row = {
    nom_competition: clean(input.nom_competition), id_type_competition: clean(input.id_type_competition), edition: clean(input.edition), est_multisport: clean(input.est_multisport || "NON").toUpperCase(),
    niveau_competition: clean(input.niveau_competition), date_debut: clean(input.date_debut), date_fin: clean(input.date_fin),
    pays: clean(input.pays), ville: clean(input.ville), lieu: clean(input.lieu), statut: clean(input.statut).toUpperCase(), observations: clean(input.observations),
  }
  if (!row.nom_competition || !row.id_type_competition || !row.date_debut || !row.statut) throw new Error("Le nom, le type, la date de la cérémonie d’ouverture et le statut sont obligatoires.")
  if (!row.date_fin) throw new Error("La date de la cérémonie de clôture est obligatoire.")
  if (row.date_fin < row.date_debut) throw new Error("La cérémonie de clôture doit avoir lieu après ou le même jour que la cérémonie d’ouverture.")
  if (!allowedStatuses.includes(row.statut as CompetitionStatus)) throw new Error("Statut de compétition invalide.")
  if (!["OUI", "NON"].includes(row.est_multisport)) throw new Error("Le caractère multisport doit valoir OUI ou NON.")
  return row
}

export function validateTeamParticipationInput(input: Record<string, unknown>) {
  const row = { id_equipe_nationale: clean(input.id_equipe_nationale), statut_participation: clean(input.statut_participation).toUpperCase(), date_engagement: clean(input.date_engagement), observations: clean(input.observations) }
  if (!row.id_equipe_nationale || !row.statut_participation) throw new Error("L’équipe nationale et le statut de participation sont obligatoires.")
  return row
}

export function validateProgramInput(input: Record<string, unknown>) {
  const row = { id_epreuve: clean(input.id_epreuve), id_categorie_age: clean(input.id_categorie_age), id_sexe: clean(input.id_sexe), date_debut: clean(input.date_debut), date_fin: clean(input.date_fin), observations: clean(input.observations) }
  if (!row.id_epreuve) throw new Error("L’épreuve est obligatoire.")
  if (row.date_debut && !/^\d{4}-\d{2}-\d{2}$/.test(row.date_debut)) throw new Error("Date de début du programme invalide.")
  if (row.date_fin && !/^\d{4}-\d{2}-\d{2}$/.test(row.date_fin)) throw new Error("Date de fin du programme invalide.")
  if (row.date_fin && (!row.date_debut || row.date_fin < row.date_debut)) throw new Error("La période du programme est invalide.")
  return row
}

export function validateProgramSchedule(program: Pick<CompetitionProgram, "date_debut" | "date_fin">, competition: Pick<Competition, "date_debut" | "date_fin">) {
  const error = programScheduleError(program, competition)
  if (error) throw new Error(error)
}

export function validateEngagementInput(input: Record<string, unknown>) {
  const row = { id_programme_competition: clean(input.id_programme_competition), id_campagne: clean(input.id_campagne), id_statut_engagement: clean(input.id_statut_engagement).toUpperCase(), date_engagement: clean(input.date_engagement), observation: clean(input.observation) }
  for (const field of ["id_programme_competition", "id_campagne", "id_statut_engagement", "date_engagement"] as const) if (!row[field]) throw new Error(`${field} est obligatoire.`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date_engagement)) throw new Error("date_engagement est invalide.")
  return row
}
export function validateAthleteParticipationInput(input: Record<string, unknown>) {
  const row={id_engagement_campagne:clean(input.id_engagement_campagne),id_selection:clean(input.id_selection),id_statut_participation:clean(input.id_statut_participation).toUpperCase(),date_statut:clean(input.date_statut),id_selection_remplacement:clean(input.id_selection_remplacement),observation:clean(input.observation)}
  if(!row.id_engagement_campagne||!row.id_selection||!row.id_statut_participation||!row.date_statut) throw new Error("L’engagement, la sélection, le statut et la date sont obligatoires.")
  if(!["INSCRIT","PARTICIPANT","ABSENT","FORFAIT","REMPLACE"].includes(row.id_statut_participation)) throw new Error("Statut de participation invalide.")
  if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date_statut)) throw new Error("Date de participation invalide.")
  if(row.id_statut_participation==="REMPLACE"&&!row.id_selection_remplacement) throw new Error("La sélection remplaçante est obligatoire.")
  if(row.id_selection_remplacement===row.id_selection) throw new Error("Une sélection ne peut pas se remplacer elle-même.")
  return row
}
export function validateCompetitionResultInput(input:Record<string,unknown>){
 const row={id_engagement_campagne:clean(input.id_engagement_campagne),id_programme_competition:clean(input.id_programme_competition),id_unite_participante:clean(input.id_unite_participante),id_epreuve:clean(input.id_epreuve),id_discipline:clean(input.id_discipline),date_resultat:clean(input.date_resultat),phase:clean(input.phase),type_adversaire:clean(input.type_adversaire||"AUCUN").toUpperCase(),nom_adversaire:clean(input.nom_adversaire||input.adversaire),pays_adversaire:clean(input.pays_adversaire),id_resultat_synthetique:clean(input.id_resultat_synthetique),valeur_coc:clean(input.valeur_coc||input.valeur_rdc),valeur_adversaire:clean(input.valeur_adversaire),id_unite_mesure:clean(input.id_unite_mesure),id_decision_resultat:clean(input.id_decision_resultat),id_statut_resultat:clean(input.id_statut_resultat||"BROUILLON").toUpperCase(),motif_correction:clean(input.motif_correction),observation:clean(input.observation)}
 for(const field of ["id_engagement_campagne","id_unite_participante","date_resultat","id_statut_resultat"] as const)if(!row[field])throw new Error(`${field} est obligatoire.`)
 if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date_resultat))throw new Error("date_resultat est invalide.")
 if(!row.id_resultat_synthetique&&!row.id_decision_resultat&&!row.valeur_coc)throw new Error("Le résultat doit contenir une synthèse, une décision ou une valeur.")
 if(!["AUCUN","ATHLETE","EQUIPE"].includes(row.type_adversaire))throw new Error("Type d’adversaire invalide.")
 if(row.type_adversaire!=="AUCUN"&&!row.nom_adversaire)throw new Error("Le nom de l’adversaire est obligatoire.")
 if(row.type_adversaire==="AUCUN"&&(row.nom_adversaire||row.valeur_adversaire))throw new Error("Un résultat sans adversaire ne peut pas contenir de valeur adverse.")
 if(!["BROUILLON","OFFICIEL","CORRIGE","ANNULE"].includes(row.id_statut_resultat))throw new Error("Statut de résultat invalide.")
 return { ...row, valeur_rdc: row.valeur_coc, id_statut_validation_resultat: row.id_statut_resultat }
}

export const MEDAL_DISTINCTIONS = ["DIST_OR", "DIST_ARGENT", "DIST_BRONZE"] as const
export function validateCompetitionMedalInput(input:Record<string,unknown>){
 const row={id_resultat_logique:clean(input.id_resultat_logique),id_distinction:clean(input.id_distinction).toUpperCase(),date_obtention:clean(input.date_obtention),observation:clean(input.observation)}
 if(!row.id_resultat_logique||!row.id_distinction||!row.date_obtention)throw new Error("Le résultat, la médaille et la date d’obtention sont obligatoires.")
 if(!MEDAL_DISTINCTIONS.includes(row.id_distinction as (typeof MEDAL_DISTINCTIONS)[number]))throw new Error("Seules les médailles d’or, d’argent et de bronze sont acceptées.")
 if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date_obtention))throw new Error("La date d’obtention est invalide.")
 return row as typeof row&{id_distinction:(typeof MEDAL_DISTINCTIONS)[number]}
}

import type { AthleteParticipation, CampaignEngagement, Competition, CompetitionProgram, CompetitionResult } from "./types"
import type { AthleteSelection, NationalTeam, NationalTeamCampaign, NationalTeamMember } from "@/lib/equipes-nationales/types"

export type DataQualityState = "ABSENT" | "INCONNU" | "NON_APPLICABLE" | "NON_RENSEIGNE" | "SOURCE_INDISPONIBLE" | "ORPHELIN" | "SCHEMA_INVALIDE"
export type DataQualityIssue = { code: string; state: DataQualityState; scope: string; message: string; action: string; blockingWrite: boolean }
export type DataQualityReport = { completeness: number; provenance: number; issues: DataQualityIssue[] }

const percent = (present: number, total: number) => total ? Math.round((present / total) * 100) : 100
const issue = (code: string, state: DataQualityState, scope: string, message: string, action: string, blockingWrite = false): DataQualityIssue => ({ code, state, scope, message, action, blockingWrite })

export function qualifiedValue(value: unknown, options: { applicable?: boolean; known?: boolean } = {}) {
  if (options.applicable === false) return { state: "NON_APPLICABLE" as const, label: "Non applicable" }
  if (options.known === false) return { state: "INCONNU" as const, label: "Inconnu" }
  if (value === null || value === undefined || String(value).trim() === "") return { state: "NON_RENSEIGNE" as const, label: "Non renseigné" }
  return { state: null, label: String(value) }
}

export function classifyDataError(error: unknown, scope: string): DataQualityIssue {
  const message = error instanceof Error ? error.message : String(error || "")
  if (/colonne|schéma|schema/i.test(message)) return issue("SCHEMA_INVALID", "SCHEMA_INVALIDE", scope, "Le schéma de la source est incomplet.", "Vérifier les en-têtes attendus avant toute écriture.", true)
  if (/timeout|délai|indisponible|unavailable|charger/i.test(message)) return issue("SOURCE_UNAVAILABLE", "SOURCE_INDISPONIBLE", scope, "La source secondaire est momentanément indisponible.", "Réessayer le chargement; les autres sections restent consultables.")
  return issue("READ_FAILED", "SOURCE_INDISPONIBLE", scope, "Cette section n’a pas pu être lue.", "Contrôler la source et réessayer.")
}

export function competitionQuality(input: { competition: Competition; programs: CompetitionProgram[]; engagements: CampaignEngagement[]; participations: AthleteParticipation[]; results: CompetitionResult[]; sectionIssues?: DataQualityIssue[]; eventsAvailable?: boolean }): DataQualityReport {
  const { competition, programs, engagements, participations, results } = input
  const required = [competition.nom_competition, competition.id_type_competition, competition.date_debut, competition.date_fin, competition.statut]
  const issues = [...(input.sectionIssues || [])]
  if (required.some((value) => !value)) issues.push(issue("COMPETITION_INCOMPLETE", "NON_RENSEIGNE", "general", "Des informations essentielles de la compétition ne sont pas renseignées.", "Compléter le nom, le type, la date de début et le statut.", true))
  if (input.eventsAvailable === false) issues.push(issue("EVENT_REFERENTIAL_EMPTY", "ABSENT", "programmes", "Le référentiel des épreuves est vide.", "Faire valider et renseigner les épreuves fédérales avant de créer un programme.", true))
  const programIds = new Set(programs.map((row) => row.id_programme_competition)), engagementIds = new Set(engagements.map((row) => row.id_engagement_campagne))
  for (const row of engagements) if (!programIds.has(row.id_programme_competition)) issues.push(issue(`ENGAGEMENT_ORPHAN:${row.id_engagement_campagne}`, "ORPHELIN", "engagements", `L’engagement ${row.id_engagement_campagne} référence un programme inconnu.`, "Rétablir le programme référencé; aucune correction silencieuse n’est appliquée.", true))
  for (const row of participations) if (!engagementIds.has(row.id_engagement_campagne)) issues.push(issue(`PARTICIPATION_ORPHAN:${row.id_participation_athlete}`, "ORPHELIN", "participants", `La participation ${row.id_participation_athlete} référence un engagement inconnu.`, "Rétablir l’engagement ou corriger explicitement la relation.", true))
  for (const row of results) if (!engagementIds.has(row.id_engagement_campagne) || !programIds.has(row.id_programme_competition)) issues.push(issue(`RESULT_ORPHAN:${row.id_resultat}`, "ORPHELIN", "resultats", `Le résultat ${row.id_resultat} possède une relation programme/engagement inconnue.`, "Rétablir les relations avant toute correction du résultat.", true))
  const dated = engagements.filter((row) => row.date_engagement).length
  return { completeness: percent(required.filter(Boolean).length, required.length), provenance: percent(dated, engagements.length), issues }
}

export function nationalTeamQuality(input: { team: NationalTeam; campaigns: NationalTeamCampaign[]; selections: AthleteSelection[]; members: NationalTeamMember[]; engagements: CampaignEngagement[]; sectionIssues?: DataQualityIssue[] }): DataQualityReport {
  const { team, campaigns, selections, members, engagements } = input, issues = [...(input.sectionIssues || [])]
  const required = [team.nom_equipe_nationale, team.id_federation, team.id_sport, team.statut]
  if (required.some((value) => !value)) issues.push(issue("TEAM_INCOMPLETE", "NON_RENSEIGNE", "general", "La fiche de l’équipe nationale est incomplète.", "Compléter le nom, la fédération, le sport et le statut.", true))
  const campaignIds = new Set(campaigns.map((row) => row.id_campagne))
  for (const row of selections) if (!campaignIds.has(row.id_campagne)) issues.push(issue(`SELECTION_ORPHAN:${row.id_selection}`, "ORPHELIN", "selections", `La sélection ${row.id_selection} référence une campagne inconnue.`, "Rétablir la campagne avant de modifier la sélection.", true))
  for (const row of engagements) if (!campaignIds.has(row.id_campagne)) issues.push(issue(`ENGAGEMENT_CAMPAIGN_ORPHAN:${row.id_engagement_campagne}`, "ORPHELIN", "engagements", `L’engagement ${row.id_engagement_campagne} référence une campagne inconnue.`, "Rétablir la campagne avant de modifier l’engagement.", true))
  const datedMembers = members.filter((row) => row.date_debut).length
  if (members.length && datedMembers < members.length) issues.push(issue("STAFF_PERIOD_INCOMPLETE", "NON_RENSEIGNE", "staff", "Certaines affectations du staff n’ont pas de date de début.", "Compléter les périodes des affectations concernées."))
  const dated = engagements.filter((row) => row.date_engagement).length
  return { completeness: percent(required.filter(Boolean).length, required.length), provenance: percent(dated, engagements.length), issues }
}

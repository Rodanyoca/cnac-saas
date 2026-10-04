import type { V1Row } from "@/lib/competitions/v1-model"

export type AthleteTeamHistoryRow = {
  id_equipe_nationale: string
  nom_equipe_nationale: string
  role_equipe: string
  date_debut: string
  date_fin: string
  statut: string
}

export type AthleteParticipationHistoryRow = {
  id: string
  idSelection: string
  competition: string
  edition: string
  discipline: string
  equipe: string
  campagne: string
  statutSelection: string
  dateSelection: string
  effective: boolean
  statutParticipation: string
  dateParticipation: string
}

export type AthleteSportHistory = {
  teams: AthleteTeamHistoryRow[]
  participations: AthleteParticipationHistoryRow[]
}

type Graph = {
  EQUIPES_NATIONALES: V1Row<"EQUIPES_NATIONALES">[]
  CAMPAGNES_EQUIPES_NATIONALES: V1Row<"CAMPAGNES_EQUIPES_NATIONALES">[]
  SELECTIONS_ATHLETES: V1Row<"SELECTIONS_ATHLETES">[]
  PARTICIPATIONS_ACTEURS_COMPETITION: V1Row<"PARTICIPATIONS_ACTEURS_COMPETITION">[]
  ENGAGEMENTS_CAMPAGNES_PROGRAMMES: V1Row<"ENGAGEMENTS_CAMPAGNES_PROGRAMMES">[]
  PROGRAMMES_COMPETITION: V1Row<"PROGRAMMES_COMPETITION">[]
  COMPETITIONS: V1Row<"COMPETITIONS">[]
}

type Labels = {
  selections?: Map<string, string>
  participations?: Map<string, string>
  eventDisciplineIds?: Map<string, string>
  disciplines?: Map<string, string>
}

export function projectAthleteSportHistory(athleteId: string, graph: Graph, labels: Labels = {}): AthleteSportHistory {
  const campaignsById = new Map(graph.CAMPAGNES_EQUIPES_NATIONALES.map((row) => [row.id_campagne, row]))
  const equipesById = new Map(graph.EQUIPES_NATIONALES.map((row) => [row.id_equipe_nationale, row]))
  const engagementsById = new Map(graph.ENGAGEMENTS_CAMPAGNES_PROGRAMMES.map((row) => [row.id_engagement_campagne, row]))
  const engagedCampaignIds = new Set(graph.ENGAGEMENTS_CAMPAGNES_PROGRAMMES.map((row) => row.id_campagne).filter(Boolean))
  const programmesById = new Map(graph.PROGRAMMES_COMPETITION.map((row) => [row.id_programme_competition, row]))
  const competitionsById = new Map(graph.COMPETITIONS.map((row) => [row.id_competition, row]))
  const participationsBySelectionId = new Map<string, V1Row<"PARTICIPATIONS_ACTEURS_COMPETITION">[]>()
  const seenParticipationIds = new Set<string>()

  for (const row of graph.PARTICIPATIONS_ACTEURS_COMPETITION) {
    if (row.id_acteur_coc !== athleteId || row.id_type_acteur !== "ATHLETE" || !row.id_selection || seenParticipationIds.has(row.id_participation_acteur)) continue
    seenParticipationIds.add(row.id_participation_acteur)
    participationsBySelectionId.set(row.id_selection, [...(participationsBySelectionId.get(row.id_selection) || []), row])
  }

  const selections = graph.SELECTIONS_ATHLETES.filter((row) => row.id_athlete === athleteId)
  const teamsById = new Map<string, AthleteTeamHistoryRow>()
  for (const selection of [...selections].sort((a, b) => b.date_selection.localeCompare(a.date_selection))) {
    const campaign = campaignsById.get(selection.id_campagne)
    const team = campaign && equipesById.get(campaign.id_equipe_nationale)
    if (team && !teamsById.has(team.id_equipe_nationale)) teamsById.set(team.id_equipe_nationale, {
      id_equipe_nationale: team.id_equipe_nationale,
      nom_equipe_nationale: team.nom_equipe_nationale,
      role_equipe: "ATHLETE",
      date_debut: selection.date_selection,
      date_fin: campaign?.date_fin || "",
      statut: selection.id_statut_selection,
    })
  }

  const participations = selections.filter((selection) => engagedCampaignIds.has(selection.id_campagne)).flatMap((selection) => {
    const campaign = campaignsById.get(selection.id_campagne)
    const team = campaign && equipesById.get(campaign.id_equipe_nationale)
    const matches = participationsBySelectionId.get(selection.id_selection) || []
    const common = {
      idSelection: selection.id_selection,
      equipe: team?.nom_equipe_nationale || "",
      campagne: campaign?.nom_campagne || "",
      statutSelection: labels.selections?.get(selection.id_statut_selection) || selection.id_statut_selection,
      dateSelection: selection.date_selection,
    }
    if (!matches.length) return [{ id: `selection:${selection.id_selection}`, ...common, competition: "", edition: "", discipline: "", effective: false, statutParticipation: "", dateParticipation: "" }]
    return matches.map((participation) => {
      const engagement = engagementsById.get(participation.id_engagement_campagne)
      const programme = engagement && programmesById.get(engagement.id_programme_competition)
      const competition = programme && competitionsById.get(programme.id_competition)
      return {
        id: participation.id_participation_acteur,
        ...common,
        competition: competition?.nom_competition || "",
        edition: competition?.edition || "",
        discipline: programme ? labels.disciplines?.get(labels.eventDisciplineIds?.get(programme.id_epreuve) || "") || "" : "",
        effective: true,
        statutParticipation: labels.participations?.get(participation.id_statut_participation) || participation.id_statut_participation,
        dateParticipation: participation.date_statut,
      }
    })
  })

  return { teams: [...teamsById.values()], participations }
}

type EngagementLink = {
  id_participation_equipe: string
  id_competition: string
}

type CampaignEngagementLink = {
  id_engagement_campagne: string
  id_campagne: string
}

type AthleteDelegate = {
  id_engagement_campagne: string
  id_selection: string
  athlete_id?: string
  id_statut_participation: string
}

type StaffDelegate = {
  id_campagne: string
  id_acteur_coc: string
  id_type_acteur: string
}

const DELEGATION_ATHLETE_STATUSES = new Set(["INSCRIT", "PARTICIPANT"])

export function calculateCompetitionDelegationCounts(
  competitionIds: string[],
  engagementLinks: EngagementLink[],
  campaignEngagements: CampaignEngagementLink[],
  athleteParticipations: AthleteDelegate[],
  staffAssignments: StaffDelegate[],
) {
  const campaignByEngagement = new Map(
    campaignEngagements.map((row) => [row.id_engagement_campagne, row.id_campagne]),
  )

  return Object.fromEntries(competitionIds.map((competitionId) => {
    const engagementIds = new Set(
      engagementLinks
        .filter((row) => row.id_competition === competitionId)
        .map((row) => row.id_participation_equipe),
    )
    const campaignIds = new Set(
      [...engagementIds].map((id) => campaignByEngagement.get(id)).filter(Boolean),
    )
    const delegates = new Set<string>()

    for (const row of athleteParticipations) {
      if (engagementIds.has(row.id_engagement_campagne) && DELEGATION_ATHLETE_STATUSES.has(row.id_statut_participation)) {
        delegates.add(`ATHLETE:${row.athlete_id || row.id_selection}`)
      }
    }
    for (const row of staffAssignments) {
      if (campaignIds.has(row.id_campagne) && row.id_acteur_coc) {
        delegates.add(`${row.id_type_acteur || "STAFF"}:${row.id_acteur_coc}`)
      }
    }
    return [competitionId, delegates.size]
  }))
}

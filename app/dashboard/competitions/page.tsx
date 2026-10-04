import { canAccess } from "@/lib/auth"
import { getAthleteParticipations, getCampaignEngagements, getCompetitionReferences, getCompetitions, getTeamParticipations } from "@/lib/competitions/data"
import { getCampaignStaff } from "@/lib/equipes-nationales/data"
import { calculateCompetitionDelegationCounts } from "@/lib/competitions/delegation-counts"
import CompetitionsClient from "./competitions-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CompetitionsPage({ searchParams }: { searchParams: Promise<{ nouveau?: string }> }) {
  const { nouveau } = await searchParams
  const canEdit = await canAccess("AUT-SPT", "WRITE")
  let props: React.ComponentProps<typeof CompetitionsClient>
  try {
    const [competitions, references] = await Promise.all([
      getCompetitions(),
      getCompetitionReferences(),
    ])
    const [engagementLinksResult, engagementsResult, athletesResult, staffResult] = await Promise.allSettled([
      getTeamParticipations(),
      getCampaignEngagements(),
      getAthleteParticipations(),
      getCampaignStaff(),
    ])
    const engagementLinks = engagementLinksResult.status === "fulfilled" ? engagementLinksResult.value : []
    const engagements = engagementsResult.status === "fulfilled" ? engagementsResult.value : []
    const athletes = athletesResult.status === "fulfilled" ? athletesResult.value : []
    const staff = staffResult.status === "fulfilled" ? staffResult.value : []
    const delegationCounts = calculateCompetitionDelegationCounts(
      competitions.map((item) => item.id_competition),
      engagementLinks,
      engagements,
      athletes,
      staff,
    )
    props = { competitions, types: references.types, levels: references.levels || [], statuses: references.statuses || [], delegationCounts, canEdit, initialCreate: nouveau === "1" }
  } catch (error) {
    console.error("Chargement page Compétitions", error)
    props = { competitions: [], types: [], levels: [], statuses: [], delegationCounts: {}, canEdit, initialCreate: false, loadError: "Impossible de charger les compétitions." }
  }
  return <CompetitionsClient {...props} />
}

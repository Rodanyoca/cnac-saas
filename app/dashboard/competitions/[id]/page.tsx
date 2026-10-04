import { notFound } from "next/navigation"
import { canAccess } from "@/lib/auth"
import { getCompetitionParticipants, getCampaignEngagements, getCompetition, getCompetitionMedals, getCompetitionPrograms, getCompetitionReferences, getCompetitionResults, getEngagementReferences, getMedalReferences, getParticipationReferences, getResultReferences } from "@/lib/competitions/data"
import { getDocumentsForEntity } from "@/lib/documents/data"
import CompetitionDetailClient from "./competition-detail-client"
import { classifyDataError, competitionQuality } from "@/lib/competitions/quality"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let competition
  try {
    competition = await getCompetition(id, { bypassCache: true })
  } catch (error) {
    console.error("Chargement compétition", error)
    return <p className="p-6 text-destructive">Impossible de charger la compétition.</p>
  }
  if (!competition) notFound()

  const [canEdit, canReadDocuments] = await Promise.all([canAccess("AUT-SPT", "WRITE"), canAccess("AUT-ADM", "READ")])
  const [referencesResult, programsResult, engagementsResult, engagementRefsResult, participationsResult, participationRefsResult, resultsResult, resultRefsResult, medalsResult, medalRefsResult, documentsResult] = await Promise.allSettled([
    getCompetitionReferences(),
    getCompetitionPrograms(id, { bypassCache: true }),
    getCampaignEngagements({ competitionId: id, fresh: true }),
    getEngagementReferences(),
    getCompetitionParticipants(id, true),
    getParticipationReferences(),
    getCompetitionResults(id, true, { bypassCache: true }),
    getResultReferences(),
    getCompetitionMedals(id),
    getMedalReferences(),
    canReadDocuments ? getDocumentsForEntity("COMPETITION", id) : Promise.resolve(undefined),
  ])
  const sectionIssues = [programsResult.status === "rejected" ? classifyDataError(programsResult.reason, "programmes") : null, engagementsResult.status === "rejected" ? classifyDataError(engagementsResult.reason, "engagements") : null, participationsResult.status === "rejected" ? classifyDataError(participationsResult.reason, "participants") : null, resultsResult.status === "rejected" ? classifyDataError(resultsResult.reason, "resultats") : null, documentsResult.status === "rejected" ? classifyDataError(documentsResult.reason, "documents") : null].filter((item) => item !== null)
  const qualityReport = competitionQuality({ competition, programs: programsResult.status === "fulfilled" ? programsResult.value : [], engagements: engagementsResult.status === "fulfilled" ? engagementsResult.value : [], participations: participationsResult.status === "fulfilled" ? participationsResult.value : [], results: resultsResult.status === "fulfilled" ? resultsResult.value : [], sectionIssues, eventsAvailable: referencesResult.status === "fulfilled" && Boolean(referencesResult.value.events?.length) })

  return <CompetitionDetailClient
    competition={competition}
    qualityReport={qualityReport}
    references={referencesResult.status === "fulfilled" ? referencesResult.value : { types: [], teams: [], teamsAvailable: false }}
    programs={programsResult.status === "fulfilled" ? programsResult.value : []}
      programsError={programsResult.status === "rejected" ? "Impossible de charger les programmes." : undefined}
      engagements={engagementsResult.status === "fulfilled" ? engagementsResult.value : []}
      engagementReferences={engagementRefsResult.status === "fulfilled" ? engagementRefsResult.value : { campaigns: [], statuses: [], federations: [] }}
      engagementsError={engagementsResult.status === "rejected" ? "Impossible de charger les engagements." : undefined}
      athleteParticipations={participationsResult.status === "fulfilled" ? participationsResult.value : []}
      participationReferences={participationRefsResult.status === "fulfilled" ? participationRefsResult.value : { statuses: [], selections: [] }}
      participationsError={participationsResult.status === "rejected" || participationRefsResult.status === "rejected" ? "Impossible de charger les participants." : undefined}
      results={resultsResult.status === "fulfilled" ? resultsResult.value : []}
      resultReferences={{ ...(resultRefsResult.status === "fulfilled" ? resultRefsResult.value : { synthetics: [], units: [], decisions: [], statuses: [], federations: [] }), federations: engagementRefsResult.status === "fulfilled" ? engagementRefsResult.value.federations : [] }}
      resultsError={resultsResult.status === "rejected" || resultRefsResult.status === "rejected" ? "Impossible de charger les résultats." : undefined}
      medals={medalsResult.status === "fulfilled" ? medalsResult.value : []}
      medalReferences={medalRefsResult.status === "fulfilled" ? medalRefsResult.value : []}
      medalsError={medalsResult.status === "rejected" || medalRefsResult.status === "rejected" ? "Impossible de charger les médailles." : undefined}
    documents={documentsResult.status === "fulfilled" ? documentsResult.value : undefined}
    documentsError={documentsResult.status === "rejected" ? "Impossible de charger les documents." : undefined}
    canEdit={canEdit}
  />
}

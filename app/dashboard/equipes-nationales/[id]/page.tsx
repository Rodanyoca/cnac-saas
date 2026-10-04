import { notFound } from "next/navigation"
import { canAccess } from "@/lib/auth"
import { getCampaignReferences, getCampaignSelections, getMemberActorLabels, getNationalTeam, getNationalTeamCampaigns, getNationalTeamMembers, getNationalTeamReferences, getSelectionReferences } from "@/lib/equipes-nationales/data"
import { getDocumentsForEntity } from "@/lib/documents/data"
import { getCampaignEngagements, getCompetitionPrograms, getCompetitions } from "@/lib/competitions/data"
import Client from "./team-detail-client"
import { classifyDataError, nationalTeamQuality } from "@/lib/competitions/quality"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let team
  try { team = await getNationalTeam(id, { fresh: true }) } catch (error) {
    console.error(error)
    return <p className="p-6 text-destructive">Impossible de charger l’équipe nationale.</p>
  }
  if (!team) notFound()
  const [canEdit, canReadDocuments] = await Promise.all([canAccess("AUT-SPT", "WRITE"), canAccess("AUT-ADM", "READ")])
  const [refs, campaigns, campaignRefs, selections, selectionRefs, members, competitions, programs, engagements, documents] = await Promise.allSettled([
    getNationalTeamReferences(), getNationalTeamCampaigns(id, { fresh: true }), getCampaignReferences(), getCampaignSelections(id, { fresh: true }), getSelectionReferences(), getNationalTeamMembers(id, undefined, undefined, { fresh: true }), getCompetitions(), getCompetitionPrograms(), getCampaignEngagements({ teamId: id, fresh: true }),
    canReadDocuments ? getDocumentsForEntity("EQUIPE_NATIONALE", id) : Promise.resolve(undefined),
  ])
  const memberRows = members.status === "fulfilled" ? members.value.filter((row) => row.id_type_acteur !== "ATHLETE") : []
  const actorLabels = await getMemberActorLabels(memberRows).catch(() => ({}))
  const sectionIssues = [campaigns.status === "rejected" ? classifyDataError(campaigns.reason, "campagnes") : null, selections.status === "rejected" ? classifyDataError(selections.reason, "selections") : null, members.status === "rejected" ? classifyDataError(members.reason, "staff") : null, engagements.status === "rejected" ? classifyDataError(engagements.reason, "engagements") : null, documents.status === "rejected" ? classifyDataError(documents.reason, "documents") : null].filter((item) => item !== null)
  const qualityReport = nationalTeamQuality({ team, campaigns: campaigns.status === "fulfilled" ? campaigns.value : [], selections: selections.status === "fulfilled" ? selections.value : [], members: memberRows, engagements: engagements.status === "fulfilled" ? engagements.value : [], sectionIssues })
  return <Client campaignReferences={campaignRefs.status === "fulfilled" ? campaignRefs.value : { seasons: [], statuses: [] }} team={team} qualityReport={qualityReport} references={refs.status === "fulfilled" ? refs.value : { federations: [], sports: [], disciplines: [], ageCategories: [], roles: [], ageCategoriesAvailable: false, rolesReferentialAvailable: false }} campaigns={campaigns.status === "fulfilled" ? campaigns.value : []} campaignsError={campaigns.status === "rejected"} selections={selections.status === "fulfilled" ? selections.value : []} selectionsError={selections.status === "rejected"} selectionReferences={selectionRefs.status === "fulfilled" ? selectionRefs.value : {statuses:[],athletes:[]}} members={memberRows} actorLabels={actorLabels} membersError={members.status === "rejected"} competitions={competitions.status === "fulfilled" ? competitions.value : []} programs={programs.status === "fulfilled" ? programs.value : []} engagements={engagements.status === "fulfilled" ? engagements.value : []} engagementsError={competitions.status === "rejected" || programs.status === "rejected" || engagements.status === "rejected"} documents={documents.status === "fulfilled" ? documents.value : undefined} documentsError={documents.status === "rejected"} canEdit={canEdit} />
}

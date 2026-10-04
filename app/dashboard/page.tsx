import { ActorsSummarySection } from "@/components/dashboard/actors-summary-section"
import { ActivitiesSummarySection } from "@/components/dashboard/activities-summary-section"
import { DashboardRefreshButton } from "@/components/dashboard/dashboard-refresh-button"
import { FederationsSummarySection } from "@/components/dashboard/federations-summary-section"
import { GeneralSummarySection } from "@/components/dashboard/general-summary-section"
import { Header } from "@/components/dashboard/header"
import { TerritorialStructureSection } from "@/components/dashboard/territorial-structure-section"
import { DocumentsSummarySection } from "@/components/dashboard/documents-summary-section"
import { CompetitionsSummarySection } from "@/components/dashboard/competitions-summary-section"
import { NationalTeamsSummarySection } from "@/components/dashboard/national-teams-summary-section"
import { MedalsSummarySection } from "@/components/dashboard/medals-summary-section"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loadActorsDashboardStats } from "@/lib/acteurs/dashboard"
import { loadActivitiesDashboardStats } from "@/lib/activites/dashboard"
import { loadFederationDashboardBundle } from "@/lib/federations/dashboard"
import { loadDocumentsDashboardStats } from "@/lib/documents/dashboard"
import { loadCompetitionsDashboardStats } from "@/lib/competitions/dashboard"
import { loadNationalTeamsDashboardStats } from "@/lib/equipes-nationales/dashboard"
import { canAccess } from "@/lib/auth"
import { loadFreshDashboardSections } from "@/lib/dashboard/fresh-load"

export default async function DashboardPage() {
  const [canReadAdministration, canReadSport] = await Promise.all([canAccess("AUT-ADM", "READ"), canAccess("AUT-SPT", "READ")])
  const [federationBundle, actors, activities, competitions, nationalTeams, documents] = await loadFreshDashboardSections({
    loaders: [
      () => canReadSport ? loadFederationDashboardBundle() : Promise.resolve(undefined),
      () => canReadSport ? loadActorsDashboardStats() : Promise.resolve(undefined),
      () => canReadAdministration ? loadActivitiesDashboardStats() : Promise.resolve(undefined),
      () => canReadSport ? loadCompetitionsDashboardStats() : Promise.resolve(undefined),
      () => canReadSport ? loadNationalTeamsDashboardStats() : Promise.resolve(undefined),
      () => canReadAdministration ? loadDocumentsDashboardStats() : Promise.resolve(undefined),
    ],
  })
  const federationStats = federationBundle.status === "fulfilled" ? federationBundle.value : undefined
  const hasError = [federationBundle, actors, activities, competitions, nationalTeams, documents].some((result) => result.status === "rejected")

  return <div className="min-h-screen">
    <Header title="Tableau de bord" subtitle="Vue synthétique des données du Comité National Antidopage Congolais" />
    <main className="space-y-6 p-4 md:p-6">
      <div className="flex justify-end"><DashboardRefreshButton /></div>
      {hasError && <Alert><AlertDescription>Certaines données de synthèse sont indisponibles. Les sections disponibles restent affichées.</AlertDescription></Alert>}
      <GeneralSummarySection
        federations={federationStats?.federations}
        territorial={federationStats?.territorial}
        actors={actors.status === "fulfilled" ? actors.value : undefined}
        activities={activities.status === "fulfilled" ? activities.value : undefined}
        competitions={competitions.status === "fulfilled" ? competitions.value : undefined}
        nationalTeams={nationalTeams.status === "fulfilled" ? nationalTeams.value : undefined}
        documents={documents.status === "fulfilled" ? documents.value : undefined}
      />
      {federationStats && <FederationsSummarySection stats={federationStats.federations} />}
      {federationStats && <TerritorialStructureSection stats={federationStats.territorial} />}
      {actors.status === "fulfilled" && actors.value && <ActorsSummarySection stats={actors.value} />}
      {activities.status === "fulfilled" && activities.value && <ActivitiesSummarySection stats={activities.value} />}
      {competitions.status === "fulfilled" && competitions.value && <CompetitionsSummarySection stats={competitions.value} />}
      {competitions.status === "fulfilled" && competitions.value && <MedalsSummarySection stats={competitions.value.medals} />}
      {nationalTeams.status === "fulfilled" && nationalTeams.value && <NationalTeamsSummarySection stats={nationalTeams.value} />}
      {documents.status === "fulfilled" && documents.value && <DocumentsSummarySection stats={documents.value} />}
    </main>
  </div>
}

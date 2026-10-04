import type { ActorsDashboardStats } from "@/lib/acteurs/dashboard"
import type { ActivitiesDashboardStats } from "@/lib/activites/dashboard"
import type { FederationsDashboardStats, TerritorialDashboardStats } from "@/lib/federations/dashboard"
import type { DocumentsDashboardStats } from "@/lib/documents/dashboard"
import type { CompetitionsDashboardStats } from "@/lib/competitions/dashboard"
import type { NationalTeamsDashboardStats } from "@/lib/equipes-nationales/dashboard"

const number = new Intl.NumberFormat("fr-FR")

export function GeneralSummarySection({ federations, territorial, actors, activities, competitions, nationalTeams, documents }: {
  federations?: FederationsDashboardStats; territorial?: TerritorialDashboardStats; actors?: ActorsDashboardStats
  activities?: ActivitiesDashboardStats; competitions?: CompetitionsDashboardStats
  nationalTeams?: NationalTeamsDashboardStats; documents?: DocumentsDashboardStats
}) {
  return <section aria-labelledby="summary-title" className="space-y-4">
    <h2 id="summary-title" className="flex items-center gap-3 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground before:h-0.5 before:w-8 before:bg-secondary">Synthèse générale</h2>
    <div className="grid overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-[0_12px_32px_rgba(7,25,54,.045)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 [&>div]:transition-colors [&>div]:duration-200 [&>div:hover]:bg-primary/[.025]">
      {federations && <div className="min-h-40 space-y-3 p-6"><p className="text-sm font-medium text-muted-foreground">Fédérations</p><p className="text-4xl font-semibold tracking-tight tabular-nums">{number.format(federations.totalFederations)}</p><p className="max-w-xs text-sm text-muted-foreground">Fédérations enregistrées et statuts de reconnaissance</p></div>}
      {territorial && <div className="min-h-40 space-y-3 border-t p-6 sm:border-l sm:border-t-0"><p className="text-sm font-medium text-muted-foreground">Structures territoriales</p><p className="text-4xl font-semibold tracking-tight tabular-nums">{number.format(territorial.totalStructures)}</p><p className="max-w-xs text-sm text-muted-foreground">Ligues, ententes, cercles et clubs enregistrés</p></div>}
      {actors && <div className="min-h-40 space-y-3 border-t p-6 lg:border-l lg:border-t-0"><p className="text-sm font-medium text-muted-foreground">Acteurs</p><p className="text-4xl font-semibold tracking-tight tabular-nums">{number.format(actors.totalActors)}</p><p className="max-w-xs text-sm text-muted-foreground">Athlètes, coachs, officiels, médecins et arbitres</p></div>}
      {activities && <div className="min-h-40 space-y-3 border-t p-6 sm:border-l lg:border-t-0"><p className="text-sm font-medium text-muted-foreground">Activités</p><p className="text-4xl font-semibold tracking-tight tabular-nums">{number.format(activities.totalActivities)}</p><p className="max-w-xs text-sm text-muted-foreground">Activités institutionnelles et sportives enregistrées</p></div>}
      {competitions && <div className="min-h-40 space-y-3 border-t p-6 sm:border-l lg:border-t-0"><p className="text-sm font-medium text-muted-foreground">Compétitions</p><p className="text-4xl font-semibold tracking-tight tabular-nums">{number.format(competitions.totalCompetitions)}</p><p className="max-w-xs text-sm text-muted-foreground">{number.format(competitions.aVenir)} à venir · {number.format(competitions.enCours)} en cours · {number.format(competitions.terminees)} terminées</p></div>}
      {nationalTeams && <div className="min-h-40 space-y-3 border-t p-6 sm:border-l lg:border-t-0"><p className="text-sm font-medium text-muted-foreground">Équipes nationales</p><p className="text-4xl font-semibold tracking-tight tabular-nums">{number.format(nationalTeams.totalTeams)}</p><p className="max-w-xs text-sm text-muted-foreground">{number.format(nationalTeams.activeTeams)} actives · {number.format(nationalTeams.totalMembers)} membres</p></div>}
      {documents && <div className="min-h-40 space-y-3 border-t p-6 sm:border-l lg:border-t-0"><p className="text-sm font-medium text-muted-foreground">Documents</p><p className="text-4xl font-semibold tracking-tight tabular-nums">{number.format(documents.totalDocuments)}</p><p className="max-w-xs text-sm text-muted-foreground">{number.format(documents.avecFichier)} avec fichier · {number.format(documents.sansFichier)} sans fichier</p></div>}
    </div>
  </section>
}

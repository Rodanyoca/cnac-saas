import { Header } from "@/components/dashboard/header"
import { CnacDashboardOverview } from "@/components/dashboard/cnac-dashboard-overview"
import { canAccess } from "@/lib/auth"
import { loadCnacDashboard } from "@/lib/dashboard/cnac-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [canReadSport, canRefresh] = await Promise.all([
    canAccess("AUT-SPT", "READ"),
    Promise.all((["AUT-ADM", "AUT-SPT", "AUT-COM"] as const).map(block => canAccess(block, "WRITE"))).then(rights => rights.some(Boolean)),
  ])
  const data = canReadSport ? await loadCnacDashboard() : undefined
  return <div className="min-h-screen"><Header title="Tableau de bord" subtitle="Référentiel fédéral, structures territoriales et acteurs CNAC" />{data ? <CnacDashboardOverview {...data} canRefresh={canRefresh} loadedAt={new Date().toISOString()} /> : <main className="p-4 md:p-6"><p className="text-sm text-muted-foreground">Aucun indicateur disponible avec vos autorisations actuelles.</p></main>}</div>
}

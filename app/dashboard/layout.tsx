import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ServiceUnavailable } from "@/components/dashboard/service-unavailable"
import { getNavigationAccess, getSession } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session
  try { session = await getSession() } catch { return <DashboardShell unavailable><ServiceUnavailable /></DashboardShell> }
  if (!session) redirect("/login")
  if (session.doitChangerMotDePasse) redirect("/activation")
  let access
  try { access = await getNavigationAccess(session) } catch { return <DashboardShell unavailable><ServiceUnavailable /></DashboardShell> }
  return <DashboardShell access={access} isSuperAdmin={session.estSuperAdmin === true}>{children}</DashboardShell>
}

import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { NavigationProvider } from "@/components/dashboard/navigation-provider"
import { getNavigationAccess, getSession } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession().catch(() => redirect("/service-indisponible"))
  if (!session) redirect("/login")
  if (session.doitChangerMotDePasse) redirect("/activation")
  const access = await getNavigationAccess(session).catch(() => redirect("/service-indisponible"))
  return (
    <NavigationProvider><div className="flex h-screen bg-background overflow-hidden">
      <Sidebar initialAccess={access} initialIsSuperAdmin={session?.estSuperAdmin === true} />
      <main className="min-w-0 flex-1 overflow-y-auto no-scrollbar">
        {children}
      </main>
    </div></NavigationProvider>
  )
}

import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar initialAccess={access} initialIsSuperAdmin={session?.estSuperAdmin === true} />
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {children}
      </main>
    </div>
  )
}

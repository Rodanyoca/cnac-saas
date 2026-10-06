import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { NavigationProvider } from "./navigation-provider"

export function DashboardShell({ children, access = {}, isSuperAdmin = false, unavailable = false }: { children: ReactNode; access?: Record<string, boolean>; isSuperAdmin?: boolean; unavailable?: boolean }) {
  return <NavigationProvider><div className="flex h-screen overflow-hidden bg-background">
    <Sidebar initialAccess={access} initialIsSuperAdmin={isSuperAdmin} unavailable={unavailable} />
    <main className="min-w-0 flex-1 overflow-y-auto no-scrollbar">{children}</main>
  </div></NavigationProvider>
}

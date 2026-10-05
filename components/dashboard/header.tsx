"use client"

import { apiFetch } from "@/lib/api/client"

import { useState } from "react"
import { LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"
import { useDashboardNavigation } from "./navigation-provider"

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState("")
  const navigation = useDashboardNavigation()

  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-r-2 border-b-border/80 border-r-primary bg-background/90 px-4 py-3 shadow-[0_10px_30px_rgba(2,12,23,0.18)] backdrop-blur-xl sm:flex-nowrap sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {navigation && <Button variant="ghost" size="icon" aria-label="Ouvrir la navigation" aria-expanded={navigation.mobileOpen} aria-controls="dashboard-navigation" onClick={navigation.toggleMobile} className="lg:hidden border border-white/15 bg-white/[0.04] font-medium text-sidebar-muted hover:border-primary/50 hover:bg-primary/10 hover:text-primary">
          <Menu className="h-5 w-5" />
        </Button>}
        <div className="min-w-0 border-l-2 border-primary pl-3">
          <h1 className="truncate text-xl font-bold tracking-[-0.02em] text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex max-w-full flex-wrap items-center gap-4 sm:flex-nowrap">
        {actions}
        {logoutError && <p role="alert" className="text-sm text-destructive">{logoutError}</p>}
        <Button
          disabled={loggingOut}
          variant="outline"
          aria-label="Déconnexion"
          className="border-white/15 bg-white/[0.04] font-medium hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          onClick={async () => {
            setLoggingOut(true)
            setLogoutError("")
            try {
              const response = await apiFetch("/api/auth/logout", { method: "POST" })
              if (!response.ok) throw new Error()
              window.location.replace("/login")
            } catch { setLogoutError("Déconnexion impossible. Réessayez."); setLoggingOut(false) }
          }}
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  )
}

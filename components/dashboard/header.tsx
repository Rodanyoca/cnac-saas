"use client"

import { apiFetch } from "@/lib/api/client"

import { useState } from "react"
import { LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState("")

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-border/70 bg-card/80 px-4 shadow-[0_1px_18px_rgba(7,25,54,.04)] backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden border border-border/70 bg-background/60 text-foreground hover:bg-sidebar-accent hover:text-sidebar-primary">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-sans text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {actions}
        {logoutError && <p role="alert" className="text-sm text-destructive">{logoutError}</p>}
        <Button
          disabled={loggingOut}
          variant="outline"
          size="sm"
          className="gap-2 border-primary/25 bg-background/60 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
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
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  )
}

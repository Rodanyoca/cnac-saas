"use client"

import { apiFetch } from "@/lib/api/client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardRefreshButton() {
  const router = useRouter()
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }, [])

  async function refresh() {
    setState("loading")
    try {
      const response = await apiFetch("/api/dashboard/refresh", { method: "POST", cache: "no-store" })
      if (!response.ok) throw new Error("Actualisation impossible")
      router.refresh()
      setState("success")
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setState("idle"), 2500)
    } catch {
      setState("error")
    }
  }

  return <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={refresh} disabled={state === "loading"} className="gap-2 border-border/80 bg-card/80 shadow-[0_6px_16px_rgba(7,25,54,0.06)] hover:border-primary/40 hover:text-primary">
      {state === "success" ? <Check className="h-4 w-4" /> : <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} />}
      <span className="hidden sm:inline">{state === "loading" ? "Actualisation…" : state === "success" ? "Actualisé" : "Actualiser"}</span>
    </Button>
    <span aria-live="polite" className={`hidden text-xs sm:inline ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>{state === "error" ? "Échec de l’actualisation" : ""}</span>
  </div>
}

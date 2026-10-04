"use client"

import { apiFetch } from "@/lib/api/client"

import Link from "next/link"
import { Eye } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateFr } from "@/lib/competitions/format"
import type { AthleteSportHistory } from "@/lib/athletes/sport-history"

const missing = (value: string, feminine = false) => value || `Non renseign${feminine ? "ée" : "é"}`

export function useAthleteSportHistory(athleteId: string) {
  const [data, setData] = useState<AthleteSportHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const load = useCallback(() => {
    setLoading(true); setError(false)
    apiFetch(`/api/athletes/${encodeURIComponent(athleteId)}/sport-history`, { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(); setData(body) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [athleteId])
  useEffect(load, [load])
  return { data, loading, error, retry: load }
}

type State = ReturnType<typeof useAthleteSportHistory>

function LoadState({ state, label }: { state: State; label: string }) {
  if (state.loading) return <p className="p-5 text-sm text-muted-foreground">Chargement {label}…</p>
  if (state.error) return <div className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"><p>Impossible de charger {label}.</p><Button className="mt-3" size="sm" variant="outline" onClick={state.retry}>Réessayer</Button></div>
  return null
}

export function AthleteNationalTeams({ state }: { state: State }) {
  if (state.loading || state.error) return <LoadState state={state} label="les équipes nationales" />
  const rows = state.data?.teams || []
  const action = (row: AthleteSportHistory["teams"][number]) => <Button asChild variant="ghost" size="icon"><Link href={`/dashboard/equipes-nationales/${row.id_equipe_nationale}`} aria-label={`Voir ${row.nom_equipe_nationale}`}><Eye className="h-4 w-4" /></Link></Button>
  return <div className="min-w-0 overflow-hidden rounded-lg border">
    <div className="hidden lg:block"><Table><TableHeader><TableRow><TableHead>Équipe nationale</TableHead><TableHead>Rôle</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id_equipe_nationale}><TableCell className="whitespace-normal font-medium">{missing(row.nom_equipe_nationale)}</TableCell><TableCell>{row.role_equipe}</TableCell><TableCell>{row.date_debut ? formatDateFr(row.date_debut) : "Non renseignée"}</TableCell><TableCell>{row.date_fin ? formatDateFr(row.date_fin) : "Non renseignée"}</TableCell><TableCell><Badge variant="outline">{missing(row.statut)}</Badge></TableCell><TableCell>{action(row)}</TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucune appartenance à une équipe nationale.</TableCell></TableRow>}</TableBody></Table></div>
    <div className="grid min-w-0 gap-3 p-3 sm:grid-cols-2 lg:hidden">{rows.map((row) => <article key={row.id_equipe_nationale} className="min-w-0 rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><p className="break-words font-medium">{missing(row.nom_equipe_nationale)}</p>{action(row)}</div><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Rôle</dt><dd>{row.role_equipe}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Début</dt><dd>{row.date_debut ? formatDateFr(row.date_debut) : "Non renseignée"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Fin</dt><dd>{row.date_fin ? formatDateFr(row.date_fin) : "Non renseignée"}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Statut</dt><dd><Badge variant="outline">{missing(row.statut)}</Badge></dd></div></dl></article>)}{!rows.length && <p className="py-10 text-center text-sm text-muted-foreground sm:col-span-2">Aucune appartenance à une équipe nationale.</p>}</div>
  </div>
}

const fields = [
  ["competition", "Compétition"], ["edition", "Édition"], ["discipline", "Discipline"], ["equipe", "Équipe nationale"], ["campagne", "Campagne"], ["statutSelection", "Statut de sélection"], ["dateSelection", "Date de sélection"], ["effective", "Participation effective"], ["statutParticipation", "Statut de participation"], ["dateParticipation", "Date de participation"],
] as const

export function AthleteSelections({ state }: { state: State }) {
  if (state.loading || state.error) return <LoadState state={state} label="les sélections et participations" />
  const rows = state.data?.participations || []
  return <div className="min-w-0">
    <section className="min-w-0 space-y-3" aria-labelledby="athlete-participations-title"><div><h3 id="athlete-participations-title" className="font-semibold">Participations effectives aux compétitions</h3><p className="text-sm text-muted-foreground">Une sélection reste visible même si aucune participation effective n’est enregistrée.</p></div>
      <div className="grid min-w-0 gap-2">{rows.map((row) => <article key={row.id} className="w-full min-w-0 rounded-lg border bg-card p-3"><dl className="grid min-w-0 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-5">{fields.map(([key, label]) => { const raw = row[key]; const value = key === "effective" ? (raw ? "OUI" : "NON") : key === "dateSelection" || key === "dateParticipation" ? (raw ? formatDateFr(String(raw)) : "Non renseignée") : missing(String(raw || ""), key === "competition" || key === "edition"); return <div key={key} className="flex min-w-0 items-start justify-between gap-3 border-b border-border/40 pb-1.5 sm:block sm:border-b-0 sm:pb-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-right font-medium sm:mt-0.5 sm:text-left">{key === "effective" ? <Badge variant={raw ? "default" : "outline"}>{value}</Badge> : value}</dd></div> })}</dl></article>)}{!rows.length && <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Aucune campagne engagée pour cet athlète.</p>}</div>
    </section>
  </div>
}

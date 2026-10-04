"use client"

import { apiFetch } from "@/lib/api/client"

import Link from "next/link"
import { Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPeriod } from "@/lib/activites/format"
import type { Activity, ActivityEntity, ActivityParticipant, ActivityReferences } from "@/lib/activites/types"

type Row = { activity: Activity; participation: ActivityParticipant; entityRelation?: ActivityEntity }

export function ActorActivities({ actorId }: { actorId: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [refs, setRefs] = useState<ActivityReferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    apiFetch(`/api/activites/acteurs/${encodeURIComponent(actorId)}`, { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(); if (active) { setRows(data.rows); setRefs(data.references) } })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [actorId])

  if (loading) return <p className="p-5 text-sm text-muted-foreground">Chargement des activités…</p>
  if (error || !refs) return <p className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Impossible de charger les activités.</p>
  const name = (items: ActivityReferences["types"], id: string) => items.find((item) => item.id === id)?.label || "—"
  return <div className="min-w-0 rounded-lg border"><Table><TableHeader><TableRow><TableHead>Activité</TableHead><TableHead className="hidden md:table-cell">Entité</TableHead><TableHead className="hidden lg:table-cell">Rôle</TableHead><TableHead>Période</TableHead><TableHead /></TableRow></TableHeader><TableBody>{rows.sort((a, b) => b.activity.date_debut.localeCompare(a.activity.date_debut)).map(({ activity, participation, entityRelation }) => <TableRow key={participation.id_participation}><TableCell className="max-w-64 whitespace-normal font-medium">{activity.nom_activite}</TableCell><TableCell className="hidden whitespace-normal md:table-cell">{entityRelation?name(refs.entites,entityRelation.id_entite):"—"}</TableCell><TableCell className="hidden whitespace-normal lg:table-cell">{entityRelation?name(refs.entityRoles,entityRelation.id_role_entite_activite):"—"}</TableCell><TableCell>{formatPeriod(activity.date_debut, activity.date_fin)}</TableCell><TableCell><Button asChild variant="ghost" size="icon"><Link href={`/dashboard/activites/${activity.id_activite}`} aria-label={`Voir ${activity.nom_activite}`} title="Voir"><Eye className="h-4 w-4" /></Link></Button></TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Aucune activité enregistrée.</TableCell></TableRow>}</TableBody></Table></div>
}

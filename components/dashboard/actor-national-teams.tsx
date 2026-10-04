"use client"

import { apiFetch } from "@/lib/api/client"

import Link from "next/link"
import { Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateFr } from "@/lib/competitions/format"
import type { NationalTeam, NationalTeamMember } from "@/lib/equipes-nationales/types"

type Row = { team: NationalTeam; member: NationalTeamMember }

export function ActorNationalTeams({ actorId }: { actorId: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    apiFetch(`/api/equipes-nationales/acteurs/${encodeURIComponent(actorId)}`, { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(); if (active) setRows(data.rows) })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [actorId])

  if (loading) return <p className="p-5 text-sm text-muted-foreground">Chargement des équipes nationales…</p>
  if (error) return <p className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Impossible de charger les équipes nationales.</p>
  return <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Équipe nationale</TableHead><TableHead>Rôle</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{rows.sort((a, b) => b.member.date_debut.localeCompare(a.member.date_debut)).map(({ team, member }) => <TableRow key={member.id_membre_equipe_nationale}><TableCell className="font-medium">{team.nom_equipe_nationale}</TableCell><TableCell>{member.role_equipe}</TableCell><TableCell>{formatDateFr(member.date_debut)}</TableCell><TableCell>{formatDateFr(member.date_fin)}</TableCell><TableCell><Badge variant="outline">{member.statut}</Badge></TableCell><TableCell><Button asChild variant="ghost" size="icon"><Link href={`/dashboard/equipes-nationales/${team.id_equipe_nationale}`} aria-label={`Voir ${team.nom_equipe_nationale}`} title="Voir"><Eye className="h-4 w-4" /></Link></Button></TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucune appartenance à une équipe nationale.</TableCell></TableRow>}</TableBody></Table></div>
}

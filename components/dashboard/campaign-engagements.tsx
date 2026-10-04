"use client"

import { apiFetch } from "@/lib/api/client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ActorSearchSelect } from "@/components/dashboard/actor-search-select"
import type { CampaignEngagement, CompetitionProgram, CompetitionReferences } from "@/lib/competitions/types"

type Refs = { campaigns: { id: string; label: string; teamId: string; teamName: string; federationId: string; dateStart: string; dateEnd: string; status: string }[]; statuses: { id: string; label: string }[]; federations: { id: string; label: string }[] }
const empty = { id_programme_competition: "", id_campagne: "", id_statut_engagement: "", date_engagement: "", observation: "" }
type CampaignEngagementForm = typeof empty

function campaignEngagementToForm(row?: Partial<CampaignEngagement>): CampaignEngagementForm {
  if (!row) return { ...empty }
  return {
    id_programme_competition: row.id_programme_competition ?? "",
    id_campagne: row.id_campagne ?? "",
    id_statut_engagement: row.id_statut_engagement ?? "",
    date_engagement: row.date_engagement ?? "",
    observation: row.observation ?? "",
  }
}

export function CampaignEngagements({ competitionId, programs, initialRows, references, competitionReferences, canEdit }: { competitionId: string; programs: CompetitionProgram[]; initialRows: CampaignEngagement[]; references: Refs; competitionReferences: CompetitionReferences; canEdit: boolean }) {
  const [rows, setRows] = useState(initialRows), [open, setOpen] = useState(false), [editing, setEditing] = useState(""), [form, setForm] = useState(empty), [saving, setSaving] = useState(false)
  const show = (row?: CampaignEngagement) => { setEditing(row?.id_engagement_campagne || ""); setForm(campaignEngagementToForm(row)); setOpen(true) }
  const campaign = references.campaigns.find(item => item.id === form.id_campagne)
  const campaignOptions = references.campaigns.map(item => {
    const federation = references.federations.find(row => row.id === item.federationId)?.label || item.federationId || "Fédération non renseignée"
    const period = `${item.dateStart || "date inconnue"} — ${item.dateEnd || "en cours"}`
    return { id: item.id, label: `${item.label} · ${item.teamName || item.teamId} · ${federation} · ${period}` }
  })
  const context = (programId: string, federationId?: string) => {
    const program = programs.find(item => item.id_programme_competition === programId)
    const event = competitionReferences.events?.find(item => item.id === program?.id_epreuve)
    const sport = competitionReferences.sports?.find(item => item.id === event?.sportId)?.label || event?.sportId || "—"
    const resolvedFederationId = event?.federationId || federationId
    const federation = references.federations.find(item => item.id === resolvedFederationId)?.label || resolvedFederationId || "—"
    return { program, sport, federation, programName: event?.label || "Programme non renseigné" }
  }
  async function save() { setSaving(true); try { const response = await apiFetch(`/api/competitions/${encodeURIComponent(competitionId)}/engagements`, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing, row: form }) }), result = await response.json(); if (!response.ok) throw new Error(result.error); setRows(current => editing ? current.map(item => item.id_engagement_campagne === editing ? result.row : item) : [...current, result.row]); setOpen(false); toast.success(editing ? "Engagement modifié." : "Campagne engagée.") } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } finally { setSaving(false) } }

  return <>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Engagements des campagnes</h3><p className="text-sm text-muted-foreground">Une équipe permanente ne participe jamais directement.</p></div>{canEdit && <Button disabled={!programs.length || !references.campaigns.length || !references.statuses.length} onClick={() => show()}><Plus className="mr-2 h-4 w-4" />Engager</Button>}</div>
      {(!references.statuses.length || !references.campaigns.length) && <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Campagnes ou statuts d’engagement indisponibles : aucune écriture n’est possible.</p>}
      <div className="min-w-0 overflow-hidden rounded-lg border"><Table><TableHeader><TableRow><TableHead>Équipe / campagne</TableHead><TableHead>Sport</TableHead><TableHead className="hidden md:table-cell">Fédération</TableHead><TableHead className="hidden lg:table-cell">Période</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader><TableBody>{rows.map(row => { const details = context(row.id_programme_competition, row.id_federation_responsable || references.campaigns.find(item => item.id === row.id_campagne)?.federationId); return <TableRow key={row.id_engagement_campagne}><TableCell className="max-w-64 whitespace-normal"><p className="font-medium">{row.nom_equipe_nationale || row.id_equipe_nationale}</p><p className="text-xs text-muted-foreground">{row.nom_campagne || row.id_campagne}</p></TableCell><TableCell className="max-w-48 whitespace-normal">{details.sport}</TableCell><TableCell className="hidden max-w-48 whitespace-normal md:table-cell">{details.federation}</TableCell><TableCell className="hidden whitespace-normal lg:table-cell">{details.program?.date_debut || "—"} — {details.program?.date_fin || "—"}</TableCell><TableCell><Badge variant="outline">{references.statuses.find(item => item.id === row.id_statut_engagement)?.label || row.id_statut_engagement || "—"}</Badge></TableCell></TableRow> })}{!rows.length && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Aucune campagne engagée.</TableCell></TableRow>}</TableBody></Table></div>
    </div>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{editing ? "Modifier l’engagement" : "Engager une campagne"}</SheetTitle><SheetDescription>Le programme et la campagne deviennent immuables après création.</SheetDescription></SheetHeader><div className="space-y-4 px-4">
      <Field label="Programme *"><Select disabled={Boolean(editing)} value={form.id_programme_competition} onValueChange={value => setForm({ ...form, id_programme_competition: value })}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{programs.map(item => { const details = context(item.id_programme_competition); return <SelectItem key={item.id_programme_competition} value={item.id_programme_competition}>{details.sport} · {details.programName}</SelectItem> })}</SelectContent></Select></Field>
      <Field label="Campagne *"><ActorSearchSelect disabled={Boolean(editing)} value={form.id_campagne} onValueChange={value => setForm({ ...form, id_campagne: value })} options={campaignOptions} placeholder="Rechercher une campagne ou une équipe" /></Field>{campaign && <p className="text-xs text-muted-foreground">Équipe : {campaign.teamName || campaign.teamId} · Campagne : {campaign.dateStart || "—"} — {campaign.dateEnd || "en cours"}</p>}
      <Field label="Statut *"><Select value={form.id_statut_engagement} onValueChange={value => setForm({ ...form, id_statut_engagement: value })}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{references.statuses.map(item => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Date d’engagement *"><Input type="date" value={form.date_engagement} onChange={event => setForm({ ...form, date_engagement: event.target.value })} /></Field>
      <Field label="Observation"><Textarea value={form.observation} onChange={event => setForm({ ...form, observation: event.target.value })} /></Field><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving} onClick={save}>Enregistrer</Button></div>
    </div></SheetContent></Sheet>
  </>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }

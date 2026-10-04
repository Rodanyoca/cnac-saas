"use client"

import { apiFetch } from "@/lib/api/client"

import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ActorSearchSelect } from "@/components/dashboard/actor-search-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { AthleteSelection, NationalTeamCampaign } from "@/lib/equipes-nationales/types"
import { selectionCampaignDateError } from "@/lib/equipes-nationales/validation"

type Option = { id: string; label: string }
const empty = { id_campagne: "", id_athlete: "", id_poste: "", id_categorie_poids: "", id_grade_sportif: "", date_selection: "", id_statut_selection: "", observation: "" }

export function CampaignSelections({ teamId, campaigns, initialRows, references, canEdit }: { teamId: string; campaigns: NationalTeamCampaign[]; initialRows: AthleteSelection[]; references: { statuses: Option[]; athletes: Option[] }; canEdit: boolean }) {
  const [rows, setRows] = useState(initialRows), [open, setOpen] = useState(false), [editing, setEditing] = useState(""), [form, setForm] = useState(empty), [saving, setSaving] = useState(false)
  const campaign = campaigns.find((item) => item.id_campagne === form.id_campagne)
  const chronologicalCampaigns = useMemo(() => [...campaigns].sort((a, b) => (a.date_debut || "9999-12-31").localeCompare(b.date_debut || "9999-12-31") || a.nom_campagne.localeCompare(b.nom_campagne, "fr", { sensitivity: "base" })), [campaigns])
  const sortedRows = useMemo(() => [...rows].sort((a, b) => (a.athlete_label || a.id_athlete).localeCompare(b.athlete_label || b.id_athlete, "fr", { sensitivity: "base" })), [rows])
  const athleteOptions = useMemo(() => [...references.athletes].sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" })), [references.athletes])
  const dateError = campaign ? selectionCampaignDateError(form.date_selection, campaign.date_debut, campaign.date_fin) : ""
  const incomplete = !form.id_campagne || !form.id_athlete || !form.id_statut_selection || !form.date_selection
  const show = (row?: AthleteSelection) => { setEditing(row?.id_selection || ""); setForm(row ? { ...empty, ...row } : empty); setOpen(true) }

  async function save() {
    setSaving(true)
    try {
      const response = await apiFetch(`/api/equipes-nationales/${encodeURIComponent(teamId)}/selections`, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing, row: form }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setRows((current) => editing ? current.map((item) => item.id_selection === editing ? { ...item, ...result.row } : item) : [...current, result.row])
      setOpen(false)
      toast.success(editing ? "Sélection modifiée." : "Athlète sélectionné.")
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) }
    finally { setSaving(false) }
  }

  return <>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Sélections d’athlètes</h3><p className="text-sm text-muted-foreground">Une sélection ne prouve jamais une participation.</p></div>{canEdit && <Button disabled={!campaigns.length || !references.statuses.length} onClick={() => show()}><Plus className="mr-2 h-4 w-4" />Ajouter</Button>}</div>
      <div className="min-w-0 overflow-hidden rounded-lg border"><Table><TableHeader><TableRow><TableHead>Athlète</TableHead><TableHead className="hidden sm:table-cell">Campagne</TableHead><TableHead>Statut</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead className="hidden lg:table-cell">Observation</TableHead></TableRow></TableHeader><TableBody>{sortedRows.map((row) => <TableRow key={row.id_selection}><TableCell className="max-w-52 whitespace-normal"><p className="break-words font-medium">{row.athlete_label || row.id_athlete}</p><p className="font-mono text-xs text-muted-foreground sm:hidden">{row.campaign_label || row.id_campagne}</p></TableCell><TableCell className="hidden max-w-52 whitespace-normal sm:table-cell">{row.campaign_label || row.id_campagne}</TableCell><TableCell><Badge variant="outline">{row.id_statut_selection}</Badge></TableCell><TableCell className="hidden md:table-cell">{row.date_selection || "—"}</TableCell><TableCell className="hidden max-w-64 whitespace-normal lg:table-cell">{row.observation || "—"}</TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Aucune sélection enregistrée.</TableCell></TableRow>}</TableBody></Table></div>
    </div>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{editing ? "Modifier la sélection" : "Ajouter une sélection"}</SheetTitle><SheetDescription>La campagne et l’athlète deviennent immuables après création.</SheetDescription></SheetHeader><div className="space-y-4 px-4">
      <Field label="Campagne *"><Select disabled={Boolean(editing)} value={form.id_campagne} onValueChange={(value) => { const selected = campaigns.find((item) => item.id_campagne === value); setForm({ ...form, id_campagne: value, date_selection: selected?.date_debut || "" }) }}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{chronologicalCampaigns.map((item) => <SelectItem key={item.id_campagne} value={item.id_campagne}>{item.nom_campagne}</SelectItem>)}</SelectContent></Select>{campaign && <p className="text-xs text-muted-foreground">Période : {campaign.date_debut || "—"} — {campaign.date_fin || "—"}</p>}</Field>
      <Field label="Athlète *"><ActorSearchSelect disabled={Boolean(editing)} value={form.id_athlete} onValueChange={(value) => setForm({ ...form, id_athlete: value })} options={athleteOptions} placeholder="Rechercher un athlète" /></Field>
      <Field label="Statut *"><Select value={form.id_statut_selection} onValueChange={(value) => setForm({ ...form, id_statut_selection: value })}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{references.statuses.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Date *"><Input type="date" min={campaign?.date_debut || undefined} max={campaign?.date_fin || undefined} value={form.date_selection} onChange={(event) => setForm({ ...form, date_selection: event.target.value })} />{dateError && <p className="text-xs text-destructive">{dateError}</p>}</Field>
      <Field label="Observation"><Textarea value={form.observation} onChange={(event) => setForm({ ...form, observation: event.target.value })} /></Field>
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving || incomplete || Boolean(dateError)} onClick={save}>Enregistrer</Button></div>
    </div></SheetContent></Sheet>
  </>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }

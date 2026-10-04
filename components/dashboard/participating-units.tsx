"use client"

import { apiFetch } from "@/lib/api/client"

import { useEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { loadCompetitionUnits } from "@/lib/competitions/client-units"
import type { AthleteParticipation, CampaignEngagement, CompetitionProgram, CompetitionReferences, ParticipatingUnit } from "@/lib/competitions/types"

const empty = { id_engagement_campagne: "", type_unite: "INDIVIDUEL", id_participation_acteur: "", nom_unite: "", membres: [] as string[], observation: "" }

export function ParticipatingUnits({ competitionId, engagements, participants, programs, references, canEdit }: { competitionId: string; engagements: CampaignEngagement[]; participants: AthleteParticipation[]; programs: CompetitionProgram[]; references: CompetitionReferences; canEdit: boolean }) {
  const [rows, setRows] = useState<ParticipatingUnit[]>([]), [open, setOpen] = useState(false), [editing, setEditing] = useState(""), [form, setForm] = useState(empty), [saving, setSaving] = useState(false)
  async function load(refresh = false) { try { setRows(await loadCompetitionUnits(competitionId, refresh)) } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } }
  useEffect(() => { let active = true; void loadCompetitionUnits(competitionId).then(rows => { if (active) setRows(rows) }).catch(error => toast.error(error instanceof Error ? error.message : String(error))); return () => { active = false } }, [competitionId])
  const eligible = participants.filter(item => item.id_engagement_campagne === form.id_engagement_campagne && item.id_statut_participation === "PARTICIPANT")
  const context = (engagement?: CampaignEngagement) => {
    const program = programs.find(item => item.id_programme_competition === engagement?.id_programme_competition)
    const event = references.events?.find(item => item.id === program?.id_epreuve)
    const sport = references.sports?.find(item => item.id === event?.sportId)?.label || event?.sportId || "—"
    const federationId = event?.federationId || engagement?.id_federation_responsable
    const federation = references.federations?.find(item => item.id === federationId)?.label || federationId || "—"
    return { program, sport, federation }
  }
  function show(row?: ParticipatingUnit) { setEditing(row?.id_unite_participante || ""); setForm(row ? { id_engagement_campagne: row.id_engagement_campagne, type_unite: row.type_unite, id_participation_acteur: row.id_participation_acteur, nom_unite: row.nom_unite, membres: row.membres || [], observation: row.observation } : empty); setOpen(true) }
  async function save() { setSaving(true); try { const response = await apiFetch(`/api/competitions/${encodeURIComponent(competitionId)}/unites`, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing, row: form }) }), payload = await response.json(); if (!response.ok) throw new Error(payload.error); setOpen(false); setEditing(""); setForm(empty); await load(true); toast.success(editing ? "Unité participante modifiée." : "Unité participante créée.") } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } finally { setSaving(false) } }

  return <>
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-[0_10px_30px_rgba(7,25,54,0.12)] sm:p-5">
      <div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-foreground">Unités engagées</h3><p className="text-sm text-muted-foreground">Deux formes uniquement : individuel ou équipe.</p></div>{canEdit && <Button onClick={() => show()}><Plus className="mr-2 h-4 w-4" />Ajouter une unité</Button>}</div>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-[0_10px_28px_rgba(7,25,54,.04)]"><Table><TableHeader><TableRow className="bg-secondary/80 hover:bg-secondary/80"><TableHead>Unité</TableHead><TableHead>Campagne</TableHead><TableHead className="hidden md:table-cell">Composition</TableHead><TableHead>Sport</TableHead><TableHead className="hidden lg:table-cell">Fédération</TableHead><TableHead className="hidden xl:table-cell">Période</TableHead>{canEdit && <TableHead className="w-12" />}</TableRow></TableHeader><TableBody>{rows.map(item => { const engagement = engagements.find(row => row.id_engagement_campagne === item.id_engagement_campagne), details = context(engagement); return <TableRow key={item.id_unite_participante}><TableCell className="font-medium text-foreground">{item.nom_unite || item.composition?.[0] || item.id_unite_participante}<p className="text-xs text-muted-foreground">{item.type_unite}</p></TableCell><TableCell className="text-foreground">{engagement?.nom_campagne || engagement?.id_campagne || "—"}</TableCell><TableCell className="hidden whitespace-normal md:table-cell text-foreground">{item.composition?.join(", ") || "—"}</TableCell><TableCell className="text-foreground">{details.sport}</TableCell><TableCell className="hidden lg:table-cell text-foreground">{details.federation}</TableCell><TableCell className="hidden whitespace-normal xl:table-cell text-foreground">{details.program?.date_debut || "—"} — {details.program?.date_fin || "—"}</TableCell>{canEdit && <TableCell><Button size="icon" variant="ghost" aria-label={`Modifier ${item.nom_unite || item.id_unite_participante}`} onClick={() => show(item)}><Pencil className="h-4 w-4" /></Button></TableCell>}</TableRow>})}{!rows.length && <TableRow><TableCell colSpan={canEdit ? 7 : 6} className="h-24 text-center text-muted-foreground">Aucune unité participante.</TableCell></TableRow>}</TableBody></Table></div>
    </div>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>{editing ? "Modifier l’unité" : "Ajouter une unité"}</SheetTitle><SheetDescription>Une sélection seule ne suffit pas : seuls les participants effectifs sont proposés.</SheetDescription></SheetHeader><div className="space-y-4 px-4">
      <Field label="Engagement *"><Select disabled={Boolean(editing)} value={form.id_engagement_campagne} onValueChange={value => setForm({ ...empty, id_engagement_campagne: value })}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{engagements.map(item => { const details = context(item); return <SelectItem key={item.id_engagement_campagne} value={item.id_engagement_campagne}>{item.nom_campagne || item.id_campagne} · {details.sport} · {details.federation}</SelectItem> })}</SelectContent></Select></Field>
      <Field label="Forme *"><Select disabled={Boolean(editing)} value={form.type_unite} onValueChange={value => setForm({ ...form, type_unite: value, id_participation_acteur: "", nom_unite: "", membres: [] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INDIVIDUEL">Individuel</SelectItem><SelectItem value="EQUIPE">Équipe</SelectItem></SelectContent></Select></Field>
      {form.id_engagement_campagne && !eligible.length && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">Aucun athlète au statut PARTICIPANT n’est disponible pour cet engagement. Enregistrez d’abord sa participation effective dans l’onglet Participants.</p>}
      {form.type_unite === "INDIVIDUEL" ? <Field label="Athlète participant *"><Select disabled={!eligible.length} value={form.id_participation_acteur} onValueChange={value => setForm({ ...form, id_participation_acteur: value })}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{eligible.map(item => <SelectItem key={item.id_participation_acteur} value={item.id_participation_acteur}>{item.athlete_label || item.id_acteur_coc}</SelectItem>)}</SelectContent></Select></Field> : <><Field label="Nom de l’équipe *"><Input value={form.nom_unite} onChange={event => setForm({ ...form, nom_unite: event.target.value })} /></Field><div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Composition *</Label>{eligible.map(item => <label key={item.id_participation_acteur} className="flex items-center gap-2 rounded-md border border-border/80 bg-background/40 p-2 text-sm"><Checkbox checked={form.membres.includes(item.id_participation_acteur)} onCheckedChange={checked => setForm({ ...form, membres: checked ? [...form.membres, item.id_participation_acteur] : form.membres.filter(id => id !== item.id_participation_acteur) })} /><span>{item.athlete_label || item.id_acteur_coc}</span></label>)}</div></>}
      <Field label="Observation"><Textarea value={form.observation} onChange={event => setForm({ ...form, observation: event.target.value })} /></Field><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving} onClick={save}>Enregistrer</Button></div>
    </div></SheetContent></Sheet>
  </>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }

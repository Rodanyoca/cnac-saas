"use client"

import { apiFetch } from "@/lib/api/client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { programScheduleError } from "@/lib/competitions/program-calendar"
import type { Competition, CompetitionProgram, CompetitionReferences } from "@/lib/competitions/types"
import { CompetitionProgramGantt, type ProgramGanttRow, UnscheduledPrograms } from "./competition-program-gantt"

const empty = { id_epreuve: "", id_categorie_age: "", id_sexe: "", date_debut: "", date_fin: "", observations: "" }
const NONE = "__NONE__"

export function CompetitionPrograms({ competition, initialRows, references, canEdit }: { competition: Competition; initialRows: CompetitionProgram[]; references: CompetitionReferences; canEdit: boolean }) {
  const competitionId = competition.id_competition
  const [rows, setRows] = useState(initialRows), [open, setOpen] = useState(false), [editingId, setEditingId] = useState(""), [form, setForm] = useState(empty), [saving, setSaving] = useState(false)
  const events = useMemo(() => references.events || [], [references.events])
  const ages = useMemo(() => references.ageCategories || [], [references.ageCategories])
  const sexes = useMemo(() => references.sexes || [], [references.sexes])
  const eventMap = useMemo(() => new Map(events.map((item) => [item.id, item])), [events])
  const displayRows = useMemo<ProgramGanttRow[]>(() => rows.map((program) => {
    const event = eventMap.get(program.id_epreuve)
    return {
      program,
      eventName: event?.label || program.id_epreuve || "Épreuve inconnue",
      sport: references.sports?.find((item) => item.id === event?.sportId)?.label || event?.sportId || "",
      discipline: references.disciplines?.find((item) => item.id === event?.disciplineId)?.label || event?.disciplineId || "",
      age: ages.find((item) => item.id === program.id_categorie_age)?.label || program.id_categorie_age || "",
      sex: sexes.find((item) => item.id === program.id_sexe)?.label || program.id_sexe || "",
      format: event?.formatId || "",
      resultType: event?.resultTypeId || "",
    }
  }).sort((a, b) => (a.program.date_debut || "9999-12-31").localeCompare(b.program.date_debut || "9999-12-31") || a.eventName.localeCompare(b.eventName, "fr")), [ages, eventMap, references.disciplines, references.sports, rows, sexes])
  const scheduled = displayRows.filter(({ program }) => program.date_debut && program.date_fin)
  const unscheduled = displayRows.filter(({ program }) => !program.date_debut || !program.date_fin)
  const formError = programScheduleError(form, competition)
  const edit = (row?: CompetitionProgram) => { setEditingId(row?.id_programme_competition || ""); setForm(row ? { id_epreuve: row.id_epreuve, id_categorie_age: row.id_categorie_age, id_sexe: row.id_sexe, date_debut: row.date_debut, date_fin: row.date_fin, observations: row.observations } : empty); setOpen(true) }
  const update = (key: keyof typeof empty, value: string) => setForm((current) => ({ ...current, [key]: value === NONE ? "" : value }))
  async function save() {
    if (!form.id_epreuve) { toast.error("L’épreuve est obligatoire."); return }
    if (formError) { toast.error(formError); return }
    setSaving(true)
    try {
      const response = await apiFetch(`/api/competitions/${encodeURIComponent(competitionId)}/programmes`, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, row: form }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setRows((current) => editingId ? current.map((item) => item.id_programme_competition === editingId ? result.row : item) : [...current, result.row])
      setOpen(false)
      toast.success(editingId ? "Programme modifié." : "Programme ajouté.")
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } finally { setSaving(false) }
  }

  return <><div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Programme chronologique</h3><p className="text-sm text-muted-foreground">Les épreuves sont positionnées par jour autour des cérémonies officielles.</p></div>{canEdit && <Button onClick={() => edit()} disabled={!events.length}><Plus className="mr-2 h-4 w-4"/>Ajouter un programme</Button>}</div>
    {!events.length && <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Le référentiel EPREUVES est vide. Aucun programme ne peut être créé avant validation des épreuves fédérales.</p>}
    {scheduled.length > 0 && <CompetitionProgramGantt competition={competition} rows={scheduled} canEdit={canEdit} onEdit={edit}/>}
    <UnscheduledPrograms rows={unscheduled} canEdit={canEdit} onEdit={edit}/>
    {!rows.length && events.length > 0 && <div className="rounded-lg border border-dashed p-8 text-center"><p className="font-medium">Aucune épreuve enregistrée</p><p className="mt-1 text-sm text-muted-foreground">Ajoutez une épreuve pour construire le programme chronologique.</p>{canEdit && <Button className="mt-4" onClick={() => edit()}><Plus className="mr-2 h-4 w-4"/>Ajouter un programme</Button>}</div>}
  </div>
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{editingId ? "Modifier le programme" : "Ajouter un programme"}</SheetTitle><SheetDescription>L’épreuve reste immuable après création. Elle peut commencer avant l’ouverture, mais jamais se prolonger après la clôture.</SheetDescription></SheetHeader><div className="space-y-4 px-4">
    <Field label="Épreuve *"><Select disabled={Boolean(editingId)} value={form.id_epreuve} onValueChange={(value) => update("id_epreuve", value)}><SelectTrigger><SelectValue placeholder="Sélectionner"/></SelectTrigger><SelectContent>{events.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></Field>
    <Field label="Catégorie d’âge"><Select value={form.id_categorie_age || NONE} onValueChange={(value) => update("id_categorie_age", value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value={NONE}>Non renseignée</SelectItem>{ages.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></Field>
    <Field label="Sexe"><Select value={form.id_sexe || NONE} onValueChange={(value) => update("id_sexe", value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value={NONE}>Non renseigné</SelectItem>{sexes.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></Field>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Date de début"><Input type="date" max={competition.date_fin || undefined} value={form.date_debut} onChange={(event) => update("date_debut", event.target.value)}/></Field><Field label="Date de fin"><Input type="date" min={form.date_debut || undefined} max={competition.date_fin || undefined} value={form.date_fin} onChange={(event) => update("date_fin", event.target.value)}/></Field></div>
    {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
    <Field label="Observations"><Textarea value={form.observations} onChange={(event) => update("observations", event.target.value)}/></Field>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving || !form.id_epreuve || Boolean(formError)} onClick={save}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></div>
  </div></SheetContent></Sheet></>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }

"use client"

import { apiFetch } from "@/lib/api/client"

import { useEffect, useState } from "react"
import { History, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { loadCompetitionUnits } from "@/lib/competitions/client-units"
import { filterResultDecisions, formatResultSummary, normalizeResultForType, resultFormPolicy, type ResultDecisionOption } from "@/lib/competitions/result-policy"
import type { CampaignEngagement, CompetitionProgram, CompetitionReferences, CompetitionResult, ParticipatingUnit } from "@/lib/competitions/types"

type Option = { id: string; label: string; disabled?: boolean }
type Refs = { synthetics: Option[]; units: (Option & { type?: string })[]; decisions: ResultDecisionOption[]; opponentTypes?: Option[]; federations?: Option[] }
const NONE = "__NONE__"
const empty = { id_engagement_campagne: "", id_programme_competition: "", id_unite_participante: "", id_epreuve: "", id_discipline: "", date_resultat: "", phase: "", type_adversaire: "AUCUN", nom_adversaire: "", pays_adversaire: "", id_resultat_synthetique: "", valeur_coc: "", valeur_adversaire: "", id_unite_mesure: "", id_decision_resultat: "", motif_correction: "", observation: "" }

export function CompetitionResults({ competitionId, engagements, programs, competitionReferences, initialRows, references, canEdit }: { competitionId: string; engagements: CampaignEngagement[]; programs: CompetitionProgram[]; competitionReferences: CompetitionReferences; initialRows: CompetitionResult[]; references: Refs; canEdit: boolean }) {
  const [rows, setRows] = useState(initialRows), [units, setUnits] = useState<ParticipatingUnit[]>([]), [open, setOpen] = useState(false), [editing, setEditing] = useState(""), [form, setForm] = useState(empty), [saving, setSaving] = useState(false), [history, setHistory] = useState(false)
  const visible = history ? rows : rows.filter((row) => row.est_version_courante === "OUI")

  useEffect(() => {
    let active = true
    void loadCompetitionUnits(competitionId).then((value) => { if (active) setUnits(value) }).catch((error) => toast.error(error instanceof Error ? error.message : String(error)))
    return () => { active = false }
  }, [competitionId])

  useEffect(() => {
    const known = new Set(references.decisions.map((decision) => decision.id))
    const unknown = [...new Set(rows.map((row) => row.id_decision_resultat).filter((id) => id && !known.has(id)))]
    if (unknown.length) console.warn("[RESULTATS] Décisions historiques non reconnues :", unknown)
  }, [references.decisions, rows])

  const label = (items: Option[], id: string, fallback = "—") => items.find((item) => item.id === id)?.label || id || fallback
  const eventForProgram = (programId: string) => { const program = programs.find((item) => item.id_programme_competition === programId); return competitionReferences.events?.find((item) => item.id === program?.id_epreuve) }
  function getResultContextLabel(row: CompetitionResult) { const engagement = engagements.find(item=>item.id_engagement_campagne===row.id_engagement_campagne); return engagement?.nom_equipe_nationale || engagement?.nom_campagne || row.nom_equipe_nationale || row.nom_campagne || "Contexte non renseigné" }
  function getEventLabel(programId: string) { return eventForProgram(programId)?.label || "—" }
  function getDisciplineLabelForProgram(programId: string) { const event = eventForProgram(programId); return competitionReferences.disciplines?.find((item) => item.id === event?.disciplineId)?.label || event?.disciplineId || "—" }
  const selectedEvent = eventForProgram(form.id_programme_competition)
  const selectedEngagement = engagements.find((item) => item.id_engagement_campagne === form.id_engagement_campagne)
  const compatibleDecisions = filterResultDecisions(references.decisions, { federationId: selectedEngagement?.id_federation_responsable, sportId: selectedEvent?.sportId, disciplineId: selectedEvent?.disciplineId })
  const decisionOptions: ResultDecisionOption[] = editing && form.id_decision_resultat && !compatibleDecisions.some((item) => item.id === form.id_decision_resultat) ? [...compatibleDecisions, { ...(references.decisions.find((item) => item.id === form.id_decision_resultat) || { id: form.id_decision_resultat, label: "Décision non reconnue" }), disabled: true }] : compatibleDecisions
  const policy = resultFormPolicy(selectedEvent?.resultTypeId || "", compatibleDecisions)
  const syntheticError = policy.syntheticRequired && !form.id_resultat_synthetique ? "Le résultat synthétique est obligatoire." : ""
  const decisionError = policy.decisionRequired && !form.id_decision_resultat ? "La décision est obligatoire." : ""
  const compatibleEngagements = engagements.filter((item) => !form.id_programme_competition || item.id_programme_competition === form.id_programme_competition)
  const compatibleUnits = units.filter((item) => !form.id_engagement_campagne || item.id_engagement_campagne === form.id_engagement_campagne)
  const unitLabel = (id: string) => { const unit = units.find((item) => item.id_unite_participante === id); return unit?.nom_unite || unit?.composition?.join(", ") || id || "Unité manquante" }
  const resultSummary = (row: CompetitionResult) => { const decision = references.decisions.find((item) => item.id === row.id_decision_resultat); return formatResultSummary({ decision: row.id_decision_resultat ? decision?.label || "Décision non reconnue" : "", value: row.valeur_coc || row.valeur_rdc, opponentValue: row.valeur_adversaire, unit: label(references.units, row.id_unite_mesure, "") }) }

  async function show(row?: CompetitionResult) {
    setEditing(row?.id_resultat || "")
    const event = eventForProgram(row?.id_programme_competition || "")
    setForm(row ? normalizeResultForType({ ...empty, ...row, id_epreuve: programs.find((item) => item.id_programme_competition === row.id_programme_competition)?.id_epreuve || "", id_discipline: event?.disciplineId || "" }, event?.resultTypeId || "") : { ...empty })
    try { setUnits(await loadCompetitionUnits(competitionId)) } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) }
    setOpen(true)
  }

  async function save() {
    if (syntheticError || decisionError) { toast.error(syntheticError || decisionError); return }
    setSaving(true)
    try {
      const response = await apiFetch("/api/competitions/" + encodeURIComponent(competitionId) + "/resultats", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing, row: normalizeResultForType(form, selectedEvent?.resultTypeId || "") }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setRows((current) => editing ? [result.row, ...current.map((item) => item.id_resultat === editing ? { ...item, est_version_courante: "NON" } : item)] : [result.row, ...current])
      setOpen(false)
      toast.success(editing ? "Correction versionnée enregistrée." : "Résultat enregistré.")
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } finally { setSaving(false) }
  }

  return <><div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Résultats</h3><p className="text-sm text-muted-foreground">Le résultat appartient au programme, à l’engagement et à l’unité participante. Aucun classement n’est calculé.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setHistory(!history)}><History className="mr-2 h-4 w-4"/>{history ? "Versions courantes" : "Historique"}</Button>{canEdit && <Button disabled={!engagements.length} onClick={() => show()}><Plus className="mr-2 h-4 w-4"/>Ajouter</Button>}</div></div>
    <div className="min-w-0 overflow-hidden rounded-lg border"><Table><TableHeader><TableRow><TableHead>Unité</TableHead><TableHead>Résultat</TableHead><TableHead className="hidden md:table-cell">Adversaire</TableHead><TableHead className="hidden lg:table-cell">Date / phase</TableHead><TableHead className="hidden xl:table-cell">Discipline</TableHead><TableHead>Synthèse</TableHead></TableRow></TableHeader><TableBody>{visible.map((row) => <TableRow key={row.id_resultat}><TableCell className="max-w-64 whitespace-normal"><p className="font-medium">{unitLabel(row.id_unite_participante)}</p><p className="text-xs text-muted-foreground">{getResultContextLabel(row)}</p></TableCell><TableCell className="max-w-72 whitespace-normal font-medium">{resultSummary(row)}</TableCell><TableCell className="hidden whitespace-normal md:table-cell"><p>{row.nom_adversaire || row.adversaire || "Sans adversaire"}</p><p className="text-xs text-muted-foreground">{row.pays_adversaire || "Pays non renseigné"}</p></TableCell><TableCell className="hidden whitespace-normal lg:table-cell"><p className="font-medium">{row.phase || "Phase non renseignée"}</p><p className="text-xs text-muted-foreground">{row.date_resultat || "Date non renseignée"}</p></TableCell><TableCell className="hidden whitespace-normal xl:table-cell"><p className="font-medium">{getDisciplineLabelForProgram(row.id_programme_competition)}</p><p className="text-xs text-muted-foreground">{getEventLabel(row.id_programme_competition)}</p></TableCell><TableCell className="whitespace-normal">{label(references.synthetics, row.id_resultat_synthetique, "Non renseignée")}</TableCell></TableRow>)}{!visible.length && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucun résultat enregistré.</TableCell></TableRow>}</TableBody></Table></div>
  </div>
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>{editing ? "Corriger le résultat" : "Ajouter un résultat"}</SheetTitle><SheetDescription>Les champs restent conservés si la validation échoue.</SheetDescription></SheetHeader><div className="space-y-4 px-4">
    <Choice label="Épreuve *" value={form.id_programme_competition} options={programs.map((program) => ({ id: program.id_programme_competition, label: competitionReferences.events?.find((item) => item.id === program.id_epreuve)?.label || program.id_epreuve }))} onChange={(programId) => { const program = programs.find((item) => item.id_programme_competition === programId), event = eventForProgram(programId); setForm(normalizeResultForType({ ...form, id_programme_competition: programId, id_epreuve: program?.id_epreuve || "", id_discipline: event?.disciplineId || "", id_engagement_campagne: "", id_unite_participante: "", id_decision_resultat: "" }, event?.resultTypeId || "")) }} optional={false}/>
    <Field label="Discipline"><Input value={competitionReferences.disciplines?.find((item) => item.id === selectedEvent?.disciplineId)?.label || selectedEvent?.disciplineId || "—"} readOnly className="bg-muted"/></Field>
    <Choice label="Engagement *" value={form.id_engagement_campagne} options={compatibleEngagements.map((item) => ({ id: item.id_engagement_campagne, label: (item.nom_campagne || item.id_campagne) + " · " + (references.federations?.find((row) => row.id === item.id_federation_responsable)?.label || item.id_federation_responsable || "—") }))} onChange={(value) => setForm({ ...form, id_engagement_campagne: value, id_unite_participante: "", id_decision_resultat: "" })} optional={false}/>
    <Choice label="Unité participante *" value={form.id_unite_participante} options={compatibleUnits.map((item) => ({ id: item.id_unite_participante, label: item.nom_unite || item.composition?.join(", ") || item.id_unite_participante }))} onChange={(value) => setForm({ ...form, id_unite_participante: value })} optional={false}/>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Date du résultat *"><Input type="date" value={form.date_resultat} onChange={(event) => setForm({ ...form, date_resultat: event.target.value })}/></Field><Field label="Phase"><Input value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })}/></Field></div>
    <Choice label="Type d’adversaire *" value={form.type_adversaire} options={references.opponentTypes || [{ id: "AUCUN", label: "Aucun" }, { id: "ATHLETE", label: "Athlète" }, { id: "EQUIPE", label: "Équipe" }]} onChange={(value) => setForm({ ...form, type_adversaire: value, nom_adversaire: value === "AUCUN" ? "" : form.nom_adversaire, valeur_adversaire: value === "AUCUN" ? "" : form.valeur_adversaire })} optional={false}/>
    {form.type_adversaire !== "AUCUN" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Nom adversaire *"><Input value={form.nom_adversaire} onChange={(event) => setForm({ ...form, nom_adversaire: event.target.value })}/></Field><Field label="Pays"><Input value={form.pays_adversaire} onChange={(event) => setForm({ ...form, pays_adversaire: event.target.value })}/></Field></div>}
    {policy.showQuantitative && <><div className="grid gap-4 sm:grid-cols-2"><Field label="Valeur COC"><Input inputMode="decimal" value={form.valeur_coc} onChange={(event) => setForm({ ...form, valeur_coc: event.target.value })}/></Field>{form.type_adversaire !== "AUCUN" && <Field label="Valeur adverse"><Input inputMode="decimal" value={form.valeur_adversaire} onChange={(event) => setForm({ ...form, valeur_adversaire: event.target.value })}/></Field>}</div><Choice label="Unité de mesure" value={form.id_unite_mesure} options={references.units} onChange={(value) => setForm({ ...form, id_unite_mesure: value === NONE ? "" : value })}/></>}
    <Choice label={"Synthèse" + (policy.syntheticRequired ? " *" : "")} value={form.id_resultat_synthetique} options={references.synthetics} onChange={(value) => setForm({ ...form, id_resultat_synthetique: value === NONE ? "" : value })} optional={!policy.syntheticRequired} error={syntheticError}/>
    {policy.showDecision && <><Choice label={"Décision du résultat" + (policy.decisionRequired ? " *" : "")} value={form.id_decision_resultat} options={decisionOptions} onChange={(value) => setForm({ ...form, id_decision_resultat: value === NONE ? "" : value })} optional={!policy.decisionRequired} error={decisionError}/>{selectedEvent?.resultTypeId === "TR_DECISION" && <p className="text-xs text-muted-foreground">Sélectionnez la manière dont le résultat a été obtenu.</p>}</>}
    {editing && <Field label="Motif de correction *"><Textarea value={form.motif_correction} onChange={(event) => setForm({ ...form, motif_correction: event.target.value })}/></Field>}
    <Field label="Observation"><Textarea value={form.observation} onChange={(event) => setForm({ ...form, observation: event.target.value })}/></Field>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving || Boolean(syntheticError || decisionError)} onClick={save}>Enregistrer</Button></div>
  </div></SheetContent></Sheet></>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
function Choice({ label, value, options, onChange, optional = true, error }: { label: string; value: string; options: Option[]; onChange: (value: string) => void; optional?: boolean; error?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value || (optional ? NONE : undefined)} onValueChange={onChange}><SelectTrigger aria-invalid={Boolean(error)}><SelectValue placeholder="Sélectionner"/></SelectTrigger><SelectContent>{optional && <SelectItem value={NONE}>Non renseigné</SelectItem>}{options.map((item) => <SelectItem key={item.id} value={item.id} disabled={item.disabled}>{item.label}</SelectItem>)}</SelectContent></Select>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>
}

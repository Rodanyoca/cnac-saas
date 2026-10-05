"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil, Plus, RotateCcw, Power } from "lucide-react"
import { apiFetch } from "@/lib/api/client"
import { localisationPatch, type AthleteLocalisation } from "@/lib/cnac/localisation-model"
import { AthleteTeamTraining, TeamTrainingSummary } from "./team-training-summary"
import { TeamTrainingFields } from "./team-training-fields"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type Props = { athleteId: string; teams: Record<string,string>[]; affiliation: { id_equipe_cnac?: string; id_club_cnac?: string; id_federation?: string } }
const blank = (): Record<string,string> => ({ lieu_entrainement: "", adresse_entrainement: "", fuseau_horaire_entrainement: "Africa/Kinshasa", planning_entrainement_json: "[]", statut: "ACTIF", observations: "" })
const fields = (row: AthleteLocalisation): Record<string,string> => ({ lieu_entrainement: row.lieu_entrainement || "", adresse_entrainement: row.adresse_entrainement || "", fuseau_horaire_entrainement: row.fuseau_horaire_entrainement || "", planning_entrainement_json: row.planning_entrainement_json || "", statut: row.statut, observations: row.observations || "" })

export function AthleteLocalisation({ athleteId, teams, affiliation }: Props) {
  const [rows, setRows] = useState<AthleteLocalisation[]>([])
  const [canWrite, setCanWrite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [revision, setRevision] = useState(0)
  const [showInactive, setShowInactive] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AthleteLocalisation | null>(null)
  const [draft, setDraft] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState("")
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const endpoint = `/api/athletes/${encodeURIComponent(athleteId)}/localisations`

  useEffect(() => {
    const controller = new AbortController()
    apiFetch(endpoint, { signal: controller.signal, deduplicate: false }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Impossible de charger les lieux individuels.")
      if (!Array.isArray(data.localisations)) throw new Error("Réponse des lieux individuels invalide.")
      if (!controller.signal.aborted) { setRows(data.localisations); setCanWrite(data.canWrite === true); setLoadError("") }
    }).catch(failure => { if (!controller.signal.aborted) { setCanWrite(false); setLoadError(failure instanceof Error ? failure.message : "Impossible de charger les lieux individuels.") } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [endpoint, revision])

  function start(row?: AthleteLocalisation) {
    setEditing(row || null); setDraft(row ? fields(row) : blank()); setError(""); setFeedback(""); setOpen(true)
  }
  async function persist(input: Record<string,string>, row?: AthleteLocalisation) {
    const response = await apiFetch(endpoint, { method: row ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, timeoutMs: 60000,
      body: JSON.stringify({ ...(row ? { id: row.id_localisation } : {}), row: input }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.ok !== true || !data.row?.id_localisation) throw new Error(data.error || "L’enregistrement du lieu a échoué.")
    setRows(current => row ? current.map(item => item.id_localisation === row.id_localisation ? data.row : item) : [...current, data.row])
  }
  async function save() {
    setError("")
    try { localisationPatch(draft, editing ? { ...editing } : undefined) } catch (failure) { setError(failure instanceof Error ? failure.message : "Vérifiez les informations du lieu."); return }
    setSaving(true)
    try { await persist(draft, editing || undefined); setOpen(false); setFeedback("Lieu d’entraînement enregistré.") }
    catch (failure) { setError(failure instanceof Error ? failure.message : "L’enregistrement a échoué.") }
    finally { setSaving(false) }
  }
  async function changeStatus(row: AthleteLocalisation) {
    if (row.statut === "ACTIF" && !window.confirm(`Désactiver le lieu « ${row.lieu_entrainement} » ?`)) return
    setBusyId(row.id_localisation); setFeedback(""); setError("")
    try { await persist({ statut: row.statut === "ACTIF" ? "INACTIF" : "ACTIF" }, row); setFeedback(row.statut === "ACTIF" ? "Lieu désactivé." : "Lieu réactivé.") }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Le changement de statut a échoué.") }
    finally { setBusyId("") }
  }
  const active = rows.filter(row => row.statut === "ACTIF")
  const inactive = rows.filter(row => row.statut === "INACTIF")
  const visible = showInactive ? [...active, ...inactive] : active
  return <div className="min-w-0 space-y-6">
    <section className="space-y-3" aria-labelledby="team-training-heading">
      <div className="flex flex-wrap items-center gap-2"><h3 id="team-training-heading" className="text-base font-semibold">Entraînements de l’équipe</h3><Badge variant="secondary">Équipe</Badge></div>
      <AthleteTeamTraining teams={teams} affiliation={affiliation} />
    </section>
    <section className="space-y-3" aria-labelledby="individual-training-heading">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 id="individual-training-heading" className="text-base font-semibold">Entraînements individuels</h3>{canWrite && !loadError && <Button type="button" size="sm" onClick={() => start()} disabled={saving || !!busyId}><Plus className="h-4 w-4" />Ajouter un lieu d’entraînement</Button>}</div>
      {feedback && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{feedback}</p>}
      {!open && error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Chargement des lieux individuels…</p> : loadError ? <div className="space-y-2"><p role="alert" className="text-sm text-destructive">{loadError}</p><Button variant="outline" size="sm" onClick={() => { setLoading(true); setRevision(value => value + 1) }}>Réessayer</Button></div> : <>
        {!active.length && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Aucun lieu d’entraînement individuel renseigné.</p>}
        {inactive.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setShowInactive(value => !value)}>{showInactive ? "Masquer" : "Afficher"} les lieux inactifs ({inactive.length})</Button>}
        {visible.map(row => <article key={row.id_localisation} className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex gap-2"><Badge variant="outline">Individuel</Badge>{row.statut === "INACTIF" && <Badge variant="secondary">Inactif</Badge>}</div>{canWrite && <div className="flex flex-wrap gap-1"><Button type="button" size="sm" variant="ghost" aria-label={`Modifier ${row.lieu_entrainement}`} disabled={saving || !!busyId} onClick={() => start(row)}><Pencil className="h-3.5 w-3.5" />Modifier</Button><Button type="button" size="sm" variant="ghost" aria-label={`${row.statut === "ACTIF" ? "Désactiver" : "Réactiver"} ${row.lieu_entrainement}`} disabled={saving || !!busyId} onClick={() => void changeStatus(row)}>{busyId === row.id_localisation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : row.statut === "ACTIF" ? <Power className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}{row.statut === "ACTIF" ? "Désactiver" : "Réactiver"}</Button></div>}</div>
          <TeamTrainingSummary compact individual team={row} />
          {row.observations && <p className="whitespace-pre-wrap break-words px-4 text-sm text-muted-foreground"><span className="font-medium">Observations : </span>{row.observations}</p>}
        </article>)}
      </>}
    </section>
    <Sheet open={open} onOpenChange={value => { if (!saving) { setOpen(value); if (!value) setError("") } }}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl" onInteractOutside={event => { if (saving) event.preventDefault() }}><SheetHeader><SheetTitle>{editing ? "Modifier le lieu d’entraînement" : "Ajouter un lieu d’entraînement"}</SheetTitle><SheetDescription>Un lieu individuel et ses horaires habituels, en complément des entraînements de l’équipe.</SheetDescription></SheetHeader>
      <div className="space-y-5 px-4"><fieldset disabled={saving} className="min-w-0 space-y-5"><TeamTrainingFields row={draft} update={(key,value) => setDraft(current => ({ ...current, [key]: value }))} />
        <div className="space-y-2"><Label htmlFor="individual-training-status">Statut</Label><Select value={draft.statut} onValueChange={value => setDraft(current => ({ ...current, statut: value }))} disabled={saving}><SelectTrigger id="individual-training-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="individual-training-observations">Observations</Label><Textarea id="individual-training-observations" value={draft.observations} onChange={event => setDraft(current => ({ ...current, observations: event.target.value }))} /></div>
      </fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
      <SheetFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Annuler</Button><Button type="button" disabled={saving} onClick={() => void save()}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Enregistrement…" : "Enregistrer"}</Button></SheetFooter>
    </SheetContent></Sheet>
  </div>
}

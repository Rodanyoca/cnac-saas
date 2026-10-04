"use client"

import { apiFetch } from "@/lib/api/client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import type { OfficialAffiliation } from "@/lib/acteurs/official-affiliations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { OfficialFunctionOption, OrganisationOption } from "./officiel-detail-client"

type Form = Pick<OfficialAffiliation, "id_entite" | "id_fonction" | "date_debut" | "date_fin" | "statut" | "observations">
const empty: Form = { id_entite: "", id_fonction: "", date_debut: "", date_fin: "", statut: "ACTIF", observations: "" }

export function OfficialAffiliations({ officialId, initialRows, organisations, functions, outOfScope = false, loadError = false, compact = false, canEdit = false }: { officialId: string; initialRows: OfficialAffiliation[]; organisations: OrganisationOption[]; functions: OfficialFunctionOption[]; outOfScope?: boolean; loadError?: boolean; compact?: boolean; canEdit?: boolean }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState("")
  const [form, setForm] = useState<Form>(empty)
  const entityNames = new Map(organisations.map((item) => [item.id, item.sigle || item.nom]))
  const functionNames = new Map(functions.map((item) => [item.id, item.nom]))
  function update<K extends keyof Form>(key: K, value: Form[K]) { setForm((current) => ({ ...current, [key]: value })) }
  function add() { setEditingId(""); setForm(empty); setOpen(true) }
  function edit(row: OfficialAffiliation) { setEditingId(row.id_affiliation); setForm({ id_entite: row.id_entite, id_fonction: row.id_fonction, date_debut: row.date_debut, date_fin: row.date_fin, statut: row.statut || "ACTIF", observations: row.observations }); setOpen(true) }
  async function save() {
    if (!form.id_entite || !form.id_fonction || !form.date_debut) return toast.error("Entité, fonction et date de début sont obligatoires.")
    setSaving(true)
    try {
      const response = await apiFetch("/api/officiels/affiliations", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, row: { ...form, id_officiel_coc: officialId } }) })
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Enregistrement impossible")
      setRows((current) => [...current.filter((item) => item.id_affiliation !== result.row.id_affiliation), result.row].sort((a, b) => b.date_debut.localeCompare(a.date_debut)))
      toast.success(editingId ? "Affiliation modifiée." : "Affiliation ajoutée."); setOpen(false); router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } finally { setSaving(false) }
  }
  if (outOfScope) return <p className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">Affiliations hors du périmètre de connexion CNAC. Le rattachement direct à l’entité figure dans les informations de la fiche.</p>
  if (loadError) return <p className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">Impossible de charger le parcours institutionnel.</p>
  return <div className="space-y-4">
    {(!compact || canEdit) && <div className="flex items-center justify-between gap-3"><div>{!compact && <><h3 className="font-semibold">Parcours institutionnel</h3><p className="text-sm text-muted-foreground">Affiliations actuelles et historiques</p></>}</div>{canEdit && <Button size="sm" onClick={add}>Ajouter</Button>}</div>}
    <div className="overflow-x-auto rounded-lg border border-border/60"><Table><TableHeader><TableRow><TableHead>Fonction</TableHead><TableHead>Entité</TableHead><TableHead>Date de début</TableHead><TableHead>Date de fin</TableHead><TableHead>Statut</TableHead>{canEdit && <TableHead className="text-right">Action</TableHead>}</TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id_affiliation}><TableCell className="font-medium">{functionNames.get(row.id_fonction) || row.id_fonction}</TableCell><TableCell>{entityNames.get(row.id_entite) || row.id_entite}</TableCell><TableCell>{row.date_debut}</TableCell><TableCell>{row.date_fin || "En cours"}</TableCell><TableCell>{row.statut || "—"}</TableCell>{canEdit && <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => edit(row)} aria-label="Modifier l’affiliation" title="Modifier"><Pencil className="h-4 w-4" /></Button></TableCell>}</TableRow>)}{!rows.length && <TableRow><TableCell colSpan={canEdit ? 6 : 5} className="h-24 text-center text-muted-foreground">Aucune affiliation enregistrée.</TableCell></TableRow>}</TableBody></Table></div>
    {canEdit && <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{editingId ? "Modifier l’affiliation" : "Ajouter une affiliation"}</SheetTitle><SheetDescription>Une affiliation décrit une fonction exercée dans une entité pendant une période.</SheetDescription></SheetHeader><div className="grid gap-4 px-4">
      <div className="space-y-2"><Label>Entité *</Label><Select value={form.id_entite} onValueChange={(value) => update("id_entite", value)}><SelectTrigger><SelectValue placeholder="Sélectionner une entité" /></SelectTrigger><SelectContent>{organisations.map((item) => <SelectItem key={item.id} value={item.id}>{item.sigle ? `${item.sigle} — ` : ""}{item.nom}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Fonction *</Label><Select value={form.id_fonction} onValueChange={(value) => update("id_fonction", value)}><SelectTrigger><SelectValue placeholder="Sélectionner une fonction" /></SelectTrigger><SelectContent>{form.id_fonction && !functionNames.has(form.id_fonction) && <SelectItem value={form.id_fonction}>{form.id_fonction} (ancienne valeur)</SelectItem>}{functions.map((item) => <SelectItem key={item.id} value={item.id}>{item.nom}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Date de début *</Label><Input type="date" value={form.date_debut} onChange={(event) => update("date_debut", event.target.value)} /></div><div className="space-y-2"><Label>Date de fin</Label><Input type="date" value={form.date_fin} onChange={(event) => update("date_fin", event.target.value)} /></div></div>
      <div className="space-y-2"><Label>Statut</Label><Select value={form.statut} onValueChange={(value) => update("statut", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Observations</Label><Input value={form.observations} onChange={(event) => update("observations", event.target.value)} /></div>
    </div><SheetFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving} onClick={save}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></SheetFooter></SheetContent></Sheet>}
  </div>
}

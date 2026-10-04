"use client"

import { apiFetch } from "@/lib/api/client"
import Link from "next/link"
import { Eye, Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Header } from "@/components/dashboard/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPeriod, normalizeStatus } from "@/lib/activites/format"
import type { Activity, ActivityReferences } from "@/lib/activites/types"

const empty = { id_type_activite: "", id_entite_organisatrice: "", nom_activite: "", titre_public: "", resume: "", date_debut: "", date_fin: "", pays: "", ville: "", lieu: "", statut: "PLANIFIE", observations: "" }
const labels: Record<string, string> = { PLANIFIE: "Planifiée", EN_COURS: "En cours", TERMINE: "Terminée", REALISE: "Réalisée", REPORTE: "Reportée", ANNULE: "Annulée", NON_RENSEIGNE: "Non renseigné" }

function ActivityForm({ form, setForm, refs }: { form: typeof empty; setForm: React.Dispatch<React.SetStateAction<typeof empty>>; refs: ActivityReferences }) {
  const update = (key: keyof typeof empty, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const input = (label: string, key: keyof typeof empty, type = "text") => <div className="space-y-2"><Label>{label}</Label><Input type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} /></div>
  return <div className="grid gap-4 px-4 sm:grid-cols-2">
    <div className="space-y-2"><Label>Type d’activité *</Label><Select value={form.id_type_activite} onValueChange={(value) => update("id_type_activite", value)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{refs.types.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-2"><Label>Entité organisatrice *</Label><Select value={form.id_entite_organisatrice} onValueChange={(value) => update("id_entite_organisatrice", value)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{refs.entites.map((item) => <SelectItem key={item.id} value={item.id}>{item.secondary ? `${item.secondary} — ` : ""}{item.label}</SelectItem>)}</SelectContent></Select></div>
    {input("Nom de l’activité *", "nom_activite")}{input("Titre public", "titre_public")}<div className="sm:col-span-2">{input("Résumé", "resume")}</div>
    {input("Date de début *", "date_debut", "date")}{input("Date de fin", "date_fin", "date")}{input("Pays", "pays")}{input("Ville", "ville")}{input("Lieu", "lieu")}
    <div className="space-y-2"><Label>Statut *</Label><Select value={form.statut} onValueChange={(value) => update("statut", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(labels).filter(([id]) => id !== "NON_RENSEIGNE").map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select></div>
    <div className="sm:col-span-2">{input("Observations", "observations")}</div>
  </div>
}

export default function Client({ initialRows, references, loadError }: { initialRows: Activity[]; references: ActivityReferences; loadError?: string }) {
  const router = useRouter(), [activities, setActivities] = useState(initialRows), [open, setOpen] = useState(false), [saving, setSaving] = useState(false), [form, setForm] = useState(empty), [query, setQuery] = useState("")
  const rows = useMemo(() => activities.filter((item) => [item.nom_activite, item.titre_public, item.lieu, item.ville].join(" ").toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date_debut.localeCompare(a.date_debut)), [activities, query])
  const name = (items: ActivityReferences["types"], id: string) => items.find((item) => item.id === id)?.secondary || items.find((item) => item.id === id)?.label || "—"
  async function save() { if(saving)return;setSaving(true); try { const response = await apiFetch("/api/activites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ row: form }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); const created = { ...result.row, statut_normalise: normalizeStatus(result.row?.statut) } as Activity; setActivities((current) => [created, ...current.filter((item) => item.id_activite !== created.id_activite)]); toast.success("Activité créée."); setOpen(false); setForm(empty); router.refresh() } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } finally { setSaving(false) } }
  const counters: [string, number][] = [["Total", activities.length], ["Planifiées", activities.filter((item) => item.statut_normalise === "PLANIFIE").length], ["En cours", activities.filter((item) => item.statut_normalise === "EN_COURS").length], ["Réalisées", activities.filter((item) => ["REALISE", "TERMINE"].includes(item.statut_normalise)).length], ["Annulées", activities.filter((item) => item.statut_normalise === "ANNULE").length]]
  return <div><Header title="Activités" subtitle="Activités institutionnelles et sportives" /><main className="space-y-6 p-4 sm:p-6">{loadError ? <p className="rounded-lg border border-destructive/30 p-4 text-destructive">{loadError}</p> : <><div className="flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nouvelle activité</Button></div><div className="grid gap-3 sm:grid-cols-5">{counters.map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}</div><div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4" /><Input className="pl-9" placeholder="Rechercher…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <Card><CardContent className="overflow-x-auto p-0"><Table className="min-w-[1000px]"><TableHeader><TableRow><TableHead>Période</TableHead><TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead>Organisateur</TableHead><TableHead>Lieu</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader><TableBody>{rows.map((item) => <TableRow key={item.id_activite}><TableCell className="whitespace-nowrap">{formatPeriod(item.date_debut, item.date_fin)}</TableCell><TableCell className="font-medium">{item.nom_activite}</TableCell><TableCell>{name(references.types, item.id_type_activite)}</TableCell><TableCell>{name(references.entites, item.id_entite_organisatrice)}</TableCell><TableCell>{[item.ville, item.lieu].filter(Boolean).join(" — ") || "—"}</TableCell><TableCell><Badge>{labels[item.statut_normalise]}</Badge></TableCell><TableCell><Link href={`/dashboard/activites/${item.id_activite}`}><Button variant="ghost" size="icon" aria-label="Voir"><Eye className="h-4 w-4" /></Button></Link></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></>}</main>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader><SheetTitle>Nouvelle activité</SheetTitle><SheetDescription>Après création, rattachez les entités avec leur rôle, puis les participants.</SheetDescription></SheetHeader><ActivityForm form={form} setForm={setForm} refs={references} /><SheetFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving} onClick={save}>Enregistrer</Button></SheetFooter></SheetContent></Sheet></div>
}
export { ActivityForm, empty as emptyActivityForm, labels as activityStatusLabels }

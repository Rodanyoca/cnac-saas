"use client"
import { sexCode } from "@/lib/cnac/display"
import { ActorMediaInput, PersonSexOptions } from "@/components/dashboard/cnac-actor-references"

import { apiFetch } from "@/lib/api/client"

import Link from "next/link"
import { Eye, FileText, ImageIcon, Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { FederationOption } from "@/lib/federations/options"
import { Header } from "@/components/dashboard/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type GradeOption = { id: string; nom: string; idSport: string; idDiscipline: string }
export type ArbitreListItem = { id: string; idNational: string; idFederal: string; nomComplet: string; sexe: string; federation: string; federationId: string; grade: string; statut: string; avatar: string | null }
export type ArbitreForm = { id_arbitre_federation: string; id_federation: string; id_national: string; id_international: string; nom_complet: string; id_sexe: string; date_de_naissance: string; lieu_de_naissance: string; nationalite: string; telephone: string; email: string; adresse: string; id_grade: string; date_affiliation: string; numero_passeport: string; date_de_delivrance_passeport: string; date_expiration_passeport: string; statut: string }
export const emptyArbitreForm: ArbitreForm = { id_arbitre_federation: "", id_federation: "", id_national: "", id_international: "", nom_complet: "", id_sexe: "", date_de_naissance: "", lieu_de_naissance: "", nationalite: "", telephone: "", email: "", adresse: "", id_grade: "", date_affiliation: "", numero_passeport: "", date_de_delivrance_passeport: "", date_expiration_passeport: "", statut: "ACTIF" }
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()

export default function ArbitresClient({ arbitres, federations, grades }: { arbitres: ArbitreListItem[]; federations: FederationOption[]; grades: GradeOption[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [federationFilter, setFederationFilter] = useState("TOUTES")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ArbitreForm>(emptyArbitreForm)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [passport, setPassport] = useState<File | null>(null)
  const filtered = useMemo(() => { const q = search.trim().toLocaleLowerCase("fr"), scoped = federationFilter === "TOUTES" ? arbitres : arbitres.filter((item) => item.federationId === federationFilter); const matching = !q ? scoped : scoped.filter((item) => [item.idNational, item.idFederal, item.nomComplet, item.federation, item.grade, item.statut].some((v) => v.toLocaleLowerCase("fr").includes(q))); return [...matching].sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" })) }, [arbitres, federationFilter, search])
  function update<K extends keyof ArbitreForm>(key: K, value: ArbitreForm[K]) { setForm((current) => ({ ...current, [key]: value })) }
  function close() { setOpen(false); setForm(emptyArbitreForm); setAvatar(null); setPassport(null) }
  function pick(file: File | undefined, type: "avatar" | "passeport") { if (!file) return; const valid = type === "avatar" ? ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type) : file.type === "application/pdf"; if (!valid || file.size > 4 * 1024 * 1024) return toast.error("Fichier invalide ou supérieur à 4 Mo."); if (type === "avatar") setAvatar(file); else setPassport(file) }
  async function upload(file: File, type: "avatar" | "passeport", id: string) { const data = new FormData(); data.append("file", file); data.append("mediaType", type); data.append("actorType", "arbitres"); data.append("actorId", id); const res = await apiFetch("/api/upload-media", { method: "POST", body: data }); const out = await res.json(); if (!res.ok) throw new Error(out.error || "Échec du média") }
  async function save() {
    if (!form.nom_complet || !form.id_federation || !form.id_sexe) return toast.error("Nom, fédération et sexe sont obligatoires.")
    setSaving(true)
    try {
      const res = await apiFetch("/api/arbitres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ row: form }) })
      const out = await res.json(); if (!res.ok) throw new Error(out.error || "Création impossible")
      const id = String(out.row?.id_arbitre_coc || "")
      const uploads = [avatar ? upload(avatar, "avatar", id) : null, passport ? upload(passport, "passeport", id) : null].filter(Boolean) as Promise<void>[]
      const settled = await Promise.allSettled(uploads)
      if (settled.some((item) => item.status === "rejected")) toast.warning("Arbitre créé, mais un média n’a pas pu être envoyé."); else toast.success("Arbitre ajouté.")
      close(); router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } finally { setSaving(false) }
  }
  return <div className="min-h-screen"><Header title="Arbitres" subtitle="Arbitres et juges officiels" /><div className="space-y-6 p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row"><div className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row"><div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher un arbitre..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><Select value={federationFilter} onValueChange={setFederationFilter}><SelectTrigger className="w-full sm:w-56" aria-label="Filtrer par fédération"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUTES">Toutes les fédérations</SelectItem>{federations.map((item) => <SelectItem key={item.id} value={item.id}>{item.sigle || item.nom}</SelectItem>)}</SelectContent></Select></div><Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Ajouter un arbitre</Button></div>
    <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>ID national</TableHead><TableHead>ID fédéral</TableHead><TableHead>Avatar</TableHead><TableHead>Nom</TableHead><TableHead>Sexe</TableHead><TableHead>Fédération</TableHead><TableHead>Grade</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((item) => <TableRow key={item.id}><TableCell>{item.idNational || "—"}</TableCell><TableCell>{item.idFederal || "—"}</TableCell><TableCell><Avatar className="h-10 w-10"><AvatarImage src={item.avatar || undefined} /><AvatarFallback>{initials(item.nomComplet)}</AvatarFallback></Avatar></TableCell><TableCell className="font-medium">{item.nomComplet}</TableCell><TableCell>{sexCode(item.sexe)}</TableCell><TableCell>{item.federation ? <Badge variant="outline">{item.federation}</Badge> : "—"}</TableCell><TableCell>{item.grade || "—"}</TableCell><TableCell><Badge variant="secondary">{item.statut || "—"}</Badge></TableCell><TableCell className="text-right"><Link href={`/dashboard/acteurs/arbitres/${item.id}`}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link></TableCell></TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={9} className="h-32 text-center">Aucun arbitre trouvé.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card>
  </div><Sheet open={open} onOpenChange={(value) => value ? setOpen(true) : close()}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader><SheetTitle>Ajouter un arbitre</SheetTitle><SheetDescription>Le grade est alimenté par le référentiel GRADES_ARBITRE.</SheetDescription></SheetHeader><ArbitreFields form={form} update={update} federations={federations} grades={grades} pick={pick} /><SheetFooter><Button variant="outline" onClick={close}>Annuler</Button><Button disabled={saving} onClick={save}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></SheetFooter></SheetContent></Sheet></div>
}

export function ArbitreFields({ form, update, federations, grades, pick }: { form: ArbitreForm; update: <K extends keyof ArbitreForm>(key: K, value: ArbitreForm[K]) => void; federations: FederationOption[]; grades: GradeOption[]; pick: (file: File | undefined, type: "avatar" | "passeport") => void }) {
  return <div className="grid gap-4 px-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label>Nom complet *</Label><Input value={form.nom_complet} onChange={(e) => update("nom_complet", e.target.value)} /></div><div className="space-y-2"><Label>Date de naissance</Label><Input type="date" value={form.date_de_naissance} onChange={(e) => update("date_de_naissance", e.target.value)} /></div><div className="space-y-2"><Label>Lieu de naissance</Label><Input value={form.lieu_de_naissance} onChange={(e) => update("lieu_de_naissance", e.target.value)} /></div>
  <div className="space-y-2"><Label>Sexe *</Label><Select value={form.id_sexe} onValueChange={(v) => update("id_sexe", v)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><PersonSexOptions /></SelectContent></Select></div><div className="space-y-2"><Label>Fédération *</Label><Select value={form.id_federation} onValueChange={(v) => update("id_federation", v)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{federations.map((item) => <SelectItem key={item.id} value={item.id}>{item.sigle ? `${item.sigle} — ` : ""}{item.nom}</SelectItem>)}</SelectContent></Select></div>
  
  <div className="space-y-2"><Label>Nationalité</Label><Input value={form.nationalite} onChange={(e) => update("nationalite", e.target.value)} /></div><div className="space-y-2"><Label>Statut</Label><Select value={form.statut} onValueChange={(v) => update("statut", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
  <div className="space-y-2"><Label>ID national</Label><Input value={form.id_national} onChange={(e) => update("id_national", e.target.value)} /></div><div className="space-y-2"><Label>ID fédéral</Label><Input value={form.id_arbitre_federation} onChange={(e) => update("id_arbitre_federation", e.target.value)} /></div><div className="space-y-2"><Label>ID international</Label><Input value={form.id_international} onChange={(e) => update("id_international", e.target.value)} /></div>
  <div className="space-y-2"><Label>Téléphone</Label><Input value={form.telephone} onChange={(e) => update("telephone", e.target.value)} /></div><div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label>Adresse</Label><Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} /></div>
  <div className="space-y-2"><Label>N° passeport</Label><Input value={form.numero_passeport} onChange={(e) => update("numero_passeport", e.target.value)} /></div><div className="space-y-2"><Label>Délivré le</Label><Input type="date" value={form.date_de_delivrance_passeport} onChange={(e) => update("date_de_delivrance_passeport", e.target.value)} /></div><div className="space-y-2"><Label>Expire le</Label><Input type="date" value={form.date_expiration_passeport} onChange={(e) => update("date_expiration_passeport", e.target.value)} /></div>
  <div className="space-y-2"><Label><ImageIcon className="mr-1 inline h-4 w-4" />Avatar</Label><ActorMediaInput type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => pick(e.target.files?.[0], "avatar")} /></div><div className="space-y-2"><Label><FileText className="mr-1 inline h-4 w-4" />Passeport</Label><ActorMediaInput type="file" accept=".pdf,application/pdf" onChange={(e) => pick(e.target.files?.[0], "passeport")} /></div></div>
}

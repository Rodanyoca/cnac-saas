"use client"
import { displayCivilDate } from "@/lib/cnac/model"
import { ActorMediaInput, PersonSexOptions } from "@/components/dashboard/cnac-actor-references"

import { apiFetch } from "@/lib/api/client"

import Link from "next/link"
import { Eye, FileText, ImageIcon, Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
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

export type CoachListItem = { id: string; idNational: string; idFederal: string; nomComplet: string; sexe: string; dateNaissance: string; federation: string; federationId: string; statut: string; avatar: string | null }
export type FederationOption = { id: string; sigle: string; nom: string }
type CoachForm = { id_coach_federation: string; id_federation: string; id_national: string; id_international: string; nom_complet: string; id_sexe: string; date_de_naissance: string; lieu_de_naissance: string; nationalite: string; telephone: string; email: string; adresse: string; numero_passeport: string; date_de_delivrance_passeport: string; date_expiration_passeport: string; statut: string }
const emptyForm: CoachForm = { id_coach_federation: "", id_federation: "", id_national: "", id_international: "", nom_complet: "", id_sexe: "", date_de_naissance: "", lieu_de_naissance: "", nationalite: "", telephone: "", email: "", adresse: "", numero_passeport: "", date_de_delivrance_passeport: "", date_expiration_passeport: "", statut: "ACTIF" }
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()
function sexe(value: string) { const v = value.toLowerCase(); return ["f", "femme", "féminin", "feminin"].includes(v) ? "F" : ["m", "h", "homme", "masculin"].includes(v) ? "H" : value || "—" }

export default function EntraineursClient({ coachs, federations }: { coachs: CoachListItem[]; federations: FederationOption[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [federationFilter, setFederationFilter] = useState("TOUTES")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CoachForm>(emptyForm)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [passport, setPassport] = useState<File | null>(null)
  const filtered = useMemo(() => { const q = search.trim().toLocaleLowerCase("fr"), scoped = federationFilter === "TOUTES" ? coachs : coachs.filter((c) => c.federationId === federationFilter); const matching = !q ? scoped : scoped.filter((c) => [c.idNational, c.idFederal, c.nomComplet, c.sexe, c.dateNaissance, c.federation, c.statut].some((v) => v.toLocaleLowerCase("fr").includes(q))); return [...matching].sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" })) }, [coachs, federationFilter, search])
  function update<K extends keyof CoachForm>(key: K, value: CoachForm[K]) { setForm((f) => ({ ...f, [key]: value })) }
  function close() { setOpen(false); setForm(emptyForm); setAvatar(null); setPassport(null) }
  function pick(file: File | undefined, type: "avatar" | "passeport") { if (!file) return; const ok = type === "avatar" ? ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type) : file.type === "application/pdf"; if (!ok || file.size > 4 * 1024 * 1024) return toast.error("Fichier invalide ou supérieur à 4 Mo."); if (type === "avatar") setAvatar(file); else setPassport(file) }
  async function upload(file: File, type: "avatar" | "passeport", id: string) { const data = new FormData(); data.append("file", file); data.append("mediaType", type); data.append("actorType", "entraineurs"); data.append("actorId", id); const res = await apiFetch("/api/upload-media", { method: "POST", body: data }); const result = await res.json(); if (!res.ok) throw new Error(result.error || "Échec du média") }
  async function save() {
    if (!form.nom_complet || !form.id_federation || !form.id_sexe) return toast.error("Nom, fédération et sexe sont obligatoires.")
    setSaving(true)
    try {
      const res = await apiFetch("/api/coachs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ row: form }) }); const result = await res.json(); if (!res.ok) throw new Error(result.error || "Création impossible")
      const id = String(result.row?.id_coach_coc || ""); const uploads = [avatar ? upload(avatar, "avatar", id) : null, passport ? upload(passport, "passeport", id) : null].filter(Boolean) as Promise<void>[]; const settled = await Promise.allSettled(uploads); if (settled.some((x) => x.status === "rejected")) toast.warning("Coach créé, mais un média n’a pas pu être envoyé."); else toast.success("Coach ajouté."); close(); router.refresh()
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)) } finally { setSaving(false) }
  }
  return <div className="min-h-screen"><Header title="Entraîneurs" subtitle="Liste des coachs enregistrés" /><div className="space-y-6 p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row"><div className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row"><div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher un coach..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><Select value={federationFilter} onValueChange={setFederationFilter}><SelectTrigger className="w-full sm:w-56" aria-label="Filtrer par fédération"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TOUTES">Toutes les fédérations</SelectItem>{federations.map((item) => <SelectItem key={item.id} value={item.id}>{item.sigle || item.nom}</SelectItem>)}</SelectContent></Select></div><Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Ajouter un coach</Button></div>
    <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>ID national</TableHead><TableHead>ID fédéral</TableHead><TableHead>Avatar</TableHead><TableHead>Nom</TableHead><TableHead>Sexe</TableHead><TableHead>Date de naissance</TableHead><TableHead>Fédération</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
      {filtered.map((c) => <TableRow key={c.id}><TableCell>{c.idNational || "—"}</TableCell><TableCell>{c.idFederal || "—"}</TableCell><TableCell><Avatar className="h-10 w-10"><AvatarImage key={c.avatar || c.id} src={c.avatar || undefined} referrerPolicy="no-referrer" /><AvatarFallback>{initials(c.nomComplet)}</AvatarFallback></Avatar></TableCell><TableCell className="font-medium">{c.nomComplet}</TableCell><TableCell>{sexe(c.sexe)}</TableCell><TableCell>{displayCivilDate(c.dateNaissance)}</TableCell><TableCell>{c.federation ? <Badge variant="outline">{c.federation}</Badge> : "—"}</TableCell><TableCell>{c.statut ? <Badge variant="secondary">{c.statut}</Badge> : "—"}</TableCell><TableCell className="text-right"><Link href={`/dashboard/acteurs/entraineurs/${c.id}`} prefetch={false}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link></TableCell></TableRow>)}
      {!filtered.length && <TableRow><TableCell colSpan={9} className="h-32 text-center">Aucun coach trouvé.</TableCell></TableRow>}
    </TableBody></Table></div></CardContent></Card><p className="text-sm text-muted-foreground">Affichage de {filtered.length} sur {coachs.length} coachs</p></div>
    <Sheet open={open} onOpenChange={(v) => v ? setOpen(true) : close()}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader><SheetTitle>Ajouter un coach</SheetTitle><SheetDescription>Renseignez l’identité, la fédération et les médias du coach.</SheetDescription></SheetHeader><div className="grid gap-4 px-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2"><Label>Nom complet *</Label><Input value={form.nom_complet} onChange={(e) => update("nom_complet", e.target.value)} /></div><div className="space-y-2"><Label>Date de naissance</Label><Input type="date" value={form.date_de_naissance} onChange={(e) => update("date_de_naissance", e.target.value)} /></div><div className="space-y-2"><Label>Lieu de naissance</Label><Input value={form.lieu_de_naissance} onChange={(e) => update("lieu_de_naissance", e.target.value)} /></div>
      <div className="space-y-2"><Label>Sexe *</Label><Select value={form.id_sexe} onValueChange={(v) => update("id_sexe", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><PersonSexOptions /></SelectContent></Select></div><div className="space-y-2"><Label>Fédération *</Label><Select value={form.id_federation} onValueChange={(v) => update("id_federation", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{federations.map((f) => <SelectItem key={f.id} value={f.id}>{f.sigle ? `${f.sigle} — ` : ""}{f.nom}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Nationalité</Label><Input value={form.nationalite} onChange={(e) => update("nationalite", e.target.value)} /></div><div className="space-y-2"><Label>Statut</Label><Select value={form.statut} onValueChange={(v) => update("statut", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>ID national</Label><Input value={form.id_national} onChange={(e) => update("id_national", e.target.value)} /></div><div className="space-y-2"><Label>ID fédéral</Label><Input value={form.id_coach_federation} onChange={(e) => update("id_coach_federation", e.target.value)} /></div><div className="space-y-2"><Label>ID international</Label><Input value={form.id_international} onChange={(e) => update("id_international", e.target.value)} /></div>
      <div className="space-y-2"><Label>Téléphone</Label><Input value={form.telephone} onChange={(e) => update("telephone", e.target.value)} /></div><div className="space-y-2"><Label>E-mail</Label><Input value={form.email} onChange={(e) => update("email", e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label>Adresse</Label><Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} /></div>
      <div className="space-y-2"><Label>N° passeport</Label><Input value={form.numero_passeport} onChange={(e) => update("numero_passeport", e.target.value)} /></div><div className="space-y-2"><Label>Date de délivrance</Label><Input type="date" value={form.date_de_delivrance_passeport} onChange={(e) => update("date_de_delivrance_passeport", e.target.value)} /></div><div className="space-y-2"><Label>Expiration passeport</Label><Input type="date" value={form.date_expiration_passeport} onChange={(e) => update("date_expiration_passeport", e.target.value)} /></div>
      <div className="space-y-2"><Label><ImageIcon className="mr-1 inline h-4 w-4" />Avatar</Label><ActorMediaInput type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => pick(e.target.files?.[0], "avatar")} /></div><div className="space-y-2"><Label><FileText className="mr-1 inline h-4 w-4" />Passeport</Label><ActorMediaInput type="file" accept=".pdf,application/pdf" onChange={(e) => pick(e.target.files?.[0], "passeport")} /></div>
    </div><SheetFooter><Button variant="outline" onClick={close}>Annuler</Button><Button disabled={saving} onClick={save}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></SheetFooter></SheetContent></Sheet>
  </div>
}

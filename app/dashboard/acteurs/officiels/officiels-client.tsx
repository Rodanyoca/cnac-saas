"use client"
import { displayCivilDate } from "@/lib/cnac/model"
import { sexCode as displaySexe } from "@/lib/cnac/display"
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

export type OfficielListItem = {
  id: string
  idNational: string
  idFederal: string
  nomComplet: string
  sexe: string
  dateNaissance: string
  organisation: string
  organisationId: string
  statut: string
  avatar: string | null
}

export type OrganisationOption = { id: string; sigle: string; nom: string }

type OfficielForm = {
  id_entite: string
  id_officiel_entite: string
  id_national: string
  id_international: string
  nom_complet: string
  id_sexe: string
  date_de_naissance: string
  lieu_de_naissance: string
  nationalite: string
  telephone: string
  email: string
  adresse: string
  numéro_passeport: string
  date_de_delivrance_passeport: string
  "date_expiration passeport": string
  statut: string
}

const emptyForm: OfficielForm = {
  id_entite: "",
  id_officiel_entite: "",
  id_national: "",
  id_international: "",
  nom_complet: "",
  id_sexe: "",
  date_de_naissance: "",
  lieu_de_naissance: "",
  nationalite: "",
  telephone: "",
  email: "",
  adresse: "",
  numéro_passeport: "",
  date_de_delivrance_passeport: "",
  "date_expiration passeport": "",
  statut: "ACTIF",
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}



export function OfficielsClient({ officiels, organisations }: { officiels: OfficielListItem[]; organisations: OrganisationOption[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [organisationFilter, setOrganisationFilter] = useState("TOUTES")
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<OfficielForm>(emptyForm)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [passportFile, setPassportFile] = useState<File | null>(null)

  const filteredOfficiels = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr")
    const byOrganisation = organisationFilter === "TOUTES"
      ? officiels
      : officiels.filter((officiel) => officiel.organisationId === organisationFilter)
    const matchingOfficiels = query
      ? byOrganisation.filter((officiel) =>
          [officiel.idNational, officiel.idFederal, officiel.nomComplet, officiel.sexe,
            officiel.dateNaissance, officiel.organisation, officiel.statut]
            .some((value) => value.toLocaleLowerCase("fr").includes(query))
        )
      : byOrganisation

    return [...matchingOfficiels].sort((first, second) =>
      first.nomComplet.localeCompare(second.nomComplet, "fr", { sensitivity: "base" })
    )
  }, [officiels, organisationFilter, searchQuery])

  function update<K extends keyof OfficielForm>(key: K, value: OfficielForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function closeEditor() {
    setEditorOpen(false)
    setForm(emptyForm)
    setAvatarFile(null)
    setPassportFile(null)
  }

  function selectFile(file: File | undefined, mediaType: "avatar" | "passeport") {
    if (!file) return
    const accepted = mediaType === "avatar"
      ? ["image/png", "image/jpeg", "image/jpg", "image/webp"]
      : ["application/pdf"]
    if (!accepted.includes(file.type) || file.size > 4 * 1024 * 1024) {
      toast.error(mediaType === "avatar" ? "Avatar invalide ou supérieur à 4 Mo." : "Passeport PDF invalide ou supérieur à 4 Mo.")
      return
    }
    if (mediaType === "avatar") setAvatarFile(file)
    else setPassportFile(file)
  }

  async function uploadMedia(file: File, mediaType: "avatar" | "passeport", officielId: string) {
    const data = new FormData()
    data.append("file", file)
    data.append("mediaType", mediaType)
    data.append("actorType", "officiels")
    data.append("actorId", officielId)
    const response = await apiFetch("/api/upload-media", { method: "POST", body: data })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || `Échec de l’envoi du fichier ${mediaType}`)
  }

  async function save() {
    const required: Array<[keyof OfficielForm, string]> = [
      ["nom_complet", "Nom complet"],
      ["id_sexe", "Sexe"],
    ]
    const missing = required.find(([key]) => !form[key].trim())
    if (missing) {
      toast.error(`Le champ « ${missing[1]} » est obligatoire.`)
      return
    }

    setSaving(true)
    try {
      const response = await apiFetch("/api/officiels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row: form }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Création impossible")

      const officielId = String(result.row?.id_officiel_coc || "")
      const uploads = [
        avatarFile ? uploadMedia(avatarFile, "avatar", officielId) : null,
        passportFile ? uploadMedia(passportFile, "passeport", officielId) : null,
      ].filter(Boolean) as Promise<void>[]
      const uploadResults = await Promise.allSettled(uploads)
      const failedUploads = uploadResults.filter((item) => item.status === "rejected")

      if (failedUploads.length) toast.warning(`Officiel créé, mais ${failedUploads.length} fichier(s) n’ont pas pu être envoyés.`)
      else toast.success("Officiel ajouté avec succès.")
      closeEditor()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Officiels" subtitle="Liste des officiels enregistrés" />
      <div className="space-y-6 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher un officiel..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={organisationFilter} onValueChange={setOrganisationFilter}>
              <SelectTrigger className="w-full sm:w-64" aria-label="Filtrer par organisation"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TOUTES">Toutes les organisations</SelectItem>
                {organisations.map((item) => <SelectItem key={item.id} value={item.id}>{item.sigle || item.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setEditorOpen(true)}><Plus className="mr-2 h-4 w-4" />Ajouter un officiel</Button>
        </div>

        <Card className="border-border/50"><CardContent className="p-0"><div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/30">
              <TableHead>ID national</TableHead><TableHead>ID fédéral</TableHead><TableHead>Avatar</TableHead>
              <TableHead>Nom</TableHead><TableHead>Sexe</TableHead><TableHead>Date de naissance</TableHead>
              <TableHead>Organisation</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredOfficiels.map((officiel) => <TableRow key={officiel.id} className="hover:bg-muted/30">
                <TableCell>{officiel.idNational || "—"}</TableCell><TableCell>{officiel.idFederal || "—"}</TableCell>
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      key={officiel.avatar || officiel.id}
                      src={officiel.avatar || undefined}
                      alt={officiel.nomComplet}
                      referrerPolicy="no-referrer"
                    />
                    <AvatarFallback className="bg-primary/10 text-sm text-primary">
                      {initials(officiel.nomComplet)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{officiel.nomComplet || "—"}</TableCell><TableCell>{displaySexe(officiel.sexe)}</TableCell>
                <TableCell>{displayCivilDate(officiel.dateNaissance)}</TableCell><TableCell>{officiel.organisation ? <Badge variant="outline">{officiel.organisation}</Badge> : "—"}</TableCell>
                <TableCell>{officiel.statut ? <Badge variant="secondary">{officiel.statut}</Badge> : "—"}</TableCell>
                <TableCell className="text-right"><Link href={`/dashboard/acteurs/officiels/${officiel.id}`} prefetch={false}><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Voir l’officiel"><Eye className="h-4 w-4" /></Button></Link></TableCell>
              </TableRow>)}
              {filteredOfficiels.length === 0 && <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">Aucun officiel trouvé.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div></CardContent></Card>
        <p className="text-sm text-muted-foreground">Affichage de {filteredOfficiels.length} sur {officiels.length} officiels</p>
      </div>

      <Sheet open={editorOpen} onOpenChange={(open) => open ? setEditorOpen(true) : closeEditor()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader><SheetTitle>Ajouter un officiel</SheetTitle><SheetDescription>Renseignez l’identité et les informations personnelles. L’organisation sera ajoutée ensuite dans le parcours.</SheetDescription></SheetHeader>
          <div className="space-y-6 px-4">
            <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identité</h3><div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Nom complet *</Label><Input value={form.nom_complet} onChange={(e) => update("nom_complet", e.target.value)} /></div>
              <div className="space-y-2"><Label>Date de naissance</Label><Input type="date" value={form.date_de_naissance} onChange={(e) => update("date_de_naissance", e.target.value)} /></div>
              <div className="space-y-2"><Label>Lieu de naissance</Label><Input value={form.lieu_de_naissance} onChange={(e) => update("lieu_de_naissance", e.target.value)} /></div>
              <div className="space-y-2"><Label>Entité de rattachement *</Label><Select value={form.id_entite} onValueChange={(value) => update("id_entite",value)}><SelectTrigger><SelectValue placeholder="Choisir une entité" /></SelectTrigger><SelectContent>{organisations.map(item=><SelectItem key={item.id} value={item.id}>{item.sigle ? `${item.sigle} — ` : ""}{item.nom}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Sexe *</Label><Select value={form.id_sexe} onValueChange={(v) => update("id_sexe", v)}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><PersonSexOptions /></SelectContent></Select></div>
              <div className="space-y-2"><Label>Nationalité</Label><Input value={form.nationalite} onChange={(e) => update("nationalite", e.target.value)} /></div>
              <div className="space-y-2"><Label>Statut</Label><Select value={form.statut} onValueChange={(v) => update("statut", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
            </div></section>

            <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identifiants</h3><div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>ID national</Label><Input value={form.id_national} onChange={(e) => update("id_national", e.target.value)} /></div>
              <div className="space-y-2"><Label>ID de l’entité</Label><Input value={form.id_officiel_entite} onChange={(e) => update("id_officiel_entite", e.target.value)} /></div>
              <div className="space-y-2"><Label>ID international</Label><Input value={form.id_international} onChange={(e) => update("id_international", e.target.value)} /></div>
            </div></section>

            <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Coordonnées</h3><div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Téléphone</Label><Input type="tel" value={form.telephone} onChange={(e) => update("telephone", e.target.value)} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Adresse</Label><Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} /></div>
            </div></section>

            <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Passeport</h3><div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Numéro</Label><Input value={form.numéro_passeport} onChange={(e) => update("numéro_passeport", e.target.value)} /></div>
              <div className="space-y-2"><Label>Délivré le</Label><Input type="date" value={form.date_de_delivrance_passeport} onChange={(e) => update("date_de_delivrance_passeport", e.target.value)} /></div>
              <div className="space-y-2"><Label>Expire le</Label><Input type="date" value={form["date_expiration passeport"]} onChange={(e) => update("date_expiration passeport", e.target.value)} /></div>
            </div></section>

            <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fichiers</h3><div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg border p-4"><div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /><Label>Avatar</Label></div><ActorMediaInput type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => selectFile(e.target.files?.[0], "avatar")} /><p className="text-xs text-muted-foreground">{avatarFile?.name || "PNG, JPG ou WebP — 4 Mo maximum"}</p></div>
              <div className="space-y-2 rounded-lg border p-4"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><Label>Passeport</Label></div><ActorMediaInput type="file" accept=".pdf,application/pdf" onChange={(e) => selectFile(e.target.files?.[0], "passeport")} /><p className="text-xs text-muted-foreground">{passportFile?.name || "PDF — 4 Mo maximum"}</p></div>
            </div></section>
          </div>
          <SheetFooter><Button variant="outline" onClick={closeEditor}>Annuler</Button><Button onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

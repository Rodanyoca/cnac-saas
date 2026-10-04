"use client"
import { displayCivilDate } from "@/lib/cnac/model"
import { sexLabel } from "@/lib/cnac/display"
import { sexId } from "@/lib/cnac/display"
import { ActorMediaInput, PersonSexOptions } from "@/components/dashboard/cnac-actor-references"

import { apiFetch } from "@/lib/api/client"

import { Mail, MapPin, Pencil, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { ActorDetailLayout } from "@/components/dashboard/actor-detail-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { OfficialAffiliation } from "@/lib/acteurs/official-affiliations"
import { OfficialAffiliations } from "./official-affiliations"
import { ActorActivities } from "@/components/dashboard/actor-activities"
import { ActorNationalTeams } from "@/components/dashboard/actor-national-teams"

export type OrganisationOption = { id: string; sigle: string; nom: string }
export type OfficialFunctionOption = { id: string; nom: string }

export type OfficielDetail = {
  id: string
  idNational: string
  idFederal: string
  idInternational: string
  nomComplet: string
  sexe: string; idSexe?: string
  dateNaissance: string
  lieuNaissance: string
  nationalite: string
  organisationId: string
  organisation: string
  telephone: string
  email: string
  adresse: string
  statut: string
  avatarUrl: string | null
  urlPasseport: string | null
  numeroPasseport: string
  dateDelivrancePasseport: string
  dateExpirationPasseport: string
}

type EditForm = {
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



function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase()
}

export function OfficielDetailClient({
  officiel: initialOfficiel,
  organisations,
  functions,
  affiliations,
  affiliationsLoadError,
}: {
  officiel: OfficielDetail
  organisations: OrganisationOption[]
  functions: OfficialFunctionOption[]
  affiliations: OfficialAffiliation[]
  affiliationsLoadError: boolean
}) {
  const router = useRouter()
  const [officiel, setOfficiel] = useState(initialOfficiel)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [form, setForm] = useState<EditForm>({
    id_entite: initialOfficiel.organisationId,
    id_officiel_entite: initialOfficiel.idFederal,
    id_national: initialOfficiel.idNational,
    id_international: initialOfficiel.idInternational,
    nom_complet: initialOfficiel.nomComplet,
    id_sexe: initialOfficiel.idSexe || sexId(initialOfficiel.sexe),
    date_de_naissance: initialOfficiel.dateNaissance,
    lieu_de_naissance: initialOfficiel.lieuNaissance,
    nationalite: initialOfficiel.nationalite,
    telephone: initialOfficiel.telephone,
    email: initialOfficiel.email,
    adresse: initialOfficiel.adresse,
    numéro_passeport: initialOfficiel.numeroPasseport,
    date_de_delivrance_passeport: initialOfficiel.dateDelivrancePasseport,
    "date_expiration passeport": initialOfficiel.dateExpirationPasseport,
    statut: initialOfficiel.statut?.toUpperCase() || "",
  })

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectFile(file: File | undefined, type: "avatar" | "passeport") {
    if (!file) return
    const accepted = type === "avatar"
      ? ["image/png", "image/jpeg", "image/jpg", "image/webp"]
      : ["application/pdf"]
    if (!accepted.includes(file.type) || file.size > 4 * 1024 * 1024) {
      toast.error(type === "avatar" ? "Avatar invalide ou supérieur à 4 Mo." : "Passeport PDF invalide ou supérieur à 4 Mo.")
      return
    }
    if (type === "avatar") setAvatarFile(file)
    else setPassportFile(file)
  }

  async function upload(file: File, mediaType: "avatar" | "passeport") {
    const data = new FormData()
    data.append("file", file)
    data.append("mediaType", mediaType)
    data.append("actorType", "officiels")
    data.append("actorId", officiel.id)
    const response = await apiFetch("/api/upload-media", { method: "POST", body: data })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || "Échec du média")
    return result as { fileId: string; url: string }
  }

  async function save() {
    if (!form.nom_complet || !form.id_sexe) {
      toast.error("Nom et sexe sont obligatoires.")
      return
    }
    setSaving(true)
    try {
      const response = await apiFetch("/api/officiels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: officiel.id, row: form }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Modification impossible")

      const avatarResult = avatarFile ? await upload(avatarFile, "avatar") : null
      const passportResult = passportFile ? await upload(passportFile, "passeport") : null
      setOfficiel((current) => ({
        ...current,
        idNational: form.id_national,
        idFederal: form.id_officiel_entite,
        organisationId: form.id_entite,
        organisation: organisations.find(item => item.id === form.id_entite)?.sigle || organisations.find(item => item.id === form.id_entite)?.nom || form.id_entite,
        idInternational: form.id_international,
        nomComplet: form.nom_complet,
        sexe: sexLabel(form.id_sexe),
        dateNaissance: form.date_de_naissance,
        lieuNaissance: form.lieu_de_naissance,
        nationalite: form.nationalite,
        telephone: form.telephone,
        email: form.email,
        adresse: form.adresse,
        statut: form.statut === "INACTIF" ? "inactif" : "actif",
        avatarUrl: avatarResult?.url || current.avatarUrl,
        urlPasseport: passportResult?.url || current.urlPasseport,
        numeroPasseport: form.numéro_passeport,
        dateDelivrancePasseport: form.date_de_delivrance_passeport,
        dateExpirationPasseport: form["date_expiration passeport"],
      }))
      toast.success("Profil de l’officiel modifié.")
      setOpen(false)
      setAvatarFile(null)
      setPassportFile(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }

  const mainInfo = [
    { label: "ID national", value: officiel.idNational || "—" },
    { label: "ID fédéral", value: officiel.idFederal || "—" },
    { label: "ID international", value: officiel.idInternational || "—" },
    { label: "Nom complet", value: officiel.nomComplet || "—" },
    { label: "Sexe", value: sexLabel(officiel.sexe) },
    { label: "Date de naissance", value: displayCivilDate(officiel.dateNaissance) },
    { label: "Lieu de naissance", value: officiel.lieuNaissance || "—" },
    { label: "Nationalité", value: officiel.nationalite || "—" },
    { label: "Organisation", value: initialOfficiel.organisation ? <Badge variant="outline">{initialOfficiel.organisation}</Badge> : "—" },
  ]
  const contactInfo = [
    officiel.telephone ? { label: "Téléphone", value: officiel.telephone, icon: <Phone className="h-4 w-4" /> } : null,
    officiel.email ? { label: "E-mail", value: officiel.email, icon: <Mail className="h-4 w-4" /> } : null,
    officiel.adresse ? { label: "Adresse", value: officiel.adresse, icon: <MapPin className="h-4 w-4" /> } : null,
  ].filter(Boolean) as { label: string; value: string; icon: React.JSX.Element }[]

  return <>
    <ActorDetailLayout
      backHref="/dashboard/acteurs/officiels"
      backLabel="Retour aux officiels"
      title={officiel.nomComplet}
      subtitle={initialOfficiel.organisation || undefined}
      avatarInitials={initials(officiel.nomComplet)}
      avatarColorClass="bg-primary/10 text-primary"
      avatarUrl={officiel.avatarUrl}
      urlPasseport={officiel.urlPasseport}
      passportInfo={[
        { label: "N° Passeport", value: officiel.numeroPasseport || "—" },
        { label: "Délivré le", value: displayCivilDate(officiel.dateDelivrancePasseport) },
        { label: "Expire le", value: displayCivilDate(officiel.dateExpirationPasseport) },
      ]}
      actorType="officiels"
      actorId={officiel.id}
      showActorId={false}
      actorDateNaissance={displayCivilDate(officiel.dateNaissance)}
      actorSexe={officiel.sexe}
      status={officiel.statut}
      mainInfo={mainInfo}
      contactInfo={contactInfo}
      additionalSections={[{ id: "parcours", label: "Parcours", content: <OfficialAffiliations outOfScope officialId={officiel.id} initialRows={affiliations} organisations={organisations} functions={functions} loadError={affiliationsLoadError} /> }, ...activitySections(officiel.id)]}
      profileActions={<Button onClick={() => setOpen(true)}><Pencil className="mr-2 h-4 w-4" />Modifier</Button>}
    />

    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader><SheetTitle>Modifier l’officiel</SheetTitle><SheetDescription>Les nouveaux médias remplaceront les fichiers Drive existants.</SheetDescription></SheetHeader>
        <div className="grid gap-4 px-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label>Nom complet *</Label><Input value={form.nom_complet} onChange={(e) => update("nom_complet", e.target.value)} /></div>
          <div className="space-y-2"><Label>Date de naissance</Label><Input type="date" value={form.date_de_naissance} onChange={(e) => update("date_de_naissance", e.target.value)} /></div>
          <div className="space-y-2"><Label>Lieu de naissance</Label><Input value={form.lieu_de_naissance} onChange={(e) => update("lieu_de_naissance", e.target.value)} /></div>
          <div className="space-y-2"><Label>Entité de rattachement *</Label><Select value={form.id_entite} onValueChange={(value) => update("id_entite",value)}><SelectTrigger><SelectValue placeholder="Choisir une entité" /></SelectTrigger><SelectContent>{organisations.map(item=><SelectItem key={item.id} value={item.id}>{item.sigle ? `${item.sigle} — ` : ""}{item.nom}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Sexe *</Label><Select value={form.id_sexe} onValueChange={(v) => update("id_sexe", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><PersonSexOptions /></SelectContent></Select></div>
          <div className="space-y-2"><Label>Nationalité</Label><Input value={form.nationalite} onChange={(e) => update("nationalite", e.target.value)} /></div>
          <div className="space-y-2"><Label>Statut</Label><Select value={form.statut} onValueChange={(v) => update("statut", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>ID national</Label><Input value={form.id_national} onChange={(e) => update("id_national", e.target.value)} /></div>
          <div className="space-y-2"><Label>ID de l’entité</Label><Input value={form.id_officiel_entite} onChange={(e) => update("id_officiel_entite", e.target.value)} /></div>
          <div className="space-y-2"><Label>ID international</Label><Input value={form.id_international} onChange={(e) => update("id_international", e.target.value)} /></div>
          <div className="space-y-2"><Label>Téléphone</Label><Input value={form.telephone} onChange={(e) => update("telephone", e.target.value)} /></div>
          <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Adresse</Label><Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} /></div>
          <div className="space-y-2"><Label>N° passeport</Label><Input value={form.numéro_passeport} onChange={(e) => update("numéro_passeport", e.target.value)} /></div>
          <div className="space-y-2"><Label>Délivré le</Label><Input type="date" value={form.date_de_delivrance_passeport} onChange={(e) => update("date_de_delivrance_passeport", e.target.value)} /></div>
          <div className="space-y-2"><Label>Expire le</Label><Input type="date" value={form["date_expiration passeport"]} onChange={(e) => update("date_expiration passeport", e.target.value)} /></div>
          <div className="space-y-2"><Label>Remplacer l’avatar</Label><ActorMediaInput type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => selectFile(e.target.files?.[0], "avatar")} /></div>
          <div className="space-y-2"><Label>Remplacer le passeport</Label><ActorMediaInput type="file" accept=".pdf,application/pdf" onChange={(e) => selectFile(e.target.files?.[0], "passeport")} /></div>
        </div>
        <div className="border-t px-4 pt-5"><OfficialAffiliations outOfScope officialId={officiel.id} initialRows={affiliations} organisations={organisations} functions={functions} loadError={affiliationsLoadError} compact canEdit /></div>
        <SheetFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  </>
}

const activitySections = (actorId: string) => [
  { id: "equipes-nationales", label: "Équipes nationales", content: <ActorNationalTeams actorId={actorId} /> },
  { id: "activites", label: "Activités", content: <ActorActivities actorId={actorId} /> },
]

"use client"
import { AthleteAffiliationFields, AthleteAffiliationSummary } from "@/components/dashboard/athlete-affiliation"
import { AthleteTeamTraining } from "@/components/dashboard/team-training-summary"
import { updateAffiliation, type AffiliationReferences } from "@/lib/cnac/affiliation-model"
import { displayCivilDate } from "@/lib/cnac/model"
import { sexLabel } from "@/lib/cnac/display"
import { sexId } from "@/lib/cnac/display"
import { useCnacActorReferences, PersonSexOptions } from "@/components/dashboard/cnac-actor-references"

import { confirmedSave } from "@/lib/api/confirmed-save"
import { ImageSelection } from "@/components/dashboard/image-selection"

import { Mail, MapPin, Pencil, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { ActorDetailLayout } from "@/components/dashboard/actor-detail-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { FederationOption } from "../athletes-client"

export type AthleteDetail = {
  observations?: string
  idClub: string
  idEquipe: string
  id: string
  idFederation: string
  idNational: string
  idFederal: string
  idInternational: string
  nomComplet: string
  sexe: string; idSexe?: string
  dateNaissance: string
  lieuNaissance: string
  federation: string
  telephone: string
  email: string
  adresse: string
  statut?: string
  avatarUrl: string | null
}
type EditForm = {
  id_club_cnac: string
  id_equipe_cnac: string
  id_national: string
  id_athlete_federation: string
  id_federation_internationale: string
  nom_complet: string
  date_de_naissance: string
  lieu_de_naissance: string
  id_federation: string
  id_sexe: string; idSexe?: string
  telephone: string
  email: string
  adresse: string
  statut: string
}



function getAgeFromDateString(dateString: string) {
  if (!dateString) return null
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const frenchMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const parts = isoMatch
    ? [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])]
    : frenchMatch
      ? [Number(frenchMatch[3]), Number(frenchMatch[2]), Number(frenchMatch[1])]
      : null
  if (!parts) return null
  const birthDate = new Date(parts[0], parts[1] - 1, parts[2])
  if (Number.isNaN(birthDate.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) age -= 1
  return age
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase()
}

export function AthleteDetailClient({
  athlete: initialAthlete,
  federations,
  affiliationRefs,
}: {
  athlete: AthleteDetail
  federations: FederationOption[]
  affiliationRefs: AffiliationReferences
}) {
  const router = useRouter()
  const [athlete, setAthlete] = useState(initialAthlete)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const saveTicket = useRef("")
  const [pendingSave, setPendingSave] = useState(false)
  const { uploads } = useCnacActorReferences()
  const formFromAthlete = (): EditForm => ({
    id_club_cnac: athlete.idClub,
    id_equipe_cnac: athlete.idEquipe,
    id_national: athlete.idNational,
    id_athlete_federation: athlete.idFederal,
    id_federation_internationale: athlete.idInternational,
    nom_complet: athlete.nomComplet,
    date_de_naissance: athlete.dateNaissance,
    lieu_de_naissance: athlete.lieuNaissance,
    id_federation: athlete.idFederation,
    id_sexe: athlete.idSexe || sexId(athlete.sexe),
    telephone: athlete.telephone,
    email: athlete.email,
    adresse: athlete.adresse,
    statut: athlete.statut === "inactif" ? "INACTIF" : "ACTIF",
  })
  const [form, setForm] = useState<EditForm>(formFromAthlete)
  function openEditor() { setForm(formFromAthlete()); setAvatarFile(null); saveTicket.current = ""; setOpen(true) }

  const age = getAgeFromDateString(athlete.dateNaissance)
  const federationReference = federations.find((item) => item.id === athlete.idFederation)
  const federationLabel = federationReference?.sigle || federationReference?.nom || athlete.federation || athlete.idFederation
  const mainInfo = [
    { label: "ID national", value: athlete.idNational || "—" },
    { label: "ID fédéral", value: athlete.idFederal || "—" },
    { label: "ID international", value: athlete.idInternational || "—" },
    { label: "Nom complet", value: athlete.nomComplet || "—" },
    { label: "Sexe", value: sexLabel(athlete.sexe) },
    { label: "Date de naissance", value: athlete.dateNaissance ? `${displayCivilDate(athlete.dateNaissance)}${age === null ? "" : ` (${age} ans)`}` : "—" },
    { label: "Lieu de naissance", value: athlete.lieuNaissance || "—" },
  ]
  const contactInfo = [
    athlete.telephone ? { label: "Téléphone", value: athlete.telephone, icon: <Phone className="h-4 w-4" /> } : null,
    athlete.email ? { label: "E-mail", value: athlete.email, icon: <Mail className="h-4 w-4" /> } : null,
    athlete.adresse ? { label: "Adresse", value: athlete.adresse, icon: <MapPin className="h-4 w-4" /> } : null,
  ].filter(Boolean) as { label: string; value: string; icon: React.JSX.Element }[]

  function update(key: keyof EditForm, value: string) {
    setForm((current) => updateAffiliation(current, key, value))
  }

  async function save() {
    if (!form.nom_complet || !form.id_federation || !form.id_sexe) {
      toast.error("Nom, fédération et sexe sont obligatoires.")
      return
    }
    setSaving(true); setSaveError("")
    try {
      const result = await confirmedSave("/api/athletes", "PUT", { id: athlete.id, row: form }, avatarFile, "avatar", saveTicket)
      const selectedFederation = federations.find((item) => item.id === form.id_federation)

      setAthlete((current) => ({
        ...current,
        idFederation: form.id_federation,
        idClub: form.id_club_cnac,
        idEquipe: form.id_equipe_cnac,
        idSexe: form.id_sexe,
        idNational: form.id_national,
        idFederal: form.id_athlete_federation,
        idInternational: form.id_federation_internationale,
        nomComplet: form.nom_complet,
        sexe: sexLabel(form.id_sexe),
        dateNaissance: form.date_de_naissance,
        lieuNaissance: form.lieu_de_naissance,
        federation: selectedFederation?.sigle || selectedFederation?.nom || form.id_federation,
        telephone: form.telephone,
        email: form.email,
        adresse: form.adresse,
        statut: form.statut === "INACTIF" ? "inactif" : "actif",
        avatarUrl: result.row?.avatar_drive_url || current.avatarUrl,
      }))

      toast.success("Profil de l’athlète modifié.")
      setOpen(false)
      setAvatarFile(null)
      saveTicket.current = ""
      router.refresh()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Enregistrement impossible.")
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setPendingSave(Boolean(saveTicket.current))
      setSaving(false)
    }
  }

  return (
    <>
      <ActorDetailLayout
        backHref="/dashboard/acteurs/athletes"
        backLabel="Retour aux athlètes"
        title={athlete.nomComplet}
        subtitle={federationLabel || undefined}
        avatarInitials={initials(athlete.nomComplet)}
        avatarColorClass="bg-primary/10 text-primary"
        avatarUrl={athlete.avatarUrl}
        actorType="athletes"
        actorId={athlete.id}
        showActorId={false}
        actorDateNaissance={displayCivilDate(athlete.dateNaissance)}
        actorSexe={athlete.sexe}
        status={athlete.statut}
        showDocuments={false}
        observations={athlete.observations || ""}
        mainInfo={mainInfo}
        contactInfo={contactInfo}
        additionalSections={[
          { id: "affiliations", label: "Affiliations", content: <Card><CardHeader><CardTitle>Affiliations sportives</CardTitle></CardHeader><CardContent><AthleteAffiliationSummary detailed refs={affiliationRefs} value={{id_federation: athlete.idFederation, id_club_cnac: athlete.idClub, id_equipe_cnac: athlete.idEquipe}} /></CardContent></Card> },
          { id: "localisation", label: "Localisation", content: <AthleteTeamTraining teams={affiliationRefs.EQUIPES || []} affiliation={{ id_equipe_cnac: athlete.idEquipe, id_club_cnac: athlete.idClub, id_federation: athlete.idFederation }} /> },
          ...(["controles", "aut"] as const).map(id => ({ id, label: id === "controles" ? "Contrôles" : "AUT", content: <Card><CardHeader><CardTitle>{id === "controles" ? "Contr\u00f4les" : "AUT"}</CardTitle></CardHeader><CardContent className="py-10 text-center text-muted-foreground">Coming soon</CardContent></Card> })),
        ]}
        profileActions={<Button onClick={openEditor}><Pencil className="mr-2 h-4 w-4" />Modifier</Button>}
      />

      <Sheet open={open} onOpenChange={value => { if (!saving && !saveTicket.current) setOpen(value) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Modifier l’athlète</SheetTitle>
            <SheetDescription>Les nouveaux médias remplaceront les fichiers Drive existants.</SheetDescription>
          </SheetHeader>
          <fieldset disabled={saving || pendingSave} className="min-w-0 space-y-6 px-4">
            <AthleteAffiliationFields value={form} refs={affiliationRefs} update={update} />
            <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identité</h3><div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Nom complet *</Label><Input value={form.nom_complet} onChange={(e) => update("nom_complet", e.target.value)} /></div>
              <div className="space-y-2"><Label>Date de naissance</Label><Input type="date" value={form.date_de_naissance} onChange={(e) => update("date_de_naissance", e.target.value)} /></div>
              <div className="space-y-2"><Label>Lieu de naissance</Label><Input value={form.lieu_de_naissance} onChange={(e) => update("lieu_de_naissance", e.target.value)} /></div>
              <div className="space-y-2"><Label>Sexe *</Label><Select value={form.id_sexe} onValueChange={(v) => update("id_sexe", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><PersonSexOptions /></SelectContent></Select></div>
              <div className="space-y-2"><Label>Statut</Label><Select value={form.statut} onValueChange={(v) => update("statut", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
            </div></section>
            <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identifiants</h3><div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>ID national</Label><Input value={form.id_national} onChange={(e) => update("id_national", e.target.value)} /></div>
              <div className="space-y-2"><Label>ID fédéral</Label><Input value={form.id_athlete_federation} onChange={(e) => update("id_athlete_federation", e.target.value)} /></div>
              <div className="space-y-2"><Label>ID international</Label><Input value={form.id_federation_internationale} onChange={(e) => update("id_federation_internationale", e.target.value)} /></div>
            </div></section>
            <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Coordonnées</h3><div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Téléphone</Label><Input type="tel" value={form.telephone} onChange={(e) => update("telephone", e.target.value)} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Adresse</Label><Input value={form.adresse} onChange={(e) => update("adresse", e.target.value)} /></div>
            </div></section>

            <section className="space-y-4"><ImageSelection label="Photo de profil" file={avatarFile} onChange={setAvatarFile} existingUrl={athlete.avatarUrl || ""} disabled={saving || pendingSave || !uploads.avatar} /></section>
          </fieldset>
          <SheetFooter>
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <Button variant="outline" disabled={saving || pendingSave} onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

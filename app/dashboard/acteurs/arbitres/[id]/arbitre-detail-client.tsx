"use client"
import { sexLabel } from "@/lib/cnac/display"
import { displayCivilDate } from "@/lib/cnac/model"
import { sexId } from "@/lib/cnac/display"

import { apiFetch } from "@/lib/api/client"

import { Mail, MapPin, Pencil, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import type { FederationOption } from "@/lib/federations/options"
import { ActorDetailLayout } from "@/components/dashboard/actor-detail-layout"
import { ActorActivities } from "@/components/dashboard/actor-activities"
import { ActorNationalTeams } from "@/components/dashboard/actor-national-teams"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ArbitreFields, emptyArbitreForm, type ArbitreForm, type GradeOption } from "../arbitres-client"

export type ArbitreDetail = { id: string; idFederation: string; idFederal: string; idNational: string; idInternational: string; nomComplet: string; sexe: string; idSexe?: string; dateNaissance: string; lieuNaissance: string; nationalite: string; federation: string; idGrade: string; grade: string; dateAffiliation: string; telephone: string; email: string; adresse: string; numeroPasseport: string; dateDelivrancePasseport: string; dateExpirationPasseport: string; statut: string; avatarUrl: string | null; urlPasseport: string | null }
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()


export function ArbitreDetailClient({ arbitre: initial, federations, grades }: { arbitre: ArbitreDetail; federations: FederationOption[]; grades: GradeOption[] }) {
  const router = useRouter()
  const [arbitre, setArbitre] = useState(initial)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [passport, setPassport] = useState<File | null>(null)
  const [form, setForm] = useState<ArbitreForm>({ ...emptyArbitreForm, id_arbitre_federation: initial.idFederal, id_federation: initial.idFederation, id_national: initial.idNational, id_international: initial.idInternational, nom_complet: initial.nomComplet, id_sexe: initial.idSexe || sexId(initial.sexe), date_de_naissance: initial.dateNaissance, lieu_de_naissance: initial.lieuNaissance, nationalite: initial.nationalite, telephone: initial.telephone, email: initial.email, adresse: initial.adresse, id_grade: initial.idGrade, date_affiliation: initial.dateAffiliation, numero_passeport: initial.numeroPasseport, date_de_delivrance_passeport: initial.dateDelivrancePasseport, date_expiration_passeport: initial.dateExpirationPasseport, statut: initial.statut?.toUpperCase() || "" })
  function update<K extends keyof ArbitreForm>(key: K, value: ArbitreForm[K]) { setForm((current) => ({ ...current, [key]: value })) }
  function pick(file: File | undefined, type: "avatar" | "passeport") { if (!file) return; const valid = type === "avatar" ? ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type) : file.type === "application/pdf"; if (!valid || file.size > 5 * 1024 * 1024) return toast.error("Fichier invalide ou supérieur à 5 Mo."); if (type === "avatar") setAvatar(file); else setPassport(file) }
  async function upload(file: File, type: "avatar" | "passeport") { const data = new FormData(); data.append("file", file); data.append("mediaType", type); data.append("actorType", "arbitres"); data.append("actorId", arbitre.id); const res = await apiFetch("/api/upload-media", { method: "POST", body: data }); const out = await res.json(); if (!res.ok) throw new Error(out.error || "Échec du média"); return out as { url: string } }
  async function save() {
    if (!form.nom_complet || !form.id_federation || !form.id_sexe) return toast.error("Nom, fédération et sexe sont obligatoires.")
    setSaving(true)
    try {
      const res = await apiFetch("/api/arbitres", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: arbitre.id, row: form }) })
      const out = await res.json(); if (!res.ok) throw new Error(out.error || "Modification impossible")
      const av = avatar ? await upload(avatar, "avatar") : null; const pp = passport ? await upload(passport, "passeport") : null
      const federation = federations.find((item) => item.id === form.id_federation); const grade = grades.find((item) => item.id === form.id_grade)
      setArbitre((current) => ({ ...current, idFederation: form.id_federation, idFederal: form.id_arbitre_federation, idNational: form.id_national, idInternational: form.id_international, nomComplet: form.nom_complet, sexe: form.id_sexe, dateNaissance: form.date_de_naissance, lieuNaissance: form.lieu_de_naissance, nationalite: form.nationalite, federation: federation?.nom || "", idGrade: form.id_grade, grade: grade?.nom || "", dateAffiliation: form.date_affiliation, telephone: form.telephone, email: form.email, adresse: form.adresse, numeroPasseport: form.numero_passeport, dateDelivrancePasseport: form.date_de_delivrance_passeport, dateExpirationPasseport: form.date_expiration_passeport, statut: form.statut === "INACTIF" ? "inactif" : "actif", avatarUrl: av?.url || current.avatarUrl, urlPasseport: pp?.url || current.urlPasseport }))
      toast.success("Arbitre modifié."); setOpen(false); setAvatar(null); setPassport(null); router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)) } finally { setSaving(false) }
  }
  const info = [{ label: "ID national", value: arbitre.idNational || "—" }, { label: "ID fédéral", value: arbitre.idFederal || "—" }, { label: "ID international", value: arbitre.idInternational || "—" }, { label: "Nom complet", value: arbitre.nomComplet }, { label: "Sexe", value: sexLabel(arbitre.sexe) }, { label: "Date de naissance", value: displayCivilDate(arbitre.dateNaissance) }, { label: "Lieu de naissance", value: arbitre.lieuNaissance || "—" }, { label: "Nationalité", value: arbitre.nationalite || "—" }, { label: "Fédération", value: arbitre.federation ? <Badge variant="outline">{arbitre.federation}</Badge> : "—" }, { label: "Grade", value: arbitre.grade || "—" }, { label: "Date d’affiliation", value: arbitre.dateAffiliation || "—" }]
  const contacts = [arbitre.telephone ? { label: "Téléphone", value: arbitre.telephone, icon: <Phone className="h-4 w-4" /> } : null, arbitre.email ? { label: "E-mail", value: arbitre.email, icon: <Mail className="h-4 w-4" /> } : null, arbitre.adresse ? { label: "Adresse", value: arbitre.adresse, icon: <MapPin className="h-4 w-4" /> } : null].filter(Boolean) as { label: string; value: string; icon: React.JSX.Element }[]
  return <><ActorDetailLayout backHref="/dashboard/acteurs/arbitres" backLabel="Retour aux arbitres" title={arbitre.nomComplet} subtitle={arbitre.grade || arbitre.federation || undefined} avatarInitials={initials(arbitre.nomComplet)} avatarColorClass="bg-chart-5/10 text-chart-5" avatarUrl={arbitre.avatarUrl} urlPasseport={arbitre.urlPasseport} passportInfo={[{ label: "N° Passeport", value: arbitre.numeroPasseport || "—" }, { label: "Délivré le", value: displayCivilDate(arbitre.dateDelivrancePasseport) }, { label: "Expire le", value: displayCivilDate(arbitre.dateExpirationPasseport) }]} actorType="arbitres" actorId={arbitre.id} showActorId={false} actorDateNaissance={displayCivilDate(arbitre.dateNaissance)} actorSexe={arbitre.sexe} status={arbitre.statut} mainInfo={info} contactInfo={contacts} additionalSections={activitySections(arbitre.id)} profileActions={<Button onClick={() => setOpen(true)}><Pencil className="mr-2 h-4 w-4" />Modifier</Button>} />
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader><SheetTitle>Modifier l’arbitre</SheetTitle><SheetDescription>Le grade est alimenté par le référentiel GRADES_ARBITRE.</SheetDescription></SheetHeader><ArbitreFields form={form} update={update} federations={federations} grades={grades} pick={pick} /><SheetFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button disabled={saving} onClick={save}>{saving ? "Enregistrement..." : "Enregistrer"}</Button></SheetFooter></SheetContent></Sheet></>
}

const activitySections = (actorId: string) => [
  { id: "equipes-nationales", label: "Équipes nationales", content: <ActorNationalTeams actorId={actorId} /> },
  { id: "activites", label: "Activités", content: <ActorActivities actorId={actorId} /> },
]

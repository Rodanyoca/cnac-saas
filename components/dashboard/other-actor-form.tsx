"use client"
import { ActorMediaInput } from "@/components/dashboard/cnac-actor-references"

import { FileText, ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { OtherActorReferences } from "@/lib/acteurs/autres-model"

export type OtherActorFormValue = { id_entite: string; id_autre_acteur_entite: string; nom_complet: string; id_sexe: string; date_de_naissance: string; lieu_de_naissance: string; nationalite: string; type_autre_acteur: string; telephone: string; email: string; adresse: string; numero_passeport: string; date_de_delivrance_passeport: string; date_expiration_passeport: string; statut: string; observations: string }
export const emptyOtherActorForm: OtherActorFormValue = { id_entite: "", id_autre_acteur_entite: "", nom_complet: "", id_sexe: "", date_de_naissance: "", lieu_de_naissance: "", nationalite: "", type_autre_acteur: "", telephone: "", email: "", adresse: "", numero_passeport: "", date_de_delivrance_passeport: "", date_expiration_passeport: "", statut: "ACTIF", observations: "" }

export function OtherActorForm({ value, onChange, references, avatarFile, passportFile, onAvatarChange, onPassportChange }: { value: OtherActorFormValue; onChange: (value: OtherActorFormValue) => void; references: OtherActorReferences; avatarFile?: File | null; passportFile?: File | null; onAvatarChange?: (file?: File) => void; onPassportChange?: (file?: File) => void }) {
  const update = (key: keyof OtherActorFormValue, next: string) => onChange({ ...value, [key]: next })
  const federationEntities = new Set(references.federations.map((item) => item.entityId))
  return <div className="grid gap-4 px-4 sm:grid-cols-2">
    <Field label="Nom complet *"><Input value={value.nom_complet} onChange={(event) => update("nom_complet", event.target.value)} /></Field>
    <Field label="Fonction ou qualité"><Input list="other-actor-functions" value={value.type_autre_acteur} onChange={(event) => update("type_autre_acteur", event.target.value)} /><datalist id="other-actor-functions">{references.functions.map((item) => <option key={item} value={item} />)}</datalist></Field>
    <Field label="Entité ou fédération" wide><Select value={value.id_entite} onValueChange={(next) => update("id_entite", next)}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un rattachement" /></SelectTrigger><SelectContent>{references.entities.map((entity) => <SelectItem key={entity.id} value={entity.id}>{entity.acronym ? `${entity.acronym} — ` : ""}{entity.name}{federationEntities.has(entity.id) ? " · Fédération" : ""}</SelectItem>)}</SelectContent></Select></Field>
    <Field label="Sexe"><Select value={value.id_sexe} onValueChange={(next) => update("id_sexe", next)}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{references.sexes.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></Field>
    <Field label="Statut"><Select value={value.statut} onValueChange={(next) => update("statut", next)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{references.statuses.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
    <Field label="ID dans l’entité"><Input value={value.id_autre_acteur_entite} onChange={(event) => update("id_autre_acteur_entite", event.target.value)} /></Field>
    <Field label="Date de naissance"><Input type="date" value={value.date_de_naissance} onChange={(event) => update("date_de_naissance", event.target.value)} /></Field><Field label="Lieu de naissance"><Input value={value.lieu_de_naissance} onChange={(event) => update("lieu_de_naissance", event.target.value)} /></Field><Field label="Nationalité"><Input value={value.nationalite} onChange={(event) => update("nationalite", event.target.value)} /></Field>
    <Field label="Téléphone"><Input type="tel" value={value.telephone} onChange={(event) => update("telephone", event.target.value)} /></Field><Field label="Adresse électronique"><Input type="email" value={value.email} onChange={(event) => update("email", event.target.value)} /></Field><Field label="Adresse" wide><Input value={value.adresse} onChange={(event) => update("adresse", event.target.value)} /></Field>
    <Field label="Numéro de passeport"><Input value={value.numero_passeport} onChange={(event) => update("numero_passeport", event.target.value)} /></Field><Field label="Délivré le"><Input type="date" value={value.date_de_delivrance_passeport} onChange={(event) => update("date_de_delivrance_passeport", event.target.value)} /></Field><Field label="Expire le"><Input type="date" value={value.date_expiration_passeport} onChange={(event) => update("date_expiration_passeport", event.target.value)} /></Field>
    <div className="space-y-2 rounded-lg border p-4"><div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /><Label htmlFor="other-actor-avatar">Avatar</Label></div><ActorMediaInput id="other-actor-avatar" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(event) => onAvatarChange?.(event.target.files?.[0])} /><p className="text-xs text-muted-foreground">{avatarFile?.name || "PNG, JPG ou WebP — 4 Mo maximum"}</p></div>
    <div className="space-y-2 rounded-lg border p-4"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><Label htmlFor="other-actor-passport">Passeport</Label></div><ActorMediaInput id="other-actor-passport" type="file" accept=".pdf,application/pdf" onChange={(event) => onPassportChange?.(event.target.files?.[0])} /><p className="text-xs text-muted-foreground">{passportFile?.name || "PDF — 4 Mo maximum"}</p></div>
    <Field label="Observations" wide><Input value={value.observations} onChange={(event) => update("observations", event.target.value)} /></Field>
  </div>
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <div className={`space-y-2 ${wide ? "sm:col-span-2" : ""}`}><Label>{label}</Label>{children}</div> }

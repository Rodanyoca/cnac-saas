"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { competitionFormError, scopeForCompetitionType } from "@/lib/competitions/form-validation"
import type { Competition, CompetitionOption } from "@/lib/competitions/types"

export const emptyCompetitionForm = { nom_competition: "", id_type_competition: "", est_multisport: "NON", niveau_competition: "", date_debut: "", date_fin: "", pays: "", ville: "", lieu: "", statut: "PLANIFIEE", observations: "" }
export type CompetitionFormValue = typeof emptyCompetitionForm

export function competitionToForm(item: Competition): CompetitionFormValue {
  return Object.fromEntries(Object.keys(emptyCompetitionForm).map((key) => [key, item[key as keyof Competition] || ""])) as CompetitionFormValue
}

export function CompetitionForm({ value, onChange, types, levels = [], statuses = [], saving, submitLabel = "Enregistrer", onSubmit, onCancel }: { value: CompetitionFormValue; onChange: (value: CompetitionFormValue) => void; types: CompetitionOption[]; levels?: CompetitionOption[]; statuses?: CompetitionOption[]; saving: boolean; submitLabel?: string; onSubmit: () => void; onCancel?: () => void }) {
  const update = (key: keyof CompetitionFormValue, fieldValue: string) => onChange({ ...value, [key]: fieldValue })
  const error = competitionFormError(value, types, levels, statuses)
  const updateType = (typeId: string) => {
    const scope = scopeForCompetitionType(typeId, types)
    onChange({ ...value, id_type_competition: typeId, ...(scope ? { est_multisport: scope } : {}) })
  }
  const updateStartDate = (date: string) => onChange({
    ...value,
    date_debut: date,
    date_fin: value.date_fin && value.date_fin < date ? "" : value.date_fin,
  })
  const input = (label: string, key: keyof CompetitionFormValue, type = "text", required = false) => <div className="space-y-2"><Label htmlFor={key} className="text-sm font-medium text-muted-foreground">{label}{required ? " *" : ""}</Label><Input id={key} type={type} value={value[key]} onChange={(event) => update(key, event.target.value)} required={required} /></div>
  return <div className="space-y-6 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-[0_10px_30px_rgba(7,25,54,0.12)] sm:p-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="nom_competition" className="text-sm font-medium text-muted-foreground">Nom de la compétition *</Label><Input id="nom_competition" value={value.nom_competition} onChange={(event) => update("nom_competition", event.target.value)} /></div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Type de compétition *</Label><Select value={value.id_type_competition} onValueChange={updateType}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{types.map((type) => <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>)}</SelectContent></Select>{!types.length && <p className="text-xs text-destructive">Le référentiel TYPES_COMPETITION est vide.</p>}</div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Portée *</Label><Select value={value.est_multisport} onValueChange={(fieldValue) => update("est_multisport", fieldValue)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NON">Monosport</SelectItem><SelectItem value="OUI">Multisports</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Niveau *</Label><Select value={value.niveau_competition} onValueChange={(fieldValue) => update("niveau_competition", fieldValue)}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{levels.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="date_debut" className="text-sm font-medium text-muted-foreground">Date de début *</Label><Input id="date_debut" type="date" value={value.date_debut} onChange={(event) => updateStartDate(event.target.value)} required /></div>
      <div className="space-y-2"><Label htmlFor="date_fin" className="text-sm font-medium text-muted-foreground">Date de fin *</Label><Input id="date_fin" type="date" min={value.date_debut || undefined} value={value.date_fin} onChange={(event) => update("date_fin", event.target.value)} required /></div>
      {input("Pays", "pays")}{input("Ville", "ville")}{input("Lieu", "lieu")}
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Statut *</Label><Select value={value.statut} onValueChange={(fieldValue) => update("statut", fieldValue)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="observations" className="text-sm font-medium text-muted-foreground">Observations</Label><Textarea id="observations" value={value.observations} onChange={(event) => update("observations", event.target.value)} rows={4} /></div>
    </div>
    {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="status">{error}</div>}
    <div className="flex justify-end gap-2">{onCancel && <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>}<Button type="button" disabled={saving || Boolean(competitionFormError(value, types, levels, statuses))} onClick={onSubmit}>{saving ? "Enregistrement…" : submitLabel}</Button></div>
  </div>
}

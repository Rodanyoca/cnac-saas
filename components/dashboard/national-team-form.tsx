"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { NationalTeam, NationalTeamReferences } from "@/lib/equipes-nationales/types"

export const emptyNationalTeamForm = { id_federation: "", id_sport: "", id_discipline: "", nom_equipe_nationale: "", id_categorie_age: "", id_saison:"", statut: "ACTIF", observations: "" }
export type NationalTeamFormValue = typeof emptyNationalTeamForm
export const nationalTeamToForm = (team: NationalTeam) => Object.fromEntries(Object.keys(emptyNationalTeamForm).map((key) => [key, team[key as keyof NationalTeam] || ""])) as NationalTeamFormValue

export function NationalTeamForm({ value, onChange, references, saving, onSubmit, onCancel, editing = false }: { value: NationalTeamFormValue; onChange: (value: NationalTeamFormValue) => void; references: NationalTeamReferences; saving: boolean; onSubmit: () => void; onCancel?: () => void; editing?: boolean }) {
  const federation = references.federations.find((item) => item.id === value.id_federation)
  const disciplineOptions = references.disciplines.filter((item) => item.parentId === value.id_sport)
  const categoryParent = value.id_discipline || value.id_sport
  const categoryOptions = references.ageCategories.filter((item) => item.parentId === categoryParent)
  const update = (key: keyof NationalTeamFormValue, next: string) => {
    if (key === "id_federation") {
      const selected = references.federations.find((item) => item.id === next)
      onChange({ ...value, id_federation: next, id_sport: selected?.parentId || "", id_discipline: "", id_categorie_age: "" })
      return
    }
    if (key === "id_sport") { onChange({ ...value, id_sport: next, id_discipline: "", id_categorie_age: "" }); return }
    if (key === "id_discipline") { onChange({ ...value, id_discipline: next, id_categorie_age: "" }); return }
    onChange({ ...value, [key]: next })
  }
  const seasons=references.seasons||[],season=seasons.find((item)=>item.id===value.id_saison)

  return <div className="space-y-6 rounded-2xl border border-border/80 bg-card/60 p-4 shadow-[0_10px_30px_rgba(7,25,54,0.12)] sm:p-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Fédération *</Label><Select disabled={editing} value={value.id_federation} onValueChange={(next) => update("id_federation", next)}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent>{references.federations.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}{item.secondary ? ` — ${item.secondary}` : ""}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Sport *</Label>{federation?.parentId || editing ? <Input value={references.sports.find((item) => item.id === value.id_sport)?.label || value.id_sport} readOnly className="bg-muted" /> : <><Select value={value.id_sport} onValueChange={(next) => update("id_sport", next)}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner le sport" /></SelectTrigger><SelectContent>{references.sports.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select>{federation && <p className="text-xs text-amber-500">Le sport n’est pas renseigné sur cette fédération dans le référentiel. Sélection manuelle requise.</p>}</>}</div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Discipline</Label><Select disabled={!value.id_sport || disciplineOptions.length === 0} value={value.id_discipline || "aucune"} onValueChange={(next) => update("id_discipline", next === "aucune" ? "" : next)}><SelectTrigger className="w-full"><SelectValue placeholder="Non renseignée" /></SelectTrigger><SelectContent><SelectItem value="aucune">Non renseignée</SelectItem>{disciplineOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select>{value.id_sport && disciplineOptions.length === 0 && <p className="text-xs text-muted-foreground">Aucune discipline n’est configurée pour ce sport.</p>}</div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Catégorie d’âge</Label><Select disabled={!categoryParent || categoryOptions.length === 0} value={value.id_categorie_age || "aucune"} onValueChange={(next) => update("id_categorie_age", next === "aucune" ? "" : next)}><SelectTrigger className="w-full"><SelectValue placeholder="Non renseignée" /></SelectTrigger><SelectContent><SelectItem value="aucune">Non renseignée</SelectItem>{categoryOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select>{categoryParent && categoryOptions.length === 0 && <p className="text-xs text-muted-foreground">Aucune catégorie n’est configurée pour ce sport ou cette discipline.</p>}</div>
      <div className="space-y-2 sm:col-span-2"><Label className="text-sm font-medium text-muted-foreground">Nom de l’équipe nationale *</Label><Input value={value.nom_equipe_nationale} onChange={(event) => update("nom_equipe_nationale", event.target.value)} /></div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Statut *</Label><Select value={value.statut} onValueChange={(next) => update("statut", next)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIF">Actif</SelectItem><SelectItem value="INACTIF">Inactif</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label className="text-sm font-medium text-muted-foreground">Saison *</Label><Select disabled={editing} value={value.id_saison} onValueChange={(next)=>update("id_saison",next)}><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner une saison"/></SelectTrigger><SelectContent>{seasons.map((item)=><SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select>{season&&<p className="text-xs text-muted-foreground">Du {season.dateStart} au {season.dateEnd}</p>}</div>
      <div className="space-y-2 sm:col-span-2"><Label className="text-sm font-medium text-muted-foreground">Observations</Label><Textarea value={value.observations} onChange={(event) => update("observations", event.target.value)} /></div>
    </div>
    <div className="flex justify-end gap-2">{onCancel && <Button variant="outline" onClick={onCancel}>Annuler</Button>}<Button disabled={saving} onClick={onSubmit}>{saving ? "Enregistrement…" : "Enregistrer"}</Button></div>
  </div>
}

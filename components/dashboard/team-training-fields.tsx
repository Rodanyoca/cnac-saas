"use client"

import { useId } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { readTrainingSlots, trainingDays, validateTraining, type TrainingSlot } from "@/lib/cnac/team-training"

const timezones = Array.from(new Set(["Africa/Kinshasa", "Africa/Lubumbashi", "UTC", ...Intl.supportedValuesOf("timeZone")]))

export function TeamTrainingFields({ row, update }: { row: Record<string, string>; update: (key: string, value: string) => void }) {
  const prefix = useId()
  let slots: TrainingSlot[] = [], anomaly = "", error = ""
  try { slots = readTrainingSlots(row.planning_entrainement_json) } catch (failure) { anomaly = failure instanceof Error ? failure.message : "Planning illisible." }
  if (!anomaly) { try { validateTraining(row) } catch (failure) { error = failure instanceof Error ? failure.message : "Planning invalide." } }
  const saveSlots = (next: TrainingSlot[]) => update("planning_entrainement_json", JSON.stringify(next))
  const changeSlot = (index: number, patch: Partial<TrainingSlot>) => saveSlots(slots.map((slot, position) => position === index ? { ...slot, ...patch } : slot))
  const timezone = row.fuseau_horaire_entrainement || ""
  const options = Array.from(new Set([...timezones, ...(timezone ? [timezone] : [])]))
  return <section className="min-w-0 space-y-4 border-t pt-4 sm:col-span-2">
    <h3 className="text-sm font-semibold">Lieu et horaires d’entraînement</h3>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-venue`}>Lieu d’entraînement</Label><Input id={`${prefix}-venue`} value={row.lieu_entrainement || ""} onChange={event => update("lieu_entrainement", event.target.value)} /></div>
      <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-timezone`}>Fuseau horaire</Label><Select value={timezone || "__empty"} onValueChange={value => update("fuseau_horaire_entrainement", value === "__empty" ? "" : value)}><SelectTrigger id={`${prefix}-timezone`} className="w-full min-w-0"><SelectValue placeholder="Non renseigné" /></SelectTrigger><SelectContent><SelectItem value="__empty">Non renseigné</SelectItem>{options.map(zone => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${prefix}-address`}>Adresse du lieu</Label><Input id={`${prefix}-address`} value={row.adresse_entrainement || ""} onChange={event => update("adresse_entrainement", event.target.value)} /></div>
    </div>
    <div className="space-y-3"><h4 className="text-sm font-medium">Planning hebdomadaire</h4><p className="text-xs text-muted-foreground">Heures locales, répétées chaque semaine. Chaque créneau doit être complet, avec une fin après le début.</p>
      {anomaly ? <div className="space-y-3 rounded-md border border-destructive/40 p-3"><p role="alert" className="text-sm text-destructive">{anomaly}</p><Button type="button" variant="outline" size="sm" onClick={() => { if (window.confirm("Remplacer le planning illisible par un planning vide ? Cette correction sera appliquée à l’enregistrement.")) saveSlots([]) }}>Remplacer le planning illisible</Button></div> : <>
        {!slots.length && <p className="text-sm text-muted-foreground">Aucun créneau renseigné.</p>}
        {slots.map((slot, index) => <div key={index} className="grid min-w-0 gap-3 rounded-md border p-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-${index}-day`}>Jour — créneau {index + 1}</Label><Select value={String(slot.jour || "__empty")} onValueChange={value => changeSlot(index, { jour: value === "__empty" ? 0 : Number(value) })}><SelectTrigger id={`${prefix}-${index}-day`} className="w-full"><SelectValue placeholder="Choisir un jour" /></SelectTrigger><SelectContent><SelectItem value="__empty">Choisir un jour</SelectItem>{trainingDays.map((day, position) => <SelectItem key={day} value={String(position + 1)}>{day}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid min-w-0 grid-cols-2 gap-3"><div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-${index}-start`}>Heure de début</Label><Input className="min-w-0" id={`${prefix}-${index}-start`} type="time" step={60} value={slot.heure_debut} onChange={event => changeSlot(index, { heure_debut: event.target.value })} /></div><div className="min-w-0 space-y-2"><Label htmlFor={`${prefix}-${index}-end`}>Heure de fin</Label><Input className="min-w-0" id={`${prefix}-${index}-end`} type="time" step={60} value={slot.heure_fin} onChange={event => changeSlot(index, { heure_fin: event.target.value })} /></div></div>
          <Button type="button" variant="ghost" size="sm" className="justify-self-start" aria-label={`Supprimer le créneau ${index + 1}`} onClick={() => saveSlots(slots.filter((_, position) => position !== index))}><Trash2 className="h-4 w-4" />Supprimer</Button>
        </div>)}
        <Button type="button" variant="outline" size="sm" onClick={() => saveSlots([...slots, { jour: 0, heure_debut: "", heure_fin: "" }])}><Plus className="h-4 w-4" />Ajouter un créneau</Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </>}
    </div>
  </section>
}

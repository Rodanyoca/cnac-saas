"use client"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api/client"
import type { AffiliationReferences } from "@/lib/cnac/affiliation-model"
import { AffiliationChoice } from "./athlete-affiliation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TeamSportingFields({ row, update, onReady }: { row: Record<string, string>; update: (key: string, value: string) => void; onReady?: (ready: boolean) => void }) {
  const [refs, setRefs] = useState<AffiliationReferences | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    apiFetch("/api/federations/equipes").then(async response => {
      const result = await response.json()
      if (!response.ok || !Array.isArray(result.references?.CATEGORIES_AGE)) throw new Error("Référentiel des catégories équipe indisponible. Réessayez ultérieurement.")
      if (active) { setRefs(result.references); onReady?.(result.references.CATEGORIES_AGE.length > 0) }
    }).catch(() => { if (active) setError("Référentiel des catégories équipe indisponible. Réessayez ultérieurement.") })
    return () => { active = false }
  }, [onReady])
  if (error) return <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>
  if (!refs) return <p role="status" className="text-sm text-muted-foreground sm:col-span-2">Chargement des catégories équipe…</p>
  return <TeamFormFields row={row} update={update} refs={refs} />
}

export function TeamFormFields({ row, update, refs }: { row: Record<string, string>; update: (key: string, value: string) => void; refs: AffiliationReferences }) {
  const choice = (label: string, key: string, sheet: string, id: string, name: string, filter: (item: Record<string, string>) => boolean = () => true) => <AffiliationChoice required={key === "id_categorie_age" || key === "id_club_coc"} label={label} value={row[key]} options={(refs[sheet] || []).filter(item => item[id] && filter(item)).map(item => ({ id: item[id], name: item[name] }))} onChange={value => update(key, value)} />
  return <>
    {choice("Fédération", "id_federation", "FEDERATIONS", "id_federation", "nom_federation", item => item.id_federation === row.id_federation)}
    {choice("Club", "id_club_coc", "CLUBS", "id_club_cnac", "nom_club", item => item.id_federation === row.id_federation)}
    {choice("Sport", "id_sport", "SPORTS", "id_sport", "nom_sport", item => item.id_sport === refs.FEDERATIONS.find(f => f.id_federation === row.id_federation)?.id_sport)}
    {choice("Discipline", "id_discipline", "DISCIPLINES", "id_discipline", "nom_discipline", item => !item.id_sport || item.id_sport === row.id_sport)}
    <div className="space-y-2"><Label>Nom de l’équipe *</Label><Input required value={row.nom_equipe || ""} onChange={event => update("nom_equipe", event.target.value)} /></div>
    {choice("Catégorie équipe", "id_categorie_age", "CATEGORIES_AGE", "id_categorie_age", "nom_categorie_age")}
    {refs.CATEGORIES_AGE.length === 0 && <p role="alert" className="text-sm text-destructive sm:col-span-2">Aucune catégorie équipe disponible. Configurez CATEGORIES_AGE avant l’enregistrement.</p>}
    {choice("Sexe", "id_sexe", "SEXES", "id_sexe", "nom_sexe")}
    <AffiliationChoice label="Statut" value={row.statut || "ACTIF"} options={[{ id: "ACTIF", name: "Actif" }, { id: "INACTIF", name: "Inactif" }]} onChange={value => update("statut", value)} />
    <div className="space-y-2"><Label>Observations</Label><Input value={row.observations || ""} onChange={event => update("observations", event.target.value)} /></div>
  </>
}

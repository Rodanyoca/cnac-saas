"use client"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { activeAffiliationLabel, athleteAffiliationDetails, teamCategory, sportUsesTeams, teamsForClub, type AffiliationReferences, type ActiveAthleteAffiliation } from "@/lib/cnac/affiliation-model"

type Affiliation = ActiveAthleteAffiliation
export function AffiliationChoice({ label, value, options, onChange, disabled = false, required = false }: { label: string; value?: string; options: { id: string; name: string }[]; onChange: (value: string) => void; disabled?: boolean; required?: boolean }) {
  const unresolved = value && !options.some(option => option.id === value)
  return <div className="min-w-0 space-y-2"><Label>{label}{required && " *"}</Label><Select required={required} disabled={disabled} value={value || "__empty"} onValueChange={next => onChange(next === "__empty" ? "" : next)}><SelectTrigger className="w-full min-w-0 max-w-full [&>[data-slot=select-value]]:block" title={options.find(option => option.id === value)?.name}><SelectValue className="min-w-0 flex-1 truncate text-left">{options.find(option => option.id === value)?.name || (value ? "Référence introuvable" : "Non renseignée")}</SelectValue></SelectTrigger><SelectContent><SelectItem value="__empty">Non renseignée</SelectItem>{unresolved && <SelectItem value={value}>Référence introuvable ({value})</SelectItem>}{options.map(option => <SelectItem key={option.id} value={option.id}>{option.name || option.id}</SelectItem>)}</SelectContent></Select></div>
}
export function AthleteAffiliationSummary({ value, refs, detailed = false }: { value: Affiliation; refs: AffiliationReferences; detailed?: boolean }) {
  const club = refs.CLUBS?.find(row => row.id_club_cnac === value.id_club_cnac && row.id_federation === value.id_federation)
  const team = teamsForClub(refs, value.id_club_cnac, value.id_federation).find(row => row.id_equipe_cnac === value.id_equipe_cnac)
  const attachment = teamCategory(team, refs)
  if (detailed) return <dl className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">{athleteAffiliationDetails(value, refs).map(field => <div key={field.label} className="min-w-0"><dt className="text-muted-foreground">{field.label}</dt><dd className="mt-1 break-words font-medium">{field.value || "Non renseigné"}</dd></div>)}</dl>
  return <dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">Rattachement actif</dt><dd className="break-words font-medium">{activeAffiliationLabel(value, refs)}</dd></div><div><dt className="text-muted-foreground">Club</dt><dd>{club?.nom_club || (value.id_club_cnac ? `Club introuvable (${value.id_club_cnac})` : "Non renseigné")}</dd></div>{value.id_equipe_cnac && <><div><dt className="text-muted-foreground">Équipe</dt><dd>{team?.nom_equipe || `Équipe introuvable ou incompatible (${value.id_equipe_cnac})`}</dd></div><div><dt className="text-muted-foreground">Catégorie équipe</dt><dd className="font-medium">{attachment.label}</dd></div></>}</dl>
}
export function AthleteAffiliationFields({ value, refs, update }: { value: Affiliation; refs: AffiliationReferences; update: (key: "id_federation" | "id_club_cnac" | "id_equipe_cnac", value: string) => void }) {
  const usesTeams = sportUsesTeams(refs, value.id_federation)
  const federations = (refs.FEDERATIONS || []).map(row => ({ id: row.id_federation, name: row.nom_federation }))
  const clubs = (refs.CLUBS || []).filter(row => row.id_federation === value.id_federation).map(row => ({ id: row.id_club_cnac, name: row.nom_club }))
  const teams = teamsForClub(refs, value.id_club_cnac, value.id_federation).map(row => ({ id: row.id_equipe_cnac, name: row.nom_equipe }))
  return <section className="space-y-4"><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Affiliation active</h3><div className="grid gap-4 sm:grid-cols-2">
    <AffiliationChoice label="Fédération" required value={value.id_federation} options={federations} onChange={next => update("id_federation", next)} />
    <AffiliationChoice label="Club" value={value.id_club_cnac} options={clubs} onChange={next => update("id_club_cnac", next)} disabled={!value.id_federation} />
    {(usesTeams !== false || value.id_equipe_cnac) && <AffiliationChoice label="Équipe" value={value.id_equipe_cnac} options={teams} onChange={next => update("id_equipe_cnac", next)} disabled={!value.id_club_cnac} />}
  </div>{value.id_federation && usesTeams === undefined && <p className="text-xs text-muted-foreground">Usage des équipes non configuré pour ce sport ; sélection facultative.</p>}{value.id_club_cnac && <AthleteAffiliationSummary value={value} refs={refs} />}</section>
}

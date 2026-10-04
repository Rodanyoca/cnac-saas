import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { activeTrainingTeam, trainingDays, validateTraining, type TeamTraining } from "@/lib/cnac/team-training"

function localHour(value: string) { const [hour, minute] = value.split(":"); return `${Number(hour)} h${minute === "00" ? "" : ` ${minute}`}` }

export function TeamTrainingSummary({ team, emptyMessage = "Aucune équipe active renseignée." }: { team?: TeamTraining & { nom_equipe?: string }; emptyMessage?: string }) {
  const groups: { day: number; times: string[] }[] = []
  let anomaly = ""
  if (team) {
    try {
      for (const slot of validateTraining(team)) {
        let group = groups.find(item => item.day === slot.jour)
        if (!group) { group = { day: slot.jour, times: [] }; groups.push(group) }
        group.times.push(`${localHour(slot.heure_debut)}–${localHour(slot.heure_fin)}`)
      }
    } catch { anomaly = "Le planning de cette équipe présente une anomalie. Faites-le corriger dans sa fiche." }
  }
  return <Card className="min-w-0 border-border/70"><CardHeader><CardTitle className="text-base">Entraînements habituels de l’équipe</CardTitle>{team?.nom_equipe && <p className="break-words text-sm text-muted-foreground">{team.nom_equipe}</p>}</CardHeader><CardContent className="space-y-5">
    {!team ? <p className="text-sm text-muted-foreground">{emptyMessage}</p> : <>
      <dl className="grid gap-4 text-sm sm:grid-cols-2"><div className="min-w-0"><dt className="text-muted-foreground">Lieu d’entraînement</dt><dd className="mt-1 break-words font-medium">{team.lieu_entrainement || "Non renseigné"}</dd></div><div className="min-w-0"><dt className="text-muted-foreground">Adresse</dt><dd className="mt-1 break-words font-medium">{team.adresse_entrainement || "Non renseignée"}</dd></div><div className="min-w-0"><dt className="text-muted-foreground">Fuseau horaire</dt><dd className="mt-1 break-words font-medium">{team.fuseau_horaire_entrainement || "Non renseigné"}</dd></div></dl>
      <div className="space-y-2"><p className="text-sm font-medium">Horaires habituels — heure locale</p>{anomaly ? <p role="alert" className="text-sm text-destructive">{anomaly}</p> : groups.length ? <ul className="space-y-2 text-sm">{groups.map(group => <li key={group.day}><span className="font-medium">{trainingDays[group.day - 1]} :</span> {group.times.join(" et ")}</li>)}</ul> : <p className="text-sm text-muted-foreground">Aucun planning d’entraînement renseigné pour cette équipe.</p>}</div>
    </>}
    <p className="text-xs text-muted-foreground">Ce planning hebdomadaire ne confirme pas la présence effective de l’athlète et ne remplace pas sa localisation individuelle.</p>
  </CardContent></Card>
}

export function AthleteTeamTraining({ teams, affiliation }: { teams: Record<string, string>[]; affiliation: { id_equipe_cnac?: string; id_club_cnac?: string; id_federation?: string } }) {
  return <TeamTrainingSummary team={activeTrainingTeam(teams, affiliation)} emptyMessage={affiliation.id_equipe_cnac ? "L’équipe active est introuvable ou incompatible avec l’affiliation de l’athlète." : "Aucune équipe active renseignée pour cet athlète."} />
}

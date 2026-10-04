import { getActeursSpreadsheetId } from "./config"
import { getSheetsRows } from "@/lib/google/sheets"
import { ACTOR_SHEETS } from "./sheets"
import { getAllOfficialAffiliations } from "./official-affiliations"
import { getPrimaryOfficialEntities } from "./official-affiliation-model"
import { actorCompletenessChecks } from "./dashboard-completeness"

export const ACTORS_DASHBOARD_CACHE_TAG = "actors-dashboard"

export type ActorTypeStats = { key: string; label: string; total: number; hommes: number; femmes: number; actifs: number; inactifs: number; fichesCompletes: number; completude: number }
export type ActorsDashboardStats = { totalActors: number; types: ActorTypeStats[] }

const definitions = [
  { sheet: ACTOR_SHEETS.ATHLETE, key: "athletes", label: "Athlètes", id: "id_athlete_coc", affiliation: ["id_federation"] },
  { sheet: ACTOR_SHEETS.COACH, key: "coachs", label: "Coachs", id: "id_coach_coc", affiliation: ["id_federation"] },
  { sheet: ACTOR_SHEETS.OFFICIEL, key: "officiels", label: "Officiels", id: "id_officiel_coc", affiliation: [] },
  { sheet: ACTOR_SHEETS.MEDECIN, key: "medecins", label: "Médecins", id: "id_medecin_coc", affiliation: ["id_entite", "id_federation"] },
  { sheet: ACTOR_SHEETS.ARBITRE, key: "arbitres", label: "Arbitres", id: "id_arbitre_coc", affiliation: ["id_federation"] },
] as const

const normalized = (input: string) => input.trim().toLocaleLowerCase("fr")

async function aggregateActorsDashboardStats(): Promise<ActorsDashboardStats> {
  const [rows, officialAffiliations] = await Promise.all([
    getSheetsRows({ sheetNames: definitions.map((item) => item.sheet), spreadsheetId: getActeursSpreadsheetId() }),
    getAllOfficialAffiliations().catch(() => []),
  ])
  const primaryOfficialEntities = getPrimaryOfficialEntities(officialAffiliations)
  const types = definitions.map((definition) => {
    const actors = rows[definition.sheet].filter((row) => String(row[definition.id] || "").trim())
    const fields = (row: Record<string, string>) => actorCompletenessChecks(
      row,
      definition.affiliation,
      definition.key === "officiels" && primaryOfficialEntities.has(row[definition.id]),
    )
    const filled = actors.reduce((sum, row) => sum + fields(row).filter(Boolean).length, 0)
    return {
      key: definition.key, label: definition.label, total: actors.length,
      hommes: actors.filter((row) => ["m", "h", "homme", "masculin"].includes(normalized(row.id_sexe || row.nom_sexe || ""))).length,
      femmes: actors.filter((row) => ["f", "femme", "féminin", "feminin"].includes(normalized(row.id_sexe || row.nom_sexe || ""))).length,
      actifs: actors.filter((row) => normalized(row.statut || "") === "actif").length,
      inactifs: actors.filter((row) => normalized(row.statut || "") === "inactif").length,
      fichesCompletes: actors.filter((row) => fields(row).every(Boolean)).length,
      completude: actors.length ? Math.round((filled / actors.reduce((sum, row) => sum + fields(row).length, 0)) * 100) : 0,
    }
  })
  return { totalActors: types.reduce((sum, item) => sum + item.total, 0), types }
}

export const loadActorsDashboardStats = aggregateActorsDashboardStats

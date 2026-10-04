import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { projectAthleteSportHistory } from "../../lib/athletes/sport-history.ts"

const base = {
  EQUIPES_NATIONALES: [], CAMPAGNES_EQUIPES_NATIONALES: [], SELECTIONS_ATHLETES: [],
  PARTICIPATIONS_ACTEURS_COMPETITION: [], ENGAGEMENTS_CAMPAGNES_PROGRAMMES: [],
  PROGRAMMES_COMPETITION: [], COMPETITIONS: [],
} as Parameters<typeof projectAthleteSportHistory>[1]

const team = (id: string, name = "Équipe") => ({ id_equipe_nationale: id, nom_equipe_nationale: name }) as never
const campaign = (id: string, teamId: string) => ({ id_campagne: id, id_equipe_nationale: teamId, nom_campagne: `Campagne ${id}`, date_fin: "2026-12-31" }) as never
const selection = (id: string, campaignId: string) => ({ id_selection: id, id_campagne: campaignId, id_athlete: "ATH1", date_selection: "2026-01-01", id_statut_selection: "SELECTIONNE" }) as never

test("déduplique les équipes exclusivement par identifiant", () => {
  const graph = { ...base, EQUIPES_NATIONALES: [team("EQ1"), team("EQ2")], CAMPAGNES_EQUIPES_NATIONALES: [campaign("C1", "EQ1"), campaign("C2", "EQ1"), campaign("C3", "EQ2")], SELECTIONS_ATHLETES: [selection("S1", "C1"), selection("S2", "C2"), selection("S3", "C3")] }
  assert.deepEqual(projectAthleteSportHistory("ATH1", graph).teams.map((row) => row.id_equipe_nationale), ["EQ1", "EQ2"])
})

test("conserve deux équipes de même nom si leurs identifiants diffèrent", () => {
  const graph = { ...base, EQUIPES_NATIONALES: [team("EQ1", "Même nom"), team("EQ2", "Même nom")], CAMPAGNES_EQUIPES_NATIONALES: [campaign("C1", "EQ1"), campaign("C2", "EQ2")], SELECTIONS_ATHLETES: [selection("S1", "C1"), selection("S2", "C2")] }
  assert.equal(projectAthleteSportHistory("ATH1", graph).teams.length, 2)
})

test("affiche avec NON une sélection d’une campagne engagée sans participation", () => {
  const graph = { ...base, EQUIPES_NATIONALES: [team("EQ1")], CAMPAGNES_EQUIPES_NATIONALES: [campaign("C1", "EQ1")], SELECTIONS_ATHLETES: [selection("S1", "C1")], ENGAGEMENTS_CAMPAGNES_PROGRAMMES: [{ id_engagement_campagne: "E1", id_campagne: "C1" } as never] }
  const [row] = projectAthleteSportHistory("ATH1", graph).participations
  assert.equal(row.effective, false); assert.equal(row.competition, "")
})

test("résout chaque participation et ignore les répétitions techniques", () => {
  const participation = { id_participation_acteur: "P1", id_selection: "S1", id_acteur_coc: "ATH1", id_type_acteur: "ATHLETE", id_engagement_campagne: "E1", id_statut_participation: "PARTICIPANT", date_statut: "2026-04-02" } as never
  const graph = { ...base, EQUIPES_NATIONALES: [team("EQ1")], CAMPAGNES_EQUIPES_NATIONALES: [campaign("C1", "EQ1")], SELECTIONS_ATHLETES: [selection("S1", "C1")], PARTICIPATIONS_ACTEURS_COMPETITION: [participation, participation], ENGAGEMENTS_CAMPAGNES_PROGRAMMES: [{ id_engagement_campagne: "E1", id_campagne: "C1", id_programme_competition: "PR1" } as never], PROGRAMMES_COMPETITION: [{ id_programme_competition: "PR1", id_competition: "CO1", id_epreuve: "EP1" } as never], COMPETITIONS: [{ id_competition: "CO1", nom_competition: "Jeux", edition: "2026" } as never] }
  const rows = projectAthleteSportHistory("ATH1", graph, { eventDisciplineIds: new Map([["EP1", "DIS1"]]), disciplines: new Map([["DIS1", "Athlétisme"]]), participations: new Map([["PARTICIPANT", "Participant"]]) }).participations
  assert.equal(rows.length, 1); assert.deepEqual([rows[0].competition, rows[0].edition, rows[0].discipline, rows[0].statutParticipation, rows[0].dateParticipation], ["Jeux", "2026", "Athlétisme", "Participant", "2026-04-02"])
})

test("ignore les campagnes sans engagement et tolère les références absentes", () => {
  const p = (id: string, engagement: string) => ({ id_participation_acteur: id, id_selection: "S1", id_acteur_coc: "ATH1", id_type_acteur: "ATHLETE", id_engagement_campagne: engagement }) as never
  const graph = { ...base, CAMPAGNES_EQUIPES_NATIONALES: [campaign("C1", "EQ_INCONNUE"), campaign("C2", "EQ_INCONNUE")], SELECTIONS_ATHLETES: [selection("S1", "C1"), selection("S2", "C2")], PARTICIPATIONS_ACTEURS_COMPETITION: [p("P1", "E1"), p("P2", "E2")], ENGAGEMENTS_CAMPAGNES_PROGRAMMES: [{ id_engagement_campagne: "E1", id_campagne: "C1" } as never, { id_engagement_campagne: "E2", id_campagne: "C1" } as never] }
  const rows = projectAthleteSportHistory("ATH1", graph).participations
  assert.equal(rows.length, 2); assert.ok(rows.every((row) => row.equipe === "" && row.competition === "" && row.discipline === ""))
})

test("conserve plusieurs épreuves d’une même compétition", () => {
  const p = (id: string, engagement: string) => ({ id_participation_acteur: id, id_selection: "S1", id_acteur_coc: "ATH1", id_type_acteur: "ATHLETE", id_engagement_campagne: engagement }) as never
  const graph = { ...base, CAMPAGNES_EQUIPES_NATIONALES: [campaign("C1", "EQ1")], SELECTIONS_ATHLETES: [selection("S1", "C1")], PARTICIPATIONS_ACTEURS_COMPETITION: [p("P1", "E1"), p("P2", "E2")], ENGAGEMENTS_CAMPAGNES_PROGRAMMES: [{ id_engagement_campagne: "E1", id_campagne: "C1", id_programme_competition: "PR1" } as never, { id_engagement_campagne: "E2", id_campagne: "C1", id_programme_competition: "PR2" } as never], PROGRAMMES_COMPETITION: [{ id_programme_competition: "PR1", id_competition: "CO1", id_epreuve: "EP1" } as never, { id_programme_competition: "PR2", id_competition: "CO1", id_epreuve: "EP2" } as never], COMPETITIONS: [{ id_competition: "CO1", nom_competition: "Jeux" } as never] }
  const rows = projectAthleteSportHistory("ATH1", graph, { eventDisciplineIds: new Map([["EP1", "DIS1"], ["EP2", "DIS2"]]), disciplines: new Map([["DIS1", "Sprint"], ["DIS2", "Saut"]]) }).participations
  assert.deepEqual(rows.map((row) => row.discipline), ["Sprint", "Saut"]); assert.ok(rows.every((row) => row.competition === "Jeux"))
})

test("la fiche athlète retire les anciens onglets de parcours sportif", async () => {
  const [detail, history, route, globalActivities] = await Promise.all([
    readFile("app/dashboard/acteurs/athletes/[id]/athlete-detail-client.tsx", "utf8"),
    readFile("components/dashboard/athlete-sport-history.tsx", "utf8"),
    readFile("app/api/athletes/[id]/sport-history/route.ts", "utf8"),
    readFile("app/api/activites/acteurs/[id]/route.ts", "utf8"),
  ])
  assert.doesNotMatch(detail, /ActorActivities|id: "activites"|label: "Activités"/)
  assert.doesNotMatch(detail, /useAthleteSportHistory|AthleteNationalTeams|AthleteSelections/)
  assert.match(history, /hidden lg:block/)
  assert.match(history, /lg:hidden/)
  assert.doesNotMatch(history, /overflow-x-auto/)
  assert.match(history, /w-full min-w-0 rounded-lg border bg-card p-3/)
  assert.match(history, /xl:grid-cols-5/)
  assert.doesNotMatch(history, /Historique des sélections|sélection\(s\)/)
  assert.match(route, /canAccess\("AUT-SPT", "READ"\)/)
  assert.match(globalActivities, /export async function GET/)
})

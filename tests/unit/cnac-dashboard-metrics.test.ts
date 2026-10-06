import assert from "node:assert/strict"
import test from "node:test"
import { actorMetrics, territorialMetrics, aggregateCnacMetrics, type MetricTables } from "../../lib/dashboard/cnac-metrics.ts"

const actors = (): MetricTables => Object.fromEntries(actorMetrics.map(def => [def.sheet, []]))
const territorial = (): MetricTables => Object.fromEntries(territorialMetrics.map(def => [def.sheet, []]))
test("jointure des sexes par identifiant et distinction des statuts absents", () => {
  const rows = actors()
  rows.ATHLETES = [
    { id_athlete_cnac: "A1", id_sexe: "SEX001", statut: "ACTIF", id_club_cnac: "C1" },
    { id_athlete_cnac: "A2", id_sexe: "SEX002", statut: "INACTIF" },
    { id_athlete_cnac: "A3", id_sexe: "XXX", statut: "" },
    { id_athlete_cnac: "", id_sexe: "SEX001", statut: "ACTIF" },
  ]
  const m = aggregateCnacMetrics({ actors: rows, referential: { FEDERATIONS: [], SEXES: [{ id_sexe: "SEX001", nom_sexe: "Masculin" }, { id_sexe: "SEX002", nom_sexe: "Féminin" }] } })
  assert.equal(m.totalActors, 3)
  assert.deepEqual(m.actorRows![0], { label: "Athlètes", total: 3, active: 1, inactive: 1, unknown: 1, men: 1, women: 1, genderUnknown: 1, complete: 0 })
  assert.equal(m.alertRows[0].count, 2)
})
test("inclut zones, équipes et autres acteurs sans compter les doublons d’identifiant", () => {
  const structure = territorial(), people = actors()
  structure.ZONES = [{ id_zone_cnac: "Z1", nom_zone: "Zone", statut: "ACTIF" }]
  structure.EQUIPES = [{ id_equipe_cnac: "E1", nom_equipe: "Équipe", statut: "ACTIF" }, { id_equipe_cnac: "E1", nom_equipe: "Équipe", statut: "ACTIF" }]
  people.AUTRES = [{ id_autre_acteur_cnac: "O1", nom_complet: "Autre", statut: "ACTIF" }]
  const m = aggregateCnacMetrics({ territorial: structure, actors: people })
  assert.equal(m.totalStructures, 2)
  assert.equal(m.territorialRows![0].share, "50 %")
  assert.equal(m.totalActors, 1)
  assert.equal(m.actorRows![5].total, 1)
})
test("une panne ne devient jamais un zéro et conserve les sources restantes", () => {
  const m = aggregateCnacMetrics({ actors: actors() })
  assert.equal(m.totalFederations, undefined)
  assert.equal(m.totalStructures, undefined)
  assert.equal(m.affiliationStats, undefined)
  assert.equal(m.actorRows![0].men, undefined)
  assert.equal(m.totalActors, 0)
  assert.equal(m.actorCompletionRate, 0)
  assert.equal(m.qualityRows.length, 1)
  assert.deepEqual(aggregateCnacMetrics({}).qualityRows, [])
})
test("affiliations sans dates et complétude des fiches sur les champs annoncés", () => {
  const rows = actors()
  rows.COACHS = [{ id_coach_cnac: "C1", nom_complet: "Coach", id_sexe: "SEX001", date_de_naissance: "2000-01-01", telephone: "123", email: "coach@example.invalid", statut: "ACTIF" }]
  const m = aggregateCnacMetrics({ actors: rows, affiliations: { AFFILIATIONS_COACHS: [{ id_affiliation_coach: "F1", id_coach_cnac: "C1", id_club_cnac: "CL1", statut: "ACTIF" }, { id_affiliation_coach: "F2", id_coach_cnac: "C1", id_club_cnac: "CL2", statut: "INACTIF" }, { id_affiliation_coach: "F3", id_coach_cnac: "", id_club_cnac: "", statut: "" }] } })
  assert.equal(m.actorCompletionRate, 100)
  assert.deepEqual(m.affiliationStats, { total: 3, active: 1, inactive: 1, unknown: 1 })
  assert.deepEqual(m.qualityRows.find(row => row.label === "Affiliations entraîneur–club"), { label: "Affiliations entraîneur–club", total: 3, complete: 2, incomplete: 1, rate: "67 %" })
})

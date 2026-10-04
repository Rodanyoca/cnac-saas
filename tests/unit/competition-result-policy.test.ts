import assert from "node:assert/strict"
import test from "node:test"
import { filterResultDecisions, formatResultSummary, normalizeResultForType, resultFormPolicy } from "../../lib/competitions/result-policy.ts"

const decisions = [
  { id: "GEN", label: "Forfait", sportId: "", disciplineId: "", active: true },
  { id: "JUD", label: "Ippon", sportId: "JUD", disciplineId: "DISC067", active: true },
  { id: "BOX", label: "KO", sportId: "BOX", disciplineId: "DISC012", active: true },
  { id: "OLD", label: "Ancienne décision", sportId: "JUD", disciplineId: "", active: false },
]

test("filtre et ordonne les décisions actives par discipline, sport puis génériques", () => {
  assert.deepEqual(filterResultDecisions(decisions, { sportId: "JUD", disciplineId: "DISC067" }).map((row) => row.id), ["JUD", "GEN"])
  assert.deepEqual(filterResultDecisions(decisions, { sportId: "KAR", disciplineId: "DISC033" }).map((row) => row.id), ["GEN"])
})

test("TR_DECISION masque les valeurs et exige synthèse et décision", () => {
  assert.deepEqual(resultFormPolicy("TR_DECISION", decisions.slice(0, 2)), {
    showQuantitative: false,
    showDecision: true,
    syntheticRequired: true,
    decisionRequired: true,
  })
  const normalized = normalizeResultForType({ valeur_coc: "1", valeur_adversaire: "0", id_unite_mesure: "UNIT_POINT" }, "TR_DECISION")
  assert.deepEqual(normalized, { valeur_coc: "", valeur_adversaire: "", id_unite_mesure: "" })
})

test("une décision générique seule n’affiche pas le sélecteur sur les mesures", () => {
  assert.equal(resultFormPolicy("TR_TEMPS", decisions.slice(0, 1)).showDecision, false)
  assert.equal(resultFormPolicy("TR_POINTS", decisions.slice(0, 2)).showDecision, true)
})

test("compose une synthèse sans inventer de score ou d’unité", () => {
  assert.equal(formatResultSummary({ synthetic: "Défaite", decision: "Ippon", value: "", opponentValue: "", unit: "" }), "Défaite — Ippon")
  assert.equal(formatResultSummary({ synthetic: "Victoire", decision: "Aux points", value: "12", opponentValue: "8", unit: "points" }), "Victoire 12–8 points — Aux points")
  assert.equal(formatResultSummary({ synthetic: "Victoire", decision: "", value: "", opponentValue: "", unit: "" }), "Victoire")
})

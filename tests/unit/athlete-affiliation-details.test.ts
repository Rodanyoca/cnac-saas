import assert from "node:assert/strict"
import test from "node:test"
import { athleteAffiliationDetails, type AffiliationReferences } from "../../lib/cnac/affiliation-model.ts"

const affiliation = { id_federation: "F1", id_club_cnac: "CL1", id_equipe_cnac: "EQ1" }
const refs: AffiliationReferences = {
  FEDERATIONS: [{ id_federation: "F1", nom_federation: "Federation", id_sport: "S1" }],
  SPORTS: [{ id_sport: "S1", nom_sport: "Sport" }],
  DISCIPLINES: [{ id_discipline: "DIS1", nom_discipline: "Discipline" }],
  CLUBS: [{ id_club_cnac: "CL1", id_federation: "F1", nom_club: "Club", id_structure_parent_cnac: "C1" }],
  CERCLES: [{ id_cercle_cnac: "C1", id_federation: "F1", nom_cercle: "Cercle", id_structure_parent_cnac: "E1" }],
  ENTENTES: [{ id_entente_cnac: "E1", id_federation: "F1", nom_entente: "Entente", id_structure_parent_cnac: "L1" }],
  LIGUES: [{ id_ligue_cnac: "L1", id_federation: "F1", nom_ligue: "Ligue" }],
  EQUIPES: [{ id_equipe_cnac: "EQ1", id_club_cnac: "CL1", id_federation: "F1", nom_equipe: "Equipe", id_discipline: "DIS1", id_categorie_age: "AGE1" }],
  CATEGORIES_AGE: [{ id_categorie_age: "AGE1", nom_categorie_age: "Senior" }],
}
test("remonte cercle, entente et ligue depuis le club et conserve le contexte sportif", () => {
  const details = new Map(athleteAffiliationDetails(affiliation, refs).map(field => [field.label, field.value]))
  for (const label of ["Sport", "Discipline", "Ligue", "Entente", "Cercle", "Club"]) assert.equal(details.get(label), label)
  assert.ok(![...details.keys()].some(label => /division/i.test(label)))
})
test("ne rattache jamais une structure homonyme d'une autre federation", () => {
  const details = athleteAffiliationDetails(affiliation, { ...refs, CERCLES: [{ ...refs.CERCLES[0], id_federation: "F2" }] })
  assert.equal(details.find(field => field.label === "Cercle")?.value, "")
  assert.equal(details.find(field => field.label === "Ligue")?.value, "")
})
test("termine la remontee en cas de cycle territorial", () => {
  const details = athleteAffiliationDetails(affiliation, { ...refs, LIGUES: [{ ...refs.LIGUES[0], id_structure_parent_cnac: "C1" }] })
  assert.equal(details.find(field => field.label === "Ligue")?.value, "Ligue")
})

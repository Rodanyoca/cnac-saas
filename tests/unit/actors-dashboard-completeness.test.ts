import assert from "node:assert/strict"
import test from "node:test"

import { actorCompletenessChecks } from "../../lib/acteurs/dashboard-completeness.ts"

const complete = {
  nom_complet: "Acteur Test",
  id_sexe: "M",
  id_federation: "FED001",
  date_de_naissance: "1990-01-01",
  email: "acteur@example.org",
  statut: "ACTIF",
}

test("la complétude d’un acteur repose sur six champs de même poids", () => {
  assert.deepEqual(actorCompletenessChecks(complete, ["id_federation"]), [
    true, true, true, true, true, true,
  ])
})

test("la date de naissance remplace le téléphone dans la formule", () => {
  assert.equal(actorCompletenessChecks({ ...complete, date_de_naissance: "", telephone: "0990000000" }, ["id_federation"])[3], false)
  assert.equal(actorCompletenessChecks({ ...complete, telephone: "" }, ["id_federation"]).every(Boolean), true)
})

test("le rattachement relationnel d’un officiel est pris en compte", () => {
  const official = { ...complete, id_federation: "" }
  assert.equal(actorCompletenessChecks(official, [], true)[2], true)
  assert.equal(actorCompletenessChecks(official, [], false)[2], false)
})

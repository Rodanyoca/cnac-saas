import assert from "node:assert/strict"
import test from "node:test"
import { findActorRowById } from "../../lib/acteurs/row-identity.ts"

test("retrouve un acteur malgré les espaces et la casse provenant de Sheets", () => {
  const rows = [
    { id_medecin_coc: " MED.000005 ", nom_complet: "Médecin test" },
  ]

  assert.equal(findActorRowById(rows, "id_medecin_coc", "med.000005"), rows[0])
})

test("ne confond pas deux identifiants distincts", () => {
  const rows = [{ id_medecin_coc: "MED.000006" }]
  assert.equal(findActorRowById(rows, "id_medecin_coc", "MED.000005"), undefined)
})

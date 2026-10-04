import assert from "node:assert/strict"
import test from "node:test"
import { ACTOR_SHEETS } from "../../lib/acteurs/sheets.ts"

test("utilise les titres réels des onglets du classeur ACTEURS", () => {
  assert.deepEqual(ACTOR_SHEETS, {
    ATHLETE: "ATHLETES", COACH: "COACHS", OFFICIEL: "OFFICIELS", MEDECIN: "MEDECINS", ARBITRE: "ARBITRES", AUTRE: "AUTRES",
  })
})

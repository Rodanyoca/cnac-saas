import assert from "node:assert/strict"
import test from "node:test"
import { loadFreshDashboardSections } from "../../lib/dashboard/fresh-load.ts"

test("charge les données d'accueil sans vider le cache Sheets", async () => {
  const events: string[] = []
  const result = await loadFreshDashboardSections({
    loaders: [async () => { events.push("load"); return 42 }],
  })
  assert.deepEqual(events, ["load"])
  assert.equal(result[0].status, "fulfilled")
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("une participation créée reçoit immédiatement le nom de l’athlète sélectionné", async () => {
  const source = await readFile("components/dashboard/athlete-participations.tsx", "utf8")

  assert.match(source, /selectedAthlete/)
  assert.match(source, /athlete_label:\s*selectedAthlete\?\.athlete_label/)
  assert.doesNotMatch(source, /:\s*\[\.\.\.current,\s*result\.row\]/)
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("le formulaire d'engagement normalise les lignes incomplètes avant de contrôler les Select", async () => {
  const source = await readFile("components/dashboard/campaign-engagements.tsx", "utf8")

  assert.match(source, /campaignEngagementToForm/)
  assert.doesNotMatch(source, /setForm\(row \? \{ \.\.\.empty, \.\.\.row \} : empty\)/)
})

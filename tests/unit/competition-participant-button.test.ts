import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("le bouton participant explique les prérequis manquants au lieu de rester inerte", async () => {
  const code = await readFile(new URL("../../components/dashboard/athlete-participations.tsx", import.meta.url), "utf8")
  assert.match(code, /function openCreate/)
  assert.match(code, /Équipes \/ unités/)
  assert.doesNotMatch(code, /disabled=\{!engagements\.length\|\|!references\.statuses\.length\}/)
})

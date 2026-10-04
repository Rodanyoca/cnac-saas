import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la fiche et la création lisent les sélections sans cache inter-instance", async () => {
  const [page, data] = await Promise.all([
    readFile("app/dashboard/equipes-nationales/[id]/page.tsx", "utf8"),
    readFile("lib/equipes-nationales/data.ts", "utf8"),
  ])
  assert.match(page, /getCampaignSelections\(id,\s*\{\s*fresh:\s*true\s*\}\)/)
  assert.match(data, /getCampaignSelections\(undefined,\s*\{\s*fresh:\s*true\s*\}\)/)
  assert.match(data, /ATHLETE_SELECTION_SHEET[\s\S]*bypassCache:\s*options\.fresh/)
})

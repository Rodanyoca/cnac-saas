import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la fiche compétition relit les engagements directement après une écriture", async () => {
  const [page, teamPage, route, data] = await Promise.all([
    readFile("app/dashboard/competitions/[id]/page.tsx", "utf8"),
    readFile("app/dashboard/equipes-nationales/[id]/page.tsx", "utf8"),
    readFile("app/api/competitions/[id]/engagements/route.ts", "utf8"),
    readFile("lib/competitions/data.ts", "utf8"),
  ])

  assert.match(page, /getCampaignEngagements\(\{\s*competitionId:\s*id,\s*fresh:\s*true\s*\}\)/)
  assert.match(teamPage, /getCampaignEngagements\(\{\s*teamId:\s*id,\s*fresh:\s*true\s*\}\)/)
  assert.match(route, /getCampaignEngagements\(\{\s*competitionId:\s*id,\s*fresh:\s*true\s*\}\)/)
  assert.match(data, /sheetName:\s*TEAMS_SHEET[^\n]+bypassCache:\s*filters\.fresh/)
})

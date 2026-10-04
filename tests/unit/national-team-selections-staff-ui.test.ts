import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("les sélections d'athlètes utilisent un tableau responsive", async () => {
  const code = await source("components/dashboard/campaign-selections.tsx")
  assert.match(code, /<Table>/)
  assert.match(code, /hidden sm:table-cell/)
  assert.match(code, /<ActorSearchSelect/)
  assert.match(code, /sortedRows\.map/)
  assert.match(code, /options=\{athleteOptions\}/)
  assert.match(code, /localeCompare\([^)]*"fr"/)
  assert.match(code, /TableHead[^>]*>Observation/)
  assert.doesNotMatch(code, /numero_maillot|Maillot/)
  assert.doesNotMatch(code, /overflow-x-auto/)
})

test("ouvrir l'ajout de staff charge immédiatement les acteurs du type initial", async () => {
  const code = await source("app/dashboard/equipes-nationales/[id]/team-detail-client.tsx")
  const route = await source("app/api/equipes-nationales/acteurs/route.ts")
  assert.match(code, /async function openMemberEditor/)
  assert.match(code, /await loadActors\(initialType\)/)
  assert.match(code, /loading=\{actorsLoading\}/)
  assert.match(code, /actorsLoadError/)
  assert.match(route, /getActorOptions\(type,\s*\{\s*fresh:\s*true\s*\}\)/)
})

test("une modification de campagne rafraîchit sa période dans le formulaire de sélection", async () => {
  const page = await source("app/dashboard/equipes-nationales/[id]/page.tsx")
  const campaigns = await source("components/dashboard/national-team-campaigns.tsx")
  const selections = await source("components/dashboard/campaign-selections.tsx")
  assert.match(page, /getNationalTeamCampaigns\(id, \{ fresh: true \}\)/)
  assert.match(campaigns, /router\.refresh\(\)/)
  assert.match(campaigns, /chronologicalRows\.map/)
  assert.match(campaigns, /a\.date_debut[^\n]+localeCompare\(b\.date_debut[^\n]+\)/)
  assert.match(selections, /chronologicalCampaigns\.map/)
})

test("la fiche relit les affectations du staff après une modification directe du classeur", async () => {
  const page = await source("app/dashboard/equipes-nationales/[id]/page.tsx")
  assert.match(page, /getNationalTeamMembers\(id,\s*undefined,\s*undefined,\s*\{\s*fresh:\s*true\s*\}\)/)
})

test("les membres du staff sont classés alphabétiquement par leur nom affiché", async () => {
  const code = await source("app/dashboard/equipes-nationales/[id]/team-detail-client.tsx")
  assert.match(code, /memberName\(a\)\.localeCompare\(memberName\(b\),\s*"fr",\s*\{\s*sensitivity:\s*"base"\s*\}\)/)
  assert.doesNotMatch(code, /sort\(\(a, b\) => b\.date_debut\.localeCompare\(a\.date_debut\)\)/)
})

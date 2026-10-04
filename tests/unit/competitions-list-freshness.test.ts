import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la liste des compétitions utilise le cache court au lieu d'une lecture forcée", async () => {
  const [page, data] = await Promise.all([
    readFile("app/dashboard/competitions/page.tsx", "utf8"),
    readFile("lib/competitions/data.ts", "utf8"),
  ])

  assert.match(data, /getCompetitions\(options\?:\s*\{\s*bypassCache\?:\s*boolean\s*\}\)/)
  assert.match(page, /getCompetitions\(\)/)
  assert.doesNotMatch(page, /getCompetitions\(\{\s*bypassCache:\s*true/)
})

test("la fiche compétition relit les programmes après une modification directe", async () => {
  const [page, data] = await Promise.all([
    readFile("app/dashboard/competitions/[id]/page.tsx", "utf8"),
    readFile("lib/competitions/data.ts", "utf8"),
  ])

  assert.match(data, /getCompetitionPrograms\(competitionId\?:\s*string,\s*options:\s*\{\s*bypassCache\?:\s*boolean\s*\}\s*=\s*\{\}\)/)
  assert.match(page, /getCompetitionPrograms\(id,\s*\{\s*bypassCache:\s*true\s*\}\)/)
})

test("la fiche compétition relit la compétition après une création", async () => {
  const [page, data] = await Promise.all([
    readFile("app/dashboard/competitions/[id]/page.tsx", "utf8"),
    readFile("lib/competitions/data.ts", "utf8"),
  ])

  assert.match(data, /getCompetition\(id:\s*string,\s*options:\s*\{\s*bypassCache\?:\s*boolean\s*\}/)
  assert.match(page, /getCompetition\(id,\s*\{\s*bypassCache:\s*true\s*\}\)/)
})

test("la fiche relit les résultats et affiche leur programme physique après une modification directe", async () => {
  const [page, data, results] = await Promise.all([
    readFile("app/dashboard/competitions/[id]/page.tsx", "utf8"),
    readFile("lib/competitions/data.ts", "utf8"),
    readFile("components/dashboard/competition-results.tsx", "utf8"),
  ])

  assert.match(page, /getCompetitionResults\(id,\s*true,\s*\{\s*bypassCache:\s*true\s*\}\)/)
  assert.match(data, /getCompetitionResults\([^)]*options:\s*\{\s*bypassCache\?:\s*boolean/)
  assert.match(results, /getEventLabel\(row\.id_programme_competition\)/)
  assert.match(results, /getDisciplineLabelForProgram\(row\.id_programme_competition\)/)
  assert.doesNotMatch(results, /getEventLabel\(row\.id_engagement_campagne\)/)
})

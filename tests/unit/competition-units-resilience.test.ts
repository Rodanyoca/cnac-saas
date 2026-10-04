import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la lecture des unités regroupe les feuilles métier et tolère l’indisponibilité des libellés", async () => {
  const source = await readFile(new URL("../../lib/competitions/data.ts", import.meta.url), "utf8")
  const start = source.indexOf("export async function getParticipatingUnits")
  const end = source.indexOf("export async function createParticipatingUnit", start)
  const implementation = source.slice(start, end)

  assert.match(implementation, /getSheetsRows/)
  assert.match(implementation, /UNITES_PARTICIPANTES/)
  assert.match(implementation, /MEMBRES_UNITES_PARTICIPANTES/)
  assert.match(implementation, /ENGAGEMENTS_CAMPAGNES_PROGRAMMES|TEAMS_SHEET/)
  assert.match(implementation, /PROGRAMMES_COMPETITION|PROGRAMS_SHEET/)
  assert.match(implementation, /getCampaignSelections\(\)\.catch\(\(\) => \[\]\)/)
  assert.doesNotMatch(implementation, /getAthleteParticipations/)
})

test("la route qualifie les pannes temporaires et le client réessaie sans boucler", async () => {
  const route = await readFile(new URL("../../app/api/competitions/[id]/unites/route.ts", import.meta.url), "utf8")
  const client = await readFile(new URL("../../lib/competitions/client-units.ts", import.meta.url), "utf8")
  const sheets = await readFile(new URL("../../lib/google/sheets.ts", import.meta.url), "utf8")

  assert.match(route, /apiErrorPayload/)
  assert.match(client, /payload\.retryable && attempt < 2/)
  assert.match(sheets, /hasCompleteStaleSnapshot/)
})

test("une saturation de la source des autorisations ne devient pas un refus 403", async () => {
  const mutation = await readFile(new URL("../../lib/competitions/mutation.ts", import.meta.url), "utf8")
  const route = await readFile(new URL("../../app/api/competitions/[id]/unites/route.ts", import.meta.url), "utf8")

  assert.match(mutation, /authorizeWithSource/)
  assert.match(mutation, /SOURCE_UNAVAILABLE[\s\S]*503/)
  assert.doesNotMatch(mutation, /canAccess\("AUT-SPT", "WRITE"\)/)
  assert.match(route, /authorizeWithSource/)
  assert.match(route, /SOURCE_UNAVAILABLE[\s\S]*503/)
  assert.doesNotMatch(route, /canAccess\("AUT-SPT","READ"\)/)
})

test("la composition d’une unité est écrite en lot pour éviter le quota Sheets", async () => {
  const data = await readFile(new URL("../../lib/competitions/data.ts", import.meta.url), "utf8")
  const start = data.indexOf("export async function createParticipatingUnit")
  const end = data.indexOf("export async function updateParticipatingUnit", start)
  const implementation = data.slice(start, end)

  assert.match(implementation, /appendSheetRows/)
  assert.doesNotMatch(implementation, /for\s*\([^)]*memberIds[^)]*\)[\s\S]*appendSheetRow/)
})

test("un résultat nouvellement créé affiche son contexte depuis l’engagement déjà chargé", async () => {
  const results = await readFile(new URL("../../components/dashboard/competition-results.tsx", import.meta.url), "utf8")
  assert.match(results, /function getResultContextLabel/)
  assert.match(results, /engagements\.find\(item=>item\.id_engagement_campagne===row\.id_engagement_campagne\)/)
  assert.match(results, /getResultContextLabel\(row\)/)
})

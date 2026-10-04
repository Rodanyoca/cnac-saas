import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la modification d’une campagne regroupe ses lectures sans appels frais en cascade", async () => {
  const source = await readFile(new URL("../../lib/equipes-nationales/data.ts", import.meta.url), "utf8")
  const start = source.indexOf("async function getCampaignMutationContext")
  const end = source.indexOf("export async function getCampaignSelections", start)
  const implementation = source.slice(start, end)

  assert.ok(start >= 0)
  assert.match(implementation, /getSheetsRows/)
  assert.match(implementation, /TEAM_SHEET/)
  assert.match(implementation, /CAMPAIGN_SHEET/)
  assert.match(implementation, /SAISONS/)
  assert.match(implementation, /STATUTS_CAMPAGNE/)
  assert.doesNotMatch(implementation, /getNationalTeam\(/)
  assert.doesNotMatch(implementation, /fresh:\s*true/)
})

test("une mise à jour Sheets réutilise les lignes et en-têtes mis en cache", async () => {
  const source = await readFile(new URL("../../lib/google/sheets.ts", import.meta.url), "utf8")
  const start = source.indexOf("export async function updateSheetCells")
  const end = source.indexOf("export async function appendSheetRow", start)
  const implementation = source.slice(start, end)

  assert.match(implementation, /getSheetRows/)
  assert.match(implementation, /getSheetHeaders/)
  assert.doesNotMatch(implementation, /spreadsheets\.values\.get/)
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la lecture des activités réutilise les en-têtes de la lecture des lignes", async () => {
  const source = await readFile(new URL("../../lib/activites/data.ts", import.meta.url), "utf8")
  const implementation = source.slice(source.indexOf("export async function getActivities"), source.indexOf("export async function getActivity("))
  assert.ok(implementation.indexOf("getSheetRows") < implementation.indexOf("assertHeaders"))
})

test("un référentiel secondaire saturé ne fait pas tomber la page Documents", async () => {
  const source = await readFile(new URL("../../lib/documents/data.ts", import.meta.url), "utf8")
  assert.match(source, /safeReference/)
  for (const loader of ["getActivities", "getCompetitions", "getNationalTeams", "getActors", "getFederationOptions"]) {
    assert.match(source, new RegExp(`safeReference\\(${loader}`))
  }
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("les vues Fédérations limitent explicitement la durée de leurs données en cache", async () => {
  const source = await readFile(new URL("../../lib/federations/data.ts", import.meta.url), "utf8")
  const ttlValues = [...source.matchAll(/(?:getSheetsRows|readRows)\(\{[^}]*cacheTtlMs:\s*(\d+)/g)].map((match) => Number(match[1]))
  assert.ok(ttlValues.length >= 3, "chaque lecture Fédérations doit fixer sa fraîcheur")
  assert.ok(ttlValues.every((value) => value <= 60000), `TTL trop long : ${ttlValues.join(", ") || "absent"}`)
})

test("le cache groupé accepte une durée propre au consommateur", async () => {
  const source = await readFile(new URL("../../lib/google/sheets.ts", import.meta.url), "utf8")
  const section = source.slice(source.indexOf("export async function getSheetsRows"), source.indexOf("export async function getSheetsTables"))
  assert.match(section, /cacheTtlMs\?: number/)
  assert.match(section, /params\.cacheTtlMs/)
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("le tableau territorial inclut les cercles dans son agrégation", async () => {
  const source = await readFile(new URL("../../lib/federations/dashboard.ts", import.meta.url), "utf8")
  assert.match(source, /aggregateLevel\("cercles", "Cercles", data\.cercles/)
  assert.match(source, /"ligues" \| "ententes" \| "cercles" \| "clubs"/)
})

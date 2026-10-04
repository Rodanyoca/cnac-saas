import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("l’administration du site regroupe toutes les anciennes entrées du sous-menu", async () => {
  const source = await readFile(new URL("../../app/dashboard/site-web/page.tsx", import.meta.url), "utf8")
  for (const route of ["sliders", "communiques", "actualites", "galeries", "historique", "gouvernance", "jeux", "athletes", "entites", "evenements", "documents"]) {
    assert.match(source, new RegExp(`/dashboard/site-web/${route}`))
  }
  assert.match(source, /Administration du site web/)
  assert.match(source, /grid gap-4 sm:grid-cols-2 xl:grid-cols-3/)
})

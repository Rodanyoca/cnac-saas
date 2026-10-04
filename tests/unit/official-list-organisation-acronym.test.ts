import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la liste des officiels affiche le sigle de l’organisation", async () => {
  const page = await readFile(
    new URL("../../app/dashboard/acteurs/officiels/page.tsx", import.meta.url),
    "utf8",
  )
  const list = await readFile(
    new URL("../../app/dashboard/acteurs/officiels/officiels-client.tsx", import.meta.url),
    "utf8",
  )

  assert.match(page, /entity\?\.sigle \|\| entity\?\.nom_officiel/)
  assert.match(page, /organisationId = row\.id_entite/)
  assert.doesNotMatch(page,/getAllOfficialAffiliations/)
  assert.match(list, /<TableHead>Organisation<\/TableHead>/)
})

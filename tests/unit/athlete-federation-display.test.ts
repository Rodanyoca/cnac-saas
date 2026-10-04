import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("la liste et la fiche athlète résolvent la fédération depuis son identifiant", async () => {
  const listPage = await source("app/dashboard/acteurs/athletes/page.tsx")
  const detailPage = await source("app/dashboard/acteurs/athletes/[id]/page.tsx")
  const detailClient = await source("app/dashboard/acteurs/athletes/[id]/athlete-detail-client.tsx")

  for (const page of [listPage, detailPage]) {
    assert.match(page, /new Map\(federationRows\.map/)
    assert.match(page, /federationById\.get\(row\.id_federation\)/)
  }
  assert.match(detailClient, /federations\.find\(\(item\) => item\.id === athlete\.idFederation\)/)
  assert.match(detailClient, /federationLabel/)
})

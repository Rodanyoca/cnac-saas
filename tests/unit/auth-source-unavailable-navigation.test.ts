import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { authenticationFailurePath } from "../../lib/auth/failure-navigation.ts"

test("une indisponibilité temporaire de la source ne renvoie pas vers la connexion", () => {
  assert.equal(authenticationFailurePath(503), "/service-indisponible")
  assert.equal(authenticationFailurePath(401), "/login")
  assert.equal(authenticationFailurePath(403), "/login")
})

test("le proxy utilise la navigation d’échec commune", async () => {
  const source = await readFile(new URL("../../proxy.ts", import.meta.url), "utf8")
  assert.match(source, /authenticationFailurePath\(status\)/)
})

test("les contrôles de session réutilisent brièvement une lecture validée au lieu de saturer Sheets", async () => {
  const [adapter, sheets] = await Promise.all([
    readFile(new URL("../../lib/users/google-adapter.ts", import.meta.url), "utf8"),
    readFile(new URL("../../lib/google/sheets.ts", import.meta.url), "utf8"),
  ])
  assert.doesNotMatch(adapter, /bypassCache:\s*true/)
  assert.match(adapter, /cacheTtlMs:\s*60_000/)
  assert.match(sheets, /cacheTtlMs\?:\s*number/)
  assert.match(sheets, /__cocGoogleAuthClients/)
  assert.match(sheets, /headerCache\.set\(headerCacheKey/)
})

test("la validation lit les lignes avant les en-têtes afin de partager une seule requête", async () => {
  const repository = await readFile(new URL("../../lib/users/repository.ts", import.meta.url), "utf8")
  const rowsPosition = repository.indexOf("this.adapter.readRows(sheetName")
  const headersPosition = repository.indexOf("this.adapter.readHeaders(sheetName")
  assert.ok(rowsPosition >= 0)
  assert.ok(headersPosition > rowsPosition)
})

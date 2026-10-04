import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"

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

test("USERS et ses écritures utilisent des lectures fraîches et propagent les pannes", async () => {
  const source = await readFile(new URL("../../lib/users/google-adapter.ts", import.meta.url), "utf8")
  const calls: Record<string, unknown>[] = []
  let unavailable = false
  const transport = async (params: Record<string, unknown>) => { calls.push(params); if (unavailable) throw new Error("Google unavailable"); return [] }
  const dependencies: Record<string, unknown> = { "server-only": {}, "./config": { getUsersSpreadsheetId: () => "cnac-users-fixture" }, "@/lib/google/sheets": { getSheetHeaders: transport, getSheetRows: transport, updateSheetCells: transport, appendSheetRow: transport } }
  const exports = {} as { createGoogleUsersSheetsAdapter: () => import("../../lib/users/types.ts").UsersSheetsAdapter }
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: (id: string) => dependencies[id] })
  const adapter = exports.createGoogleUsersSheetsAdapter()
  await adapter.readRows("USERS", { fresh: true })
  await adapter.readHeaders("USER_AUTORISATIONS", { fresh: true })
  await adapter.appendRow("AUTH_TENTATIVES", {})
  await adapter.updateRow!("USERS", "id_user", "TEST", { session_version: "2" })
  assert.equal(calls.length, 4)
  for (const call of calls) { assert.equal(call.bypassCache, true); assert.equal(call.spreadsheetId, "cnac-users-fixture") }
  unavailable = true
  await assert.rejects(adapter.readRows("USERS", { fresh: true }), /Google unavailable/)
})

test("la validation lit les lignes avant les en-têtes afin de partager une seule requête", async () => {
  const repository = await readFile(new URL("../../lib/users/repository.ts", import.meta.url), "utf8")
  const rowsPosition = repository.indexOf("this.adapter.readRows(sheetName")
  const headersPosition = repository.indexOf("this.adapter.readHeaders(sheetName")
  assert.ok(rowsPosition >= 0)
  assert.ok(headersPosition > rowsPosition)
})

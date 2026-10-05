import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"

function fixture() {
  const calls: string[][] = []
  let release: (() => void) | undefined
  let gate: Promise<void> | undefined
  let now = 0
  const code = ts.transpileModule(readFileSync(new URL("../../lib/cnac/sheets.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  const mocks: Record<string, unknown> = {
    "server-only": {},
    "googleapis/build/src/apis/sheets": { auth: { JWT: class {} }, sheets: () => ({ spreadsheets: { values: {
      batchGet: async ({ ranges }: { ranges: string[] }) => {
        calls.push([...ranges])
        if (gate) await gate
        return { data: { valueRanges: ranges.map(() => ({ values: [["id"], ["01"]] })) } }
      },
    } } }) },
    "../google/request": { runGoogleRequest: (fn: () => unknown) => fn() },
    "./config": { cnacCredentials: () => ({ email: "fixture", key: "fixture" }), cnacWorkbook: (name: string) => name },
    "./errors": { cnacError: (error: unknown) => error },
    "./media-url": {}, "./schema": {},
    "./model": { assertHeaders: () => {}, isDateColumn: () => false,
      parseTable: (_name: string, values: string[][]) => ({ headers: values[0], rows: [{ id: values[1][0] }], rowNumbers: [2] }) },
  }
  runInNewContext(code, { module, exports: module.exports, process: { env: {} }, structuredClone,
    Date: { now: () => now }, console, require: (name: string) => {
      if (!(name in mocks)) throw new Error(`Unexpected dependency ${name}`)
      return mocks[name]
    } })
  const api = module.exports as typeof import("../../lib/cnac/sheets.ts")
  return { ...api, calls, tick: (ms: number) => { now += ms },
    hold: () => { gate = new Promise<void>(resolve => { release = resolve }) },
    release: () => { gate = undefined; release?.() } }
}

test("overlapping page reads fetch each sheet only once, including simultaneous subsets", async () => {
  const f = fixture()
  f.hold()
  const first = f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["FEDERATIONS", "ENTITES"] })
  const second = f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["ENTITES", "SPORTS"] })
  f.release()
  const [a, b] = await Promise.all([first, second])
  assert.deepEqual(f.calls.flat().sort(), ["'ENTITES'!A:AZ", "'FEDERATIONS'!A:AZ", "'SPORTS'!A:AZ"].sort())
  assert.equal(b.SPORTS.rows[0].id, "01")
  a.ENTITES.rows[0].id = "mutated"
  assert.equal(b.ENTITES.rows[0].id, "01")
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["SPORTS", "ENTITES"] })
  assert.equal(f.calls.length, 2)
})

test("partial cache hits only fetch missing sheets and fresh writes bypass cached reads", async () => {
  const f = fixture()
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["ENTITES"] })
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["ENTITES", "SPORTS"] })
  assert.deepEqual(f.calls[1], ["'SPORTS'!A:AZ"])
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["ENTITES"], bypassCache: true })
  assert.equal(f.calls.length, 3)
  f.clearSheetCache()
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["SPORTS"] })
  assert.equal(f.calls.length, 4)
})

test("cache expiration and workbook isolation still force reads", async () => {
  const f = fixture()
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["SPORTS"], cacheTtlMs: 60000 })
  f.tick(59999)
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["SPORTS"], cacheTtlMs: 60000 })
  assert.equal(f.calls.length, 1)
  f.tick(1)
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["SPORTS"], cacheTtlMs: 60000 })
  await f.getSheetsTables({ spreadsheetId: "other", sheetNames: ["SPORTS"] })
  assert.equal(f.calls.length, 3)
})

test("a read started before invalidation cannot repopulate the cache", async () => {
  const f = fixture()
  f.hold()
  const oldRead = f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["SPORTS"] })
  f.clearSheetCache()
  f.release()
  await oldRead
  await f.getSheetsTables({ spreadsheetId: "refs", sheetNames: ["SPORTS"] })
  assert.equal(f.calls.length, 2)
})

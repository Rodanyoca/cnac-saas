import assert from "node:assert/strict"
import test from "node:test"
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import sharp from "sharp"
import { CNAC_HEADERS, CNAC_KEYS, type CnacSheet } from "../../lib/cnac/schema.ts"
import { parseTable } from "../../lib/cnac/model.ts"

const root = fileURLToPath(new URL("../../", import.meta.url)), require = createRequire(import.meta.url)
const compiledModules = new Map<string, string>()
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADklEQVQImWP4DwMMcBYAs2AR78H3GQQAAAAASUVORK5CYII=", "base64")
const image = () => new File([png], "photo.png", { type: "image/png" })
type Row = Record<string, string>
type Result = { status: number; json: Record<string, unknown> }

function fixture() {
  const matrices = new Map<string, unknown[][]>(Object.entries(CNAC_HEADERS).map(([name, headers]) => [name, [[...headers]]]))
  matrices.get("FEDERATIONS")![0].push("logo_drive_id", "logo_drive_url")
  const add = (sheet: string, row: Row) => matrices.get(sheet)!.push(matrices.get(sheet)![0].map(column => row[String(column)] || ""))
  add("FEDERATIONS", { id_federation: "FED001", id_entite: "RDCENT001", id_sport: "SP1", statut: "ACTIF" })
  add("ENTITES", { id_entite: "RDCENT001", nom_officiel: "Federation existante", sigle: "FE", id_categorie_entite: "CATEN001" })
  add("CATEGORIES_ENTITES", { id_categorie_entite: "CATEN001", nom_categorie_entite: "Federation nationale" })
  add("SPORTS", { id_sport: "SP1", nom_sport: "Sport", statut: "ACTIF" })
  matrices.get("SPORTS")![0].push("utilise_equipes"); matrices.get("SPORTS")![1].push("TRUE")
  add("SEXES", { id_sexe: "01", nom_sexe: "Homme" })
  add("CLUBS", { id_club_cnac: "C1", id_federation: "FED001", nom_club: "Club" })
  add("EQUIPES", { id_equipe_cnac: "T1", id_club_cnac: "C1", id_federation: "FED001", id_sport: "SP1", id_sexe: "01", nom_equipe: "Equipe" })
  let allowed = true, user = "USER-TEST", nextFile = 0, writes = 0, failWrite = false, loseResponse = false, failConfirm = false, failDrive = false
  const files = new Map<string, { folder: string; buffer: Buffer; mimeType: string }>(), events: string[] = [], logs: string[] = []
  const readRanges = (ranges: string[]) => ({ data: { valueRanges: ranges.map(range => {
    assert.doesNotMatch(range, /DIVISIONS/)
    const match = range.match(/^'([^']+)'!([A-Z]+):([A-Z]+)$/)!
    const matrix = matrices.get(match[1])!
    if (match[2] === match[3]) { const index = [...match[2]].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 64, 0) - 1; return { values: matrix.map(row => [row[index] || ""]) } }
    if (match[1] === "ATHLETES") assert.equal(range, "'ATHLETES'!A:S")
    return { values: structuredClone(matrix) }
  }) } })
  const transport = { spreadsheets: {
    values: { batchGet: async ({ ranges }: { ranges: string[] }) => { if (writes && failConfirm) throw new Error("secret-provider-error"); return readRanges(ranges) } },
    get: async () => ({ data: { sheets: [...matrices.keys()].map((title, sheetId) => ({ properties: { title, sheetId } })) } }),
    batchUpdate: async ({ requestBody }: { requestBody: { requests: { appendCells?: { sheetId: number; rows: { values: { userEnteredValue: Record<string, unknown> }[] }[] }; updateCells?: { start: { sheetId: number; rowIndex: number; columnIndex: number }; rows: { values: { userEnteredValue: Record<string, unknown> }[] }[] } }[] } }) => {
      events.push("sheets:batch"); if (failWrite) throw new Error("secret-provider-error")
      const next = structuredClone(matrices), names = [...matrices.keys()]
      const value = (cell: { userEnteredValue: Record<string, unknown> }) => cell.userEnteredValue.stringValue ?? cell.userEnteredValue.numberValue ?? cell.userEnteredValue.boolValue
      for (const request of requestBody.requests) {
        if (request.appendCells) {
          const name = names[request.appendCells.sheetId], rows = request.appendCells.rows.map(row => row.values.map(value))
          if (name === "ATHLETES") assert.equal(rows[0].length, 19)
          next.get(name)!.push(...rows)
        } else {
          const requestData = request.updateCells!, start = requestData.start, name = names[start.sheetId]
          if (name === "ATHLETES") assert.ok(start.columnIndex < 19)
          next.get(name)![start.rowIndex][start.columnIndex] = value(requestData.rows[0].values[0])
        }
      }
      matrices.clear(); for (const [name, matrix] of next) matrices.set(name, matrix)
      writes++; if (loseResponse) throw new Error("secret-provider-error")
      return { data: {} }
    },
  } }
  const env = { NODE_ENV: "test", GOOGLE_SERVICE_ACCOUNT_EMAIL: "fixture@example.invalid", GOOGLE_PRIVATE_KEY: "fixture-key", GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID: "cnac-refs-test", GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID: "cnac-actors-test", GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID: "cnac-territorial-test", GOOGLE_OAUTH_CLIENT_ID: "test", GOOGLE_OAUTH_CLIENT_SECRET: "test", GOOGLE_DRIVE_REFRESH_TOKEN: "test", GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID: "cnac-logos-test", GOOGLE_DRIVE_ACTEURS_AVATARS_FOLDER_ID: "cnac-avatars-test" }
  const mocks: Record<string, unknown> = {
    "server-only": {}, "sharp": { __esModule: true, default: sharp },
    "next/server": { NextResponse: { json: Response.json } }, "next/cache": { revalidatePath: () => undefined },
    "googleapis/build/src/apis/sheets": { sheets: () => transport, auth: { JWT: class {} } },
    [resolve(root, "lib/auth.ts")]: { canAccess: async () => allowed, getSession: async () => allowed ? { idUser: user, doitChangerMotDePasse: false } : null },
    [resolve(root, "lib/auth/config.ts")]: { getAuthSecret: () => "test-signature-key-with-no-real-credentials" },
    [resolve(root, "lib/google/request.ts")]: { runGoogleRequest: (fn: () => unknown) => fn() },
    [resolve(root, "lib/google/sheets.ts")]: { getSheetsRows: () => { throw new Error("Only CNAC Sheets may be used") } },
    [resolve(root, "lib/google/drive.ts")]: {
      reservePrivateDriveFileId: async () => `file-${++nextFile}`,
      uploadPrivateFileToDrive: async (input: { fileId: string; folderId: string; buffer: Buffer; mimeType: string }) => { events.push(`upload:${input.fileId}`); if (failDrive) throw new Error("secret-provider-error"); files.set(input.fileId, { folder: input.folderId, buffer: input.buffer, mimeType: input.mimeType }); return { fileId: input.fileId, url: "https://drive.google.com/view-page" } },
      uploadFileToDrive: () => { throw new Error("Public upload forbidden") },
      downloadDriveFile: async (id: string) => ({ ...files.get(id)!, name: "photo" }),
    },
    [resolve(root, "lib/cnac/drive-ownership.ts")]: {
      cnacOwnedFileMetadata: async (id: string, folder: string) => { const file = files.get(id); return file?.folder === folder ? { mimeType: file.mimeType, size: file.buffer.length } : undefined },
      deleteCnacOwnedFile: async (id: string, folder: string) => { if (files.get(id)?.folder === folder) { events.push(`delete:${id}`); files.delete(id) } },
    },
  }
  const modules = new Map<string, { exports: Record<string, unknown> }>()
  const load = (path: string): Record<string, unknown> => {
    if (path in mocks) return mocks[path] as Record<string, unknown>
    if (modules.has(path)) return modules.get(path)!.exports
    const module = { exports: {} }; modules.set(path, module)
    const code = compiledModules.get(path) || ts.transpileModule(readFileSync(path, "utf8"), { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
    compiledModules.set(path, code)
    runInNewContext(code, { module, exports: module.exports, process: { env }, Buffer, File, FormData, Request, Response, URL, structuredClone, setTimeout, clearTimeout, console: { error: (...args: unknown[]) => logs.push(JSON.stringify(args)) }, require: (name: string) => {
      if (name in mocks) return mocks[name]
      if (!name.startsWith("@/") && !name.startsWith(".")) return require(name)
      let target = name.startsWith("@/") ? resolve(root, name.slice(2)) : resolve(dirname(path), name)
      if (!/\.tsx?$/.test(target)) target += existsSync(target + ".tsx") ? ".tsx" : ".ts"
      return load(target)
    } }, { filename: path }); return module.exports
  }
  const athlete = load(resolve(root, "app/api/athletes/route.ts")) as Record<string, (request: Request) => Promise<Response>>
  const federation = load(resolve(root, "app/api/federations/route.ts")) as Record<string, (request: Request) => Promise<Response>>
  const territorial = load(resolve(root, "lib/cnac/territorial-handler.ts")) as { territorialWrite: (kind: string, request: Request, method: string) => Promise<Response> }
  const images = load(resolve(root, "lib/cnac/media-handler.ts")) as { readExistingImage: (kind: string, id: string) => Promise<Response> }
  const call = async (scope: "athlete" | "federation" | "identification", method: "POST" | "PUT", data: unknown, file?: File, ticket = ""): Promise<Result> => {
    const form = new FormData(); form.set("data", JSON.stringify(data)); if (file) form.set(scope === "athlete" ? "avatar" : "logo", file); if (ticket) form.set("ticket", ticket)
    const request = new Request("http://fixture.invalid/api", { method, body: form })
    const response = scope === "identification" ? await territorial.territorialWrite("identification", request, method) : await (scope === "athlete" ? athlete : federation)[method](request)
    return { status: response.status, json: await response.json() }
  }
  const save = async (scope: "athlete" | "federation" | "identification", method: "POST" | "PUT", data: unknown, file?: File) => {
    const prepared = await call(scope, method, data, file); assert.equal(prepared.status, 202, JSON.stringify(prepared.json))
    const committed = await call(scope, method, data, file, String(prepared.json.ticket)); return { prepared, committed }
  }
  const rows = (sheet: CnacSheet) => parseTable(sheet, matrices.get(sheet)!).rows
  return { call, save, rows, add, images, files, events, logs, deny: () => { allowed = false }, otherUser: () => { user = "OTHER" }, failWrite: () => { failWrite = true }, loseResponse: () => { loseResponse = true }, failDrive: () => { failDrive = true }, failConfirm: (value: boolean) => { failConfirm = value }, writes: () => writes }
}
const identity = { nom_complet: "Athlete test", id_federation: "FED001", id_sexe: "01", id_club_cnac: "C1", id_equipe_cnac: "T1", observations: "Conserver" }
const federationInput = { nom_officiel: "Nouvelle federation", sigle: "NF", id_categorie_entite: "CATEN001", id_sport: "SP1", statut: "ACTIF", statut_reconnaissance_ministere: "ACTIF", statut_affiliation_coc: "ACTIF" }

for (const withImage of [false, true]) {
  test(`athlete create/reload ${withImage ? "with" : "without"} private image preserves identity and club/team`, async () => {
    const f = fixture(), result = await f.save("athlete", "POST", { row: identity }, withImage ? image() : undefined)
    assert.equal(result.committed.status, 200, JSON.stringify(result.committed.json))
    const row = f.rows("ATHLETES")[0]; assert.equal(row.nom_complet, identity.nom_complet); assert.equal(row.id_club_cnac, "C1"); assert.equal(row.id_equipe_cnac, "T1")
    assert.equal(Boolean(row.avatar_drive_id), withImage); assert.equal(f.files.size, withImage ? 1 : 0)
    const edited = await f.save("athlete", "PUT", { id: row.id_athlete_cnac, row: { nom_complet: "Updated" } })
    assert.equal(edited.committed.status, 200); assert.equal(f.rows("ATHLETES")[0].avatar_drive_id, row.avatar_drive_id); assert.equal(f.rows("ATHLETES")[0].id_equipe_cnac, "T1")
  })
  test(`federation atomic create/reload ${withImage ? "with" : "without"} logo`, async () => {
    const f = fixture(), result = await f.save("federation", "POST", { row: federationInput }, withImage ? image() : undefined)
    assert.equal(result.committed.status, 201, JSON.stringify(result.committed.json)); assert.equal(f.writes(), 1)
    const row = f.rows("FEDERATIONS")[1]; assert.ok(f.rows("ENTITES").some(entity => entity.id_entite === row.id_entite)); assert.equal(Boolean(row.logo_drive_id), withImage)
    const edited = await f.save("identification", "PUT", { id: row.id_federation, row: { observations: "Updated" } })
    assert.equal(edited.committed.status, 200); assert.equal(f.rows("FEDERATIONS")[1].logo_drive_id, row.logo_drive_id)
  })
}
test("replacing an avatar keeps a shared old image and returns a readable private proxy after reload", async () => {
  const f = fixture(); await f.save("athlete", "POST", { row: identity }, image())
  const row = f.rows("ATHLETES")[0]; f.add("ATHLETES", { ...row, id_athlete_cnac: "SHARED" })
  const changed = await f.save("athlete", "PUT", { id: row.id_athlete_cnac, row: { nom_complet: "Updated" } }, image())
  assert.equal(changed.committed.status, 200); assert.ok(f.files.has(row.avatar_drive_id)); assert.equal(f.files.size, 2)
  const response = await f.images.readExistingImage("avatar", row.id_athlete_cnac)
  assert.equal(response.status, 200); assert.equal(response.headers.get("Cache-Control"), "private, no-store"); assert.deepEqual(Buffer.from(await response.arrayBuffer()), png)
})
test("lost Sheets responses and retry never create a duplicate federation, entity or file", async () => {
  const f = fixture(); f.loseResponse(); const result = await f.save("federation", "POST", { row: federationInput }, image())
  assert.equal(result.committed.status, 201)
  const again = await f.call("federation", "POST", { row: federationInput }, image(), String(result.prepared.json.ticket))
  assert.equal(again.status, 201); assert.equal(f.rows("FEDERATIONS").length, 2); assert.equal(f.rows("ENTITES").length, 2); assert.equal(f.files.size, 1); assert.equal(f.writes(), 1)
})
test("Sheets failure removes an unused upload and never reports success", async () => {
  const f = fixture(); f.failWrite(); const result = await f.save("athlete", "POST", { row: identity }, image())
  assert.equal(result.committed.status, 502); assert.equal(result.committed.json.resetTicket, true); assert.equal(f.files.size, 0); assert.equal(f.rows("ATHLETES").length, 0)
  assert.doesNotMatch(JSON.stringify([result.committed.json, f.logs]), /secret-provider-error|fixture-key|test-signature-key/)
})
test("Drive failure never appends a sheet record", async () => {
  const f = fixture(); f.failDrive(); const result = await f.save("athlete", "POST", { row: identity }, image())
  assert.equal(result.committed.status, 502); assert.equal(f.writes(), 0); assert.equal(f.rows("ATHLETES").length, 0)
})
test("confirmation failure can resume the committed record after the source recovers", async () => {
  const f = fixture(); const data = { row: identity }, selected = image()
  const prepared = await f.call("athlete", "POST", data, selected); f.failConfirm(true)
  const failure = await f.call("athlete", "POST", data, selected, String(prepared.json.ticket))
  assert.equal(failure.status, 502); assert.equal(failure.json.resetTicket, false); assert.equal(f.files.size, 1)
  f.failConfirm(false); const retried = await f.call("athlete", "POST", data, selected, String(prepared.json.ticket))
  assert.equal(retried.status, 200); assert.equal(f.rows("ATHLETES").length, 1); assert.equal(f.writes(), 1)
})
test("unauthorized access, invalid content and oversize uploads have no side effects", async () => {
  const f = fixture()
  const bad = await f.call("athlete", "POST", { row: identity }, new File(["fake"], "photo.png", { type: "image/png" })); assert.equal(bad.status, 400)
  const huge = await f.call("federation", "POST", { row: federationInput }, new File([new Uint8Array(4 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" })); assert.equal(huge.status, 413)
  f.deny(); assert.equal((await f.call("athlete", "POST", { row: identity }, image())).status, 403); assert.equal((await f.images.readExistingImage("avatar", "ATH-0001")).status, 403)
  assert.equal(f.writes(), 0); assert.equal(f.files.size, 0)
})
test("a save ticket cannot be changed, reused by another user or attached to another payload", async () => {
  const f = fixture(), data = { row: identity }, selected = image(), prepared = await f.call("athlete", "POST", data, selected), ticket = String(prepared.json.ticket)
  assert.equal((await f.call("athlete", "POST", data, selected, ticket + "x")).status, 409)
  assert.equal((await f.call("athlete", "POST", { row: { ...identity, nom_complet: "Changed" } }, selected, ticket)).status, 409)
  f.otherUser(); assert.equal((await f.call("athlete", "POST", data, selected, ticket)).status, 409); assert.equal(f.writes(), 0)
})
test("the private proxy refuses a copied file outside the configured CNAC folder", async () => {
  const f = fixture(); f.add("ATHLETES", { ...identity, id_athlete_cnac: "ATH-0001", avatar_drive_id: "foreign" }); f.files.set("foreign", { folder: "other-repository", buffer: png, mimeType: "image/png" })
  assert.equal((await f.images.readExistingImage("avatar", "ATH-0001")).status, 404)
})

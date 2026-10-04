import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import ts from "typescript"

function client(fetcher: (body: FormData) => Promise<Response>) {
  const module = { exports: {} }
  const source = readFileSync(new URL("../../lib/api/confirmed-save.ts", import.meta.url), "utf8")
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  runInNewContext(code, { module, exports: module.exports, FormData, require: () => ({ apiFetch: (_url: string, options: { body: FormData; timeoutMs: number }) => { assert.equal(options.timeoutMs, 120_000); return fetcher(options.body) } }) })
  return (module.exports as { confirmedSave: (url: string, method: string, data: unknown, file: File | null, field: string, ticket: { current: string }) => Promise<Record<string, unknown>> }).confirmedSave
}
test("preparation stores a ticket before commit and concurrent submits share the same operation", async () => {
  const bodies: FormData[] = [], save = client(async body => {
    bodies.push(body)
    return body.get("ticket") ? Response.json({ ok: true, row: { id: "A" } }) : Response.json({ prepared: true, ticket: "signed-plan" }, { status: 202 })
  }), ticket = { current: "" }
  const [first, second] = await Promise.all([save("/api/athletes", "POST", { row: { nom_complet: "Test" } }, null, "avatar", ticket), save("/api/athletes", "POST", { row: { nom_complet: "Test" } }, null, "avatar", ticket)])
  assert.equal(bodies.length, 2); assert.equal(bodies[1].get("ticket"), "signed-plan"); assert.equal(first, second); assert.equal(ticket.current, "")
})
test("a lost commit response retains the ticket and retries the original commit", async () => {
  let calls = 0
  const save = client(async body => {
    if (++calls === 1) return Response.json({ prepared: true, ticket: "signed-plan" }, { status: 202 })
    assert.equal(body.get("ticket"), "signed-plan")
    if (calls === 2) throw new Error("lost network response")
    return Response.json({ ok: true })
  }), ticket = { current: "" }, data = { row: { nom_complet: "Test" } }
  await assert.rejects(save("/api/athletes", "POST", data, null, "avatar", ticket), /même sauvegarde/)
  assert.equal(ticket.current, "signed-plan")
  assert.equal((await save("/api/athletes", "POST", data, null, "avatar", ticket)).ok, true); assert.equal(calls, 3)
})
test("a confirmed failure allows correction; an unknown failure keeps the original ticket", async () => {
  for (const reset of [false, true]) {
    const save = client(async () => Response.json({ error: "Non confirmé", resetTicket: reset }, { status: 502 })), ticket = { current: "signed-plan" }
    await assert.rejects(save("/api/athletes", "PUT", {}, null, "avatar", ticket), /Non confirmé/)
    assert.equal(ticket.current, reset ? "" : "signed-plan")
  }
})

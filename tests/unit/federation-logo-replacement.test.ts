import assert from "node:assert/strict"
import test from "node:test"
import { executeConfirmedSave, ConfirmedSaveError, type SavePlan, type SaveAdapter } from "../../lib/cnac/confirmed-save.ts"

function fixture(options: { writeFails?: boolean; loseResponse?: boolean; confirmationFails?: boolean; shared?: boolean; driveFails?: boolean } = {}) {
  const before = { id_federation: "FED-1", logo_drive_id: "old", logo_drive_url: "old-url", observations: "Garder" }
  let row = { ...before }, exists = false, reads = 0
  const events: string[] = [], removed = new Set<string>()
  const plan: SavePlan = { scope: "logo", rows: [{ sheet: "FEDERATIONS", id: "FED-1", mode: "update", before, values: { id_federation: "FED-1", logo_drive_id: "new", logo_drive_url: "/api/federations/logo/FED-1?v=new" } }], media: { kind: "logo", recordId: "FED-1", fileId: "new", oldId: "old", mimeType: "image/png", digest: "digest" } }
  const adapter: SaveAdapter = {
    read: async () => { if (++reads > 1 && options.confirmationFails) throw new Error("unavailable"); return [{ ...row }] },
    mediaExists: async () => exists,
    upload: async () => { events.push("upload"); if (options.driveFails) throw new Error("Drive"); exists = true },
    write: async rows => { events.push("write"); if (options.writeFails) throw new Error("Sheets"); row = { ...row, ...rows[0].values }; if (options.loseResponse) throw new Error("Lost response") },
    removeUnused: async id => { if (!removed.has(id) && row.logo_drive_id !== id && !(options.shared && id === "old")) { events.push(`remove:${id}`); removed.add(id) } },
  }
  return { plan, adapter, events, row: () => row }
}
test("replacement confirms Sheets before removing an unshared old file", async () => {
  const f = fixture(); await executeConfirmedSave(f.plan, f.adapter)
  assert.deepEqual(f.events, ["upload", "write", "remove:old"])
  assert.equal(f.row().observations, "Garder")
})
test("confirmed Sheets failure cleans the new file and preserves existing data", async () => {
  const f = fixture({ writeFails: true })
  await assert.rejects(executeConfirmedSave(f.plan, f.adapter), error => error instanceof ConfirmedSaveError && error.resetTicket)
  assert.deepEqual(f.events, ["upload", "write", "remove:new"]); assert.equal(f.row().logo_drive_id, "old")
})
test("a lost write response is reconciled without double writes or double uploads", async () => {
  const f = fixture({ loseResponse: true }); await executeConfirmedSave(f.plan, f.adapter); await executeConfirmedSave(f.plan, f.adapter)
  assert.deepEqual(f.events, ["upload", "write", "remove:old"])
})
test("an unknown confirmation retains the new file for a safe retry", async () => {
  const options = { confirmationFails: true }, f = fixture(options)
  await assert.rejects(executeConfirmedSave(f.plan, f.adapter), error => error instanceof ConfirmedSaveError && !error.resetTicket)
  assert.deepEqual(f.events, ["upload", "write"])
  options.confirmationFails = false; await executeConfirmedSave(f.plan, f.adapter)
  assert.equal(f.events.filter(event => event === "write").length, 1)
})
test("a shared old image is retained", async () => {
  const f = fixture({ shared: true }); await executeConfirmedSave(f.plan, f.adapter)
  assert.deepEqual(f.events, ["upload", "write"])
})
test("a Drive failure never changes the existing sheet row", async () => {
  const f = fixture({ driveFails: true }); await assert.rejects(executeConfirmedSave(f.plan, f.adapter), ConfirmedSaveError)
  assert.deepEqual(f.events, ["upload"]); assert.equal(f.row().logo_drive_id, "old")
})
test("concurrent changes are refused before any upload", async () => {
  const f = fixture(); f.plan.rows[0].before!.observations = "Stale"
  await assert.rejects(executeConfirmedSave(f.plan, f.adapter), error => error instanceof ConfirmedSaveError && error.status === 409)
  assert.deepEqual(f.events, [])
})

import assert from "node:assert/strict"
import test from "node:test"
import { canWriteLocalTerritorialMutation } from "../../lib/demo-mode.ts"

const demo = { NODE_ENV: "development", CNAC_DEMO_MODE: "true" }
const host = "localhost:3000"
const origin = "http://localhost:3000"

test("local CNAC federation settings allow edits to structures and identification", () => {
  for (const resource of ["zones", "ententes", "ligues", "cercles", "clubs", "equipes", "hierarchie", "identification"]) {
    assert.equal(canWriteLocalTerritorialMutation(resource, "PUT", demo, host, origin), true, resource)
  }
})

test("local edit exception never permits remote, cross-origin or production requests", () => {
  for (const resource of ["zones", "identification"]) {
    assert.equal(canWriteLocalTerritorialMutation(resource, "PUT", demo, host, "http://other.invalid"), false)
    assert.equal(canWriteLocalTerritorialMutation(resource, "PUT", demo, host, ""), false)
    assert.equal(canWriteLocalTerritorialMutation(resource, "PUT", demo, "example.invalid", "http://example.invalid"), false)
    assert.equal(canWriteLocalTerritorialMutation(resource, "PUT", { ...demo, NODE_ENV: "production" }, host, origin), false)
    assert.equal(canWriteLocalTerritorialMutation(resource, "PUT", { NODE_ENV: "development" }, host, origin), false)
    assert.equal(canWriteLocalTerritorialMutation(resource, "DELETE", demo, host, origin), false)
  }
  assert.equal(canWriteLocalTerritorialMutation("identification", "POST", demo, host, origin), false)
  assert.equal(canWriteLocalTerritorialMutation("users", "PUT", demo, host, origin), false)
})

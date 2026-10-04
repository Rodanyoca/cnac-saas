import assert from "node:assert/strict"
import test from "node:test"
import { localCredentialsMatch, LOCAL_ADMIN_ID, resolveLocalSession, localLoginBlocked, recordLocalLogin } from "../../lib/auth/local-access.ts"
import { createSessionToken } from "../../lib/auth/session-token.ts"

const env = { CNAC_LOCAL_AUTH: "true", CNAC_LOCAL_EMAIL: "admin@test.local", CNAC_LOCAL_PASSWORD: "Test-password-2026", AUTH_SECRET: "local-test-secret" }

test("local login accepts only configured credentials and requires explicit enablement", () => {
  assert.equal(localCredentialsMatch(" ADMIN@Test.local ", env.CNAC_LOCAL_PASSWORD, env), true)
  assert.equal(localCredentialsMatch(env.CNAC_LOCAL_EMAIL, "wrong", env), false)
  assert.equal(localCredentialsMatch("other@test.local", env.CNAC_LOCAL_PASSWORD, env), false)
  assert.equal(localCredentialsMatch(env.CNAC_LOCAL_EMAIL, env.CNAC_LOCAL_PASSWORD, { ...env, CNAC_LOCAL_AUTH: "false" }), false)
  assert.equal(localCredentialsMatch(env.CNAC_LOCAL_EMAIL, env.CNAC_LOCAL_PASSWORD, { ...env, CNAC_LOCAL_PASSWORD: "" }), false)
})

test("local session requires a signed, current administrator cookie", async () => {
  const token = await createSessionToken({ idUser: LOCAL_ADMIN_ID, sessionVersion: 1, secret: env.AUTH_SECRET })
  const session = await resolveLocalSession(token, env)
  assert.equal(session?.estSuperAdmin, true)
  assert.equal(session?.email, env.CNAC_LOCAL_EMAIL)
  assert.equal(await resolveLocalSession(undefined, env), null)
  assert.equal(await resolveLocalSession(token + "tampered", env), null)
  assert.equal(await resolveLocalSession(token, { ...env, AUTH_SECRET: "different" }), null)
  assert.equal(await resolveLocalSession(token, { ...env, CNAC_LOCAL_AUTH: "false" }), null)
  for (const [idUser, sessionVersion, nowSeconds] of [["OTHER", 1, undefined], [LOCAL_ADMIN_ID, 2, undefined], [LOCAL_ADMIN_ID, 1, 1]] as const) {
    const invalid = await createSessionToken({ idUser, sessionVersion, secret: env.AUTH_SECRET, nowSeconds })
    assert.equal(await resolveLocalSession(invalid, env), null)
  }
})

test("failed local attempts are limited and expire; successful login clears failures", () => {
  const key = "test-limit"
  for (let i = 0; i < 8; i++) recordLocalLogin(key, false, 1000)
  assert.equal(localLoginBlocked(key, 1001), true)
  assert.equal(localLoginBlocked(key, 1000 + 15 * 60 * 1000), false)
  recordLocalLogin(key, false)
  recordLocalLogin(key, true)
  assert.equal(localLoginBlocked(key), false)
})

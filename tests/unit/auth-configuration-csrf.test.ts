import assert from "node:assert/strict"
import test from "node:test"
import { getAuthSecret, validateAuthenticationConfiguration } from "../../lib/auth/config.ts"
import { isSameOriginMutation } from "../../lib/auth/csrf.ts"

test("authentication requires two distinct server secrets", () => {
  assert.throws(() => getAuthSecret({}))
  assert.throws(() => getAuthSecret({ AUTH_SECRET: "short" }))
  const env = { AUTH_SECRET: "s".repeat(40), AUTH_TELEMETRY_HMAC_KEY: "t".repeat(40) }
  assert.doesNotThrow(() => validateAuthenticationConfiguration(env))
  assert.throws(() => validateAuthenticationConfiguration({ ...env, AUTH_TELEMETRY_HMAC_KEY: env.AUTH_SECRET }))
  assert.throws(() => validateAuthenticationConfiguration({ AUTH_SECRET: env.AUTH_SECRET }))
})

test("mutations require the exact same origin in local and production environments", () => {
  const request = (origin?: string, extra = {}) => new Request("https://cnac.example/api/auth/login", { method: "POST", headers: { ...(origin ? { origin } : {}), ...extra } })
  assert.equal(isSameOriginMutation(request("https://cnac.example")), true)
  for (const origin of [undefined, "null", "https://evil.example", "http://cnac.example", "https://cnac.example:444", "https://cnac.example/path"]) assert.equal(isSameOriginMutation(request(origin)), false)
  assert.equal(isSameOriginMutation(request("https://cnac.example", { "sec-fetch-site": "cross-site" })), false)
  assert.equal(isSameOriginMutation(new Request("http://localhost:3000/api/auth/logout", { method: "POST", headers: { origin: "http://localhost:3000" } })), true)
  assert.equal(isSameOriginMutation(new Request("https://cnac.example/api/auth/session")), true)
})

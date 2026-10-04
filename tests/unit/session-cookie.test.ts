import assert from "node:assert/strict"
import test from "node:test"
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../../lib/auth/session-cookie.ts"
import { SESSION_TTL_SECONDS } from "../../lib/auth/session-token.ts"
import { isPendingPasswordRouteAllowed } from "../../lib/auth/session-policy.ts"

test("définit les attributs de sécurité et la durée du cookie", () => {
  assert.equal(SESSION_COOKIE_NAME, "coc_session")
  assert.deepEqual(sessionCookieOptions(true), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS })
  assert.equal(sessionCookieOptions(false).secure, false)
})

test("une session en activation n'accède qu'aux quatre routes minimales", () => {
  for (const path of ["/activation", "/api/auth/activate", "/api/auth/session", "/api/auth/logout"]) {
    assert.equal(isPendingPasswordRouteAllowed(path), true)
  }
  for (const path of ["/dashboard", "/api/athletes", "/api/auth/login", "/dashboard/activation"]) {
    assert.equal(isPendingPasswordRouteAllowed(path), false)
  }
})

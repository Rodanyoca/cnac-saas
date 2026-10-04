import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"
import test from "node:test"
import ts from "typescript"
import * as localAccess from "../../lib/auth/local-access.ts"
import { createSessionToken } from "../../lib/auth/session-token.ts"
import { SESSION_COOKIE_NAME } from "../../lib/auth/session-cookie.ts"

function load(file: string, dependencies: Record<string, unknown>) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(resolve(file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  runInNewContext(code, { exports, process, console, URL, require: (id: string) => {
    if (!(id in dependencies)) throw new Error(`Unexpected dependency ${id}`)
    return dependencies[id]
  } })
  return exports as Record<string, (...args: any[]) => Promise<any>>
}

test("CNAC login, protected request, session reload and logout work without USERS", async () => {
  const values = { CNAC_LOCAL_AUTH: "true", CNAC_LOCAL_EMAIL: "integration@test.local", CNAC_LOCAL_PASSWORD: "Integration-password-2026", AUTH_SECRET: "integration-secret", CNAC_DEMO_MODE: "true" }
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]))
  Object.assign(process.env, values)
  let cookie: string | undefined
  const google = () => { throw new Error("Local authentication must not call Google USERS") }
  const jar = { get: () => cookie ? { value: cookie } : undefined, set: (_name: string, value: string) => { cookie = value }, delete: () => { cookie = undefined } }
  const next = { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init), next: () => ({ status: 200 }), redirect: () => ({ status: 307 }) }, after: google }
  try {
    const auth = load("lib/auth.ts", {
      "server-only": {}, "next/headers": { cookies: async () => jar },
      "@/lib/users/data": { getUserById: google, getAuthorizationsForUser: google },
      "@/lib/auth/authorization": { authorize: google },
      "@/lib/auth/session-cookie": { SESSION_COOKIE_NAME, sessionCookieOptions: () => ({ httpOnly: true }) },
      "@/lib/auth/session-resolution": { resolveSession: google },
      "@/lib/auth/session-token": { createSessionToken },
      "@/lib/demo-mode": { isCnacDemoMode: () => true },
      "@/lib/auth/local-access": localAccess,
    })
    const login = load("app/api/auth/login/route.ts", {
      "node:crypto": { randomUUID: () => "request-local" }, "next/server": next,
      "@/lib/auth": auth,
      "@/lib/auth/attempts": {}, "@/lib/auth/login-error": { describeAuthenticationFailure: () => ({ message: "Failure", status: 503 }) },
      "@/lib/auth/password": { hashPassword: async () => "unused", verifyPassword: google },
      "@/lib/auth/post-login-route": {}, "@/lib/auth/telemetry-hash": {}, "@/lib/audit/actions": {}, "@/lib/audit/logger": {},
      "@/lib/users/commands": {}, "@/lib/users/google-adapter": { createGoogleUsersSheetsAdapter: google },
      "@/lib/users/data": { getAuthenticationSnapshot: google }, "@/lib/auth/local-access": localAccess,
    })
    const proxy = load("proxy.ts", {
      "next/server": next, "@/lib/auth/session-cookie": { SESSION_COOKIE_NAME },
      "@/lib/auth/session-policy": {}, "@/lib/auth/session-resolution": { resolveSession: google },
      "@/lib/auth/authorization": {}, "@/lib/auth/route-policy": {}, "@/lib/users/data": {},
      "@/lib/auth/failure-navigation": { authenticationFailurePath: () => "/login" },
      "@/lib/demo-mode": { isCnacDemoMode: () => true }, "@/lib/auth/local-access": localAccess,
    })
    const request = () => ({ nextUrl: { pathname: "/dashboard/acteurs/athletes" }, cookies: jar, url: "http://localhost:3000/dashboard/acteurs/athletes" })
    const credentials = (password: string) => new Request("http://localhost:3000/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: values.CNAC_LOCAL_EMAIL, password }) })
    assert.equal(await auth.getSession(), null)
    assert.equal(await auth.canAccess("AUT-SPT", "WRITE"), false)
    assert.equal((await proxy.proxy(request())).status, 307)
    assert.equal((await login.POST(credentials("wrong"))).status, 401)
    assert.equal(cookie, undefined)
    const response = await login.POST(credentials(values.CNAC_LOCAL_PASSWORD))
    assert.equal(response.status, 200)
    assert.equal((await response.json()).redirectTo, "/dashboard")
    assert.ok(cookie)
    assert.equal((await proxy.proxy(request())).status, 200)
    assert.equal((await auth.getSession()).idUser, localAccess.LOCAL_ADMIN_ID)
    assert.equal((await auth.getSession()).email, values.CNAC_LOCAL_EMAIL)
    assert.equal(await auth.canAccess("AUT-SPT", "WRITE"), true)
    assert.equal((await auth.getNavigationAccess())["AUT-SPT:WRITE"], true)
    const logout = load("app/api/auth/logout/route.ts", { "next/server": next, "@/lib/auth": auth })
    assert.equal((await logout.POST()).status, 200)
    assert.equal(await auth.getSession(), null)
    assert.equal((await proxy.proxy(request())).status, 307)
  } finally {
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value
  }
})

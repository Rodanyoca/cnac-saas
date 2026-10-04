import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { runInNewContext } from "node:vm"
import test from "node:test"
import ts from "typescript"
import { hashPassword } from "../../lib/auth/password.ts"
import { USER_HEADERS, USER_AUTHORIZATION_HEADERS, AUTH_ATTEMPT_HEADERS, AUDIT_LOG_HEADERS, type User } from "../../lib/users/types.ts"
import { userToSheetRow } from "../../lib/users/commands.ts"

const require = createRequire(import.meta.url)
const root = resolve(".")
const password = "Fixture-private-password-2026"
const headers: Record<string, readonly string[]> = { USERS: USER_HEADERS, USER_AUTORISATIONS: USER_AUTHORIZATION_HEADERS, AUTH_TENTATIVES: AUTH_ATTEMPT_HEADERS, JOURNAL_OPERATIONS: AUDIT_LOG_HEADERS }

async function fixture() {
  const user: User = { idUser: "USER-TEST", nomComplet: "Test CNAC", email: "test@example.invalid", passwordHash: await hashPassword(password), typeUser: "ADMIN", estSuperAdmin: false, doitChangerMotDePasse: false, statut: "ACTIF", dateCreation: new Date().toISOString(), dateModificationMotDePasse: null, derniereConnexion: null, sessionVersion: 1, dateExpirationAccesTemporaire: null }
  const rows: Record<string, Record<string, string>[]> = { USERS: [userToSheetRow(user)], USER_AUTORISATIONS: [{ id_user_autorisation: "AUTH-TEST", id_user: user.idUser, id_bloc_autorisation: "AUT-SPT", statut: "ACTIF", date_debut: "2020-01-01", date_fin: "" }], AUTH_TENTATIVES: [], JOURNAL_OPERATIONS: [] }
  let unavailable = false, writesUnavailable = false, cookie: string | undefined
  const check = () => { if (unavailable) throw new Error("Provider unavailable with sensitive diagnostics") }
  const adapter = {
    async readHeaders(sheet: string) { check(); return [...headers[sheet]] },
    async readRows(sheet: string) { check(); return structuredClone(rows[sheet]) },
    async appendRow(sheet: string, row: Record<string, string>) { check(); if (writesUnavailable) throw new Error("Write unavailable"); rows[sheet].push({ ...row }) },
    async updateRow(sheet: string, column: string, id: string, row: Record<string, string>) { check(); if (writesUnavailable) throw new Error("Write unavailable"); Object.assign(rows[sheet].find(item => item[column] === id)!, row) },
  }
  const jar = { get: () => cookie ? { value: cookie } : undefined, set: (_name: string, value: string, options: Record<string, unknown>) => { assert.equal(options.httpOnly, true); assert.equal(options.sameSite, "lax"); cookie = value }, delete: () => { cookie = undefined } }
  const env = { NODE_ENV: "test", AUTH_SECRET: "fixture-session-secret".repeat(3), AUTH_TELEMETRY_HMAC_KEY: "fixture-telemetry-secret".repeat(3) }
  const modules = new Map<string, Record<string, any>>()
  const next = { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init), next: () => new Response(null, { status: 200 }), redirect: (url: URL) => Response.redirect(url, 307) } }
  const mocks: Record<string, unknown> = { "server-only": {}, "next/server": next, "next/headers": { cookies: async () => jar }, "@/lib/users/google-adapter": { createGoogleUsersSheetsAdapter: () => adapter } }
  mocks["@/lib/users/data"] = {
    getUserById: async (id: string) => new (load("lib/users/repository.ts").UsersRepository)(adapter).getUserById(id),
    getAuthorizationsForUser: async (id: string) => new (load("lib/users/repository.ts").UsersRepository)(adapter).getAuthorizationsForUser(id),
    getAuthenticationSnapshot: async (email: string) => { const repository = new (load("lib/users/repository.ts").UsersRepository)(adapter); const user = await repository.getUserByEmail(email); return { user, attempts: await repository.getAuthAttempts(), authorizations: user ? await repository.getAuthorizationsForUser(user.idUser) : [] } },
  }
  function load(file: string): Record<string, any> {
    let path = resolve(root, file)
    if (!path.endsWith(".ts")) path += ".ts"
    if (modules.has(path)) return modules.get(path)!
    const exports = {}; modules.set(path, exports)
    const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    runInNewContext(code, { exports, process: { env }, console: { error() {} }, URL, Buffer, crypto: globalThis.crypto, TextEncoder, TextDecoder, Uint8Array, btoa, atob, setTimeout, clearTimeout, require: (id: string) => id in mocks ? mocks[id] : id.startsWith("@/") ? load(id.slice(2)) : id.startsWith(".") ? load(resolve(dirname(path), id)) : require(id) })
    return exports
  }
  const auth = load("lib/auth.ts"), login = load("app/api/auth/login/route.ts"), proxy = load("proxy.ts")
  const request = (path = "/dashboard/acteurs/athletes", method = "GET", origin = "http://localhost:3000") => Object.assign(new Request(`http://localhost:3000${path}`, { method, headers: { origin } }), { nextUrl: { pathname: path }, cookies: jar })
  const credentials = (entered = password, email = user.email, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/auth/login", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: entered }) })
  return { user, rows, env, auth, login, proxy, load, request, credentials, cookie: () => cookie, restore: (value: string) => { cookie = value }, unavailable: () => { unavailable = true }, failWrites: () => { writesUnavailable = true } }
}

test("real USERS login, permissions, reload, revocation and logout", async () => {
  const f = await fixture()
  assert.equal(await f.auth.getSession(), null)
  assert.equal((await f.proxy.proxy(f.request())).status, 307)
  assert.equal((await f.proxy.proxy(f.request("/api/athletes"))).status, 401)
  assert.equal((await f.login.POST(f.credentials("incorrect"))).status, 401)
  assert.equal(f.cookie(), undefined)
  assert.equal((await f.login.POST(f.credentials())).status, 200)
  const token = f.cookie()!
  assert.ok(token)
  assert.equal((await f.auth.getSession()).idUser, f.user.idUser)
  const publicSession = await f.load("app/api/auth/session/route.ts").GET()
  const publicBody = await publicSession.text()
  assert.equal(publicSession.status, 200)
  assert.doesNotMatch(publicBody, /password_hash|passwordHash|scrypt\$/)
  assert.ok(!publicBody.includes(password) && !publicBody.includes(f.env.AUTH_SECRET))
  assert.ok(f.rows.USERS[0].derniere_connexion)
  assert.equal((await f.proxy.proxy(f.request())).status, 200)
  assert.equal(await f.auth.canAccess("AUT-SPT", "WRITE"), true)
  assert.equal(await f.auth.canAccess("AUT-COM", "READ"), false)
  assert.equal((await f.proxy.proxy(f.request("/api/site-web/sliders", "POST"))).status, 403)
  f.rows.USER_AUTORISATIONS[0].statut = "INACTIF"
  assert.equal(await f.auth.canAccess("AUT-SPT", "WRITE"), false)
  f.rows.USERS[0].session_version = "2"
  assert.equal(await f.auth.getSession(), null)
  assert.equal((await f.proxy.proxy(f.request("/api/athletes"))).status, 401)
  f.rows.USERS[0].session_version = "1"
  const logout = f.load("app/api/auth/logout/route.ts")
  assert.equal((await logout.POST(f.request("/api/auth/logout", "POST"))).status, 200)
  assert.equal(f.cookie(), undefined)
  assert.equal(await f.auth.getSession(), null)
  f.restore(token)
  assert.equal(await f.auth.getSession(), null)
  assert.equal(f.rows.USERS[0].session_version, "2")
  const exposed = JSON.stringify({ session: await f.auth.getSession(), audit: f.rows.JOURNAL_OPERATIONS, attempts: f.rows.AUTH_TENTATIVES })
  assert.ok(!exposed.includes(password) && !exposed.includes(f.user.passwordHash) && !token.includes(password))
})

test("unknown, inactive and expired accounts receive the same generic refusal", async () => {
  const f = await fixture()
  const unknown = await f.login.POST(f.credentials(password, "unknown@example.invalid"))
  f.rows.USERS[0].statut = "INACTIF"
  const inactive = await f.login.POST(f.credentials())
  f.rows.USERS[0].statut = "ACTIF"
  f.rows.USERS[0].doit_changer_mot_de_passe = "TRUE"
  f.rows.USERS[0].date_expiration_acces_temporaire = "2020-01-01T00:00:00.000Z"
  const expired = await f.login.POST(f.credentials())
  for (const response of [unknown, inactive, expired]) assert.equal(response.status, 401)
  assert.equal(await unknown.text(), await inactive.text())
  assert.equal(f.cookie(), undefined)
})

test("initial access is restricted to activation; activation changes hash and revokes the initial token", async () => {
  const f = await fixture()
  f.rows.USERS[0].doit_changer_mot_de_passe = "TRUE"
  f.rows.USERS[0].date_expiration_acces_temporaire = new Date(Date.now() + 3600000).toISOString()
  const login = await f.login.POST(f.credentials())
  assert.equal((await login.json()).redirectTo, "/activation")
  const initial = f.cookie()!
  assert.equal((await f.proxy.proxy(f.request("/api/athletes"))).status, 403)
  assert.equal(await f.auth.canAccess("AUT-SPT", "READ"), false)
  const activate = f.load("app/api/auth/activate/route.ts")
  const response = await activate.POST(new Request("http://localhost:3000/api/auth/activate", { method: "POST", headers: { origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ temporaryAccess: password, newPassword: "New-private-password-2026", confirmation: "New-private-password-2026" }) }))
  assert.equal(response.status, 200)
  assert.equal(f.rows.USERS[0].doit_changer_mot_de_passe, "FALSE")
  assert.equal(f.rows.USERS[0].date_expiration_acces_temporaire, "")
  assert.equal(f.rows.USERS[0].session_version, "2")
  assert.notEqual(f.rows.USERS[0].password_hash, f.user.passwordHash)
  assert.equal((await f.proxy.proxy(f.request())).status, 200)
  f.restore(initial)
  assert.equal(await f.auth.getSession(), null)
})

test("configuration, backend and confirmed-write failures never produce a session", async () => {
  for (const failure of ["config", "read", "write"]) {
    const f = await fixture()
    if (failure === "config") f.env.AUTH_TELEMETRY_HMAC_KEY = ""
    if (failure === "read") f.unavailable()
    if (failure === "write") f.failWrites()
    const response = await f.login.POST(f.credentials())
    assert.equal(response.status, 503, failure)
    assert.equal(f.cookie(), undefined)
    assert.doesNotMatch(await response.text(), /sensitive diagnostics|scrypt\$|fixture-session-secret/)
  }
  const f = await fixture()
  await f.login.POST(f.credentials())
  f.unavailable()
  assert.equal((await f.proxy.proxy(f.request("/api/athletes"))).status, 503)
})

test("cross-origin login and authenticated mutations are refused", async () => {
  const f = await fixture()
  assert.equal((await f.login.POST(f.credentials(password, f.user.email, "https://evil.invalid"))).status, 403)
  assert.equal(f.rows.AUTH_TENTATIVES.length, 0)
  await f.login.POST(f.credentials())
  assert.equal((await f.proxy.proxy(f.request("/api/athletes", "POST", "https://evil.invalid"))).status, 403)
})

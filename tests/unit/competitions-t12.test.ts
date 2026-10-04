import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { authorize } from "../../lib/auth/authorization.ts"
import type { User, UserAuthorization } from "../../lib/users/types.ts"

const source = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const user = (typeUser: User["typeUser"]): User => ({ idUser: "USR-1", nomComplet: "Test", email: "test@example.org", passwordHash: "x", typeUser, estSuperAdmin: false, doitChangerMotDePasse: false, statut: "ACTIF", dateCreation: "2026-01-01T00:00:00Z", dateModificationMotDePasse: null, derniereConnexion: null, sessionVersion: 1, dateExpirationAccesTemporaire: null })
const grant = (overrides: Partial<UserAuthorization> = {}): UserAuthorization => ({ idUserAutorisation: "AUT-1", idUser: "USR-1", idBlocAutorisation: "AUT-SPT", statut: "ACTIF", dateDebut: "2026-01-01", dateFin: null, ...overrides })

test("T12: VIEWER ne peut jamais écrire et ADMIN exige une attribution AUT-SPT active", () => {
  const requirement = { scope: "BUSINESS", blocks: ["AUT-SPT"] } as const
  assert.equal(authorize({ user: user("VIEWER"), authorizations: [grant()], requirement, action: "WRITE", date: "2026-09-01" }).allowed, false)
  assert.equal(authorize({ user: user("ADMIN"), authorizations: [], requirement, action: "WRITE", date: "2026-09-01" }).allowed, false)
  assert.equal(authorize({ user: user("ADMIN"), authorizations: [grant({ dateFin: "2026-08-31" })], requirement, action: "WRITE", date: "2026-09-01" }).allowed, false)
  assert.equal(authorize({ user: user("ADMIN"), authorizations: [grant()], requirement, action: "WRITE", date: "2026-09-01" }).allowed, true)
})

test("T12: l'enveloppe serveur distingue 401/403, bloque les doublons et journalise", async () => {
  const code = await source("lib/competitions/mutation.ts")
  assert.match(code, /status: 401/)
  assert.match(code, /status: 403/)
  assert.match(code, /entry\.requestId === requestId/)
  assert.match(code, /alreadyProcessed: true/)
  assert.match(code, /result: "SUCCES"/)
  assert.match(code, /result: "ECHEC"/)
  assert.match(code, /createGoogleUsersSheetsAdapter/)
})

test("T12: chaque mutation V1 utilise l'enveloppe sécurisée et auditée", async () => {
  const paths = [
    "app/api/competitions/route.ts", "app/api/competitions/[id]/programmes/route.ts", "app/api/competitions/[id]/engagements/route.ts",
    "app/api/competitions/[id]/participants/route.ts", "app/api/competitions/[id]/resultats/route.ts", "app/api/competitions/[id]/medailles/route.ts",
    "app/api/equipes-nationales/route.ts", "app/api/equipes-nationales/[id]/membres/route.ts",
    "app/api/equipes-nationales/[id]/campagnes/route.ts", "app/api/equipes-nationales/[id]/selections/route.ts",
  ]
  for (const path of paths) assert.match(await source(path), /runSportMutation/, path)
})

test("T12: la relation directe équipe-compétition est protégée et retirée en écriture", async () => {
  const code = await source("app/api/competitions/[id]/equipes-nationales/route.ts")
  assert.match(code, /canAccess\("AUT-SPT", "WRITE"\)/)
  assert.match(code, /status: 410/)
  assert.match(code, /engagement de campagne dans un programme/)
})

test("T12: les routes de lecture secondaires contrôlent AUT-SPT côté serveur", async () => {
  for (const path of ["app/api/competitions/[id]/route.ts", "app/api/equipes-nationales/[id]/route.ts", "app/api/equipes-nationales/acteurs/route.ts", "app/api/equipes-nationales/acteurs/[id]/route.ts"]) {
    assert.match(await source(path), /canAccess\("AUT-SPT", "READ"\)/, path)
  }
})

test("T12: les formulaires conservent leur état en erreur et bloquent l'action pendant l'enregistrement", async () => {
  const paths = [
    "app/dashboard/competitions/[id]/competition-programs.tsx", "components/dashboard/campaign-engagements.tsx", "components/dashboard/athlete-participations.tsx",
    "components/dashboard/competition-results.tsx", "components/dashboard/competition-medals.tsx",
    "components/dashboard/national-team-campaigns.tsx", "components/dashboard/campaign-selections.tsx",
  ]
  for (const path of paths) {
    const code = await source(path)
    assert.match(code, /disabled=\{saving(?:\s*\|\|[^}]*)?\}/, path)
    const catchPosition = code.indexOf("catch")
    assert.ok(catchPosition > 0, path)
    assert.doesNotMatch(code.slice(catchPosition), /setForm\(empty/, path)
  }
})

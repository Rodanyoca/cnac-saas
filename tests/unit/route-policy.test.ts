import assert from "node:assert/strict"
import test from "node:test"
import { routePolicy } from "../../lib/auth/route-policy.ts"

const cases = [
  ["/dashboard", "GET", "READ", "BUSINESS"], ["/dashboard/federations", "GET", "READ", "BUSINESS"],
  ["/dashboard/federations/FED-1", "GET", "READ", "BUSINESS"], ["/dashboard/federations/FED-1/parametres", "GET", "WRITE", "BUSINESS"], ["/dashboard/acteurs/athletes/ATH-1", "GET", "READ", "BUSINESS"],
  ["/dashboard/competitions/nouveau", "GET", "WRITE", "BUSINESS"], ["/dashboard/equipes-nationales/EN-1", "GET", "READ", "BUSINESS"],
  ["/dashboard/activites/ACT-1", "GET", "READ", "BUSINESS"], ["/dashboard/documents/nouveau", "GET", "WRITE", "BUSINESS"],
  ["/api/athletes", "GET", "READ", "BUSINESS"], ["/api/athletes", "POST", "WRITE", "BUSINESS"],
  ["/dashboard/acteurs/autres/AUT.000001/modifier", "GET", "WRITE", "BUSINESS"], ["/api/autres", "PUT", "WRITE", "BUSINESS"],
  ["/api/activites/ACT-1/participants", "PUT", "WRITE", "BUSINESS"], ["/api/equipes-nationales/EN-1/membres", "GET", "READ", "BUSINESS"],
  ["/api/federations/ligues", "PUT", "WRITE", "BUSINESS"], ["/api/federations/logo/FED-1", "POST", "WRITE", "BUSINESS"], ["/api/documents/DOC-1/download", "GET", "READ", "BUSINESS"],
  ["/api/documents", "POST", "WRITE", "BUSINESS"], ["/api/users/USR-1", "PATCH", "WRITE", "SUPER_ADMIN"],
  ["/api/referentiels/blocs", "GET", "READ", "SUPER_ADMIN"], ["/api/dashboard/refresh", "POST", "WRITE", "BUSINESS"],
  ["/dashboard/utilisateurs", "GET", "READ", "SUPER_ADMIN"], ["/dashboard/utilisateurs/USR-1", "GET", "READ", "SUPER_ADMIN"],
] as const

test("la matrice couvre explicitement les familles de pages et API", () => {
  for (const [path, method, action, scope] of cases) {
    const policy = routePolicy(path, method)
    assert.ok(policy, `${method} ${path}`)
    assert.equal(policy.action, action)
    assert.equal(policy.scope, scope)
  }
})

test("les routes inconnues et contournements par URL sont refusés par défaut", () => {
  for (const path of ["/dashboard-inconnu", "/dashboard/admin-cache", "/api/inconnu", "/api/auth/invente"]) assert.equal(routePolicy(path, "GET"), null)
})

test("chaque mutation métier exige WRITE et chaque lecture exige READ", () => {
  for (const path of ["/api/athletes", "/api/autres", "/api/competitions", "/api/documents", "/api/upload-media"]) {
    assert.equal(routePolicy(path, "GET")?.action, "READ")
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) assert.equal(routePolicy(path, method)?.action, "WRITE")
  }
})

test("les périmètres officiels utilisent exactement le bon bloc", () => {
  const expected = [
    ["/dashboard/activites", "GET", "AUT-ADM"], ["/dashboard/activites/ACT-1", "GET", "AUT-ADM"],
    ["/api/activites", "POST", "AUT-ADM"], ["/api/activites/ACT-1/participants", "PUT", "AUT-ADM"],
    ["/api/activites/acteurs/ATH-1", "GET", "AUT-ADM"], ["/dashboard/documents", "GET", "AUT-ADM"],
    ["/dashboard/documents/nouveau", "GET", "AUT-ADM"], ["/api/documents/DOC-1/file", "GET", "AUT-ADM"],
    ["/dashboard/federations", "GET", "AUT-SPT"], ["/api/officiels/affiliations", "POST", "AUT-SPT"],
    ["/dashboard/equipes-nationales", "GET", "AUT-SPT"], ["/api/competitions/COM-1/equipes-nationales", "POST", "AUT-SPT"],
    ["/api/competitions/COM-1/programmes", "GET", "AUT-SPT"], ["/api/competitions/COM-1/programmes", "POST", "AUT-SPT"],
    ["/api/competitions/COM-1/engagements", "POST", "AUT-SPT"], ["/api/equipes-nationales/EQN-1/campagnes", "POST", "AUT-SPT"],
    ["/api/competitions/COM-1/participants", "POST", "AUT-SPT"], ["/api/equipes-nationales/EQN-1/selections", "POST", "AUT-SPT"],
    ["/api/competitions/COM-1/resultats", "POST", "AUT-SPT"],
    ["/api/competitions/COM-1/medailles", "DELETE", "AUT-SPT"],
    ["/dashboard/articles", "GET", "AUT-COM"], ["/api/galeries", "POST", "AUT-COM"],
    ["/dashboard/site-web", "GET", "AUT-COM"], ["/dashboard/site-web/sliders", "GET", "AUT-COM"], ["/api/site-web/sliders", "GET", "AUT-COM"],
    ["/api/site-web/sliders", "POST", "AUT-COM"], ["/api/site-web/sliders/SLD-1", "PUT", "AUT-COM"],
  ] as const
  for (const [path, method, block] of expected) {
    const policy = routePolicy(path, method)
    assert.equal(policy?.scope, "BUSINESS", `${method} ${path}`)
    if (policy?.scope === "BUSINESS") assert.deepEqual(policy.blocks, [block], `${method} ${path}`)
  }
})

test("toutes les routes protégées actuellement exposées appartiennent à la matrice", () => {
  const pages = [
    "/dashboard/antidopage", "/dashboard/antidopage/controles", "/dashboard/antidopage/aut", "/dashboard/antidopage/sanctions",
    "/dashboard", "/dashboard/acteurs", "/dashboard/acteurs/arbitres", "/dashboard/acteurs/arbitres/ARB-1",
    "/dashboard/acteurs/athletes", "/dashboard/acteurs/athletes/ATH-1", "/dashboard/acteurs/entraineurs",
    "/dashboard/acteurs/entraineurs/COA-1", "/dashboard/acteurs/medecins", "/dashboard/acteurs/medecins/MED-1",
    "/dashboard/acteurs/officiels", "/dashboard/acteurs/officiels/OFF-1", "/dashboard/acteurs/autres", "/dashboard/acteurs/autres/nouveau", "/dashboard/acteurs/autres/AUT.000001", "/dashboard/acteurs/autres/AUT.000001/modifier", "/dashboard/activites", "/dashboard/activites/ACT-1",
    "/dashboard/competitions", "/dashboard/competitions/COM-1", "/dashboard/competitions/nouveau", "/dashboard/documents",
    "/dashboard/documents/DOC-1", "/dashboard/documents/nouveau", "/dashboard/equipes-nationales",
    "/dashboard/equipes-nationales/EN-1", "/dashboard/equipes-nationales/nouveau", "/dashboard/federations",
    "/dashboard/federations/FED-1", "/dashboard/federations/FED-1/parametres",
  ]
  const apis = [
    "/api/activites", "/api/activites/ACT-1", "/api/activites/ACT-1/entites", "/api/activites/ACT-1/participants",
    "/api/activites/acteurs/ATH-1", "/api/arbitres", "/api/athletes", "/api/autres", "/api/coachs", "/api/competitions",
    "/api/competitions/COM-1", "/api/competitions/COM-1/equipes-nationales", "/api/competitions/COM-1/programmes", "/api/competitions/COM-1/engagements", "/api/competitions/COM-1/participants", "/api/competitions/COM-1/resultats", "/api/competitions/COM-1/medailles", "/api/dashboard/refresh", "/api/documents",
    "/api/documents/DOC-1", "/api/documents/DOC-1/download", "/api/documents/DOC-1/file", "/api/documents/DOC-1/preview",
    "/api/equipes-nationales", "/api/equipes-nationales/EN-1", "/api/equipes-nationales/EN-1/membres", "/api/equipes-nationales/EN-1/campagnes", "/api/equipes-nationales/EN-1/selections",
    "/api/equipes-nationales/acteurs", "/api/equipes-nationales/acteurs/ATH-1", "/api/federations/ligues", "/api/federations/logo/FED-1",
    "/api/medecins", "/api/officiels", "/api/officiels/affiliations", "/api/upload-media",
  ]
  for (const path of [...pages, ...apis]) assert.ok(routePolicy(path, path === "/api/dashboard/refresh" ? "POST" : "GET"), path)
})

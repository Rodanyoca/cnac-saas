import assert from "node:assert/strict"
import test from "node:test"
import { dashboardNavigation, visibleDashboardNavigation } from "../../lib/navigation/dashboard-navigation.ts"

test("le super-administrateur voit immédiatement toutes les sections disponibles", () => {
  const visible = visibleDashboardNavigation(dashboardNavigation, { isSuperAdmin: true, readableBlocks: [] })
  assert.deepEqual(visible.map((item) => item.href), [
    "/dashboard", "/dashboard/federations", "/dashboard/acteurs", "/dashboard/competitions",
    "/dashboard/equipes-nationales", "/dashboard/activites", "/dashboard/documents", "/dashboard/site-web", "/dashboard/utilisateurs",
  ])
})

test("la section Site web ouvre une administration unique sans sous-menu", () => {
  const siteWeb = dashboardNavigation.find((item) => item.name === "Site web")
  assert.deepEqual(siteWeb?.blocks, ["AUT-COM"])
  assert.equal(siteWeb?.href, "/dashboard/site-web")
  assert.equal(siteWeb?.children, undefined)
})

test("AUT-COM contrôle la visibilité de Site web pour les comptes ordinaires", () => {
  const withoutCommunication = visibleDashboardNavigation(dashboardNavigation, { isSuperAdmin: false, readableBlocks: ["AUT-ADM"] })
  const withCommunication = visibleDashboardNavigation(dashboardNavigation, { isSuperAdmin: false, readableBlocks: ["AUT-COM"] })
  assert.equal(withoutCommunication.some((item) => item.name === "Site web"), false)
  assert.equal(withCommunication.some((item) => item.name === "Site web"), true)
})

test("chaque section principale, y compris Acteurs, possède une destination cliquable", () => {
  for (const item of dashboardNavigation) assert.match(item.href!, /^\/dashboard(?:\/|$)/)
  assert.equal(dashboardNavigation.find((item) => item.name === "Acteurs")?.href, "/dashboard/acteurs")
  assert.equal(dashboardNavigation.find((item) => item.name === "Site web")?.href, "/dashboard/site-web")
})

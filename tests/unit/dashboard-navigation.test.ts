import assert from "node:assert/strict"
import test from "node:test"
import { dashboardNavigation, visibleDashboardNavigation } from "../../lib/navigation/dashboard-navigation.ts"
import { dashboardSections } from "../../lib/navigation/dashboard-presentation.ts"

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

test("FEBACO presentation preserves permitted routes and dynamic children without empty sections", () => {
  for (const access of [{ isSuperAdmin: true, readableBlocks: [] }, { isSuperAdmin: false, readableBlocks: ["AUT-COM"] }, { isSuperAdmin: false, readableBlocks: ["AUT-SPT"] }, { isSuperAdmin: false, readableBlocks: [] }]) {
    const visible = visibleDashboardNavigation(dashboardNavigation, access)
    const sections = dashboardSections(visible)
    assert.deepEqual(sections.flatMap(section => section.items), visible)
    assert.ok(sections.every(section => section.items.length > 0))
    for (const item of sections.flatMap(section => section.items)) assert.equal(item, visible.find(original => original.href === item.href))
  }
  const dynamic = { ...dashboardNavigation[2], name: "Structure territoriale", children: [{ name: "Niveau dynamique", href: "/dashboard/federations/FED1/structures/TYPSTR001" }] }
  assert.equal(dashboardSections([dynamic])[0].items[0].children, dynamic.children)
  const titles = dashboardSections(dashboardNavigation).map(section => section.title).filter(Boolean)
  assert.deepEqual(titles, ["Competition", "Equipe nationale", "Administration"])
})

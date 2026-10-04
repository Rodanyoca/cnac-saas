import { expect, test } from "@playwright/test"

for (const path of ["/dashboard/competitions", "/dashboard/equipes-nationales", "/dashboard/competitions/nouveau", "/dashboard/equipes-nationales/nouveau"]) {
  test(`protège l'accès direct à ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
  })
}

for (const path of ["/api/competitions", "/api/equipes-nationales", "/api/competitions/COM-1/programmes", "/api/equipes-nationales/EQ-1/campagnes"]) {
  test(`refuse l'API sans authentification ${path}`, async ({ request }) => {
    const response = await request.get(path)
    expect([401, 403]).toContain(response.status())
  })
}

test("la page de connexion reste responsive avant l'accès au bloc", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport)
    await page.goto("/login")
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }))
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport)
  }
})

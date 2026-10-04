import { expect, test } from "@playwright/test"
test("refuse l'administration des utilisateurs sans authentification", async ({ page }) => { await page.goto("/dashboard/utilisateurs"); await expect(page).toHaveURL(/\/login$/) })
test("refuse l'API utilisateurs sans authentification", async ({ request }) => { const response = await request.get("/api/users"); expect(response.status()).toBe(401) })

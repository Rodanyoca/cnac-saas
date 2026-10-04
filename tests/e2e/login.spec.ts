import { expect, test, type Page } from "@playwright/test"

const viewports = [
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
]

async function fillCredentials(page: Page) {
  await page.getByLabel("Adresse e-mail").fill("membre@coc.cd")
  await page.getByLabel("Mot de passe", { exact: true }).fill("mot-de-passe")
}

test("affiche les éléments institutionnels et les partenaires réels", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: /portons plus haut les couleurs/i })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Bienvenue" })).toBeVisible()
  await expect(page.getByRole("img", { name: "Comité Olympique Congolais" })).toBeVisible()
  await expect(page.getByRole("region", { name: "Avec le soutien de nos partenaires" }).getByRole("img")).toHaveCount(3)
  await expect(page.getByLabel("Design par DS Concept")).toBeVisible()
  await expect(page.getByLabel("Adresse e-mail")).toHaveAttribute("autocomplete", "username")
  await expect(page.getByLabel("Mot de passe", { exact: true })).toHaveAttribute("autocomplete", "current-password")
})

test("respecte l’ordre clavier et la réduction des animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/login")
  await page.getByLabel("Adresse e-mail").focus()
  await page.keyboard.press("Tab")
  await expect(page.getByLabel("Mot de passe", { exact: true })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Afficher le mot de passe" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeFocused()
  const animationNames = await page.locator("main").evaluate((main) =>
    [...main.querySelectorAll("*")].map((element) => getComputedStyle(element).animationName),
  )
  expect(animationNames.every((name) => name === "none")).toBe(true)
})

test("affiche et masque le mot de passe au clavier", async ({ page }) => {
  await page.goto("/login")
  const password = page.getByLabel("Mot de passe", { exact: true })
  await password.fill("secret")
  await expect(password).toHaveAttribute("type", "password")
  await page.getByRole("button", { name: "Afficher le mot de passe" }).focus()
  await page.keyboard.press("Enter")
  await expect(password).toHaveAttribute("type", "text")
  await expect(page.getByRole("button", { name: "Masquer le mot de passe" })).toBeFocused()
})

for (const status of [401, 403]) {
  test(`affiche une erreur d’identification pour ${status}`, async ({ page }) => {
    await page.route("**/api/auth/login", (route) => route.fulfill({ status, contentType: "application/json", body: "{}" }))
    await page.goto("/login")
    await fillCredentials(page)
    await page.getByLabel("Mot de passe", { exact: true }).press("Enter")
    await expect(page.locator("#login-error")).toContainText("ne permettent pas d’accéder au système")
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled()
  })
}

test("distingue une requête invalide d’un service indisponible", async ({ page }) => {
  let status = 400
  await page.route("**/api/auth/login", (route) => route.fulfill({ status, contentType: "application/json", body: "{}" }))
  await page.goto("/login")
  await fillCredentials(page)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await expect(page.locator("#login-error")).toContainText("Vérifiez les informations")
  status = 500
  await page.getByRole("button", { name: "Se connecter" }).click()
  await expect(page.locator("#login-error")).toContainText("momentanément indisponible")
})

test("affiche le chargement, bloque une double soumission puis redirige", async ({ page }) => {
  let calls = 0
  let redirectSnapshot: { label: string; emailDisabled: boolean; passwordDisabled: boolean; buttonDisabled: boolean } | null = null
  await page.exposeFunction("captureLoginRedirect", (snapshot: typeof redirectSnapshot) => { redirectSnapshot = snapshot })
  await page.route("**/dashboard**", (route) => route.abort("failed"))
  await page.route("**/api/auth/login", async (route) => {
    calls += 1
    await new Promise((resolve) => setTimeout(resolve, 1_000))
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  })
  await page.goto("/login")
  await fillCredentials(page)
  await page.evaluate(() => {
    const observer = new MutationObserver(() => {
      const button = document.querySelector<HTMLButtonElement>('button[type="submit"]')
      if (button?.textContent?.includes("Redirection en cours")) {
        void (window as unknown as { captureLoginRedirect: (value: unknown) => Promise<void> }).captureLoginRedirect({
          label: button.textContent.trim(),
          emailDisabled: Boolean(document.querySelector<HTMLInputElement>('#email')?.disabled),
          passwordDisabled: Boolean(document.querySelector<HTMLInputElement>('#password')?.disabled),
          buttonDisabled: button.disabled,
        })
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  })
  const destinationRequest = page.waitForRequest((request) => new URL(request.url()).pathname === "/dashboard")
  await page.locator("form").evaluate((form) => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  })
  await expect(page.getByRole("button", { name: "Connexion en cours…" })).toBeDisabled()
  await expect(page.getByLabel("Adresse e-mail")).toBeDisabled()
  await expect(page.getByLabel("Mot de passe", { exact: true })).toBeDisabled()
  await destinationRequest
  await expect.poll(() => redirectSnapshot).not.toBeNull()
  expect(redirectSnapshot).toEqual({ label: "Redirection en cours…", emailDisabled: true, passwordDisabled: true, buttonDisabled: true })
  expect(calls).toBe(1)
})

test("deux validations Entrée immédiates ne créent qu'une requête", async ({ page }) => {
  let calls = 0
  await page.route("**/api/auth/login", async (route) => {
    calls += 1
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({ status: 401, contentType: "application/json", body: "{}" })
  })
  await page.goto("/login")
  await fillCredentials(page)
  await page.getByLabel("Mot de passe", { exact: true }).focus()
  await page.keyboard.press("Enter")
  await page.keyboard.press("Enter")
  await expect(page.locator("#login-error")).toBeVisible()
  expect(calls).toBe(1)
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled()
})

test("redirige une première connexion vers l'activation sans modifier l'interface", async ({ page }) => {
  await page.route("**/api/auth/login", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, redirectTo: "/activation" }) }))
  await page.goto("/login")
  await fillCredentials(page)
  const activationRequest = page.waitForRequest((request) => new URL(request.url()).pathname === "/activation")
  await page.getByRole("button", { name: "Se connecter" }).click()
  await activationRequest
})

test("respecte la destination accessible renvoyée après connexion", async ({ page }) => {
  await page.route("**/api/auth/login", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, redirectTo: "/mon-compte" }) }))
  await page.goto("/login")
  await fillCredentials(page)
  const accountRequest = page.waitForRequest((request) => new URL(request.url()).pathname === "/mon-compte")
  await page.getByRole("button", { name: "Se connecter" }).click()
  await accountRequest
})

test("gère une panne réseau simulée", async ({ page }) => {
  await page.route("**/api/auth/login", (route) => route.abort("failed"))
  await page.goto("/login")
  await fillCredentials(page)
  await page.getByRole("button", { name: "Se connecter" }).click()
  await expect(page.locator("#login-error")).toContainText("momentanément indisponible")
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled()
})

for (const viewport of viewports) {
  test(`reste sans défilement à ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/login")
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }))
    expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight)
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
    await page.screenshot({ path: `test-results/screenshots/login-${viewport.name}.png`, fullPage: false })
  })
}

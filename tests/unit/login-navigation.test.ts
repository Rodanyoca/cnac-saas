import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

test("la connexion recharge la destination après la pose du cookie", async () => {
  const source = await readFile(new URL("../../app/login/page.tsx", import.meta.url), "utf8")

  assert.match(source, /window\.location\.assign\(normalizeLoginRedirect\(result\.redirectTo\)\)/)
  assert.doesNotMatch(source, /router\.push\(normalizeLoginRedirect/)
})

test("le développement n'utilise pas le répertoire des builds de production", async () => {
  const source = await readFile(new URL("../../next.config.mjs", import.meta.url), "utf8")

  assert.match(source, /NODE_ENV === "development" \? "\.next-dev" : "\.next"/)
})

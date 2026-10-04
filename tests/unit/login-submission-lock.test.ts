import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la connexion reste verrouillée entre le succès et le remplacement de page", async () => {
  const source = await readFile("app/login/page.tsx", "utf8")
  assert.match(source, /submissionLocked\.current/)
  assert.match(source, /type SubmissionPhase = "idle" \| "request" \| "redirect"/)
  assert.match(source, /setPhase\("redirect"\)/)
  assert.match(source, /window\.location\.replace\(normalizeLoginRedirect\(result\.redirectTo\)\)/)
  assert.match(source, /if \(!authenticated\)[\s\S]*submissionLocked\.current = false[\s\S]*setPhase\("idle"\)/)
  assert.doesNotMatch(source, /window\.location\.assign|router\.refresh/)
})

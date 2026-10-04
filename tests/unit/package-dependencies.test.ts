import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("les imports directs des scripts sont déclarés dans le manifeste pnpm", async () => {
  const manifest = JSON.parse(await readFile("package.json", "utf8")) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const declared = { ...manifest.dependencies, ...manifest.devDependencies }
  assert.equal(declared["@next/env"], "16.3.4")
})

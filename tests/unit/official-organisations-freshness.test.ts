import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("les sélecteurs d’organisation des officiels relisent le référentiel ENTITES", async () => {
  const pages = [
    "app/dashboard/acteurs/officiels/page.tsx",
    "app/dashboard/acteurs/officiels/[id]/page.tsx",
  ]

  for (const path of pages) {
    const source = await readFile(path, "utf8")
    assert.match(
      source,
      /sheetName:\s*["']ENTITES["'][\s\S]{0,180}?bypassCache:\s*true/,
      `${path} peut proposer un référentiel d’organisations obsolète`,
    )
  }
})

test("les sélecteurs des athlètes demandent des fédérations fraîches", async () => {
  const pages = [
    "app/dashboard/acteurs/athletes/page.tsx",
    "app/dashboard/acteurs/athletes/[id]/page.tsx",
  ]

  for (const path of pages) {
    const source = await readFile(path, "utf8")
    assert.match(source, /getFederationOptions\(\{\s*fresh:\s*true\s*\}\)/)
  }
})

test("les sélecteurs des médecins relisent déjà le référentiel ENTITES", async () => {
  const pages = [
    "app/dashboard/acteurs/medecins/page.tsx",
    "app/dashboard/acteurs/medecins/[id]/page.tsx",
  ]

  for (const path of pages) {
    const source = await readFile(path, "utf8")
    assert.match(source, /sheetName:\s*["']ENTITES["'][\s\S]{0,180}?bypassCache:\s*true/)
  }
})

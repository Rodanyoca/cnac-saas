import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const actorLists = [
  ["athlètes", "app/dashboard/acteurs/athletes/page.tsx", "ATHLETE"],
  ["coachs", "app/dashboard/acteurs/entraineurs/page.tsx", "COACHS"],
  ["médecins", "app/dashboard/acteurs/medecins/page.tsx", "MEDECINS"],
  ["arbitres", "app/dashboard/acteurs/arbitres/page.tsx", "ARBITRES"],
  ["officiels", "app/dashboard/acteurs/officiels/page.tsx", "OFFICIELS"],
] as const

test("les listes d’acteurs relisent leur feuille principale après une création", async () => {
  for (const [label, path, sheet] of actorLists) {
    const source = await readFile(path, "utf8")
    const readsFresh = new RegExp(`sheetName:\\s*(?:ACTOR_SHEETS\\.)?["']?${sheet}["']?[\\s\\S]{0,160}?bypassCache:\\s*true`)
    assert.match(source, readsFresh, `la liste ${label} peut conserver un cache inter-instance obsolète`)
  }
})

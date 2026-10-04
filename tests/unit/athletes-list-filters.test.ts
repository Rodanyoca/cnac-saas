import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("la liste des athlètes combine les filtres de fédération, sexe et statut", async () => {
  const source = await readFile(new URL("../../app/dashboard/acteurs/athletes/athletes-client.tsx", import.meta.url), "utf8")
  assert.match(source, /aria-label="Filtrer par sexe"/)
  assert.match(source, /aria-label="Filtrer par statut"/)
  assert.match(source, /displaySexe\(athlete\.sexe\) === sexFilter/)
  assert.match(source, /athlete\.statut\.trim\(\)\.toLocaleUpperCase\("fr"\) === statusFilter/)
})

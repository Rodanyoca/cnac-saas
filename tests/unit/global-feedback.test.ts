import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("les notifications Sonner sont montées globalement", async () => {
  const layout = await readFile(new URL("../../app/layout.tsx", import.meta.url), "utf8")
  assert.match(layout, /import \{ Toaster \} from "@\/components\/ui\/sonner"/)
  assert.match(layout, /<Toaster/)
})

test("le sélecteur d'acteur reste interactif dans un volet", async () => {
  const select = await readFile(new URL("../../components/dashboard/actor-search-select.tsx", import.meta.url), "utf8")
  assert.match(select, /placeholder = "Rechercher un acteur/)
  assert.match(select, /z-\[60\]/)
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const sourcePath = new URL("../../components/dashboard/federations-summary-section.tsx", import.meta.url)

test("le détail Fédérations du dashboard utilise un tableau synthétique sans icône ni cartes", async () => {
  const source = await readFile(sourcePath, "utf8")
  assert.match(source, /<Table>/)
  assert.match(source, /<TableHead>Indicateur<\/TableHead>/)
  assert.match(source, /<TableHead>Statut<\/TableHead>/)
  assert.match(source, />Effectif<\/TableHead>/)
  assert.match(source, />Part<\/TableHead>/)
  assert.doesNotMatch(source, /<Card/)
  assert.doesNotMatch(source, /lucide-react/)
})

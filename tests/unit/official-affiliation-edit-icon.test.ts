import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("le parcours officiel utilise une icône accessible pour modifier une affiliation", async () => {
  const source = await readFile(
    new URL("../../app/dashboard/acteurs/officiels/[id]/official-affiliations.tsx", import.meta.url),
    "utf8",
  )
  assert.match(source, /size="icon".*?aria-label="Modifier l’affiliation"/)
  assert.match(source, /<Pencil className="h-4 w-4" \/>/)
  assert.doesNotMatch(source, />Modifier<\/Button>/)
})

test("l’onglet Parcours est en lecture seule et le profil conserve l’édition", async () => {
  const source = await readFile(new URL("../../app/dashboard/acteurs/officiels/[id]/officiel-detail-client.tsx", import.meta.url), "utf8")
  assert.match(source, /additionalSections=\{\[\{ id: "parcours"[\s\S]*?<OfficialAffiliations(?![^>]*canEdit)/)
  assert.match(source, /<OfficialAffiliations[^>]*compact canEdit \/>/)
})

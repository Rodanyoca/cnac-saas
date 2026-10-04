import assert from "node:assert/strict"
import test from "node:test"
import { uniqueReferenceOptions } from "../../lib/equipes-nationales/reference-options.ts"

test("les options de référentiel ont une clé React unique", () => {
  const options = uniqueReferenceOptions([
    { id: "KUR", label: "Kurash" },
    { id: "KUR", label: "Kurash" },
    { id: "ATH", label: "Athlétisme" },
  ])

  assert.deepEqual(options, [
    { id: "KUR", label: "Kurash" },
    { id: "ATH", label: "Athlétisme" },
  ])
})

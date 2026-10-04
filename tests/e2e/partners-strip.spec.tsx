import { expect, test } from "@playwright/test"

import { PartnersStrip } from "@/components/login/partners-strip"

test("ne produit aucun élément lorsque la collection partenaires est vide", () => {
  expect(PartnersStrip({ partners: [] })).toBeNull()
})

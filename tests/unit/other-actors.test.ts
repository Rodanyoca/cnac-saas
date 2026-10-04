import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { mapOtherActorRow, OTHER_ACTOR_COLUMNS } from "../../lib/acteurs/autres-model.ts"

test("mappe exactement les en-têtes réels de AUTRES et neutralise les cellules absentes", () => {
  assert.equal(OTHER_ACTOR_COLUMNS.length, 23)
  const row = mapOtherActorRow({ id_autre_acteur_coc: " AUT.000001 ", nom_complet: " Ada Lovelace ", champ_inconnu: "ignoré" })
  assert.equal(row.id_autre_acteur_coc, "AUT.000001")
  assert.equal(row.nom_complet, "Ada Lovelace")
  assert.equal(row.telephone, "")
  assert.equal("champ_inconnu" in row, false)
  assert.equal("nom" in row, false)
})

test("la liste Autres reste responsive sans défilement horizontal", async () => {
  const source = await readFile(new URL("../../app/dashboard/acteurs/autres/autres-client.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(source, /overflow-x-auto/)
  assert.match(source, /overflow-x-hidden/)
  assert.match(source, /hidden lg:block/)
  assert.match(source, /lg:hidden/)
  assert.match(source, /Aucun autre acteur enregistré/)
  assert.match(source, /loadError/)
})

test("les actions d’écriture sont conditionnées et les relations restent des identifiants", async () => {
  const [list, detail, form] = await Promise.all([
    readFile(new URL("../../app/dashboard/acteurs/autres/autres-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/dashboard/acteurs/autres/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../components/dashboard/other-actor-form.tsx", import.meta.url), "utf8"),
  ])
  assert.match(list, /canWrite &&/)
  assert.match(detail, /canWrite \?/)
  assert.match(form, /value\.id_entite/)
  assert.doesNotMatch(form, /nom_entite:/)
  assert.doesNotMatch(form, /id_national/)
})

test("id_national reste absent des interfaces et des validations de AUTRES", async () => {
  const [list, detail, form, api] = await Promise.all([
    readFile(new URL("../../app/dashboard/acteurs/autres/autres-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/dashboard/acteurs/autres/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../components/dashboard/other-actor-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/api/autres/route.ts", import.meta.url), "utf8"),
  ])
  assert.doesNotMatch(`${list}\n${detail}\n${form}`, /id_national|Identifiant national|ID national/)
  assert.doesNotMatch(api, /row\.id_national/)
  assert.match(api, /actorWrite\("autres",request,"PUT"\)/)
})

test("la fiche Autres se limite aux onglets Général et Documents", async () => {
  const detail = await readFile(new URL("../../app/dashboard/acteurs/autres/[id]/page.tsx", import.meta.url), "utf8")
  assert.match(detail, /generalTabLabel="Général"/)
  assert.doesNotMatch(detail, /additionalSections|Parcours/)
})

test("l’ajout et la modification de AUTRES utilisent le même volet latéral", async () => {
  const [list, detail, editor] = await Promise.all([
    readFile(new URL("../../app/dashboard/acteurs/autres/autres-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/dashboard/acteurs/autres/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/dashboard/acteurs/autres/other-actor-editor.tsx", import.meta.url), "utf8"),
  ])
  assert.match(list, /OtherActorEditor presentation="sheet"/)
  assert.match(detail, /OtherActorEditor presentation="sheet"/)
  assert.match(editor, /<SheetContent/)
})

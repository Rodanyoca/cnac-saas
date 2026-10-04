import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const listPath = new URL("../../app/dashboard/federations/federations-client.tsx", import.meta.url)
const detailPath = new URL("../../app/dashboard/federations/[id]/page.tsx", import.meta.url)
const structurePath = new URL("../../components/dashboard/federation-structure-section.tsx", import.meta.url)

test("la liste fédérations utilise une grille responsive sans conteneur horizontal", async () => {
  const source = await readFile(listPath, "utf8")
  assert.doesNotMatch(source, /overflow-x-auto/)
  assert.match(source, /lg:grid-cols-/)
  assert.match(source, /break-(all|words)/)
  assert.match(source, /className="overflow-hidden"/)
})

test("la liste fédérations propose un filtre de catégorie combiné à la recherche", async () => {
  const source = await readFile(listPath, "utf8")
  assert.match(source, /aria-label="Filtrer par catégorie"/)
  assert.match(source, />Toutes les catégories</)
  assert.match(source, /category === "TOUTES" \|\| item\.categorie_entite === category/)
})

test("l’action de détail est une icône accessible avec infobulle", async () => {
  const source = await readFile(listPath, "utf8")
  assert.match(source, /aria-label={`Voir la fiche de/)
  assert.match(source, /<Eye className=/)
  assert.match(source, /<TooltipContent>Voir la fiche<\/TooltipContent>/)
  assert.doesNotMatch(source, />Détails<\/Link>/)
})

test("la fiche reprend la grille Acteurs avec les deux onglets demandés", async () => {
  const source = await readFile(detailPath, "utf8")
  assert.match(source, /lg:grid-cols-3/)
  assert.match(source, /lg:col-span-1/)
  assert.match(source, /lg:col-span-2/)
  assert.equal((source.match(/<TabsTrigger/g) || []).length, 2)
  assert.match(source, /value="identification">Identification/)
  assert.match(source, /value="structure">Structure/)
  assert.doesNotMatch(source, /id_entite_continentale.*<Field/)
})

test("chaque tableau de structure propose recherche et pagination 10, 20 ou 50", async () => {
  const source = await readFile(structurePath, "utf8")
  assert.match(source, /function StructureTable/)
  assert.match(source, /const \[query, setQuery\]/)
  assert.match(source, /\[10, 20, 50\]/)
  assert.match(source, />Précédent</)
  assert.match(source, />Suivant</)
})

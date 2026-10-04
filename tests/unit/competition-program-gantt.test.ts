import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("le programme utilise une vue Gantt unique sans restaurer les cartes", async () => {
  const programs = await source("app/dashboard/competitions/[id]/competition-programs.tsx")
  const gantt = await source("app/dashboard/competitions/[id]/competition-program-gantt.tsx")

  assert.match(programs, /CompetitionProgramGantt/)
  assert.doesNotMatch(programs, /grid gap-3 md:grid-cols-2 xl:grid-cols-3|<Card/)
  assert.match(gantt, /data-testid="program-gantt"/)
  assert.match(gantt, /sticky left-0/)
  assert.match(gantt, /Date d’ouverture/)
  assert.match(gantt, /Date de clôture/)
  assert.match(gantt, /ceremonyDayTone/)
  assert.doesNotMatch(gantt, /function RowMarker|function Milestone/)
  assert.match(gantt, /sportTone/)
  assert.match(gantt, /minmax\(\$\{timelineWidth\}px,1fr\)/)
  assert.match(gantt, /left:.*%/)
  assert.match(gantt, /Épreuves à planifier/)
  assert.match(gantt, /aria-label=\{aria\}/)
})

test("le formulaire bloque le payload invalide avant l’appel API", async () => {
  const programs = await source("app/dashboard/competitions/[id]/competition-programs.tsx")
  assert.match(programs, /if \(formError\).*return/)
  assert.match(programs, /max=\{competition\.date_fin/)
  assert.match(programs, /disabled=\{saving \|\| !form\.id_epreuve \|\| Boolean\(formError\)\}/)
})

test("le chargement de la fiche reprend la silhouette du Gantt", async () => {
  const loading = await source("app/dashboard/competitions/[id]/loading.tsx")
  assert.match(loading, /Skeleton/)
  assert.match(loading, /grid-cols-\[minmax\(13rem,17rem\)_1fr\]/)
})

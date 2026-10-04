import assert from "node:assert/strict"
import test from "node:test"
import { compareCompetitionsByMostRecent } from "../../lib/competitions/sort.ts"
import type { Competition } from "../../lib/competitions/types.ts"

const competition = (id: string, start: string, end = "", name = id) => ({ id_competition: id, date_debut: start, date_fin: end, nom_competition: name } as Competition)

test("trie les compétitions de la plus récente à la plus ancienne", () => {
  const rows = [competition("ancienne", "2022-01-01"), competition("sans-date", ""), competition("recente", "2026-05-10"), competition("milieu", "2024-08-20")]
  assert.deepEqual(rows.sort(compareCompetitionsByMostRecent).map((row) => row.id_competition), ["recente", "milieu", "ancienne", "sans-date"])
})

test("trie strictement sur la date de début et stabilise les dates identiques", () => {
  const rows = [competition("B", "2025-01-01", "2025-03-01", "Zulu"), competition("A", "2025-01-01", "2025-04-01", "Alpha"), competition("sans-debut", "", "2026-12-01")]
  assert.deepEqual(rows.sort(compareCompetitionsByMostRecent).map((row) => row.id_competition), ["A", "B", "sans-debut"])
})

test("reconnaît les dates françaises renvoyées par Google Sheets", () => {
  const rows = [competition("janvier", "15/01/2026"), competition("decembre", "02/12/2026"), competition("iso", "2025-12-31")]
  assert.deepEqual(rows.sort(compareCompetitionsByMostRecent).map((row) => row.id_competition), ["decembre", "janvier", "iso"])
})

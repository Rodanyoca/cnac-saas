import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { parseTable, appendValues, updateCells } from "../../lib/cnac/model.ts"
import { actorPatch } from "../../lib/cnac/actors-model.ts"

const headers = ["id_athlete_cnac", "id_federation", "id_athlete_federation", "id_national", "id_international", "nom_complet", "id_sexe", "date_de_naissance", "lieu_de_naissance", "nationalite", "telephone", "email", "adresse", "statut", "avatar_drive_id", "avatar_drive_url", "observations", "id_club_cnac", "id_equipe_cnac"]
const retired = ["numero_passeport", "date_de_delivrance_passeport", "date_expiration_passeport", "passeport_drive_id", "passeport_drive_url"]

test("the actual nineteen-column athlete contract loads and writes without passport columns", () => {
  const original = { id_athlete_cnac: "ATH-TEST", nom_complet: "Fixture", id_federation: "FED-TEST", id_sexe: "01", avatar_drive_id: "private-avatar", id_club_cnac: "CLUB-TEST", id_equipe_cnac: "TEAM-TEST" }
  const table = parseTable("ATHLETES", [headers, headers.map(key => original[key as keyof typeof original] || "")])
  const row = table.rows[0]
  assert.equal(appendValues({ ...table, rows: [] }, "ATHLETES", original).length, 19)
  const cells = updateCells(table, "ATHLETES", "id_athlete_cnac", original.id_athlete_cnac, [{ column: "nom_complet", value: "Updated" }, { column: "id_club_cnac", value: "CLUB-OTHER" }, { column: "id_equipe_cnac", value: "TEAM-OTHER" }])
  assert.deepEqual(cells.map(cell => cell.columnIndex), [5, 17, 18])
  assert.equal(row.avatar_drive_id, original.avatar_drive_id)
  for (const column of retired) {
    assert.equal(column in row, false)
    assert.throws(() => updateCells(table, "ATHLETES", "id_athlete_cnac", original.id_athlete_cnac, [{ column, value: "removed" }]), /Colonne absente/)
  }
  assert.throws(() => actorPatch("athletes", { numero_passeport: "removed" }, row, {}, [row]), /n.existe pas/)
})

test("athlete creation and detail sources contain no passport fields or payloads", async () => {
  for (const path of ["athletes-client.tsx", "[id]/page.tsx", "[id]/athlete-detail-client.tsx"]) {
    const source = await readFile(new URL(`../../app/dashboard/acteurs/athletes/${path}`, import.meta.url), "utf8")
    assert.doesNotMatch(source, /passeport|passport/i)
  }
})

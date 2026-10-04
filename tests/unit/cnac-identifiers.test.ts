import assert from "node:assert/strict"
import test from "node:test"
import { nextCompactCnacId, withCnacCreationQueue } from "../../lib/cnac/identifiers.ts"
import { planCnacIdMigration } from "../../lib/cnac/id-migration.ts"
import { CNAC_HEADERS, type CnacSheet } from "../../lib/cnac/schema.ts"

function matrix(sheet: CnacSheet, rows: Record<string, unknown>[]) {
  return [[...CNAC_HEADERS[sheet]], ...rows.map(row => CNAC_HEADERS[sheet].map(column => row[column] ?? ""))]
}
test("compact CNAC identifiers indicate the type and never reuse an existing sequence", () => {
  assert.equal(nextCompactCnacId("ZON", []), "ZON-0001")
  assert.equal(nextCompactCnacId("ZON", ["ZON-0001", "ZON-0007", "Z1"]), "ZON-0008")
  assert.equal(nextCompactCnacId("LIG", ["LIG-9999"]), "LIG-10000")
  assert.throws(() => nextCompactCnacId("ZON", ["ZON-99999999"]), /épuisée/)
})
test("concurrent creations share a sequence and a rejected creation does not block the queue", async () => {
  const ids: string[] = []
  const create = () => withCnacCreationQueue("test:zone", async () => {
    const id = nextCompactCnacId("ZON", ids)
    await Promise.resolve()
    ids.push(id)
    return id
  })
  assert.deepEqual(await Promise.all([create(), create(), create()]), ["ZON-0001", "ZON-0002", "ZON-0003"])
  await assert.rejects(withCnacCreationQueue("test:zone", async () => { throw new Error("failed") }))
  assert.equal(await create(), "ZON-0004")
})
test("migration rewrites existing long IDs and their parents, preserving other cells and short IDs", () => {
  const zone = "FED007-ZONES-00000000-0000-0000-0000-000000000001"
  const league = "FED007-LIGUES-00000000-0000-0000-0000-000000000002"
  const athlete = "ATH.00000000-0000-0000-0000-000000000003"
  const tables = {
    ZONES: matrix("ZONES", [{ id_zone_cnac: "ZON-0001", nom_zone: "Keep" }, { id_zone_cnac: zone, id_federation: "FED007", nom_zone: "Nord", observations: "KEEP" }]),
    LIGUES: matrix("LIGUES", [{ id_ligue_cnac: league, id_structure_parent_cnac: zone, telephone: "+243001" }]),
    ENTENTES: matrix("ENTENTES", [{ id_entente_cnac: "E1", id_structure_parent_cnac: league }]),
    ATHLETES: matrix("ATHLETES", [{ id_athlete_cnac: athlete, nom_complet: "KEEP" }]),
    PERSONNES_CONTACT_ENTITES: matrix("PERSONNES_CONTACT_ENTITES", [{ id_contact_entite: "CONTACT1", id_acteur_cnac: athlete }]),
  }
  const before = structuredClone(tables)
  const plan = planCnacIdMigration(tables)
  assert.deepEqual(plan.mappings.map(item => item.after), ["ZON-0002", "LIG-0001", "ATH-0001"])
  assert.equal(plan.cells.length, 6)
  assert.deepEqual(tables, before)
  for (const cell of plan.cells) tables[cell.sheet as keyof typeof tables][cell.row - 1][cell.column] = cell.after
  assert.equal(tables.ZONES[1][0], "ZON-0001")
  assert.equal(tables.ZONES[2][6], "KEEP")
  assert.equal(tables.LIGUES[1][12], "ZON-0002")
  assert.equal(tables.ENTENTES[1][3], "LIG-0001")
  assert.equal(tables.PERSONNES_CONTACT_ENTITES[1][3], "ATH-0001")
  assert.equal(planCnacIdMigration(tables).cells.length, 0)
})
test("migration refuses ambiguous identities, unhandled references and literal formula dependencies", () => {
  const long = "FED007-ZONES-00000000-0000-0000-0000-000000000001"
  assert.throws(() => planCnacIdMigration({ ZONES: matrix("ZONES", [{ id_zone_cnac: long }, { id_zone_cnac: long }]) }), /ambigu/)
  assert.throws(() => planCnacIdMigration({ ZONES: matrix("ZONES", [{ id_zone_cnac: long }]), CUSTOM: [["id_external"], [long]] }), /non prise en charge/)
  assert.throws(() => planCnacIdMigration({ ZONES: matrix("ZONES", [{ id_zone_cnac: long }]), CUSTOM: [["formula"], [`="${long}"`]] }), /formule/)
})

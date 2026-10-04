import assert from "node:assert/strict"
import test from "node:test"

import { getPrimaryOfficialAffiliation, getPrimaryOfficialEntities } from "../../lib/acteurs/official-affiliation-model.ts"

const affiliation = (official: string, entity: string, start: string, end = "") => ({
  id_officiel_coc: official,
  id_entite: entity,
  date_debut: start,
  date_fin: end,
})

test("retient la plus ancienne affiliation dont la date de fin est vide", () => {
  const rows = [
    affiliation("OFF1", "ENT-RECENTE", "2024-01-01"),
    affiliation("OFF1", "ENT-TERMINEE", "2010-01-01", "2015-01-01"),
    affiliation("OFF1", "ENT-ANCIENNE", "2018-05-10"),
  ]

  assert.equal(getPrimaryOfficialAffiliation(rows)?.id_entite, "ENT-ANCIENNE")
})

test("résout indépendamment l'organisation principale de chaque officiel", () => {
  const entities = getPrimaryOfficialEntities([
    affiliation("OFF1", "ENT1", "2020-01-01"),
    affiliation("OFF2", "ENT2", "2019-01-01"),
    affiliation("OFF2", "ENT3", "2022-01-01"),
  ])

  assert.equal(entities.get("OFF1"), "ENT1")
  assert.equal(entities.get("OFF2"), "ENT2")
})

test("ne retourne aucune organisation lorsque toutes les affiliations sont terminées", () => {
  assert.equal(getPrimaryOfficialAffiliation([
    affiliation("OFF1", "ENT1", "2020-01-01", "2024-01-01"),
  ]), undefined)
})

import assert from "node:assert/strict"
import test from "node:test"
import { mapEntiteRow, mapFederationRow } from "../../lib/federations/mappers.ts"

test("projette uniquement les champs réels d’une entité utiles à la fiche fédération", () => {
  assert.deepEqual(mapEntiteRow({ id_entite: "ENT-1", id_categorie_entite: "CAT-1", nom_officiel: "Fédération Test", sigle: "FT", adresse_siege: "Kinshasa", telephone: "+243", email: "contact@example.test", site_web: "example.test", observations: "Note" }), {
    id_entite: "ENT-1", id_categorie_entite: "CAT-1", nom_entite: "Fédération Test", sigle_entite: "FT", adresse_siege: "Kinshasa", telephone: "+243", email: "contact@example.test", site_web: "example.test", observations: "Note",
  })
})

test("conserve les statuts et rattachements réels de FEDERATIONS sans inventer les données d’entité", () => {
  const result = mapFederationRow({ id_federation: "FED-1", id_entite: "ENT-1", id_sport: "SP-1", logo_drive_id: "DRV-1", logo_drive_url: "https://image/logo", statut_reconnaissance_ministere: "RECONNUE", date_reconnaissance_nationale: "2023-01-01", statut_affiliation_coc: "AFFILIEE", date_affiliation_coc: "2024-01-01", id_entite_continentale: "ENT-C", date_affiliation_continentale: "2024-02-01", id_entite_internationale: "ENT-I", date_affiliation_internationale: "2024-03-01", statut: "ACTIF", observations: "Observation fédérale" })
  assert.equal(result.id_federation, "FED-1")
  assert.equal(result.statut, "ACTIF")
  assert.equal(result.statut_reconnaissance_ministere, "RECONNUE")
  assert.equal(result.statut_affiliation_coc, "AFFILIEE")
  assert.equal(result.id_entite_continentale, "ENT-C")
  assert.equal(result.id_entite_internationale, "ENT-I")
  assert.equal(result.logo_drive_id, "DRV-1")
  assert.equal(result.logo_drive_url, "https://image/logo")
  assert.equal(result.categorie_entite, "")
  assert.equal(result.nom_federation, "")
  assert.equal(result.observations, "Observation fédérale")
})

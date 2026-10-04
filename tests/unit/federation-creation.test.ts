import assert from "node:assert/strict"
import test from "node:test"
import { nextSequentialId, normalizeFederationCreation, validateFederationCreation } from "../../lib/federations/creation-model.ts"

const valid = () => normalizeFederationCreation({ id_categorie_entite: "CATEN001", nom_officiel: "Fédération test", sigle: "fet", id_sport: "AUT", statut: "ACTIF", statut_reconnaissance_ministere: "ACTIF", statut_affiliation_coc: "ACTIF" })
test("normalise le sigle et génère les identifiants serveur séquentiels", () => { assert.equal(valid().sigle, "FET"); assert.equal(nextSequentialId([{ id_entite: "RDCENT085" }], "id_entite", "RDCENT"), "RDCENT086"); assert.equal(nextSequentialId([{ id_federation: "FED025" }], "id_federation", "FED"), "FED026") })
test("valide les champs obligatoires et les coordonnées", () => { assert.doesNotThrow(() => validateFederationCreation(valid())); assert.throws(() => validateFederationCreation({ ...valid(), email: "incorrect" }), /e-mail/i); assert.throws(() => validateFederationCreation({ ...valid(), site_web: "://" }), /site web/i) })
test("le sigle est facultatif lors de la création", () => { assert.doesNotThrow(() => validateFederationCreation({ ...valid(), sigle: "" })) })
test("une date de rattachement exige son entité", () => { assert.throws(() => validateFederationCreation({ ...valid(), date_affiliation_continentale: "2026-09-01" }), /continentale/i); assert.throws(() => validateFederationCreation({ ...valid(), date_affiliation_internationale: "2026-09-01" }), /internationale/i) })

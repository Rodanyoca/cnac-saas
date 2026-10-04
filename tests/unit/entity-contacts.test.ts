import assert from "node:assert/strict"
import test from "node:test"
import { normalizeContactInput, validateContactRules } from "../../lib/federations/entity-contacts-model.ts"

const valid = (type: string) => normalizeContactInput({ id_entite: "RDCENT005", id_type_acteur: type, id_acteur_coc: `ACT-${type}`, fonction_contact: "Secrétaire", est_contact_principal: false, statut: "ACTIF" })

for (const type of ["TYPACT002", "TYPACT003", "TYPACT004", "TYPACT005", "TYPACT006"]) test(`accepte le type ${type}`, () => assert.doesNotThrow(() => validateContactRules(valid(type), [])))
test("refuse explicitement un athlète", () => assert.throws(() => validateContactRules(valid("TYPACT001"), []), /athlète/i))
test("refuse une relation active identique", () => assert.throws(() => validateContactRules(valid("TYPACT002"), [{ id_contact_entite: "PCE1", id_entite: "RDCENT005", id_type_acteur: "TYPACT002", id_acteur_coc: "ACT-TYPACT002", statut: "ACTIF", est_contact_principal: "FALSE" }]), /déjà/i))
test("refuse un second contact principal actif", () => assert.throws(() => validateContactRules({ ...valid("TYPACT003"), est_contact_principal: true }, [{ id_contact_entite: "PCE1", id_entite: "RDCENT005", id_type_acteur: "TYPACT002", id_acteur_coc: "AUTRE", statut: "ACTIF", est_contact_principal: "TRUE" }]), /principal/i))

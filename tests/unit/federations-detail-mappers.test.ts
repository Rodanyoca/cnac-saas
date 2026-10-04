import assert from "node:assert/strict"
import test from "node:test"
import { resolveActiveEntityContacts } from "../../lib/federations/detail-mappers.ts"

test("résout seulement les contacts AUTRES actifs liés à l’entité", () => {
  const contacts = resolveActiveEntityContacts([
    { id_autre_acteur_coc: "AUT-1", id_entite: "ENT-C", nom_complet: "Contact Un", type_autre_acteur: "Secrétaire général", telephone: "+2431", email: "un@example.test", statut: "ACTIF" },
    { id_autre_acteur_coc: "AUT-2", id_entite: "ENT-C", nom_complet: "Contact Deux", statut: "INACTIF" },
    { id_autre_acteur_coc: "AUT-3", id_entite: "ENT-I", nom_complet: "Autre entité", statut: "ACTIF" },
  ], "ENT-C")
  assert.deepEqual(contacts, [{ id: "AUT-1", nom: "Contact Un", fonction: "Secrétaire général", telephone: "+2431", email: "un@example.test" }])
})

test("ne crée aucun contact quand l’entité ou la relation est absente", () => {
  assert.deepEqual(resolveActiveEntityContacts([{ nom_complet: "Sans relation", statut: "ACTIF" }], "ENT-C"), [])
  assert.deepEqual(resolveActiveEntityContacts([], ""), [])
})

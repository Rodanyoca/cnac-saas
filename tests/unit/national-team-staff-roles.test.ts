import assert from "node:assert/strict"
import test from "node:test"
import { roleForActorType } from "../../lib/equipes-nationales/staff-roles.ts"

const roles = [
  { id: "ROLE_ENTRAINEUR_PRINCIPAL", label: "Entraîneur principal", parentId: "TYPACT002" },
  { id: "ROLE_MEDECIN", label: "Médecin", parentId: "TYPACT003" },
  { id: "ROLE_OFFICIEL", label: "Officiel", parentId: "TYPACT005" },
]

test("le choix Officiel sélectionne un rôle officiel valide", () => {
  assert.equal(roleForActorType("OFFICIEL", roles), "ROLE_OFFICIEL")
})

test("chaque type de staff préfère son rôle métier", () => {
  assert.equal(roleForActorType("COACH", roles), "ROLE_ENTRAINEUR_PRINCIPAL")
  assert.equal(roleForActorType("MEDECIN", roles), "ROLE_MEDECIN")
})

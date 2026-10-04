import assert from "node:assert/strict"
import test from "node:test"
import { aggregateFederationsDashboardStats } from "../../lib/federations/dashboard-stats.ts"
import type { Federation } from "../../lib/federations/types.ts"

const federation = (values: Partial<Federation>): Federation => ({
  id_federation: "FED-001", statut: "ACTIF", statut_reconnaissance_ministere: "RECONNUE", statut_affiliation_coc: "ACTIF", ...values,
} as Federation)

test("calcule le total et les statuts réels des fédérations", () => {
  const stats = aggregateFederationsDashboardStats({ federations: [
    federation({}),
    federation({ id_federation: "FED-002", statut_affiliation_coc: "INACTIF" }),
    federation({ id_federation: "FED-003", statut_affiliation_coc: "" }),
    federation({ id_federation: "", statut_affiliation_coc: "ACTIF" }),
  ] })
  assert.equal(stats.totalFederations, 3)
  assert.deepEqual(stats.dimensions.find((item) => item.key === "coc")?.statuses, [
    { label: "Actif", total: 1, missing: false },
    { label: "Inactif", total: 1, missing: false },
    { label: "Non renseigné", total: 1, missing: true },
  ])
})

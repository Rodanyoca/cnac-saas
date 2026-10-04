import assert from "node:assert/strict"
import test from "node:test"

import { calculateCompetitionDelegationCounts } from "../../lib/competitions/delegation-counts.ts"

test("calcule la délégation sans doubler un acteur engagé plusieurs fois", () => {
  const counts = calculateCompetitionDelegationCounts(
    ["COM1"],
    [
      { id_participation_equipe: "ENG1", id_competition: "COM1" },
      { id_participation_equipe: "ENG2", id_competition: "COM1" },
    ],
    [
      { id_engagement_campagne: "ENG1", id_campagne: "CAM1" },
      { id_engagement_campagne: "ENG2", id_campagne: "CAM1" },
    ],
    [
      { id_engagement_campagne: "ENG1", id_selection: "SEL1", athlete_id: "ATH1", id_statut_participation: "PARTICIPANT" },
      { id_engagement_campagne: "ENG2", id_selection: "SEL1", athlete_id: "ATH1", id_statut_participation: "INSCRIT" },
      { id_engagement_campagne: "ENG1", id_selection: "SEL2", athlete_id: "ATH2", id_statut_participation: "FORFAIT" },
    ],
    [
      { id_campagne: "CAM1", id_acteur_coc: "COA1", id_type_acteur: "COACH" },
      { id_campagne: "CAM1", id_acteur_coc: "COA1", id_type_acteur: "COACH" },
      { id_campagne: "CAM2", id_acteur_coc: "MED1", id_type_acteur: "MEDECIN" },
    ],
  )
  assert.deepEqual(counts, { COM1: 2 })
})

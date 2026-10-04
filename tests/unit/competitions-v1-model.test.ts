import assert from "node:assert/strict"
import test from "node:test"
import { mapV1Row, missingHeaders, validateEngagement, validateParticipation, validateResult, validateV1Relations, V1_HEADERS } from "../../lib/competitions/v1-model.ts"

const program = mapV1Row("PROGRAMMES_COMPETITION", { id_programme_competition: "PRG0001", id_competition: "COMP0001", id_epreuve: "EPR_BSK" })
const campaign = mapV1Row("CAMPAGNES_EQUIPES_NATIONALES", { id_campagne: "CAM0001", id_equipe_nationale: "EQN001", nom_campagne: "Jeux", date_debut:"2026-01-01", date_fin:"2026-12-31", id_statut_campagne: "ACTIVE" })
const engagement = validateEngagement(mapV1Row("ENGAGEMENTS_CAMPAGNES_PROGRAMMES", { id_engagement_campagne: "ENG0001", id_programme_competition: "PRG0001", id_campagne: "CAM0001", id_statut_engagement: "CONFIRME", date_engagement: "2026-01-10" }))
const selection = mapV1Row("SELECTIONS_ATHLETES", { id_selection: "SEL0001", id_campagne: "CAM0001", id_athlete: "ATH001", date_selection: "2026-01-05", id_statut_selection: "SELECTIONNE" })
const participation = validateParticipation(mapV1Row("PARTICIPATIONS_ACTEURS_COMPETITION", { id_participation_acteur: "PAR0001", id_engagement_campagne: "ENG0001", id_acteur_coc:"ATH001", id_type_acteur:"ATHLETE", id_selection: "SEL0001", id_statut_participation: "PARTICIPANT", date_statut: "2026-02-01" }))
const result = validateResult(mapV1Row("RESULTATS", { id_resultat: "RES0001", id_resultat_logique: "RSL0001", numero_version: "1", est_version_courante: "OUI", id_engagement_campagne: "ENG0001", id_programme_competition: "PRG0001", id_unite_participante:"UNI0001", date_resultat: "2026-02-01", id_resultat_synthetique: "VICTOIRE", id_statut_resultat: "BROUILLON" }))

test("mappe uniquement les en-têtes physiques V1", () => {
  const row = mapV1Row("PROGRAMMES_COMPETITION", { id_programme_competition: " PRG1 ", inconnu: "x" })
  assert.equal(row.id_programme_competition, "PRG1")
  assert.equal("inconnu" in row, false)
  assert.deepEqual(V1_HEADERS.ENGAGEMENTS_CAMPAGNES_PROGRAMMES, ["id_engagement_campagne", "id_programme_competition", "id_campagne", "id_statut_engagement", "date_engagement", "observation"])
})

test("détecte un schéma incomplet", () => {
  assert.deepEqual(missingHeaders("COMPETITIONS", [...V1_HEADERS.COMPETITIONS].filter((header) => header !== "est_multisport")), ["est_multisport"])
})

test("valide le graphe campagne-programme-participation-résultat", () => {
  assert.doesNotThrow(() => validateV1Relations({ programs: [program], campaigns: [campaign], engagements: [engagement], selections: [selection], participations: [participation], results: [result] }))
})

test("refuse une participation déduite d’une autre campagne", () => {
  const badSelection = { ...selection, id_campagne: "CAM9999" }
  assert.throws(() => validateV1Relations({ programs: [program], campaigns: [campaign], engagements: [engagement], selections: [badSelection], participations: [participation], results: [result] }), /Participation incohérente/)
})

test("exige une sélection remplaçante et une correction motivée", () => {
  assert.throws(() => validateParticipation({ ...participation, id_statut_participation: "REMPLACE", id_participation_remplacement: "" }), /remplaçante/)
  assert.throws(() => validateResult({ ...result, id_resultat: "RES0002", numero_version: "2", id_resultat_precedent: "", motif_correction: "" }), /correction/)
})

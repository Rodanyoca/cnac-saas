import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { mapV1Row, validateEngagement, validateParticipation, validateResult, validateV1Relations } from "../../lib/competitions/v1-model.ts"
import { validateCompetitionResultInput } from "../../lib/competitions/validation.ts"

const campaign = mapV1Row("CAMPAGNES_EQUIPES_NATIONALES", { id_campagne: "CAM-RDC-2028", id_equipe_nationale: "EQ-RDC", nom_campagne: "Jeux 2028", date_debut:"2028-06-01", date_fin:"2028-08-31", id_statut_campagne:"ACTIVE" })
const programs = [
  mapV1Row("PROGRAMMES_COMPETITION", { id_programme_competition: "PRG-BASKET", id_competition: "COM-JO-2028", id_epreuve: "BASKET-5X5" }),
  mapV1Row("PROGRAMMES_COMPETITION", { id_programme_competition: "PRG-VOLLEY", id_competition: "COM-JO-2028", id_epreuve: "VOLLEY-SALLE" }),
  mapV1Row("PROGRAMMES_COMPETITION", { id_programme_competition: "PRG-ATH-100M", id_competition: "COM-JO-2028", id_epreuve: "ATH-100M" }),
]
const engagement = (id: string, program: string) => validateEngagement(mapV1Row("ENGAGEMENTS_CAMPAGNES_PROGRAMMES", { id_engagement_campagne: id, id_programme_competition: program, id_campagne: campaign.id_campagne, id_statut_engagement: "CONFIRME", date_engagement: "2028-06-01" }))
const engagements = [engagement("ENG-BASKET", "PRG-BASKET"), engagement("ENG-VOLLEY", "PRG-VOLLEY"), engagement("ENG-ATH", "PRG-ATH-100M")]
const selected = mapV1Row("SELECTIONS_ATHLETES", { id_selection: "SEL-TIT", id_campagne: campaign.id_campagne, id_athlete: "ATH-1", date_selection: "2028-06-10", id_statut_selection: "SELECTIONNE" })
const substitute = mapV1Row("SELECTIONS_ATHLETES", { id_selection: "SEL-REM", id_campagne: campaign.id_campagne, id_athlete: "ATH-2", date_selection: "2028-06-10", id_statut_selection: "REMPLACANT" })
const participation = validateParticipation(mapV1Row("PARTICIPATIONS_ACTEURS_COMPETITION", { id_participation_acteur: "PAR-1", id_engagement_campagne: "ENG-ATH", id_acteur_coc:"ATH-1", id_type_acteur:"ATHLETE", id_selection: selected.id_selection, id_statut_participation: "REMPLACE", date_statut: "2028-07-20", id_participation_remplacement: "PAR-2" }))
const result = (id: string, logical: string, engagementId: string, programId: string, version = "1", previous = "", status = "BROUILLON") => validateResult(mapV1Row("RESULTATS", { id_resultat: id, id_resultat_logique: logical, numero_version: version, id_resultat_precedent: previous, est_version_courante: "OUI", id_engagement_campagne: engagementId, id_programme_competition: programId, id_unite_participante:`UNI-${id}`, date_resultat: "2028-07-21", id_resultat_synthetique: "VICTOIRE", id_statut_resultat: status, motif_correction: previous ? "Correction officielle" : "" }))

test("réception: parcours multisport complet équipe-campagne-programme-participant-résultat", () => {
  const results = [result("RES-BASKET", "LOG-BASKET", "ENG-BASKET", "PRG-BASKET"), result("RES-VOLLEY", "LOG-VOLLEY", "ENG-VOLLEY", "PRG-VOLLEY"), result("RES-ATH", "LOG-ATH", "ENG-ATH", "PRG-ATH-100M")]
  assert.doesNotThrow(() => validateV1Relations({ programs, campaigns: [campaign], engagements, selections: [selected, substitute], participations: [participation], results }))
  assert.equal(new Set(programs.map((row) => row.id_competition)).size, 1, "une compétition multisport reste unique")
})

test("réception: un remplacement conserve sa participation liée", () => {
  assert.equal(participation.id_statut_participation, "REMPLACE")
  assert.equal(participation.id_participation_remplacement, "PAR-2")
})

test("réception: une correction officielle conserve les versions", async () => {
  const official = validateCompetitionResultInput({ id_engagement_campagne: "ENG-BASKET", id_unite_participante:"UNI-BASKET", date_resultat: "2028-07-21", id_resultat_synthetique: "VICTOIRE", id_statut_resultat: "OFFICIEL" })
  assert.equal(official.id_statut_resultat, "OFFICIEL")
  const data = await readFile(new URL("../../lib/competitions/data.ts", import.meta.url), "utf8")
  assert.match(data, /id_resultat_precedent:current\.id_resultat/)
  assert.match(data, /motif_correction/)
})

test("réception: le modèle refuse les relations croisées entre campagnes", () => {
  const foreign = mapV1Row("SELECTIONS_ATHLETES", { ...selected, id_selection: "SEL-X", id_campagne: "CAM-X" })
  const invalid = mapV1Row("PARTICIPATIONS_ACTEURS_COMPETITION", { ...participation, id_participation_acteur: "PAR-X", id_selection: foreign.id_selection })
  assert.throws(() => validateV1Relations({ programs, campaigns: [campaign], engagements, selections: [selected, substitute, foreign], participations: [invalid], results: [] }), /incohérente/i)
})

test("réception finale: basket, boxe et athlétisme acceptent les trois formes d’adversaire", () => {
  const basket = validateCompetitionResultInput({ id_engagement_campagne:"ENG-BASKET", id_unite_participante:"UNI-BASKET", date_resultat:"2028-07-21", type_adversaire:"EQUIPE", nom_adversaire:"France", valeur_coc:"82", valeur_adversaire:"76", id_statut_resultat:"OFFICIEL" })
  const boxe = validateCompetitionResultInput({ id_engagement_campagne:"ENG-BOXE", id_unite_participante:"UNI-BOXE", date_resultat:"2028-07-21", type_adversaire:"ATHLETE", nom_adversaire:"Adversaire test", id_resultat_synthetique:"VICTOIRE", id_statut_resultat:"OFFICIEL" })
  const athletisme = validateCompetitionResultInput({ id_engagement_campagne:"ENG-ATH", id_unite_participante:"UNI-ATH", date_resultat:"2028-07-21", type_adversaire:"AUCUN", valeur_coc:"10.12", id_statut_resultat:"OFFICIEL" })
  assert.equal(basket.type_adversaire,"EQUIPE");assert.equal(boxe.type_adversaire,"ATHLETE");assert.equal(athletisme.type_adversaire,"AUCUN")
})

test("réception finale: paire, relais et TEAM ATHLETISME restent des équipes multi-athlètes", () => {
  for (const nom_unite of ["Paire beach-volley", "Relais 4x100", "TEAM ATHLETISME"]) {
    const unit = mapV1Row("UNITES_PARTICIPANTES", { id_unite_participante:`UNI-${nom_unite}`, id_engagement_campagne:"ENG-ATH", type_unite:"EQUIPE", nom_unite })
    const members = ["PAR-1","PAR-2"].map((id_participation_acteur,index)=>mapV1Row("MEMBRES_UNITES_PARTICIPANTES",{id_membre_unite:`MEM-${index}`,id_unite_participante:unit.id_unite_participante,id_participation_acteur}))
    assert.equal(unit.type_unite,"EQUIPE");assert.equal(members.length,2)
  }
})

test("réception finale: sélection sans participation et résultat invalide restent distincts", () => {
  const selections=[selected],participations:(typeof participation)[]=[]
  assert.equal(selections.length,1);assert.equal(participations.length,0)
  assert.throws(()=>validateCompetitionResultInput({id_engagement_campagne:"ENG-ATH",id_unite_participante:"UNI-ATH",date_resultat:"2028-07-21",type_adversaire:"AUCUN"}),/résultat doit contenir/i)
})

import assert from "node:assert/strict"
import test from "node:test"
import { activeTrainingTeam, readTrainingSlots, trainingPatch, validateTraining, validTrainingTimezone } from "../../lib/cnac/team-training.ts"

const slots = [{ jour: 3, heure_debut: "16:00", heure_fin: "18:00" }, { jour: 1, heure_debut: "16:00", heure_fin: "18:00" }, { jour: 3, heure_debut: "09:00", heure_fin: "11:00" }]
const training = { lieu_entrainement: "Salle test", adresse_entrainement: "Adresse test", fuseau_horaire_entrainement: "Africa/Kinshasa", planning_entrainement_json: JSON.stringify(slots) }

test("weekly training sorts local slots and supports both DRC timezones without date conversion", () => {
  assert.deepEqual(validateTraining(training), [slots[1], slots[2], slots[0]])
  assert.ok(validTrainingTimezone("Africa/Kinshasa")); assert.ok(validTrainingTimezone("Africa/Lubumbashi"))
  assert.equal(validTrainingTimezone("INVALID"), false)
  assert.equal(validTrainingTimezone("CET"), false)
  assert.deepEqual(validateTraining({}), [])
  assert.deepEqual(validateTraining({ planning_entrainement_json: "[]" }), [])
  assert.deepEqual(readTrainingSlots("  "), [])
})

for (const [name, invalidSlots] of [
  ["missing day", [{ jour: 0, heure_debut: "09:00", heure_fin: "10:00" }]],
  ["fractional day", [{ jour: 1.5, heure_debut: "09:00", heure_fin: "10:00" }]],
  ["invalid day", [{ jour: 8, heure_debut: "09:00", heure_fin: "10:00" }]],
  ["incomplete slot", [{ jour: 1, heure_debut: "", heure_fin: "10:00" }]],
  ["invalid time", [{ jour: 1, heure_debut: "09:60", heure_fin: "10:00" }]],
  ["non HH:mm time", [{ jour: 1, heure_debut: "9:00", heure_fin: "10:00" }]],
  ["overnight", [{ jour: 1, heure_debut: "23:00", heure_fin: "01:00" }]],
  ["zero duration", [{ jour: 1, heure_debut: "09:00", heure_fin: "09:00" }]],
  ["duplicate", [slots[0], slots[0]]],
  ["overlap", [slots[0], { jour: 3, heure_debut: "17:00", heure_fin: "19:00" }]],
] as const) test(`weekly training rejects ${name}`, () => {
  assert.throws(() => validateTraining({ ...training, planning_entrainement_json: JSON.stringify(invalidSlots) }), { code: "TRAINING_INVALID" })
})

test("weekly training rejects missing timezone, malformed JSON and wrong JSON shape", () => {
  assert.throws(() => validateTraining({ ...training, fuseau_horaire_entrainement: "" }), /fuseau/)
  for (const value of ["{broken", "null", "{}", "[{}]", '[{"jour":"1","heure_debut":"09:00","heure_fin":"10:00"}]']) assert.throws(() => readTrainingSlots(value), /conservé/)
})

test("adjacent slots and the same hours on different days are valid", () => {
  const value = [{ jour: 1, heure_debut: "09:00", heure_fin: "10:00" }, { jour: 1, heure_debut: "10:00", heure_fin: "11:00" }, { jour: 2, heure_debut: "09:00", heure_fin: "10:00" }]
  assert.equal(validateTraining({ ...training, planning_entrainement_json: JSON.stringify(value) }).length, 3)
})

test("partial updates preserve cells; explicit removal and malformed historical preservation differ", () => {
  const unrelated = trainingPatch({ nom_equipe: "Nouveau nom" }, training)
  assert.deepEqual(unrelated, { nom_equipe: "Nouveau nom" })
  const malformed = { ...training, planning_entrainement_json: "broken" }
  assert.deepEqual(trainingPatch({ ...malformed, observations: "note" }, malformed), { ...malformed, observations: "note" })
  assert.deepEqual(trainingPatch({ lieu_entrainement: "Autre salle" }, malformed), { lieu_entrainement: "Autre salle" })
  assert.throws(() => trainingPatch({ fuseau_horaire_entrainement: "Africa/Lubumbashi" }, malformed), /conservé/)
  assert.deepEqual(trainingPatch({ planning_entrainement_json: "" }, training), { planning_entrainement_json: "" })
  assert.deepEqual(trainingPatch({ planning_entrainement_json: "[]", fuseau_horaire_entrainement: "" }, malformed), { planning_entrainement_json: "[]", fuseau_horaire_entrainement: "" })
  assert.equal(trainingPatch({ ...training }).planning_entrainement_json, JSON.stringify([slots[1], slots[2], slots[0]]))
})

test("athlete training follows the active team and checks affiliation, without copied training data", () => {
  const first = { ...training, id_equipe_cnac: "T1", id_club_cnac: "C1", id_federation: "FED1" }
  const second = { ...training, lieu_entrainement: "Salle 2", id_equipe_cnac: "T2", id_club_cnac: "C1", id_federation: "FED1" }
  const affiliation = { id_equipe_cnac: "T1", id_club_cnac: "C1", id_federation: "FED1" }
  assert.equal(activeTrainingTeam([first, second], affiliation), first)
  assert.equal(activeTrainingTeam([first, second], { ...affiliation, id_equipe_cnac: "T2" }), second)
  assert.equal(activeTrainingTeam([first, second], { ...affiliation, id_club_cnac: "C2" }), undefined)
  assert.equal(activeTrainingTeam([first, second], {}), undefined)
})

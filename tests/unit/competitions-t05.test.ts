import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { validateCompetitionInput, validateProgramInput } from "../../lib/competitions/validation.ts"

test("conserve explicitement la portée mono ou multisport", () => {
  const base = { nom_competition: "Jeux", id_type_competition: "TYPE_JO", date_debut: "2028-07-14", date_fin: "2028-07-30", statut: "PLANIFIEE" }
  assert.equal(validateCompetitionInput({ ...base, est_multisport: "OUI" }).est_multisport, "OUI")
  assert.equal(validateCompetitionInput({ ...base, est_multisport: "NON" }).est_multisport, "NON")
  assert.throws(() => validateCompetitionInput({ ...base, est_multisport: "INCONNU" }), /multisport/)
})

test("valide les dates d’un programme et exige une épreuve", () => {
  assert.throws(() => validateProgramInput({}), /épreuve/i)
  assert.throws(() => validateProgramInput({ id_epreuve: "EPR-1", date_debut: "2028-07-20", date_fin: "2028-07-19" }), /période/i)
  assert.deepEqual(validateProgramInput({ id_epreuve: " EPR-1 ", id_sexe: " SEX-F " }), {
    id_epreuve: "EPR-1", id_categorie_age: "", id_sexe: "SEX-F", date_debut: "", date_fin: "", observations: "",
  })
})

test("l’interface programme reste compacte et gère le référentiel vide", () => {
  const source = readFileSync("app/dashboard/competitions/[id]/competition-programs.tsx", "utf8")
  assert.match(source, /EPREUVES est vide/)
  assert.match(source, /disabled=\{!events\.length\}/)
  assert.doesNotMatch(source, /overflow-x-auto/)
})

test("les écritures de programmes sont contrôlées côté serveur", () => {
  const source = readFileSync("app/api/competitions/[id]/programmes/route.ts", "utf8")
  assert.match(source, /canAccess\("AUT-SPT", "READ"\)/)
  assert.match(source, /runSportMutation|canAccess\("AUT-SPT", "WRITE"\)/)
})

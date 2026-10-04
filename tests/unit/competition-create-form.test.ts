import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { competitionFormError, scopeForCompetitionType } from "../../lib/competitions/form-validation.ts"

const types = [{ id: "JEUX", label: "Jeux", scope: "MULTISPORTS" }, { id: "MATCH", label: "Match", scope: "MONOSPORT" }]
const levels = [{ id: "INT", label: "International" }]
const statuses = [{ id: "PLANIFIEE", label: "Planifiée" }]
const valid = { nom_competition: "Jeux 2028", id_type_competition: "JEUX", est_multisport: "OUI", niveau_competition: "INT", date_debut: "2028-07-14", date_fin: "2028-07-30", statut: "PLANIFIEE" }

test("le volet de création bloque les données obligatoires avant l'appel API", () => {
  assert.equal(competitionFormError({ ...valid, nom_competition: "" }, types, levels, statuses), "Le nom de la compétition est obligatoire.")
  assert.equal(competitionFormError({ ...valid, niveau_competition: "" }, types, levels, statuses), "Sélectionnez un niveau de compétition.")
  assert.equal(competitionFormError({ ...valid, date_debut: "" }, types, levels, statuses), "La date de la cérémonie d’ouverture est obligatoire.")
  assert.equal(competitionFormError(valid, types, levels, statuses), null)
})

test("la portée suit le type de compétition choisi", () => {
  assert.equal(scopeForCompetitionType("JEUX", types), "OUI")
  assert.equal(scopeForCompetitionType("MATCH", types), "NON")
  assert.equal(competitionFormError({ ...valid, est_multisport: "NON" }, types, levels, statuses), "Ce type de compétition doit être multisport.")
})

test("la date de fin est bornée et le client revérifie avant fetch", async () => {
  const [formSource, clientSource] = await Promise.all([
    readFile(new URL("../../components/dashboard/competition-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/dashboard/competitions/competitions-client.tsx", import.meta.url), "utf8"),
  ])

  assert.match(formSource, /min=\{value\.date_debut \|\| undefined\}/)
  assert.doesNotMatch(formSource, /"edition"/)
  assert.doesNotMatch(formSource, />Édition</)
  assert.match(clientSource, /const validationError=competitionFormError\(form,types,levels,statuses\)/)
  assert.match(clientSource, /if\(validationError\)\{toast\.error\(validationError\);return\}/)
})

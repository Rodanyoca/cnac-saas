import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("les participants référencent une relation entité-activité sans rôle libre", async () => {
  const types = await source("lib/activites/types.ts")
  const data = await source("lib/activites/data.ts")
  assert.match(types, /"id_activite_entite", "observation"/)
  assert.doesNotMatch(types, /role_activite|statut_participation|id_entite_representee/)
  assert.match(data, /L’entité sélectionnée n’est pas rattachée à cette activité/)
  assert.match(data, /Ce participant est déjà enregistré dans cette activité/)
})

test("les rôles d’entité viennent du référentiel et les suppressions utilisées sont refusées", async () => {
  const data = await source("lib/activites/data.ts")
  assert.match(data, /"ROLES_ENTITE_ACTIVITE","TYPES_ACTEURS"/)
  assert.match(data, /Rôle d’entité inconnu/)
  assert.match(data, /des participants lui sont rattachés/)
  assert.match(data, /ensureOrganizerRelation/)
  assert.match(data, /L’entité organisatrice ne peut pas être retirée/)
})

test("la fiche actualise localement les entités, participants et compteurs", async () => {
  const detail = await source("app/dashboard/activites/[id]/activite-detail-client.tsx")
  assert.match(detail, /setEntities\(current=>/)
  assert.match(detail, /setParticipants\(current=>/)
  assert.match(detail, /participantCount\(row\.id_activite_entite\)/)
  assert.match(detail, /sortedEntities\.map/)
  assert.match(detail, /leftOrganizer!==rightOrganizer/)
  assert.match(detail, /sortedParticipants\.map/)
  assert.match(detail, /setDisplayActorNames\(current=>/)
  assert.match(detail, /<TableHead>Observation<\/TableHead>/)
  assert.match(detail, /row\.observation\|\|"—"/)
  assert.match(detail, /Ajoutez d’abord une entité à cette activité/)
  assert.doesNotMatch(detail, /overflow-x-auto/)
  assert.doesNotMatch(detail, /Rôle du participant|Statut de participation/)
})

test("les commandes d’écriture de la fiche sont masquées pour un viewer", async () => {
  const page = await source("app/dashboard/activites/[id]/page.tsx")
  const detail = await source("app/dashboard/activites/[id]/activite-detail-client.tsx")
  assert.match(page, /canAccess\("AUT-ADM", "WRITE"\)/)
  assert.match(detail, /canEdit&&/)
})

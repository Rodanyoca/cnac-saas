import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("les engagements et résultats de compétition sont affichés en tableaux", async () => {
  for (const path of [
    "../../components/dashboard/campaign-engagements.tsx",
    "../../components/dashboard/competition-results.tsx",
  ]) {
    const source = await readFile(new URL(path, import.meta.url), "utf8")
    assert.match(source, /<Table>/)
    assert.doesNotMatch(source, /rows\.map\(\(row\)=>\s*<Card/)
  }
})

test("les engagements de la fiche équipe nationale sont affichés en tableau", async () => {
  const source = await readFile(
    new URL("../../app/dashboard/equipes-nationales/[id]/team-detail-client.tsx", import.meta.url),
    "utf8",
  )
  const start = source.indexOf('<TabsContent value="competitions">')
  const end = source.indexOf('<TabsContent value="documents">', start)
  const section = source.slice(start, end)
  assert.match(section, /<Table>/)
  assert.doesNotMatch(section, /<article/)
})

test("les tableaux internes n’exposent aucune colonne ni commande d’action", async () => {
  const internalFiles = [
    "../../components/dashboard/campaign-engagements.tsx",
    "../../components/dashboard/competition-results.tsx",
    "../../components/dashboard/campaign-selections.tsx",
  ]
  for (const path of internalFiles) {
    const source = await readFile(new URL(path, import.meta.url), "utf8")
    assert.doesNotMatch(source, /<TableHead[^>]*(?:Actions|w-14|w-24)/)
    assert.doesNotMatch(source, /aria-label="(?:Corriger|Modifier l’engagement|Voir l’équipe)"/)
  }

  const teamDetail = await readFile(
    new URL("../../app/dashboard/equipes-nationales/[id]/team-detail-client.tsx", import.meta.url),
    "utf8",
  )
  assert.doesNotMatch(teamDetail, /editMember/)
  assert.doesNotMatch(teamDetail, /title="Ouvrir la compétition"/)
})

test("les listes principales conservent seules l’accès aux fiches détaillées", async () => {
  const competitionList = await readFile(
    new URL("../../app/dashboard/competitions/competitions-client.tsx", import.meta.url),
    "utf8",
  )
  const teamList = await readFile(
    new URL("../../app/dashboard/equipes-nationales/teams-client.tsx", import.meta.url),
    "utf8",
  )
  assert.match(competitionList, /Voir les détails/)
  assert.match(teamList, /Ouvrir la fiche/)
})

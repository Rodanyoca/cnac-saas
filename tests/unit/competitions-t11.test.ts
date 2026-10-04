import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = (path: string) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("T11: la liste des compétitions est responsive, filtrable et paginée", async () => {
  const code = await source("app/dashboard/competitions/competitions-client.tsx")
  assert.match(code, /aria-label="Rechercher une compétition"/)
  assert.match(code, /Filtrer par statut/)
  assert.match(code, /Début à partir du/)
  assert.match(code, /Fin jusqu’au/)
  assert.match(code, /<TableHead>Année<\/TableHead>/)
  assert.match(code, /<TableHead>Début<\/TableHead>/)
  assert.match(code, /<TableHead>Fin<\/TableHead>/)
  assert.doesNotMatch(code, /<TableHead>Édition<\/TableHead>/)
  assert.match(code, /\[10, 20, 50\]/)
  assert.match(code, /hidden lg:block/)
  assert.match(code, /lg:hidden/)
  assert.doesNotMatch(code, /overflow-x-auto/)
})

test("T11: la liste des équipes nationales réduit ses colonnes sur mobile", async () => {
  const code = await source("app/dashboard/equipes-nationales/teams-client.tsx")
  assert.match(code, /aria-label="Rechercher une équipe nationale"/)
  assert.match(code, /\[10, 20, 50\]/)
  assert.match(code, /hidden lg:block/)
  assert.match(code, /lg:hidden/)
  assert.match(code, /Aucune équipe nationale enregistrée/)
  assert.doesNotMatch(code, /overflow-x-auto/)
  assert.match(code, /Filtrer par statut/)
  assert.match(code, /Filtrer par \$\{label\.toLocaleLowerCase/)
  for (const obsolete of ["<Filter label=\"Sport\"", "<Filter label=\"Discipline\"", "<Filter label=\"Catégorie\"", "<Filter label=\"Sexe\""]) assert.doesNotMatch(code, new RegExp(obsolete))
})

test("T11: la fiche équipe navigue par programme et engagement, jamais par participation directe", async () => {
  const page = await source("app/dashboard/equipes-nationales/[id]/page.tsx")
  const detail = await source("app/dashboard/equipes-nationales/[id]/team-detail-client.tsx")
  assert.match(page, /getCompetitionPrograms/)
  assert.doesNotMatch(page, /getTeamParticipations/)
  assert.match(detail, /engagements\.map/)
  assert.match(detail, /id_programme_competition/)
  assert.match(detail, /Engagements dans les programmes/)
  assert.doesNotMatch(detail, /href=\{`\/dashboard\/competitions\//)
})

test("T11: les erreurs secondaires des détails restent isolées", async () => {
  const competitionPage = await source("app/dashboard/competitions/[id]/page.tsx")
  const competitionDetail = await source("app/dashboard/competitions/[id]/competition-detail-client.tsx")
  const teamPage = await source("app/dashboard/equipes-nationales/[id]/page.tsx")
  assert.match(competitionPage, /Promise\.allSettled/)
  for (const name of ["programsError", "engagementsError", "participationsError", "resultsError", "documentsError"]) assert.match(competitionDetail, new RegExp(name))
  for (const name of ["campaignsError", "selectionsError", "membersError", "engagementsError", "documentsError"]) assert.match(teamPage, new RegExp(name))
  assert.match(competitionDetail, /Les autres sections restent disponibles/)
})

test("T11: les vues qualifient les valeurs et relations absentes", async () => {
  const competitionList = await source("app/dashboard/competitions/competitions-client.tsx")
  const teamList = await source("app/dashboard/equipes-nationales/teams-client.tsx")
  const teamDetail = await source("app/dashboard/equipes-nationales/[id]/team-detail-client.tsx")
  assert.match(competitionList, /Non renseigné/)
  assert.match(teamList, /Non renseigné/)
  assert.match(teamDetail, /Compétition inconnue/)
  assert.match(teamDetail, /programDiscipline\(program\)/)
  assert.match(teamDetail, /<TableHead className="hidden md:table-cell">Discipline<\/TableHead>/)
  assert.doesNotMatch(teamDetail, /program\?\.id_programme_competition \|\| engagement\.id_programme_competition/)
})

test("T11: chaque engagement résout sa discipline depuis l’épreuve de son programme", async () => {
  const data = await source("lib/equipes-nationales/data.ts")
  const detail = await source("app/dashboard/equipes-nationales/[id]/team-detail-client.tsx")
  assert.match(data, /"EPREUVES"/)
  assert.match(data, /disciplineId: row\.id_discipline/)
  assert.match(detail, /event\.id === program\?\.id_epreuve/)
  assert.match(detail, /discipline\.id === disciplineId/)
})

import "server-only"

import { getSheetsRows } from "@/lib/google/sheets"
import { getReferentialSpreadsheetId } from "@/lib/federations/config"
import { getCompetitionsSpreadsheetId } from "@/lib/competitions/config"
import { getNationalTeamsSpreadsheetId } from "@/lib/equipes-nationales/config"
import { mapV1Row, type V1SheetName } from "@/lib/competitions/v1-model"
import { projectAthleteSportHistory } from "./sport-history"

export async function getAthleteSportHistory(athleteId: string) {
  const competitionSheets = ["COMPETITIONS", "PROGRAMMES_COMPETITION", "ENGAGEMENTS_CAMPAGNES_PROGRAMMES", "PARTICIPATIONS_ACTEURS_COMPETITION"] as const
  const teamSheets = ["EQUIPES_NATIONALES", "CAMPAGNES_EQUIPES_NATIONALES", "SELECTIONS_ATHLETES"] as const
  const [competitionRows, teamRows, references] = await Promise.all([
    getSheetsRows({ sheetNames: [...competitionSheets], spreadsheetId: getCompetitionsSpreadsheetId() }),
    getSheetsRows({ sheetNames: [...teamSheets], spreadsheetId: getNationalTeamsSpreadsheetId() }),
    getSheetsRows({ sheetNames: ["STATUTS_SELECTION", "STATUTS_PARTICIPATION_ATHLETE", "EPREUVES", "DISCIPLINES"], spreadsheetId: getReferentialSpreadsheetId() }),
  ])
  const rawGraph = { ...competitionRows, ...teamRows }
  const graph = Object.fromEntries(Object.entries(rawGraph).map(([sheet, rows]) => [sheet, rows.map((row) => mapV1Row(sheet as V1SheetName, row))])) as Parameters<typeof projectAthleteSportHistory>[1]
  return projectAthleteSportHistory(athleteId, graph, {
    selections: new Map(references.STATUTS_SELECTION.map((row) => [row.id_statut_selection, row.nom_statut_selection || row.id_statut_selection])),
    participations: new Map(references.STATUTS_PARTICIPATION_ATHLETE.map((row) => [row.id_statut_participation, row.nom_statut_participation || row.id_statut_participation])),
    eventDisciplineIds: new Map(references.EPREUVES.map((row) => [row.id_epreuve, row.id_discipline])),
    disciplines: new Map(references.DISCIPLINES.map((row) => [row.id_discipline, row.nom_discipline || row.id_discipline])),
  })
}

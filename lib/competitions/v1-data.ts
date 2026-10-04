import "server-only"

import { appendSheetRow, getSheetHeaders, getSheetRows, getSheetsRows, updateSheetCells } from "@/lib/google/sheets"
import { getCompetitionsSpreadsheetId } from "./config"
import { getNationalTeamsSpreadsheetId } from "@/lib/equipes-nationales/config"
import { V1_HEADERS, mapV1Row, missingHeaders, validateV1Relations, type V1Row, type V1SheetName } from "./v1-model"

const competitionSheets = new Set<V1SheetName>(["COMPETITIONS", "PROGRAMMES_COMPETITION", "ENGAGEMENTS_CAMPAGNES_PROGRAMMES", "PARTICIPATIONS_ACTEURS_COMPETITION", "UNITES_PARTICIPANTES", "MEMBRES_UNITES_PARTICIPANTES", "RESULTATS", "MEDAILLES"])
const teamSheets = new Set<V1SheetName>(["EQUIPES_NATIONALES", "CAMPAGNES_EQUIPES_NATIONALES", "SELECTIONS_ATHLETES", "AFFECTATIONS_STAFF"])

const cell = (row: object, column: string) => (row as Record<string, string>)[column] || ""

export class CompetitionSchemaError extends Error {
  constructor(public sheet: string, public missing: string[]) { super(`${sheet} : colonnes manquantes : ${missing.join(", ")}`); this.name = "CompetitionSchemaError" }
}

function spreadsheetFor(sheet: V1SheetName) {
  if (competitionSheets.has(sheet)) return getCompetitionsSpreadsheetId()
  if (teamSheets.has(sheet)) return getNationalTeamsSpreadsheetId()
  throw new Error(`Feuille V1 non routée : ${sheet}`)
}

export async function readV1Sheet<N extends V1SheetName>(sheet: N, options: { fresh?: boolean } = {}): Promise<V1Row<N>[]> {
  const spreadsheetId = spreadsheetFor(sheet)
  const actual = await getSheetHeaders({ sheetName: sheet, spreadsheetId, bypassCache: options.fresh })
  const missing = missingHeaders(sheet, actual)
  if (missing.length) throw new CompetitionSchemaError(sheet, [...missing])
  return (await getSheetRows({ sheetName: sheet, spreadsheetId, bypassCache: options.fresh })).map((row) => mapV1Row(sheet, row)).filter((row) => cell(row, V1_HEADERS[sheet][0]))
}

export async function readCompetitionGraph(options: { fresh?: boolean } = {}) {
  const competitionNames = [...competitionSheets]
  const teamNames = [...teamSheets]
  const [competitionRows, teamRows] = options.fresh
    ? await Promise.all([
      Promise.all(competitionNames.map(async (name) => [name, await readV1Sheet(name, { fresh: true })] as const)).then(Object.fromEntries),
      Promise.all(teamNames.map(async (name) => [name, await readV1Sheet(name, { fresh: true })] as const)).then(Object.fromEntries),
    ])
    : await Promise.all([
      getSheetsRows({ sheetNames: competitionNames, spreadsheetId: getCompetitionsSpreadsheetId() }),
      getSheetsRows({ sheetNames: teamNames, spreadsheetId: getNationalTeamsSpreadsheetId() }),
    ])
  const rows = Object.fromEntries(Object.entries({ ...competitionRows, ...teamRows }).map(([name, values]) => [name, (values as Record<string, string>[]).map((row) => mapV1Row(name as V1SheetName, row))])) as Record<V1SheetName, V1Row<V1SheetName>[]>
  validateV1Relations({ programs: rows.PROGRAMMES_COMPETITION, campaigns: rows.CAMPAGNES_EQUIPES_NATIONALES, engagements: rows.ENGAGEMENTS_CAMPAGNES_PROGRAMMES, selections: rows.SELECTIONS_ATHLETES, participations: rows.PARTICIPATIONS_ACTEURS_COMPETITION, results: rows.RESULTATS })
  return rows
}

export async function createV1Row<N extends V1SheetName>(sheet: N, row: V1Row<N>): Promise<V1Row<N>> {
  const idColumn = V1_HEADERS[sheet][0]
  const idValue = cell(row, idColumn)
  if (!idValue) throw new Error(`${sheet}.${idColumn} est obligatoire.`)
  const before = await readV1Sheet(sheet, { fresh: true })
  const existing = before.find((item) => cell(item, idColumn) === idValue)
  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(row)) return existing
    throw new Error(`${sheet} : l’identifiant ${idValue} existe déjà avec un contenu différent.`)
  }
  await appendSheetRow({ sheetName: sheet, spreadsheetId: spreadsheetFor(sheet), row })
  const confirmed = (await readV1Sheet(sheet, { fresh: true })).filter((item) => cell(item, idColumn) === idValue)
  if (confirmed.length !== 1) throw new Error(`${sheet} : écriture non confirmée pour ${idValue}.`)
  return confirmed[0]
}

export async function updateV1Row<N extends V1SheetName>(sheet: N, idValue: string, row: V1Row<N>): Promise<V1Row<N>> {
  const idColumn = V1_HEADERS[sheet][0]
  const current = (await readV1Sheet(sheet, { fresh: true })).find((item) => cell(item, idColumn) === idValue)
  if (!current) throw new Error(`${sheet} : enregistrement ${idValue} introuvable.`)
  await updateSheetCells({ sheetName: sheet, spreadsheetId: spreadsheetFor(sheet), idColumn, idValue, updates: V1_HEADERS[sheet].slice(1).map((column) => ({ column, value: cell(row, column) })) })
  const confirmed = (await readV1Sheet(sheet, { fresh: true })).filter((item) => cell(item, idColumn) === idValue)
  if (confirmed.length !== 1 || V1_HEADERS[sheet].some((column) => cell(confirmed[0], column) !== cell(row, column))) throw new Error(`${sheet} : modification non confirmée pour ${idValue}.`)
  return confirmed[0]
}

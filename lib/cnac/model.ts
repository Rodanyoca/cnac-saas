import { CNAC_HEADERS, CNAC_KEYS, type CnacSheet } from "./schema.ts"

export class CnacDataError extends Error {
  readonly code: string
  readonly status: number
  constructor(code: string, message: string, status = 400) { super(message); this.code=code;this.status=status }
}

export type SheetRecord = Record<string, string>
export type SheetTable = { headers: string[]; rows: SheetRecord[]; rowNumbers: number[] }

// Colonnes médias déjà présentes : reconnues sans jamais modifier les en-têtes.
const optionalColumns = (sheet: CnacSheet) => sheet === "FEDERATIONS" ? ["logo_drive_id", "logo_drive_url"] : sheet === "SPORTS" ? ["utilise_equipes"] : []

// Les noms historiques restent un contrat UI interne, jamais des colonnes écrites.
export const COLUMN_ALIASES: Record<string,string> = {
  id_ligue_coc: "id_ligue_cnac", id_entente_coc: "id_entente_cnac",
  id_zone_coc: "id_zone_cnac", id_cercle_coc: "id_cercle_cnac", id_club_coc: "id_club_cnac", id_equipe_coc: "id_equipe_cnac",
  id_structure_parent_coc: "id_structure_parent_cnac", id_acteur_coc: "id_acteur_cnac",
  id_athlete_coc: "id_athlete_cnac", id_coach_coc: "id_coach_cnac", id_arbitre_coc: "id_arbitre_cnac",
  id_officiel_coc: "id_officiel_cnac", id_medecin_coc: "id_medecin_cnac", id_autre_acteur_coc: "id_autre_acteur_cnac",
  id_federation_internationale: "id_international", "date_expiration passeport": "date_expiration_passeport",
  "numéro_passeport": "numero_passeport", observation: "observations",
}
export const physicalColumn = (column: string) => COLUMN_ALIASES[column] || column
export const isDateColumn = (column: string) => column.startsWith("date_")

export function civilDate(value: unknown): string {
  if (value === undefined || value === null || value === "") return ""
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 1 || value > 2958465) throw new CnacDataError("DATE_INVALID", "Date Sheets invalide.")
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0,10)
  }
  const raw = String(value).trim()
  if (!raw) return ""
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/) || raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) throw new CnacDataError("DATE_INVALID", `Format de date inconnu : ${raw}.`)
  const [y,m,d] = raw.includes("/") ? [Number(match[3]),Number(match[2]),Number(match[1])] : [Number(match[1]),Number(match[2]),Number(match[3])]
  const date = new Date(Date.UTC(y,m-1,d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m-1 || date.getUTCDate() !== d) throw new CnacDataError("DATE_INVALID", `Date civile invalide : ${raw}.`)
  return `${String(y).padStart(4,"0")}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`
}
export function sheetDate(value: string) { const iso = civilDate(value); return iso ? (Date.parse(iso+"T00:00:00Z")-Date.UTC(1899,11,30))/86400000 : "" }
export function displayCivilDate(value: string) { try { const iso = civilDate(value); return iso ? `${iso.slice(8,10)}/${iso.slice(5,7)}/${iso.slice(0,4)}` : "Non renseigné" } catch { return value } }
export function booleanCell(value: unknown) { return value === true || ["TRUE","VRAI","1"].includes(String(value).trim().toUpperCase()) }

// Le référentiel CNAC global peut ne pas avoir de périmètre par sport/fédération.
const optionalAgeCategoryHeaders = new Set(["id_federation", "id_sport", "id_discipline", "age_min", "age_max", "observations"])
function canonicalSheetColumn(sheet: CnacSheet, column: string): string {
  if (sheet !== "CATEGORIES_AGE") return column
  return column === "âge_min" ? "age_min" : column === "âge_max" ? "age_max" : column
}
export function assertHeaders(sheet: CnacSheet, headers: string[]) {
  const canonicalHeaders = headers.map(column => canonicalSheetColumn(sheet, column))
  const missing = CNAC_HEADERS[sheet].filter(column => !(sheet === "CATEGORIES_AGE" && optionalAgeCategoryHeaders.has(column)) && !(sheet === "CLUBS" && column === "id_categorie_club") && !canonicalHeaders.includes(column))
  if (missing.length) throw new CnacDataError("MAPPING_COLUMNS", `Colonnes absentes dans ${sheet} : ${missing.join(", ")}.`, 502)
  if (sheet === "LOCALISATION" && (canonicalHeaders.length !== 8 || CNAC_HEADERS.LOCALISATION.some((column, index) => canonicalHeaders[index] !== column))) throw new CnacDataError("MAPPING_COLUMNS", "Ordre des colonnes incompatible dans LOCALISATION (A:H).", 502)
  if (sheet === "ATHLETES" && CNAC_HEADERS.ATHLETES.some((column, index) => canonicalHeaders[index] !== column)) throw new CnacDataError("MAPPING_COLUMNS", "Ordre des colonnes incompatible dans ATHLETES (A:S).", 502)
  const populated = canonicalHeaders.filter(Boolean)
  if (new Set(populated).size !== populated.length) throw new CnacDataError("MAPPING_DUPLICATES", `En-têtes dupliqués dans ${sheet}.`, 502)
}
export function parseTable(sheet: CnacSheet, values: unknown[][]): SheetTable {
  const headers = (values[0] || []).map(value => String(value ?? "").trim())
  assertHeaders(sheet,headers)
  const supportedColumns = new Set<string>([...CNAC_HEADERS[sheet], ...optionalColumns(sheet)])
  const rowNumbers: number[] = []
  const rows = values.slice(1).flatMap((cells,offset) => {
    const row: SheetRecord = {}
    headers.forEach((physical,index) => { const column = canonicalSheetColumn(sheet, physical); if (supportedColumns.has(column)) row[column] = String(cells[index] ?? "").trim() })
    if (!row[CNAC_KEYS[sheet]]) return []
    if(headers.includes("est_contact_principal"))row.est_contact_principal=booleanCell(cells[headers.indexOf("est_contact_principal")])?"TRUE":"FALSE"
    rowNumbers.push(offset+2)
    // Une date historique inconnue reste visible; elle n'est pas remplacée par une autre date.
    headers.filter(column => supportedColumns.has(column) && isDateColumn(column)).forEach(column => { try { row[column] = civilDate(cells[headers.indexOf(column)]) } catch { /* conserver la valeur pour diagnostic */ } })
    Object.entries(COLUMN_ALIASES).forEach(([legacy,physical]) => { if (physical in row) row[legacy] = row[physical] })
    return [row]
  })
  return { headers, rows, rowNumbers }
}

export function updateCells(table: SheetTable, sheet: CnacSheet, idColumn: string, id: string, updates: {column:string;value:string}[]) {
  const physicalId = physicalColumn(idColumn)
  if (physicalId !== CNAC_KEYS[sheet]) throw new CnacDataError("IDENTITY_COLUMN", "Colonne d’identification incompatible.")
  const positions = table.rows.map((row,index) => row[physicalId] === id ? index : -1).filter(index => index >= 0)
  if (!positions.length) throw new CnacDataError("NOT_FOUND", "Fiche introuvable.",404)
  if (positions.length !== 1) throw new CnacDataError("DUPLICATE_ID", "Identifiant dupliqué : écriture refusée.",409)
  const supportedColumns = new Set<string>([...CNAC_HEADERS[sheet], ...optionalColumns(sheet)])
  return updates.map(update => {
    const column = physicalColumn(update.column), index = table.headers.findIndex(header => canonicalSheetColumn(sheet, header) === column)
    if (index < 0 || !supportedColumns.has(column)) throw new CnacDataError("MAPPING_COLUMNS", `Colonne absente du schéma CNAC : ${column}.`,502)
    if (column === physicalId) throw new CnacDataError("IMMUTABLE_ID", "L’identifiant interne est immuable.")
    return { rowNumber:table.rowNumbers[positions[0]], columnIndex:index, value:isDateColumn(column) ? sheetDate(update.value) : column === "est_contact_principal" ? booleanCell(update.value) : update.value }
  })
}

export function appendValues(table: SheetTable, sheet: CnacSheet, input: SheetRecord) {
  const row = Object.fromEntries(Object.entries(input).map(([key, value]) => [physicalColumn(key), value]))
  if (!row[CNAC_KEYS[sheet]]) throw new CnacDataError("MISSING_ID", "Identifiant interne obligatoire.")
  if (table.rows.some(item => item[CNAC_KEYS[sheet]] === row[CNAC_KEYS[sheet]])) throw new CnacDataError("DUPLICATE_ID", "Identifiant déjà utilisé.", 409)
  const supportedColumns = new Set<string>([...CNAC_HEADERS[sheet], ...optionalColumns(sheet)])
  Object.keys(row).forEach(column => {
    if (!table.headers.some(header => canonicalSheetColumn(sheet, header) === column) || !supportedColumns.has(column)) throw new CnacDataError("MAPPING_COLUMNS", `Colonne absente du schéma CNAC ou du classeur : ${column}.`, 502)
  })
  assertHeaders(sheet, table.headers)
  // Borner les écritures aux colonnes physiques du contrat.
  const bounded = sheet === "ATHLETES" || sheet === "ZONES" || sheet === "ENTENTES" || sheet === "EQUIPES" || sheet === "LOCALISATION"
  const headers = bounded ? [...CNAC_HEADERS[sheet]] : table.headers
  if (bounded && headers.some((column, index) => table.headers[index] !== column)) {
    throw new CnacDataError("MAPPING_COLUMNS", `Ordre des colonnes incompatible dans ${sheet}.`, 502)
  }
  return headers.map(physical => { const column = canonicalSheetColumn(sheet, physical); return isDateColumn(column) ? sheetDate(row[column] || "") : column === "est_contact_principal" ? booleanCell(row[column]) : row[column] || "" })
}

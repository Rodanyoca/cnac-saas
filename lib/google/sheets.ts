import "server-only"

import { sheets as createSheets, auth as googleAuth } from "googleapis/build/src/apis/sheets"
import { runGoogleRequest } from "./request"

// --- In-memory cache to avoid Google Sheets API quota limits ---
const CACHE_TTL_MS = Number.parseInt(process.env.GOOGLE_SHEETS_CACHE_TTL_MS ?? "300000", 10)
type SheetCache = Map<string, { data: Record<string, string>[]; ts: number }>
type HeaderCache = Map<string, { data: string[]; ts: number }>
type PendingSheetReads = Map<string, Promise<Record<string, string>[]>>
type GoogleAuthClient = InstanceType<typeof googleAuth.JWT> | InstanceType<typeof googleAuth.OAuth2>

// Next.js peut charger ce module dans plusieurs bundles serveur distincts.
// Un cache global garantit qu'une écriture invalide aussi les lectures des pages.
const sheetsGlobal = globalThis as typeof globalThis & {
  __cocGoogleSheetsCache?: SheetCache
  __cocGoogleSheetsHeaderCache?: HeaderCache
  __cocGoogleSheetsPendingReads?: PendingSheetReads
  __cocGoogleAuthClients?: Map<string, GoogleAuthClient>
  __cocSheetsReadGate?: { active:number; queue:Array<()=>void>; total:number; maxActive:number }
}
const cache = sheetsGlobal.__cocGoogleSheetsCache ??= new Map()
const headerCache = sheetsGlobal.__cocGoogleSheetsHeaderCache ??= new Map()
const pendingReads = sheetsGlobal.__cocGoogleSheetsPendingReads ??= new Map()
const authClients = sheetsGlobal.__cocGoogleAuthClients ??= new Map()
const readGate = sheetsGlobal.__cocSheetsReadGate ??= {active:0,queue:[],total:0,maxActive:0}
const MAX_CONCURRENT_SHEETS_READS=6
const SHEETS_TIMEOUT_MS = Number.parseInt(process.env.GOOGLE_SHEETS_TIMEOUT_MS ?? "20000", 10)

async function withSheetsReadPermit<T>(task:()=>Promise<T>):Promise<T>{
 if(readGate.active>=MAX_CONCURRENT_SHEETS_READS)await new Promise<void>(resolve=>readGate.queue.push(resolve))
 readGate.active+=1;readGate.total+=1;readGate.maxActive=Math.max(readGate.maxActive,readGate.active)
 try{return await task()}finally{readGate.active-=1;readGate.queue.shift()?.()}
}

function withSheetsTimeout<T>(task: () => Promise<T>) {
  return runGoogleRequest(task, { timeoutMs: SHEETS_TIMEOUT_MS })
}

export function getSheetsRuntimeMetrics(){return{totalReads:readGate.total,activeReads:readGate.active,maxConcurrentReads:readGate.maxActive,limit:MAX_CONCURRENT_SHEETS_READS}}

function getCached(key: string, ttlMs = CACHE_TTL_MS): Record<string, string>[] | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttlMs) return null
  return entry.data
}

function setCache(key: string, data: Record<string, string>[]) {
  cache.set(key, { data, ts: Date.now() })
}

export function clearSheetCache() {
  cache.clear()
  headerCache.clear()
  pendingReads.clear()
}

function getPrivateKey() {
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!key) return ""
  return key.replace(/\\n/g, "\n")
}

function isScopedCnacWorkbook(id: string) {
  return [process.env.GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID,process.env.GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID,process.env.GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID].some(value=>value && value===id)
}
function getSheetCredentials(spreadsheetId: string) {
  if (isScopedCnacWorkbook(spreadsheetId)) throw new Error("Ce classeur CNAC exige le service dédié aux blocs Acteurs et Structure territoriale.")
  if (!spreadsheetId?.trim()) throw new Error("Identifiant du classeur Google Sheets manquant.")
  return { spreadsheetId }
}

function getGoogleAuth(scopes: string[]) {
  const credentialKind = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && getPrivateKey() ? "service-account" : "oauth"
  const cacheKey = `${credentialKind}:${[...scopes].sort().join(",")}`
  const cached = authClients.get(cacheKey)
  if (cached) return cached
  // Les classeurs sont partagés avec le compte de service. Il doit être
  // prioritaire pour Sheets ; le jeton OAuth est principalement utilisé par
  // Drive et peut ne pas avoir accès aux mêmes classeurs.
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = getPrivateKey()
  if (email && key) {
    const auth = new googleAuth.JWT({ email, key, scopes })
    authClients.set(cacheKey, auth)
    return auth
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  if (clientId && clientSecret && refreshToken) {
    const auth = new googleAuth.OAuth2(clientId, clientSecret)
    auth.setCredentials({ refresh_token: refreshToken })
    authClients.set(cacheKey, auth)
    return auth
  }
  throw new Error("Identifiants Google Sheets manquants")
}

function valuesToRecords(values: unknown[][]): Record<string, string>[] {
  if (values.length === 0) return []
  const [headers, ...rows] = values
  const normalizedHeaders = (headers ?? []).map((header) => String(header ?? "").trim())
  return rows.map((row) => Object.fromEntries(
    normalizedHeaders.map((header, index) => [header, row?.[index] === undefined ? "" : String(row[index])])
  ))
}

export async function getSheetRows(params: {
  sheetName: string
  range?: string
  spreadsheetId: string
  bypassCache?: boolean
  cacheTtlMs?: number
}): Promise<Record<string, string>[]> {
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)
  const safeSheetName = String(params.sheetName ?? "").replace(/'/g, "''")
  const range = params.range ?? `'${safeSheetName}'!A:Z`

  // Check cache first
  const cacheKey = `${spreadsheetId}:${range}`
  if (!params.bypassCache) {
    const cached = getCached(cacheKey, params.cacheTtlMs)
    if (cached) return cached
    const pending = pendingReads.get(cacheKey)
    if (pending) return pending
  }

  const request = (async () => {
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"])

  const sheets = createSheets({ version: "v4", auth })

  let res
  try {
    res = await withSheetsReadPermit(() => runGoogleRequest(
      () => sheets.spreadsheets.values.get({ spreadsheetId, range }, { timeout: SHEETS_TIMEOUT_MS }),
      { timeoutMs: SHEETS_TIMEOUT_MS },
    ))
  } catch (err) {
    // En cas de quota temporairement dépassé, une ancienne valeur vaut mieux
    // qu'une page entièrement indisponible.
    const stale = !params.bypassCache ? cache.get(cacheKey)?.data : undefined
    if (stale) return stale
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed to read Google Sheet (spreadsheetId=${spreadsheetId}, range=${range}): ${message}`
    )
  }

  const values: unknown[][] = (res?.data?.values ?? []) as unknown[][]
  const result = valuesToRecords(values)

  // Les lectures explicitement fraîches ne doivent ni lire ni alimenter le cache.
  if (!params.bypassCache) {
    setCache(cacheKey, result)
    if (!params.range) {
      const headers = (values[0] ?? []).map((header) => String(header ?? "").trim()).filter(Boolean)
      const headerCacheKey = `${spreadsheetId}:'${safeSheetName}'!1:1`
      headerCache.set(headerCacheKey, { data: headers, ts: Date.now() })
    }
  }

  return result
  })()

  if (params.bypassCache) return request
  pendingReads.set(cacheKey, request)
  try {
    return await request
  } finally {
    if (pendingReads.get(cacheKey) === request) pendingReads.delete(cacheKey)
  }
}

export async function getSheetHeaders(params: {
  sheetName: string
  spreadsheetId: string
  bypassCache?: boolean
  cacheTtlMs?: number
}): Promise<string[]> {
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)
  const safeSheetName = String(params.sheetName).replace(/'/g, "''")
  const cacheKey = `${spreadsheetId}:'${safeSheetName}'!1:1`
  const cached = params.bypassCache ? undefined : headerCache.get(cacheKey)
  if (cached && Date.now() - cached.ts <= (params.cacheTtlMs ?? CACHE_TTL_MS)) return cached.data
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"])
  const sheets = createSheets({ version: "v4", auth })
  try {
    const result = await withSheetsReadPermit(() => withSheetsTimeout(() => sheets.spreadsheets.values.get({ spreadsheetId, range: `'${safeSheetName}'!1:1` })))
    const headers = (result.data.values?.[0] ?? []).map((header: unknown) => String(header ?? "").trim()).filter(Boolean)
    if (!params.bypassCache) headerCache.set(cacheKey, { data: headers, ts: Date.now() })
    return headers
  } catch (error) {
    if (cached) return cached.data
    throw error
  }
}

export async function getSheetsRows(params: {
  sheetNames: string[]
  spreadsheetId: string
  cacheTtlMs?: number
  bypassCache?: boolean
}): Promise<Record<string, Record<string, string>[]>> {
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)
  const cachedResult: Record<string, Record<string, string>[]> = {}
  const allCached = !params.bypassCache && params.sheetNames.every((sheetName) => {
    const rows = getCached(`${spreadsheetId}:'${sheetName.replace(/'/g, "''")}'!A:Z`, params.cacheTtlMs)
    if (rows) cachedResult[sheetName] = rows
    return Boolean(rows)
  })
  if (allCached) return cachedResult
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"])
  const sheets = createSheets({ version: "v4", auth })
  const ranges = params.sheetNames.map((sheetName) => `'${sheetName.replace(/'/g, "''")}'!A:Z`)
  let response
  try {
    response = await withSheetsReadPermit(() => withSheetsTimeout(() => sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges })))
  } catch (error) {
    const staleResult: Record<string, Record<string, string>[]> = {}
    const hasCompleteStaleSnapshot = params.sheetNames.every((sheetName, index) => {
      const stale = cache.get(`${spreadsheetId}:${ranges[index]}`)?.data
      if (stale) staleResult[sheetName] = stale
      return Boolean(stale)
    })
    if (hasCompleteStaleSnapshot) return staleResult
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read Google Sheets batch (spreadsheetId=${spreadsheetId}): ${message}`)
  }
  const result: Record<string, Record<string, string>[]> = {}
  params.sheetNames.forEach((sheetName, index) => {
    const values = (response.data.valueRanges?.[index]?.values ?? []) as unknown[][]
    result[sheetName] = valuesToRecords(values)
    if (!params.bypassCache) setCache(`${spreadsheetId}:${ranges[index]}`, result[sheetName])
    const headers = (values[0] ?? []).map((header) => String(header ?? "").trim()).filter(Boolean)
    if (!params.bypassCache) headerCache.set(`${spreadsheetId}:'${sheetName.replace(/'/g, "''")}'!1:1`, { data: headers, ts: Date.now() })
  })
  return result
}

export async function getSheetsTables(params: { sheetNames: string[]; spreadsheetId: string }) {
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets.readonly"])
  const sheets = createSheets({ version: "v4", auth })
  const ranges = params.sheetNames.map((sheetName) => `'${sheetName.replace(/'/g, "''")}'!A:Z`)
  const response = await withSheetsReadPermit(() => withSheetsTimeout(() => sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges })))
  return Object.fromEntries(params.sheetNames.map((sheetName, index) => {
    const values = (response.data.valueRanges?.[index]?.values ?? []) as unknown[][]
    const headers = (values[0] ?? []).map((header) => String(header ?? "").trim())
    return [sheetName, { headers, rows: valuesToRecords(values) }]
  })) as Record<string, { headers: string[]; rows: Record<string, string>[] }>
}

export async function updateSheetCell(params: {
  sheetName: string
  idColumn: string
  idValue: string
  targetColumn: string
  value: string
  spreadsheetId: string
}): Promise<void> {
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)

  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"])

  const sheets = createSheets({ version: "v4", auth })
  const safeSheetName = String(params.sheetName ?? "").replace(/'/g, "''")
  const range = `'${safeSheetName}'!A:Z`

  const res = await runGoogleRequest(() => sheets.spreadsheets.values.get({ spreadsheetId, range }))
  const values: unknown[][] = (res?.data?.values ?? []) as unknown[][]
  if (values.length === 0) throw new Error("Sheet is empty")

  const headers = (values[0] ?? []).map((h: unknown) => String(h ?? "").trim())
  const idColIdx = headers.indexOf(params.idColumn)
  const targetColIdx = headers.indexOf(params.targetColumn)

  if (idColIdx === -1) throw new Error(`Column "${params.idColumn}" not found in sheet "${params.sheetName}"`)
  if (targetColIdx === -1) throw new Error(`Column "${params.targetColumn}" not found in sheet "${params.sheetName}"`)

  let rowIndex = -1
  for (let i = 1; i < values.length; i++) {
    const cellValue = String(values[i]?.[idColIdx] ?? "").trim()
    if (cellValue === params.idValue) {
      rowIndex = i
      break
    }
  }

  if (rowIndex === -1) throw new Error(`Row with ${params.idColumn}="${params.idValue}" not found`)

  const colLetter = String.fromCharCode(65 + targetColIdx)
  const cellRange = `'${safeSheetName}'!${colLetter}${rowIndex + 1}`

  await runGoogleRequest(() => sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellRange,
    valueInputOption: "RAW",
    requestBody: { values: [[params.value]] },
  }), { idempotent: false })
}

function columnToLetter(colIdx: number): string {
  if (colIdx < 26) return String.fromCharCode(65 + colIdx)
  return (
    String.fromCharCode(64 + Math.floor(colIdx / 26)) +
    String.fromCharCode(65 + (colIdx % 26))
  )
}

export async function updateSheetCells(params: {
  sheetName: string
  idColumn: string
  idValue: string
  updates: { column: string; value: string }[]
  bypassCache?: boolean
  spreadsheetId: string
}): Promise<void> {
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)

  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"])

  const sheets = createSheets({ version: "v4", auth })
  const safeSheetName = String(params.sheetName ?? "").replace(/'/g, "''")
  const [headers, rows] = await Promise.all([
    getSheetHeaders({ sheetName: params.sheetName, spreadsheetId, bypassCache: params.bypassCache }),
    getSheetRows({ sheetName: params.sheetName, spreadsheetId, bypassCache: params.bypassCache }),
  ])
  if (headers.length === 0) throw new Error("La feuille est vide")
  const idColIdx = headers.indexOf(params.idColumn)
  if (idColIdx === -1) throw new Error(`Colonne "${params.idColumn}" introuvable dans "${params.sheetName}"`)

  const columnIndices: { colIdx: number; value: string }[] = []
  for (const upd of params.updates) {
    const idx = headers.indexOf(upd.column)
    // Les modèles applicatifs peuvent encore contenir des champs historiques.
    // Une modification ne doit envoyer que les colonnes présentes dans la feuille cible.
    if (idx === -1) continue
    columnIndices.push({ colIdx: idx, value: upd.value })
  }

  const recordIndex = rows.findIndex((row) => String(row[params.idColumn] ?? "").trim() === params.idValue)
  if (recordIndex === -1) throw new Error(`Ligne avec ${params.idColumn}="${params.idValue}" introuvable`)
  const rowNumber = recordIndex + 2

  const data = columnIndices.map(({ colIdx, value }) => ({
    range: `'${safeSheetName}'!${columnToLetter(colIdx)}${rowNumber}`,
    values: [[value]],
  }))

  await runGoogleRequest(() => sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data,
    },
  }), { idempotent: false })
  clearSheetCache()
}

export async function appendSheetRow(params: {
  bypassCache?: boolean
  sheetName: string
  row: Record<string, string>
  spreadsheetId: string
}): Promise<void> {
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"])
  const sheets = createSheets({ version: "v4", auth })
  const safeSheetName = params.sheetName.replace(/'/g, "''")
  const headers = await getSheetHeaders({ sheetName: params.sheetName, spreadsheetId, bypassCache: params.bypassCache })
  if (headers.length === 0) throw new Error(`La feuille "${params.sheetName}" ne contient pas d'en-têtes`)
  await runGoogleRequest(() => sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${safeSheetName}'!A:Z`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [headers.map((header) => params.row[header] ?? "")] },
  }), { idempotent: false })
  clearSheetCache()
}

export async function appendSheetRows(params: {
  sheetName: string
  rows: Record<string, string>[]
  spreadsheetId: string
}): Promise<void> {
  if (!params.rows.length) return
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"])
  const sheets = createSheets({ version: "v4", auth })
  const safeSheetName = params.sheetName.replace(/'/g, "''")
  const headers = await getSheetHeaders({ sheetName: params.sheetName, spreadsheetId })
  if (headers.length === 0) throw new Error(`La feuille "${params.sheetName}" ne contient pas d'en-têtes`)
  await runGoogleRequest(() => sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${safeSheetName}'!A:Z`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: params.rows.map((row) => headers.map((header) => row[header] ?? "")) },
  }), { idempotent: false })
  clearSheetCache()
}

export async function deleteSheetRow(params: {
  sheetName: string
  idColumn: string
  idValue: string
  spreadsheetId: string
}): Promise<void> {
  const { spreadsheetId } = getSheetCredentials(params.spreadsheetId)
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/spreadsheets"])
  const sheets = createSheets({ version: "v4", auth })
  const safeSheetName = params.sheetName.replace(/'/g, "''")
  const metadata = await runGoogleRequest(() => sheets.spreadsheets.get({ spreadsheetId }))
  const sheet = metadata.data.sheets?.find((item) => item.properties?.title === params.sheetName)
  const sheetId = sheet?.properties?.sheetId
  if (sheetId === undefined || sheetId === null) throw new Error(`Feuille "${params.sheetName}" introuvable`)
  const valuesResult = await runGoogleRequest(() => sheets.spreadsheets.values.get({ spreadsheetId, range: `'${safeSheetName}'!A:Z` }))
  const values = valuesResult.data.values ?? []
  const headers = (values[0] ?? []).map((header) => String(header ?? "").trim())
  const idIndex = headers.indexOf(params.idColumn)
  if (idIndex < 0) throw new Error(`Colonne "${params.idColumn}" introuvable`)
  const rowIndex = values.findIndex((row, index) => index > 0 && String(row[idIndex] ?? "").trim() === params.idValue)
  if (rowIndex < 1) throw new Error("Enregistrement introuvable")
  await runGoogleRequest(() => sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 } } }] },
  }), { idempotent: false })
  clearSheetCache()
}

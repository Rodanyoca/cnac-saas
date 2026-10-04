import nextEnv from "@next/env"
import { google } from "googleapis"
import { mkdirSync, writeFileSync } from "node:fs"
import { CNAC_GROUPS } from "../lib/cnac/schema.ts"
import { planCnacIdMigration, type IdMigrationCell } from "../lib/cnac/id-migration.ts"

nextEnv.loadEnvConfig(process.cwd())
const apply = process.argv.includes("--apply")
const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), scopes: [`https://www.googleapis.com/auth/spreadsheets${apply ? "" : ".readonly"}`] })
const api = google.sheets({ version: "v4", auth })
type Workbook = { id: string; sheets: string[] }
function letter(index: number) { let text = ""; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) text = String.fromCharCode(65 + (n - 1) % 26) + text; return text }
const quote = (sheet: string) => `'${sheet.replaceAll("'", "''")}'`
const cellRange = (cell: IdMigrationCell) => `${quote(cell.sheet)}!${letter(cell.column)}${cell.row}`

async function main() {
  const workbooks: Workbook[] = []
  const owner = new Map<string, Workbook>()
  for (const group of ["REFERENTIEL", "STRUCTURE_TERRITORIALE", "ACTEURS"] as const) {
    const id = process.env[`GOOGLE_SHEETS_${group}_SPREADSHEET_ID`]
    if (!id || id === "A_COMPLETER" || id === "CNAC-DEMO") throw new Error(`Classeur CNAC ${group} non configuré : inventaire incomplet.`)
    const meta = await api.spreadsheets.get({ spreadsheetId: id, fields: "properties.title,sheets.properties.title" }, { timeout: 20000 })
    if (!/CNAC/i.test(meta.data.properties?.title || "")) throw new Error(`Le classeur ${group} n'est pas identifié CNAC : opération refusée.`)
    const sheets = (meta.data.sheets || []).map(item => item.properties?.title || "").filter(Boolean)
    if (CNAC_GROUPS[group].some(sheet => !sheets.includes(sheet))) throw new Error(`Feuille CNAC requise absente dans ${group}.`)
    const workbook = { id, sheets }
    workbooks.push(workbook)
    for (const sheet of sheets) { if (owner.has(sheet)) throw new Error(`Feuille ambiguë : ${sheet}.`); owner.set(sheet, workbook) }
  }
  const read = async () => {
    const tables: Record<string, unknown[][]> = {}
    for (const workbook of workbooks) {
      const response = await api.spreadsheets.values.batchGet({ spreadsheetId: workbook.id, ranges: workbook.sheets.map(sheet => `${quote(sheet)}!A:ZZ`), valueRenderOption: "FORMULA" }, { timeout: 20000 })
      workbook.sheets.forEach((sheet, index) => { tables[sheet] = response.data.valueRanges?.[index]?.values || [] })
    }
    return tables
  }
  const tables = await read()
  const plan = planCnacIdMigration(tables)
  mkdirSync(".cache", { recursive: true })
  const path = `.cache/cnac-id-migration-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  writeFileSync(path, JSON.stringify({ createdAt: new Date().toISOString(), status: "planned", ...plan }, null, 2))
  console.log(`${plan.mappings.length} identifiants longs ; ${plan.cells.length} cellules à adapter. Plan : ${path}`)
  for (const sheet of Object.keys(CNAC_GROUPS).flatMap(group => CNAC_GROUPS[group as keyof typeof CNAC_GROUPS])) {
    const count = plan.mappings.filter(item => item.sheet === sheet).length
    if (count) console.log(`${sheet} : ${count} identifiants, exemple ${plan.mappings.find(item => item.sheet === sheet)!.after}`)
  }
  if (!apply || !plan.cells.length) return
  const fresh = await read()
  if (JSON.stringify(tables) !== JSON.stringify(fresh)) throw new Error("Les données ont changé pendant la préparation : relancer la migration.")
  const completed: Workbook[] = []
  try {
    for (const workbook of workbooks) {
      const cells = plan.cells.filter(cell => owner.get(cell.sheet) === workbook)
      if (!cells.length) continue
      completed.push(workbook)
      await api.spreadsheets.values.batchUpdate({ spreadsheetId: workbook.id, requestBody: { valueInputOption: "RAW", data: cells.map(cell => ({ range: cellRange(cell), values: [[cell.after]] })) } }, { timeout: 20000 })
    }
    const after = await read()
    for (const cell of plan.cells) if (String(after[cell.sheet][cell.row - 1]?.[cell.column] || "") !== cell.after) throw new Error("Écriture non confirmée : restauration nécessaire.")
    if (planCnacIdMigration(after).mappings.length) throw new Error("La migration reste incomplète.")
    writeFileSync(path, JSON.stringify({ completedAt: new Date().toISOString(), status: "applied", ...plan }, null, 2))
    console.log("Migration appliquée et vérifiée : identifiants et relations mis à jour.")
  } catch (error) {
    // Restaurer uniquement les cellules touchées, jamais des lignes complètes.
    const current = await read()
    for (const workbook of completed.reverse()) {
      const cells = plan.cells.filter(cell => owner.get(cell.sheet) === workbook && String(current[cell.sheet][cell.row - 1]?.[cell.column] || "") === cell.after)
      if (cells.length) await api.spreadsheets.values.batchUpdate({ spreadsheetId: workbook.id, requestBody: { valueInputOption: "RAW", data: cells.map(cell => ({ range: cellRange(cell), values: [[cell.before]] })) } }, { timeout: 20000 })
    }
    writeFileSync(path, JSON.stringify({ status: "rolled-back", ...plan }, null, 2))
    throw error
  }
}
main().catch(error => { console.error("Migration interrompue :", error.response?.status || error.code || error.message); process.exitCode = 1 })

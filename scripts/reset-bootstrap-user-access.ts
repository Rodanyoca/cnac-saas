import { randomUUID } from "node:crypto"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import nextEnv from "@next/env"
import { google } from "googleapis"
import { resetUserAccess } from "../lib/auth/account-workflows.ts"
import { UsersRepository } from "../lib/users/repository.ts"
import { AUDIT_LOG_HEADERS, AUDIT_LOG_SHEET, USER_HEADERS, USERS_SHEET, type SheetRow, type UsersSheetsAdapter } from "../lib/users/types.ts"

nextEnv.loadEnvConfig(process.cwd())
const CONFIRMATION = "REINITIALISER ACCES USR-0001"

function auth(scopes: string[]) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim(), key = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n")
  if (email && key) return new google.auth.JWT({ email, key, scopes })
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim(), clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(), refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim()
  if (clientId && clientSecret && refreshToken) { const oauth = new google.auth.OAuth2(clientId, clientSecret); oauth.setCredentials({ refresh_token: refreshToken }); return oauth }
  throw new Error("Identifiants Google Sheets absents.")
}

function records(values: unknown[][]): SheetRow[] { if (!values.length) return []; const [headers, ...rows] = values; return rows.map((row) => Object.fromEntries(headers.map((header, index) => [String(header ?? "").trim(), String(row[index] ?? "")]))) }

function adapter(): UsersSheetsAdapter {
  const spreadsheetId = process.env.GOOGLE_SHEETS_USERS_SPREADSHEET_ID?.trim()
  if (!spreadsheetId) throw new Error("Classeur USERS non configuré.")
  return {
    async readHeaders(sheetName) { const api = google.sheets({ version: "v4", auth: auth(["https://www.googleapis.com/auth/spreadsheets.readonly"]) }); const result = await api.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName}'!1:1` }); return (result.data.values?.[0] ?? []).map(String).map((value) => value.trim()).filter(Boolean) },
    async readRows(sheetName) { const api = google.sheets({ version: "v4", auth: auth(["https://www.googleapis.com/auth/spreadsheets.readonly"]) }); const result = await api.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName}'!A:Z` }); return records((result.data.values ?? []) as unknown[][]) },
    async updateRow(sheetName, idColumn, idValue, row) { if (sheetName !== USERS_SHEET || idColumn !== "id_user") throw new Error("Mise à jour hors périmètre."); const api = google.sheets({ version: "v4", auth: auth(["https://www.googleapis.com/auth/spreadsheets"]) }); const result = await api.spreadsheets.values.get({ spreadsheetId, range: `'${USERS_SHEET}'!A:M` }), values = result.data.values ?? [], index = values.findIndex((item, rowIndex) => rowIndex > 0 && String(item[0] ?? "") === idValue); if (index < 1) throw new Error("Utilisateur introuvable."); await api.spreadsheets.values.update({ spreadsheetId, range: `'${USERS_SHEET}'!A${index + 1}:M${index + 1}`, valueInputOption: "RAW", requestBody: { values: [USER_HEADERS.map((header) => row[header] ?? "")] } }) },
    async appendRow(sheetName, row) { if (sheetName !== AUDIT_LOG_SHEET) throw new Error("Ajout hors périmètre."); const api = google.sheets({ version: "v4", auth: auth(["https://www.googleapis.com/auth/spreadsheets"]) }); await api.spreadsheets.values.append({ spreadsheetId, range: `'${AUDIT_LOG_SHEET}'!A:I`, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values: [AUDIT_LOG_HEADERS.map((header) => row[header] ?? "")] } }) },
  }
}

async function main() {
  const source = adapter(), target = await new UsersRepository(source).requireUserById("USR-0001")
  stdout.write(`${JSON.stringify({ mode: process.argv.includes("--execute") ? "EXECUTION_PENDING" : "DRY_RUN", idUser: target.idUser, email: target.email, doitChangerMotDePasse: target.doitChangerMotDePasse, statut: target.statut, prochaineSessionVersion: target.sessionVersion + 1, expirationHours: 24 }, null, 2)}\n`)
  if (!process.argv.includes("--execute")) { stdout.write("Contrôle à blanc terminé. Aucune écriture effectuée.\n"); return }
  if (!stdin.isTTY || !stdout.isTTY) throw new Error("Le mode --execute exige un terminal interactif.")
  const terminal = createInterface({ input: stdin, output: stdout }), answer = await terminal.question(`Tapez exactement « ${CONFIRMATION} » : `); terminal.close()
  if (answer !== CONFIRMATION) throw new Error("Confirmation refusée. Aucune écriture effectuée.")
  const result = await resetUserAccess({ adapter: source, target, actorId: target.idUser, requestId: randomUUID() })
  stdout.write("Accès réinitialisé et vérifié. Copiez-le maintenant ; il ne sera plus affiché.\n")
  stdout.write(`${result.temporaryAccess}\n`)
}

main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "Échec inconnu."}\n`); process.exitCode = 1 })

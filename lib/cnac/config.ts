import { CnacDataError } from "./model.ts"
import { CNAC_GROUPS, type CnacSheet } from "./schema.ts"

export function cnacCredentials(env: Record<string,string|undefined> = process.env) {
  const missing = ["GOOGLE_SERVICE_ACCOUNT_EMAIL","GOOGLE_PRIVATE_KEY"].filter(key => !env[key]?.trim() || env[key] === "A_COMPLETER")
  if (missing.length) throw new CnacDataError("GOOGLE_CONFIGURATION", `Connexion Google CNAC non configurée. Compléter ${missing.join(" et ")} dans .env.local.`,503)
  return { email:env.GOOGLE_SERVICE_ACCOUNT_EMAIL!.trim(), key:env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g,"\n") }
}
export function cnacWorkbook(sheet: string, spreadsheetId: string, env: Record<string,string|undefined> = process.env): CnacSheet {
  const group = Object.entries(CNAC_GROUPS).find(([,names]) => (names as readonly string[]).includes(sheet))?.[0]
  if (!group) throw new CnacDataError("OUT_OF_SCOPE", `La feuille ${sheet} n’appartient pas aux deux blocs autorisés.`,403)
  const variable = `GOOGLE_SHEETS_${group}_SPREADSHEET_ID`
  const configured = env[variable]?.trim()
  if (!configured || configured === "A_COMPLETER") throw new CnacDataError("GOOGLE_CONFIGURATION", `Connexion Google CNAC non configurée. Compléter ${variable} avec l’identifiant CNAC fourni.`,503)
  if (configured !== spreadsheetId) throw new CnacDataError("WORKBOOK_MISMATCH", "Cette feuille ne peut pas être lue dans ce classeur.",403)
  return sheet as CnacSheet
}

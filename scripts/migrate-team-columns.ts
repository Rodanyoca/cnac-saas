import nextEnv from "@next/env"
import { sheets, auth } from "googleapis/build/src/apis/sheets/index.js"
import { cnacCredentials, cnacWorkbook } from "../lib/cnac/config.ts"
import { CNAC_HEADERS } from "../lib/cnac/schema.ts"
nextEnv.loadEnvConfig(process.cwd())
const spreadsheetId = process.env.GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID || ""
cnacWorkbook("EQUIPES", spreadsheetId)
const credentials = cnacCredentials()
const apply = process.argv.includes("--apply")
const api = sheets({version:"v4",auth:new auth.JWT({email:credentials.email,key:credentials.key,scopes:["https://www.googleapis.com/auth/spreadsheets"]})})
async function main() {
try {
 const metadata = await api.spreadsheets.get({spreadsheetId,fields:"properties.title,sheets.properties"}, {timeout:20000})
 if (metadata.data.properties?.title !== "01_CNAC_STRUCTURE_TERRITORIALE") throw new Error("Le titre du classeur ne correspond pas au classeur CNAC attendu.")
 const sheetId = metadata.data.sheets?.find(sheet=>sheet.properties?.title === "EQUIPES")?.properties?.sheetId
 if (sheetId == null) throw new Error("Feuille EQUIPES introuvable.")
 const response = await api.spreadsheets.values.get({spreadsheetId,range:"'EQUIPES'!A:AZ"}, {timeout:20000})
 const matrix = response.data.values || [], headers = matrix[0] || []
 const removed = ["id_type_structure_sportive", "id_structure_sportive_cnac"].map(name=>({name,index:headers.indexOf(name)})).filter(item=>item.index>=0)
 if (CNAC_HEADERS.EQUIPES.some(name=>!headers.includes(name))) throw new Error("Une colonne conservée manque. Migration refusée.")
 console.log(JSON.stringify({rows:matrix.length-1,headers,removed:removed.map(item=>({name:item.name,populated:matrix.slice(1).filter(row=>String(row[item.index]||"").trim()).length})),apply}))
 if (apply && removed.length) {
  // Une seule requête atomique; ordre décroissant pour préserver toutes les autres colonnes.
  await api.spreadsheets.batchUpdate({spreadsheetId,requestBody:{requests:removed.sort((a,b)=>b.index-a.index).map(item=>({deleteDimension:{range:{sheetId,dimension:"COLUMNS",startIndex:item.index,endIndex:item.index+1}}}))}}, {timeout:20000})
  const verified = await api.spreadsheets.values.get({spreadsheetId,range:"'EQUIPES'!A:AZ"}, {timeout:20000})
  const expected = matrix.map(row=>row.filter((_,index)=>!removed.some(item=>item.index===index)))
  const after = verified.data.values || []
  const normalize = (rows:unknown[][])=>rows.map(row=>{const copy=[...row];while(copy.at(-1)==="")copy.pop();return copy})
  if (JSON.stringify(normalize(expected))!==JSON.stringify(normalize(after))) throw new Error("Vérification des données conservées échouée.")
  console.log("Migration vérifiée : toutes les colonnes et données conservées sont identiques.")
 }
} catch (error) { console.error(error instanceof Error ? error.message : "Migration impossible");process.exitCode=1 }

}
void main()

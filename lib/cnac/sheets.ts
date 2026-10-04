import "server-only"
import { sheets, auth as googleAuth } from "googleapis/build/src/apis/sheets"
import { runGoogleRequest } from "../google/request"
import { cnacCredentials, cnacWorkbook } from "./config"
import { cnacError } from "./errors"
import { type CnacSheet } from "./schema"
import { appendValues, assertHeaders, CnacDataError, isDateColumn, parseTable, updateCells, type SheetTable } from "./model"

type Params = { spreadsheetId:string; sheetNames:string[]; bypassCache?:boolean; cacheTtlMs?:number }
const state = (globalThis as typeof globalThis & { __cnacScopedSheets?: {cache:Map<string,{table:SheetTable;at:number}>;pending:Map<string,Promise<Record<string,SheetTable>>>;generation:number} })
const store = state.__cnacScopedSheets ??= {cache:new Map(),pending:new Map(),generation:0}
const timeout = () => Number(process.env.GOOGLE_SHEETS_TIMEOUT_MS || 20000)
const ttl = () => Number(process.env.GOOGLE_SHEETS_CACHE_TTL_MS || 300000)
function client(write=false) {
  const {email,key} = cnacCredentials()
  return sheets({version:"v4",auth:new googleAuth.JWT({email,key,scopes:[`https://www.googleapis.com/auth/spreadsheets${write?"":".readonly"}`]})})
}
const range = (name:string) => `'${name.replaceAll("'","''")}'!${name === "ATHLETES" ? "A:X" : "A:AZ"}`
export function clearSheetCache() { store.generation++;store.cache.clear();store.pending.clear() }

async function tables(params: Params): Promise<Record<string,SheetTable>> {
  params.sheetNames.forEach(name => cnacWorkbook(name,params.spreadsheetId))
  cnacCredentials()
  const key = `${params.spreadsheetId}:${[...params.sheetNames].sort().join(",")}`
  const cached = Object.fromEntries(params.sheetNames.map(name=>[name,store.cache.get(`${params.spreadsheetId}:${name}`)]))
  if (!params.bypassCache && params.sheetNames.every(name=>cached[name] && Date.now()-cached[name]!.at < (params.cacheTtlMs ?? ttl()))) return Object.fromEntries(params.sheetNames.map(name=>[name,structuredClone(cached[name]!.table)]))
  const pending = store.pending.get(key)
  if(pending && !params.bypassCache)return structuredClone(await pending)
  const generation=store.generation
  const task=(async()=>{
    try {
      const api=client()
      // Valeurs formatées : identifiants « 01 », téléphones et dates civiles du classeur.
      const response=await runGoogleRequest(()=>api.spreadsheets.values.batchGet({spreadsheetId:params.spreadsheetId,ranges:params.sheetNames.map(range),valueRenderOption:"FORMATTED_VALUE"},{timeout:timeout()}),{timeoutMs:timeout()})
      const matrices=params.sheetNames.map((name,index)=>{
        const values:unknown[][]=response.data.valueRanges?.[index]?.values || []
        assertHeaders(name as CnacSheet,(values[0]||[]).map(value=>String(value??"").trim()))
        return values
      })
      // Ne pas perdre les zéros des identifiants; lire séparément les dates natives.
      const dateColumns=params.sheetNames.flatMap((name,index)=>(matrices[index][0]||[]).flatMap((header,column)=>isDateColumn(String(header))?[{name,index,column}]:[]))
      if(dateColumns.length){
        const nativeDates=await runGoogleRequest(()=>api.spreadsheets.values.batchGet({spreadsheetId:params.spreadsheetId,ranges:dateColumns.map(item=>`'${item.name}'!${columnLetter(item.column)}:${columnLetter(item.column)}`),valueRenderOption:"UNFORMATTED_VALUE",dateTimeRenderOption:"SERIAL_NUMBER"},{timeout:timeout()}),{timeoutMs:timeout()})
        dateColumns.forEach((item,index)=>{const values=nativeDates.data.valueRanges?.[index]?.values || [];matrices[item.index].slice(1).forEach((row,offset)=>{row[item.column]=values[offset+1]?.[0] ?? ""})})
      }
      const result:Record<string,SheetTable>={}
      params.sheetNames.forEach((name,index)=>{const table=parseTable(name as CnacSheet,matrices[index]);result[name]=table;if(generation===store.generation)store.cache.set(`${params.spreadsheetId}:${name}`,{table,at:Date.now()})})
      return result
    } catch(error) { const failure=cnacError(error); console.error(`[CNAC Sheets] ${failure.code}: ${failure.message} (${params.sheetNames.join(", ")})`);throw failure }
  })()
  store.pending.set(key,task)
  try{return structuredClone(await task)}finally{if(store.pending.get(key)===task)store.pending.delete(key)}
}

export async function getSheetsRows(params: Params): Promise<Record<string,Record<string,string>[]>> {
  const result=await tables(params)
  const rows=Object.fromEntries(Object.entries(result).map(([name,table])=>[name,table.rows]))
  if(params.sheetNames.some(name=>["ATHLETES","COACHS","OFFICIELS","MEDECINS","ARBITRES"].includes(name))){
    const refId=process.env.GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID || ""
    const sexes=(await tables({sheetNames:["SEXES"],spreadsheetId:refId})).SEXES.rows
    const labels=new Map(sexes.map(row=>[row.id_sexe,row.nom_sexe]))
    Object.values(rows).flat().forEach(row=>{if("id_sexe" in row)row.nom_sexe=labels.get(row.id_sexe)||row.id_sexe})
  }
  return rows
}
export async function getSheetRows(params: Omit<Params,"sheetNames"> & {sheetName:string;range?:string}) { return (await getSheetsRows({...params,sheetNames:[params.sheetName]}))[params.sheetName] }
export async function getSheetHeaders(params: Omit<Params,"sheetNames"> & {sheetName:string}) { return (await tables({...params,sheetNames:[params.sheetName]}))[params.sheetName].headers }
export const getSheetsTables = tables

function columnLetter(index:number) { let result="";for(let n=index+1;n;n=Math.floor((n-1)/26))result=String.fromCharCode(65+(n-1)%26)+result;return result }
export async function updateSheetCells(params:{sheetName:string;spreadsheetId:string;idColumn:string;idValue:string;updates:{column:string;value:string}[]}) {
  const sheet=cnacWorkbook(params.sheetName,params.spreadsheetId)
  // Relire les positions physiques juste avant l’écriture; jamais de numéro venant du client.
  const table=(await tables({spreadsheetId:params.spreadsheetId,sheetNames:[sheet],bypassCache:true}))[sheet]
  const cells=updateCells(table,sheet,params.idColumn,params.idValue,params.updates)
  if(!cells.length)throw new CnacDataError("EMPTY_UPDATE","Aucune modification à enregistrer.")
  const api=client(true)
  try{await runGoogleRequest(()=>api.spreadsheets.values.batchUpdate({spreadsheetId:params.spreadsheetId,requestBody:{valueInputOption:"RAW",data:cells.map(cell=>({range:`'${sheet}'!${columnLetter(cell.columnIndex)}${cell.rowNumber}`,values:[[cell.value]]}))}},{timeout:timeout()}),{idempotent:false,timeoutMs:timeout()})}catch(error){throw cnacError(error)}finally{clearSheetCache()}
}
export async function appendSheetRow(params:{sheetName:string;spreadsheetId:string;row:Record<string,string>}) {
  const sheet=cnacWorkbook(params.sheetName,params.spreadsheetId)
  const table=(await tables({spreadsheetId:params.spreadsheetId,sheetNames:[sheet],bypassCache:true}))[sheet]
  const values=appendValues(table,sheet,params.row)
  const appendRange=sheet==="ZONES"?"'ZONES'!A:G":sheet==="ENTENTES"?"'ENTENTES'!A:M":sheet==="EQUIPES"?"'EQUIPES'!A:K":range(sheet)
  const api=client(true)
  try{await runGoogleRequest(()=>api.spreadsheets.values.append({spreadsheetId:params.spreadsheetId,range:appendRange,valueInputOption:"RAW",insertDataOption:"INSERT_ROWS",requestBody:{values:[values]}},{timeout:timeout()}),{idempotent:false,timeoutMs:timeout()})}catch(error){throw cnacError(error)}finally{clearSheetCache()}
}
export async function deleteSheetRow(params:{sheetName:string;spreadsheetId:string;idColumn:string;idValue:string}) {
  if(params.sheetName!=="HIERARCHIE")throw new CnacDataError("NO_DELETE","Suppression définitive non autorisée.",405)
  cnacWorkbook(params.sheetName,params.spreadsheetId)
  const api=client(true),table=(await tables({sheetNames:[params.sheetName],spreadsheetId:params.spreadsheetId,bypassCache:true}))[params.sheetName]
  const index=table.rows.findIndex(row=>row[params.idColumn]===params.idValue)
  if(index<0)throw new CnacDataError("NOT_FOUND","Niveau introuvable.",404)
  const metadata=await runGoogleRequest(()=>api.spreadsheets.get({spreadsheetId:params.spreadsheetId,fields:"sheets.properties"}))
  const sheetId=metadata.data.sheets?.find(sheet=>sheet.properties?.title===params.sheetName)?.properties?.sheetId
  if(sheetId===undefined || sheetId===null)throw new CnacDataError("MAPPING_SHEET","Feuille introuvable.",502)
  try{await runGoogleRequest(()=>api.spreadsheets.batchUpdate({spreadsheetId:params.spreadsheetId,requestBody:{requests:[{deleteDimension:{range:{sheetId,dimension:"ROWS",startIndex:table.rowNumbers[index]-1,endIndex:table.rowNumbers[index]}}}]}}),{idempotent:false})}catch(error){throw cnacError(error)}finally{clearSheetCache()}
}

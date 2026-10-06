import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import { createElement, type ComponentType, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { FederationData } from "../../lib/federations/types.ts"
import { CNAC_HEADERS, CNAC_KEYS, type CnacSheet } from "../../lib/cnac/schema.ts"
import { parseTable, type SheetRecord } from "../../lib/cnac/model.ts"
import { mapEntenteRow, mapTypeStructureRow, mapZoneRow } from "../../lib/federations/mappers.ts"
import { territorialEditorRow } from "../../lib/cnac/territorial-model.ts"
import { teamCategory } from "../../lib/cnac/affiliation-model.ts"
import { cnacWorkbook } from "../../lib/cnac/config.ts"

const root = fileURLToPath(new URL("../../", import.meta.url))
const require = createRequire(import.meta.url)
const request = (body: unknown) => new Request("http://fixture.invalid/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

function localisationFixture() {
  let read = true, write = true
  const f = fixture({
    [resolve(root, "lib/auth.ts")]: { canAccess: async (_block: string, action: string) => action === "WRITE" ? write : read },
    [resolve(root, "lib/acteurs/config.ts")]: { getActeursSpreadsheetId: () => "actors-fixture", getActeursAffiliationsSpreadsheetId: () => "affiliations-fixture" },
  })
  for (const id of ["A1", "A2"]) f.matrices.get("ATHLETES")!.push(CNAC_HEADERS.ATHLETES.map(key => key === "id_athlete_cnac" ? id : ""))
  const route = f.load(resolve(root, "app/api/athletes/[id]/localisations/route.ts")) as Record<string, (request: Request, context: { params: Promise<{id:string}> }) => Promise<Response>>
  const call = (method: string, body?: unknown, id = "A1") => route[method](body ? request(body) : new Request("http://fixture.invalid/api"), { params: Promise.resolve({id}) })
  return { ...f, call, permissions: (r: boolean, w: boolean) => { read = r; write = w } }
}

test("affiliation cache uses the dedicated workbook and invalidates after a status update", async () => {
  const env = {GOOGLE_SHEETS_ACTEURS_AFFILIATIONS_SPREADSHEET_ID:"affiliations-fixture",GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID:"refs-fixture"}
  const f = fixture({[resolve(root,"lib/cnac/config.ts")]: {
    cnacCredentials:()=>({email:"fixture@example.invalid",key:"fixture"}),
    cnacWorkbook:(sheet:string,id:string)=>cnacWorkbook(sheet,id,env),
  }})
  const headers = [...CNAC_HEADERS.AFFILIATIONS_COACHS].reverse()
  const row:SheetRecord = {id_affiliation_coach:"AFF1",id_coach_cnac:"COACH1",id_club_cnac:"C1",statut:"ACTIF",observations:"Note"}
  f.matrices.set("AFFILIATIONS_COACHS",[headers,headers.map(key=>row[key])])
  const sheets = f.load(resolve(root,"lib/cnac/sheets.ts")) as {
    getSheetRows:(params:{sheetName:string;spreadsheetId:string})=>Promise<SheetRecord[]>;
    updateSheetCells:(params:{sheetName:string;spreadsheetId:string;idColumn:string;idValue:string;updates:{column:string;value:string}[]})=>Promise<unknown>;
  }
  const params={sheetName:"AFFILIATIONS_COACHS",spreadsheetId:"affiliations-fixture"}
  assert.equal((await sheets.getSheetRows(params))[0].statut,"ACTIF")
  const reads=f.reads.length
  await sheets.getSheetRows(params)
  assert.equal(f.reads.length,reads)
  await assert.rejects(sheets.getSheetRows({...params,spreadsheetId:"refs-fixture"}),/classeur/)
  assert.equal(f.reads.length,reads)
  await sheets.updateSheetCells({...params,idColumn:"id_affiliation_coach",idValue:"AFF1",updates:[{column:"statut",value:"INACTIF"}]})
  assert.equal((await sheets.getSheetRows(params))[0].statut,"INACTIF")
  assert.equal(f.matrices.get("AFFILIATIONS_COACHS")!.length,2)
})

test("coach club affiliations save by header name, round-trip statuses and populate athlete localisation without duplicates", async () => {
  const f = fixture({}, {NODE_ENV:"test"}, true)
  const add=(sheet:CnacSheet,row:SheetRecord)=>f.matrices.get(sheet)!.push(f.matrices.get(sheet)![0].map(key=>row[String(key)]||""))
  // Colonnes réordonnées pour exercer les vrais mappings et écritures par nom.
  f.matrices.set("AFFILIATIONS_COACHS",[[...CNAC_HEADERS.AFFILIATIONS_COACHS].reverse()])
  f.matrices.set("COACHS",[[...CNAC_HEADERS.COACHS].reverse()])
  add("SEXES",{id_sexe:"01",nom_sexe:"Masculin"})
  add("CLUBS",{id_club_cnac:"C1",id_federation:"FED1",nom_club:"Club 1"})
  add("CLUBS",{id_club_cnac:"C2",id_federation:"FED1",nom_club:"Club 2"})
  add("CLUBS",{id_club_cnac:"FOREIGN",id_federation:"OTHER",nom_club:"Autre fédération"})
  const {actorWrite}=f.load(resolve(root,"lib/cnac/actor-handler.ts")) as {actorWrite:(kind:string,request:Request,method:"POST"|"PUT")=>Promise<Response>}
  const draft={id_club_cnac:"C1",statut:"ACTIF",observations:"Observation conservée"}
  const create=await actorWrite("entraineurs",request({row:{nom_complet:"Coach test",id_federation:"FED1",id_sexe:"01"},affiliations:[draft]}),"POST")
  const body=await create.json();assert.equal(create.status,200,JSON.stringify(body));assert.equal(body.affiliationsError,undefined)
  const coachId=body.row.id_coach_cnac
  assert.equal("id_club_cnac" in body.row,false)
  assert.equal(parseTable("COACHS",f.matrices.get("COACHS")!).rows[0].nom_complet,"Coach test")
  const saved=()=>parseTable("AFFILIATIONS_COACHS",f.matrices.get("AFFILIATIONS_COACHS")!).rows
  assert.equal(saved().length,1);assert.equal(saved()[0].id_coach_cnac,coachId);assert.equal(saved()[0].observations,draft.observations)
  const route=f.load(resolve(root,"app/api/coachs/affiliations/route.ts")) as {PUT:(r:Request)=>Promise<Response>;GET:(r:Request)=>Promise<Response>}
  assert.equal((await route.PUT(request({coachId,affiliations:[draft]}))).status,200)
  assert.equal(saved().length,1)
  assert.equal((await route.PUT(request({coachId,affiliations:[{...draft,id_affiliation_coach:saved()[0].id_affiliation_coach,statut:"INACTIF"}]}))).status,200)
  assert.equal(saved()[0].statut,"INACTIF");assert.equal(saved()[0].observations,draft.observations)
  const read=await route.GET(new Request(`http://fixture.invalid/api?coachId=${coachId}`))
  assert.equal((await read.json()).affiliations[0].nom_club,"Club 1")
  add("ATHLETES",{id_athlete_cnac:"A1",id_federation:"FED1",id_club_cnac:"C1"})
  const athleteRoute=f.load(resolve(root,"app/api/athletes/[id]/club-coachs/route.ts")) as {GET:(r:Request,context:{params:Promise<{id:string}>})=>Promise<Response>}
  const coaches=async()=>(await (await athleteRoute.GET(new Request("http://fixture.invalid/api"),{params:Promise.resolve({id:"A1"})})).json()).coaches
  assert.equal((await coaches()).length,0)
  assert.equal((await route.PUT(request({coachId,affiliations:[draft,{id_club_cnac:"C2",statut:"ACTIF",observations:""}]}))).status,200)
  assert.equal(saved().length,2)
  // Une source historiquement dupliquée ne doit pas dupliquer les noms chez l'athlète.
  add("AFFILIATIONS_COACHS",{...saved()[0],id_affiliation_coach:"DUPLICATE"})
  assert.deepEqual((await coaches()).map((row:{id:string;nom:string})=>[row.id,row.nom]),[[coachId,"Coach test"]])
  assert.ok(f.updates.filter(item=>item.range.startsWith("'AFFILIATIONS_COACHS'!")).every(item=>/[AB]\d+$/.test(item.range)))
  assert.ok(f.revalidations.some(([path])=>path==="/dashboard/acteurs/athletes"))
})

test("coach affiliation writes enforce permissions, ownership, compatibility and retry partial writes safely", async () => {
  const f=fixture({}, {NODE_ENV:"test"}, true)
  const add=(sheet:CnacSheet,row:SheetRecord)=>f.matrices.get(sheet)!.push(CNAC_HEADERS[sheet].map(key=>row[key]||""))
  add("COACHS",{id_coach_cnac:"CO1",id_federation:"FED1",nom_complet:"Coach 1",id_sexe:"01"})
  add("COACHS",{id_coach_cnac:"CO2",id_federation:"FED1",nom_complet:"Coach 2",id_sexe:"01"})
  add("CLUBS",{id_club_cnac:"C1",id_federation:"FED1",nom_club:"Club 1"})
  add("CLUBS",{id_club_cnac:"OTHER",id_federation:"FED2",nom_club:"Autre"})
  const route=f.load(resolve(root,"app/api/coachs/affiliations/route.ts")) as {PUT:(r:Request)=>Promise<Response>}
  const draft={id_club_cnac:"C1",statut:"ACTIF",observations:"Garder"}
  for(const affiliations of [[{...draft,id_club_cnac:"OTHER"}],[draft,draft],[{...draft,statut:"UNKNOWN"}],[{...draft,id_coach_cnac:"CO2"}]])assert.ok((await route.PUT(request({coachId:"CO1",affiliations}))).status>=400)
  assert.equal(f.appends.length,0)
  f.failWrite();assert.equal((await route.PUT(request({coachId:"CO1",affiliations:[draft]}))).status,502)
  assert.equal((await route.PUT(request({coachId:"CO1",affiliations:[draft]}))).status,200)
  const row=parseTable("AFFILIATIONS_COACHS",f.matrices.get("AFFILIATIONS_COACHS")!).rows[0]
  assert.equal((await route.PUT(request({coachId:"CO2",affiliations:[{...draft,id_affiliation_coach:row.id_affiliation_coach}]}))).status,404)
  const {actorWrite}=f.load(resolve(root,"lib/cnac/actor-handler.ts")) as {actorWrite:(kind:string,r:Request,m:"PUT")=>Promise<Response>}
  assert.equal((await actorWrite("entraineurs",request({id:"CO1",row:{id_federation:"FED2"}}),"PUT")).status,400)
  assert.equal((await actorWrite("entraineurs",request({id:"CO1",row:{id_club_cnac:"C1"}}),"PUT")).status,400)
  f.deny();assert.equal((await route.PUT(request({coachId:"CO1",affiliations:[draft]}))).status,403)
})

test("a failed affiliation append reports the saved identity and retries without another coach or relation",async()=>{
  const f=fixture({}, {NODE_ENV:"test"},true)
  const add=(sheet:CnacSheet,row:SheetRecord)=>f.matrices.get(sheet)!.push(CNAC_HEADERS[sheet].map(key=>row[key]||""))
  add("SEXES",{id_sexe:"01",nom_sexe:"Masculin"});add("CLUBS",{id_club_cnac:"C1",id_federation:"FED1",nom_club:"Club"})
  const sheets=f.load(resolve(root,"lib/cnac/sheets.ts")) as {appendSheetRow:(params:{sheetName:string})=>Promise<unknown>}
  const original=sheets.appendSheetRow;let fail=true
  sheets.appendSheetRow=async params=>{if(params.sheetName==="AFFILIATIONS_COACHS"&&fail){fail=false;throw new Error("Google unavailable")}return original(params)}
  const {actorWrite}=f.load(resolve(root,"lib/cnac/actor-handler.ts")) as {actorWrite:(kind:string,r:Request,m:"POST"|"PUT")=>Promise<Response>}
  const row={nom_complet:"Coach",id_federation:"FED1",id_sexe:"01"},affiliations=[{id_club_cnac:"C1",statut:"ACTIF",observations:""}]
  const created=await actorWrite("entraineurs",request({row,affiliations}),"POST")
  const payload=await created.json();assert.equal(created.status,200);assert.ok(payload.affiliationsError);assert.ok(payload.row.id_coach_cnac)
  for(let i=0;i<2;i++) {const updated=await actorWrite("entraineurs",request({id:payload.row.id_coach_cnac,row,affiliations}),"PUT");assert.equal(updated.status,200);assert.equal((await updated.json()).affiliationsError,undefined)}
  assert.equal(parseTable("COACHS",f.matrices.get("COACHS")!).rows.length,1)
  assert.equal(parseTable("AFFILIATIONS_COACHS",f.matrices.get("AFFILIATIONS_COACHS")!).rows.length,1)
})

test("team editor persists the displayed active default when the sheet status is empty", async () => {
  const f = fixture()
  const club: SheetRecord = {id_club_cnac:"C1",id_federation:"FED1",nom_club:"Club"}
  f.matrices.get("CLUBS")!.push(CNAC_HEADERS.CLUBS.map(key => club[key] || ""))
  const created = await f.territorialWrite("equipes", request({row:{id_federation:"FED1",id_club_cnac:"C1",nom_equipe:"Équipe",id_categorie_age:"AGE1"}}), "POST")
  const createdPayload = await created.json()
  assert.equal(created.status, 200, JSON.stringify(createdPayload))
  const team = createdPayload.row
  for (const statut of ["", "   ", "INACTIF"]) {
    const row = territorialEditorRow("equipes", {...team, statut})
    const response = await f.territorialWrite("equipes", request({id:team.id_equipe_cnac,row}), "PUT")
    const payload = await response.json()
    assert.equal(response.status, 200, JSON.stringify(payload))
    assert.equal(payload.row.statut, statut.trim() || "ACTIF")
  }
  const invalid = await f.territorialWrite("equipes", request({id:team.id_equipe_cnac,row:territorialEditorRow("equipes",{...team,statut:"UNKNOWN"})}), "PUT")
  assert.equal(invalid.status, 400)
  assert.equal((await invalid.json()).code, "STATUS_INVALID")
})

test("athlete sex choices use page references even without a layout provider", () => {
  const f = fixture({[resolve(root,"components/ui/select.tsx")]:{SelectItem:({value,children}:{value:string;children:string})=>createElement("option",{value},children)}})
  const {PersonSexOptions} = f.load(resolve(root,"components/dashboard/cnac-actor-references.tsx")) as {PersonSexOptions:ComponentType<{rows:SheetRecord[]}>}
  const html = renderToStaticMarkup(createElement(PersonSexOptions,{rows:[{id_sexe:"01",nom_sexe:"Masculin"},{id_sexe:"02",nom_sexe:"Féminin"},{id_sexe:"03",nom_sexe:"Mixte"}]}))
  assert.match(html, /value="01">Masculin/)
  assert.match(html, /value="02">Féminin/)
  assert.doesNotMatch(html, /Mixte/)
  assert.equal(renderToStaticMarkup(createElement(PersonSexOptions,{rows:[]})), "")
  const numeric = renderToStaticMarkup(createElement(PersonSexOptions,{rows:[{id_sexe:"1",nom_sexe:"Masculin"},{id_sexe:"2",nom_sexe:"Féminin"}]}))
  assert.match(numeric, /value="1">Masculin/)
  assert.match(numeric, /value="2">Féminin/)
  const reference = renderToStaticMarkup(createElement(PersonSexOptions,{rows:[{id_sexe:"SEX001",nom_sexe:"Masculin"},{id_sexe:"SEX002",nom_sexe:"Féminin"},{id_sexe:"SEX003",nom_sexe:"Mixte"}]}))
  assert.match(reference, /value="SEX001">Masculin/)
  assert.match(reference, /value="SEX002">Féminin/)
  assert.doesNotMatch(reference, /SEX003/)
})

test("athlete creation persists the actual SEXES reference IDs and refuses unknown or mixed IDs", async () => {
  const f = fixture({}, {NODE_ENV:"test"}, true)
  f.matrices.set("SEXES", [[...CNAC_HEADERS.SEXES], ...[{id_sexe:"SEX001",nom_sexe:"Masculin"},{id_sexe:"SEX002",nom_sexe:"Féminin"},{id_sexe:"SEX003",nom_sexe:"Mixte"}].map(row=>CNAC_HEADERS.SEXES.map(key=>row[key as keyof typeof row]||""))])
  const {actorWrite} = f.load(resolve(root,"lib/cnac/actor-handler.ts")) as {actorWrite:(kind:string,request:Request,method:string)=>Promise<Response>}
  for (const id_sexe of ["SEX001", "SEX002"]) {
    const response = await actorWrite("athletes",request({row:{nom_complet:"Athlète fixture",id_federation:"FED1",id_sexe}}),"POST")
    const payload = await response.json()
    assert.equal(response.status,200,JSON.stringify(payload))
    assert.equal(payload.row.id_sexe,id_sexe)
  }
  for (const id_sexe of ["SEX003","SEX999","01"]) assert.equal((await actorWrite("athletes",request({row:{nom_complet:"Athlète fixture",id_federation:"FED1",id_sexe}}),"POST")).status,400)
  assert.deepEqual(parseTable("ATHLETES",f.matrices.get("ATHLETES")!).rows.map(row=>row.id_sexe),["SEX001","SEX002"])
})

test("individual venues persist separately from teams, support multiple places and status round trips", async () => {
  const f = localisationFixture()
  const teamBefore = structuredClone(f.matrices.get("EQUIPES"))
  const schedule = JSON.stringify([{jour:3,heure_debut:"16:00",heure_fin:"18:00"},{jour:1,heure_debut:"16:00",heure_fin:"18:00"},{jour:3,heure_debut:"09:00",heure_fin:"11:00"}])
  const created = await f.call("POST", { row: { lieu_entrainement: "Salle X", adresse_entrainement: "Adresse X", fuseau_horaire_entrainement: "Africa/Kinshasa", planning_entrainement_json: schedule, observations: "Garder" } })
  assert.equal(created.status, 200)
  const first = (await created.json()).row
  assert.match(first.id_localisation, /^LOC-/)
  assert.equal(first.id_athlete_cnac, "A1")
  assert.equal(f.appends[0].range, "'LOCALISATION'!A:H")
  assert.equal(f.appends[0].values[0].length, 8)
  assert.equal(JSON.parse(first.planning_entrainement_json)[0].jour, 1)
  const second = (await (await f.call("POST", { row: { lieu_entrainement: "Salle Y" } })).json()).row
  assert.notEqual(first.id_localisation, second.id_localisation)
  assert.equal((await (await f.call("GET")).json()).localisations.length, 2)
  for (const statut of ["INACTIF", "ACTIF"]) {
    assert.equal((await f.call("PUT", { id: first.id_localisation, row: { statut } })).status, 200)
    const saved = (await (await f.call("GET")).json()).localisations.find((row: SheetRecord) => row.id_localisation === first.id_localisation)
    assert.equal(saved.statut, statut); assert.equal(saved.observations, "Garder"); assert.equal(saved.adresse_entrainement, "Adresse X")
  }
  assert.equal((await f.call("PUT", { id: first.id_localisation, row: { adresse_entrainement: "Nouvelle adresse" } })).status, 200)
  assert.equal((await (await f.call("GET")).json()).localisations[0].adresse_entrainement, "Nouvelle adresse")
  assert.deepEqual(f.matrices.get("EQUIPES"), teamBefore)
  assert.ok(f.updates.every(update => update.range.startsWith("'LOCALISATION'!")))
  assert.ok(f.revalidations.some(([path]) => path === "/dashboard/acteurs/athletes/A1"))
})

test("localisation API enforces direct access, athlete existence and place ownership", async () => {
  const f = localisationFixture()
  const first = (await (await f.call("POST", { row: { lieu_entrainement: "Privé" } })).json()).row
  assert.equal((await f.call("PUT", { id: first.id_localisation, row: { observations: "Forbidden" } }, "A2")).status, 404)
  assert.equal((await f.call("POST", { row: { lieu_entrainement: "Missing" } }, "UNKNOWN")).status, 404)
  assert.equal((await (await f.call("GET", undefined, "A2")).json()).localisations.length, 0)
  assert.equal((await f.call("PUT", { id: first.id_localisation, row: { id_athlete_cnac: "A2" } })).status, 400)
  assert.equal((await f.call("PUT", { id: first.id_localisation, row: { id_localisation: "OTHER" } })).status, 400)
  const snapshot = structuredClone(f.matrices.get("LOCALISATION"))
  f.permissions(true, false)
  assert.equal((await (await f.call("GET")).json()).canWrite, false)
  assert.equal((await f.call("POST", { row: { lieu_entrainement: "Forbidden" } })).status, 403)
  assert.equal((await f.call("PUT", { id: first.id_localisation, row: { statut: "INACTIF" } })).status, 403)
  f.permissions(false, false)
  const readsBefore = f.reads.length
  assert.equal((await f.call("GET")).status, 403)
  assert.equal(f.reads.length, readsBefore)
  assert.deepEqual(f.matrices.get("LOCALISATION"), snapshot)
})

test("individual training validation rejects invalid slots and preserves historical anomalies", async () => {
  const f = localisationFixture()
  const slot = {jour:1,heure_debut:"16:00",heure_fin:"18:00"}
  for (const row of [
    {lieu_entrainement:""},
    {lieu_entrainement:"X",planning_entrainement_json:"broken"},
    ...[[{...slot,jour:0}], [{...slot,heure_fin:"15:00"}], [{...slot,heure_debut:"25:00"}], [slot,slot], [slot,{...slot,heure_debut:"17:00"}]].map(slots => ({lieu_entrainement:"X",fuseau_horaire_entrainement:"Africa/Kinshasa",planning_entrainement_json:JSON.stringify(slots)})),
    {lieu_entrainement:"X",planning_entrainement_json:JSON.stringify([slot]),fuseau_horaire_entrainement:""},
    {lieu_entrainement:"X",statut:"UNKNOWN"},
  ]) assert.equal((await f.call("POST", {row})).status, 400)
  assert.equal(f.appends.length, 0)
  const old: SheetRecord = {id_localisation:"OLD",id_athlete_cnac:"A1",lieu_entrainement:"Historique",statut:"ACTIF",planning_entrainement_json:"broken"}
  f.matrices.get("LOCALISATION")!.push(CNAC_HEADERS.LOCALISATION.map(key => old[key] || ""))
  assert.equal((await f.call("PUT", {id:"OLD",row:{observations:"Conserver"}})).status, 200)
  const row = (await (await f.call("GET")).json()).localisations[0]
  assert.equal(row.planning_entrainement_json,"broken")
  assert.equal((await f.call("PUT", {id:"OLD",row:{planning_entrainement_json:"[]"}})).status,200)
})

test("Sheets failures never report successful localisation creation or modification", async () => {
  const f = localisationFixture()
  f.failWrite()
  const failed = await f.call("POST", {row:{lieu_entrainement:"Failure"}})
  assert.equal(failed.status,502); assert.equal((await failed.json()).ok,undefined)
  assert.equal(f.matrices.get("LOCALISATION")!.length,1)
  const row = (await (await f.call("POST", {row:{lieu_entrainement:"Saved"}})).json()).row
  const before = structuredClone(f.matrices.get("LOCALISATION"))
  f.failWrite()
  assert.equal((await f.call("PUT",{id:row.id_localisation,row:{statut:"INACTIF"}})).status,502)
  assert.deepEqual(f.matrices.get("LOCALISATION"),before)
})

test("localisation headers stay exactly A:H and the fresh writer rechecks ownership", async () => {
  const headers = [...CNAC_HEADERS.LOCALISATION]
  assert.throws(() => parseTable("LOCALISATION", [[headers[1],headers[0],...headers.slice(2)]]), /A:H/)
  const f = localisationFixture()
  const row: SheetRecord = { id_localisation:"L1",id_athlete_cnac:"A2",lieu_entrainement:"Other owner",statut:"ACTIF" }
  f.matrices.get("LOCALISATION")!.push(headers.map(key=>row[key]||""))
  const { updateSheetCells } = f.load(resolve(root,"lib/cnac/sheets.ts")) as { updateSheetCells: (input: unknown) => Promise<void> }
  await assert.rejects(() => updateSheetCells({sheetName:"LOCALISATION",spreadsheetId:"actors-fixture",idColumn:"id_localisation",idValue:"L1",expectedValues:{id_athlete_cnac:"A1"},updates:[{column:"observations",value:"Forbidden"}]}), /changé/)
  assert.equal(f.updates.length,0)
})

test("athlete localisation inherits the place and weekday hours loaded from its team sheet", async () => {
  const f = fixture()
  const team: SheetRecord = {
    id_equipe_cnac: "T1", id_club_cnac: "C1", id_federation: "FED1", nom_equipe: "Equipe test",
    lieu_entrainement: "Gymnase du club", adresse_entrainement: "Adresse du gymnase",
    fuseau_horaire_entrainement: "Africa/Kinshasa",
    planning_entrainement_json: JSON.stringify([
      { jour: 3, heure_debut: "17:30", heure_fin: "19:00" },
      { jour: 1, heure_debut: "16:00", heure_fin: "18:00" },
    ]),
  }
  f.matrices.set("EQUIPES", [[...CNAC_HEADERS.EQUIPES], CNAC_HEADERS.EQUIPES.map(key => team[key] || "")])
  const { loadAffiliationReferences } = f.load(resolve(root, "lib/cnac/affiliation-data.ts")) as { loadAffiliationReferences: () => Promise<Record<string, SheetRecord[]>> }
  const { AthleteTeamTraining } = f.load(resolve(root, "components/dashboard/team-training-summary.tsx")) as { AthleteTeamTraining: ComponentType<{ teams: SheetRecord[]; affiliation: SheetRecord }> }
  const refs = await loadAffiliationReferences()
  const html = renderToStaticMarkup(createElement(AthleteTeamTraining, { teams: refs.EQUIPES, affiliation: { id_equipe_cnac: "T1", id_club_cnac: "C1", id_federation: "FED1" } }))
  assert.match(html, /Gymnase du club/)
  assert.match(html, /Lundi/)
  assert.match(html, /16 h–18 h/)
  assert.match(html, /Mercredi/)
  assert.match(html, /17 h 30–19 h/)
  assert.ok(html.indexOf("Lundi") < html.indexOf("Mercredi"))
  const incompatible = renderToStaticMarkup(createElement(AthleteTeamTraining, { teams: refs.EQUIPES, affiliation: { id_equipe_cnac: "T1", id_club_cnac: "OTHER", id_federation: "FED1" } }))
  assert.doesNotMatch(incompatible, /Gymnase du club/)
})

test("athlete affiliation references load the current fifteen-column EQUIPES sheet", async () => {
  const f = fixture()
  const headers = [...CNAC_HEADERS.EQUIPES]
  const team: SheetRecord = { id_equipe_cnac: "T1", id_federation: "FED1", id_club_cnac: "C1", id_categorie_age: "AGE1", nom_equipe: "Seniors" }
  f.matrices.set("EQUIPES", [headers, headers.map(key => team[key] || "")])
  const { loadAffiliationReferences } = f.load(resolve(root, "lib/cnac/affiliation-data.ts")) as { loadAffiliationReferences: () => Promise<Record<string, SheetRecord[]>> }
  const refs = await loadAffiliationReferences()
  assert.equal(refs.EQUIPES[0].nom_equipe, "Seniors")
  assert.equal(refs.EQUIPES[0].id_club_cnac, "C1")
  assert.equal("id_division" in refs.EQUIPES[0], false)
  assert.equal(f.appends.length, 0)
  assert.equal(f.updates.length, 0)
})


test("team and athlete save/reload through real handlers and Sheets transport; failed writes never report success", async () => {
  const f = fixture({}, { NODE_ENV: "test" }, true)
  const add = (sheet: CnacSheet, row: SheetRecord) => f.matrices.get(sheet)!.push(CNAC_HEADERS[sheet].map(column => row[column] || ""))
  add("CLUBS", {id_club_cnac:"C1",id_federation:"FED1",id_structure_parent_cnac:"E1",nom_club:"V Club"})
  add("CLUBS", {id_club_cnac:"C2",id_federation:"FED1",id_structure_parent_cnac:"E1",nom_club:"Autre club"})
  add("SEXES", {id_sexe:"01",nom_sexe:"Masculin"})
  const request = (body: unknown) => new Request("http://fixture.invalid/api", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
  const clubsBefore=structuredClone(f.matrices.get("CLUBS"))
  const created=await f.territorialWrite("equipes",request({row:{id_federation:"FED1",id_club_cnac:"C1",nom_equipe:"Seniors",observations:"PRÉSERVER",id_categorie_age:"AGE1",id_division:"D1",id_type_structure_sportive:"OBSOLETE",id_structure_sportive_cnac:"OBSOLETE"}}),"POST")
  assert.equal(created.status,200)
  const team=(await created.json()).row
  assert.equal("id_type_structure_sportive" in team,false)
  assert.equal("id_structure_sportive_cnac" in team,false)
  const federationData=await f.loadFederationData({connected:true})
  assert.equal(federationData.equipes[0].observations,"PRÉSERVER")
  assert.equal(f.appends[0].values[0].length,15);assert.equal(f.appends[0].values[0][6],"AGE1")
  const actor=f.load(resolve(root,"lib/cnac/actor-handler.ts")) as {actorWrite:(kind:string,request:Request,method:string)=>Promise<Response>}
  // Reproduire les vrais emplacements S:V des médias, W:X de l'affiliation.
  const athleteHeaders=[...CNAC_HEADERS.ATHLETES]
  f.matrices.set("ATHLETES",[athleteHeaders])
  const athleteCreated=await actor.actorWrite("athletes",request({row:{nom_complet:"Athlete test",id_federation:"FED1",id_sexe:"01",id_club_cnac:"C1",id_equipe_cnac:team.id_equipe_cnac,observations:"GARDER"}}),"POST")
  assert.equal(athleteCreated.status,200)
  const athlete=(await athleteCreated.json()).row
  assert.deepEqual(f.appends[1].values[0].slice(17,19),["C1",team.id_equipe_cnac])
  const updated=await actor.actorWrite("athletes",request({id:athlete.id_athlete_cnac,row:{id_club_cnac:"C2",id_equipe_cnac:""}}),"PUT")
  assert.equal(updated.status,200)
  assert.deepEqual(f.updates.slice(-3).map(cell=>cell.range),["'ATHLETES'!R2","'ATHLETES'!S2"])
  const reload=parseTable("ATHLETES",f.matrices.get("ATHLETES")!).rows[0]
  assert.equal(reload.id_club_cnac,"C2");assert.equal(reload.id_equipe_cnac,"");assert.equal(reload.observations,"GARDER")
  const updatedTeam=await f.territorialWrite("equipes",request({id:team.id_equipe_cnac,row:{id_categorie_age:"AGE1",id_division:"D2"}}),"PUT")
  assert.equal(updatedTeam.status,200)
  const refs=Object.fromEntries([...f.matrices].map(([sheet,matrix])=>[sheet,parseTable(sheet,matrix).rows]))
  assert.equal(teamCategory(refs.EQUIPES[0],refs).label,"Seniors")
  assert.deepEqual(f.matrices.get("CLUBS"),clubsBefore)
  const affiliationBefore=structuredClone(f.matrices.get("ATHLETES"))
  const invalid=await actor.actorWrite("athletes",request({id:athlete.id_athlete_cnac,row:{id_equipe_cnac:team.id_equipe_cnac}}),"PUT")
  assert.equal(invalid.status,400);assert.equal((await invalid.json()).ok,undefined)
  assert.deepEqual(f.matrices.get("ATHLETES"),affiliationBefore)
  f.matrices.get("ATHLETES")![0][17]="missing_club_header"
  const backendFailure=await actor.actorWrite("athletes",request({id:athlete.id_athlete_cnac,row:{nom_complet:"Changed"}}),"PUT")
  assert.equal(backendFailure.status,502);assert.equal((await backendFailure.json()).ok,undefined)
  assert.ok(f.revalidations.some(([path,type])=>path==="/dashboard/acteurs/athletes" && type==="layout"))
})

test("active affiliation component renders resolved labels and unresolved stored IDs", async () => {
  const f=fixture()
  const {AthleteAffiliationSummary,AthleteAffiliationFields}=f.load(resolve(root,"components/dashboard/athlete-affiliation.tsx")) as {AthleteAffiliationSummary:ComponentType<{value:SheetRecord;refs:Record<string,SheetRecord[]>}>;AthleteAffiliationFields:ComponentType<{value:SheetRecord;refs:Record<string,SheetRecord[]>;update:()=>void}>}
  const refs=Object.fromEntries([...f.matrices].map(([sheet,matrix])=>[sheet,parseTable(sheet,matrix).rows]))
  refs.CLUBS=[{id_club_cnac:"C1",id_federation:"FED1",nom_club:"V Club"}]
  refs.EQUIPES=[{id_equipe_cnac:"T1",id_club_cnac:"C1",id_federation:"FED1",nom_equipe:"Seniors",id_categorie_age:"AGE1"}]
  const value={id_federation:"FED1",id_club_cnac:"C1",id_equipe_cnac:"T1"}
  const html=renderToStaticMarkup(createElement(AthleteAffiliationFields,{value,refs,update:()=>{}}))
  assert.match(html,/Affiliation active/);assert.match(html,/Seniors/);assert.match(html,/V Club/)
  assert.match(renderToStaticMarkup(createElement(AthleteAffiliationSummary,{value:{...value,id_equipe_cnac:"UNKNOWN"},refs})),/UNKNOWN/)
  refs.FEDERATIONS[0].id_sport="SP1";refs.SPORTS=[{id_sport:"SP1",utilise_equipes:"NON"}]
  const noTeam=renderToStaticMarkup(createElement(AthleteAffiliationFields,{value:{...value,id_equipe_cnac:""},refs,update:()=>{}}))
  assert.doesNotMatch(noTeam,/Équipe/);assert.match(noTeam,/Club/)
})

// Exécuter les vrais services avec un transport Sheets en mémoire, sans secrets ni réseau.
function fixture(extraMocks: Record<string, unknown> = {}, env: Record<string, string> = { NODE_ENV: "test" }, realActors = false) {
  const matrices = new Map<CnacSheet, unknown[][]>()
  for (const [sheet, headers] of Object.entries(CNAC_HEADERS)) matrices.set(sheet as CnacSheet, [[...headers]])
  function add(sheet: CnacSheet, row: SheetRecord) {
    matrices.get(sheet)!.push(CNAC_HEADERS[sheet].map(column => row[column] || ""))
  }
  add("CATEGORIES_AGE", {id_categorie_age:"AGE1",nom_categorie_age:"Seniors"})
  add("FEDERATIONS", { id_federation: "FED1", id_entite: "ENT1" })
  add("ENTITES", { id_entite: "ENT1", nom_officiel: "Fédération test" })
  add("TYPES_STRUCTURE", { id_type_structure: "TYPSTR003", nom_type_structure: "ZONE" })
  add("TYPES_STRUCTURE", { id_type_structure: "TYPSTR004", nom_type_structure: "ENTENTE" })
  add("TYPES_STRUCTURE", { id_type_structure: "TYPSTR001", nom_type_structure: "FEDERATION" })
  add("TYPES_STRUCTURE", { id_type_structure: "TYPSTR002", nom_type_structure: "LIGUE" })
  for (const [index, type] of ["TYPSTR001", "TYPSTR003", "TYPSTR002", "TYPSTR004"].entries()) {
    add("HIERARCHIE", { id_hierarchie: `H${index}`, id_federation: "FED1", id_type_structure: type, niveau_hierarchique: String(index + 1) })
  }
  add("ZONES", { id_zone_cnac: "Z1", id_federation: "FED1", nom_zone: "Zone existante", observations: "GARDER", statut: "ACTIF" })
  add("LIGUES", { id_ligue_cnac: "L1", id_federation: "FED1", id_structure_parent_cnac: "Z1", nom_ligue: "Ligue test" })
  add("ENTENTES", { id_entente_cnac: "E1", id_federation: "FED1", id_structure_parent_cnac: "L1", nom_entente: "Entente existante", telephone: "+24300001", observations: "GARDER", statut: "ACTIF" })
  // Des en-têtes d'un ancien cache/état peuvent subsister au-delà des données métier.
  matrices.get("ZONES")![0].push("id_division")
  matrices.get("ZONES")![1].push("D1")
  matrices.get("ENTENTES")![0].push("id_division")
  matrices.get("ENTENTES")![1].push("D2")
  const reads: string[][] = [], appends: { range: string; values: unknown[][] }[] = [], updates: { range: string; values: unknown[][] }[] = []
  const revalidations: [string, string?][] = []
  let authorized = true, accessChecks = 0, failNextWrite = false
  const workbookRequests: { spreadsheetId: string; ranges: string[] }[] = []
  function checkWorkbook(spreadsheetId: string, ranges: string[]) {
    workbookRequests.push({spreadsheetId, ranges})
    for (const range of ranges) {
      if (range.startsWith("'AFFILIATIONS_COACHS'!")) assert.equal(spreadsheetId, "affiliations-fixture")
      if (range.startsWith("'COACHS'!")) assert.equal(spreadsheetId, "actors-fixture")
      if (range.startsWith("'CLUBS'!")) assert.equal(spreadsheetId, "territorial-fixture")
    }
  }
  const transport = {
    spreadsheets: { values: {
      async batchGet({ spreadsheetId, ranges }: { spreadsheetId: string; ranges: string[] }) {
        checkWorkbook(spreadsheetId, ranges)
        reads.push(ranges)
        return { data: { valueRanges: ranges.map(range => {
          const match = range.match(/^'([^']+)'!([A-Z]+):([A-Z]+)$/)!
          const matrix = matrices.get(match[1] as CnacSheet)!
          if (match[2] !== match[3]) return { values: structuredClone(matrix) }
          const index = [...match[2]].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1
          return { values: matrix.map(row => [row[index] || ""]) }
        }) } }
      },
      async append({ spreadsheetId, range, requestBody }: { spreadsheetId: string; range: string; requestBody: { values: unknown[][] } }) {
        checkWorkbook(spreadsheetId, [range])
        if (failNextWrite) { failNextWrite = false; throw new Error("Simulated Sheets failure") }
        appends.push({ range, values: structuredClone(requestBody.values) })
        matrices.get(range.match(/^'([^']+)'/)![1] as CnacSheet)!.push(...structuredClone(requestBody.values))
        return { data: {} }
      },
      async batchUpdate({ spreadsheetId, requestBody }: { spreadsheetId: string; requestBody: { data: typeof updates } }) {
        checkWorkbook(spreadsheetId, requestBody.data.map(item=>item.range))
        if (failNextWrite) { failNextWrite = false; throw new Error("Simulated Sheets failure") }
        updates.push(...structuredClone(requestBody.data))
        for (const cell of requestBody.data) {
          const match = cell.range.match(/^'([^']+)'!([A-Z]+)(\d+)$/)!
          const index = [...match[2]].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1
          matrices.get(match[1] as CnacSheet)![Number(match[3]) - 1][index] = cell.values[0][0]
        }
        return { data: {} }
      },
    } },
  }
  const mocks: Record<string, unknown> = {
    "server-only": {},
    "next/server": { NextResponse: { json: Response.json } },
    "next/cache": { revalidatePath: (path: string, type?: string) => revalidations.push([path, type]) },
    "googleapis/build/src/apis/sheets": { sheets: () => transport, auth: { JWT: class {} } },
    [resolve(root, "lib/google/request.ts")]: { runGoogleRequest: (run: () => unknown) => run() },
    [resolve(root, "lib/google/sheets.ts")]: { getSheetsRows: () => { throw new Error("Lecture isolée inattendue") } },
    [resolve(root, "lib/cnac/config.ts")]: { cnacCredentials: () => ({ email: "fixture@example.invalid", key: "fixture" }), cnacWorkbook: (sheet: string) => sheet },
    [resolve(root, "lib/federations/config.ts")]: { getReferentialSpreadsheetId: () => "refs-fixture", getTerritorialSpreadsheetId: () => "territorial-fixture" },
    [resolve(root, "lib/cnac/actor-handler.ts")]: {
      writeAccess: async () => { accessChecks++; return authorized ? undefined : Response.json({ code: "ACCESS_DENIED" }, { status: 403 }) },
      errorResponse: (error: { code?: string; message?: string; status?: number }) => Response.json({ code: error.code, error: error.message }, { status: error.status || 500 }),
    },
    ...extraMocks,
  }
  if (realActors) {
    delete mocks[resolve(root, "lib/cnac/actor-handler.ts")]
    mocks[resolve(root, "lib/auth.ts")] = { canAccess: async () => authorized }
    mocks[resolve(root, "lib/acteurs/config.ts")] = { getActeursSpreadsheetId: () => "actors-fixture", getActeursAffiliationsSpreadsheetId: () => "affiliations-fixture" }
  }
  const modules = new Map<string, { exports: Record<string, unknown> }>()
  function load(path: string): Record<string, unknown> {
    if (path in mocks) return mocks[path] as Record<string, unknown>
    if (modules.has(path)) return modules.get(path)!.exports
    const module = { exports: {} }
    modules.set(path, module)
    const code = ts.transpileModule(readFileSync(path, "utf8"), { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    runInNewContext(code, {
      module, exports: module.exports, process: { env }, console,
      structuredClone, URL, setTimeout, clearTimeout,
      require: (specifier: string) => {
        if (specifier in mocks) return mocks[specifier]
        if (specifier.startsWith("@/") || specifier.startsWith(".")) {
          let target = specifier.startsWith("@/") ? resolve(root, specifier.slice(2)) : resolve(dirname(path), specifier)
          if (!/\.tsx?$/.test(target)) target += existsSync(target + ".tsx") ? ".tsx" : ".ts"
          return load(target)
        }
        return require(specifier)
      },
    }, { filename: path })
    return module.exports
  }
  const { territorialWrite } = load(resolve(root, "lib/cnac/territorial-handler.ts")) as { territorialWrite: (kind: string, request: Request, method: string) => Promise<Response> }
  const { loadFederationData } = load(resolve(root, "lib/federations/data.ts")) as { loadFederationData: (options: { connected: boolean }) => Promise<FederationData> }
  return { matrices, reads, appends, updates, revalidations, load, loadFederationData, territorialWrite, deny: () => { authorized = false }, accessChecks: () => accessChecks, failWrite: () => { failNextWrite = true } }
}

test("team training saves fifteen columns, reloads, preserves partial updates and clears explicitly", async () => {
  const f = fixture()
  const club = { id_club_cnac: "C1", id_federation: "FED1", nom_club: "Club test" } as SheetRecord
  f.matrices.get("CLUBS")!.push(CNAC_HEADERS.CLUBS.map(key => club[key] || ""))
  const schedule = [{ jour: 3, heure_debut: "16:00", heure_fin: "18:00" }, { jour: 1, heure_debut: "16:00", heure_fin: "18:00" }, { jour: 3, heure_debut: "09:00", heure_fin: "11:00" }]
  const training = { lieu_entrainement: "Salle test", adresse_entrainement: "Adresse précise", fuseau_horaire_entrainement: "Africa/Lubumbashi", planning_entrainement_json: JSON.stringify(schedule) }
  const basic = { id_federation: "FED1", id_club_cnac: "C1", nom_equipe: "Equipe test", id_categorie_age: "AGE1" }
  const created = await f.territorialWrite("equipes", request({ row: { ...basic, ...training } }), "POST")
  assert.equal(created.status, 200)
  const id = (await created.json()).row.id_equipe_cnac
  assert.equal(f.appends[0].range, "'EQUIPES'!A:O")
  assert.equal(f.appends[0].values[0].length, 15)
  const canonical = JSON.stringify([schedule[1], schedule[2], schedule[0]])
  assert.deepEqual(f.appends[0].values[0].slice(11), [training.lieu_entrainement, training.adresse_entrainement, training.fuseau_horaire_entrainement, canonical])
  const reloaded = await f.loadFederationData({ connected: true })
  assert.equal(reloaded.equipes[0].planning_entrainement_json, canonical)
  assert.equal(reloaded.equipes[0].adresse_entrainement, training.adresse_entrainement)
  const noPlanning = await f.territorialWrite("equipes", request({ row: { ...basic, nom_equipe: "Ancienne équipe vide" } }), "POST")
  assert.equal(noPlanning.status, 200)
  assert.deepEqual(f.appends[1].values[0].slice(11), ["", "", "", ""])
  const before = structuredClone(f.matrices.get("EQUIPES")![1].slice(11))
  assert.equal((await f.territorialWrite("equipes", request({ id, row: { observations: "Changer seulement la note" } }), "PUT")).status, 200)
  assert.deepEqual(f.matrices.get("EQUIPES")![1].slice(11), before)
  const reduced = JSON.stringify([{ jour: 5, heure_debut: "10:00", heure_fin: "12:00" }])
  assert.equal((await f.territorialWrite("equipes", request({ id, row: { planning_entrainement_json: reduced } }), "PUT")).status, 200)
  assert.equal(f.updates.at(-1)!.range, "'EQUIPES'!O2")
  assert.equal((await f.loadFederationData({ connected: true })).equipes[0].planning_entrainement_json, reduced)
  assert.equal((await f.territorialWrite("equipes", request({ id, row: { lieu_entrainement: "", adresse_entrainement: "", fuseau_horaire_entrainement: "", planning_entrainement_json: "[]" } }), "PUT")).status, 200)
  assert.deepEqual(f.matrices.get("EQUIPES")![1].slice(11), ["", "", "", "[]"])
  assert.ok(f.reads.flat().some(range => range === "'EQUIPES'!A:O"))
  assert.ok(f.revalidations.some(([path, type]) => path === "/dashboard/acteurs/athletes" && type === "layout"))
})

test("invalid team schedules and failed or unauthorized writes never succeed; historical anomalies remain", async () => {
  const f = fixture()
  const row: SheetRecord = { id_equipe_cnac: "T1", id_federation: "FED1", id_club_cnac: "C1", nom_equipe: "Equipe", id_categorie_age: "AGE1", planning_entrainement_json: "broken" }
  const club: SheetRecord = { id_club_cnac: "C1", id_federation: "FED1", nom_club: "Club" }
  f.matrices.get("CLUBS")!.push(CNAC_HEADERS.CLUBS.map(key => club[key] || ""))
  f.matrices.get("EQUIPES")!.push(CNAC_HEADERS.EQUIPES.map(key => row[key] || ""))
  assert.equal((await f.territorialWrite("equipes", request({ id: "T1", row: { observations: "Autre champ" } }), "PUT")).status, 200)
  assert.equal((await f.territorialWrite("equipes", request({ id: "T1", row: { ...row, observations: "Formulaire complet" } }), "PUT")).status, 200)
  assert.equal(f.matrices.get("EQUIPES")![1][14], "broken")
  const snapshots = structuredClone(f.matrices.get("EQUIPES"))
  for (const slots of [[{ jour: 1, heure_debut: "", heure_fin: "18:00" }], [{ jour: 1, heure_debut: "16:00", heure_fin: "18:00" }, { jour: 1, heure_debut: "17:00", heure_fin: "19:00" }]]) {
    const response = await f.territorialWrite("equipes", request({ id: "T1", row: { planning_entrainement_json: JSON.stringify(slots), fuseau_horaire_entrainement: "Africa/Kinshasa" } }), "PUT")
    assert.equal(response.status, 400)
    assert.equal((await response.json()).ok, undefined)
    assert.deepEqual(f.matrices.get("EQUIPES"), snapshots)
  }
  f.failWrite()
  const failure = await f.territorialWrite("equipes", request({ id: "T1", row: { observations: "Ne pas enregistrer" } }), "PUT")
  assert.ok(!failure.ok); assert.equal((await failure.json()).ok, undefined)
  assert.deepEqual(f.matrices.get("EQUIPES"), snapshots)
  f.deny()
  assert.equal((await f.territorialWrite("equipes", request({ id: "T1", row: { planning_entrainement_json: "[]" } }), "PUT")).status, 403)
  assert.deepEqual(f.matrices.get("EQUIPES"), snapshots)
})

test("team and athlete training summaries group local times, follow active team and show safe empty/anomaly states", () => {
  const f = fixture()
  const { AthleteTeamTraining, TeamTrainingSummary } = f.load(resolve(root, "components/dashboard/team-training-summary.tsx")) as { AthleteTeamTraining: ComponentType<{teams: SheetRecord[]; affiliation: SheetRecord}>; TeamTrainingSummary: ComponentType<{team?: SheetRecord}> }
  const first: SheetRecord = { id_equipe_cnac: "T1", id_club_cnac: "C1", id_federation: "FED1", nom_equipe: "Première équipe", lieu_entrainement: "Salle première", fuseau_horaire_entrainement: "Africa/Kinshasa", planning_entrainement_json: JSON.stringify([{jour:3,heure_debut:"16:00",heure_fin:"18:00"},{jour:1,heure_debut:"16:00",heure_fin:"18:00"},{jour:3,heure_debut:"09:00",heure_fin:"11:00"}]) }
  const second = { ...first, id_equipe_cnac: "T2", lieu_entrainement: "Salle seconde" }
  const affiliation = { id_equipe_cnac: "T1", id_club_cnac: "C1", id_federation: "FED1" }
  const render = (value: SheetRecord) => renderToStaticMarkup(createElement(AthleteTeamTraining, { teams: [first, second], affiliation: value }))
  const html = render(affiliation)
  assert.match(html, /Salle première/); assert.match(html, /Africa\/Kinshasa/)
  assert.ok(html.indexOf("Lundi") < html.indexOf("Mercredi"))
  assert.match(html, /9 h–11 h et 16 h–18 h/)
  assert.match(html, /ne confirme pas la présence effective/)
  assert.doesNotMatch(html, /heure_debut|planning_entrainement_json/)
  const changed = render({ ...affiliation, id_equipe_cnac: "T2" })
  assert.match(changed, /Salle seconde/); assert.doesNotMatch(changed, /Salle première/)
  assert.match(render({}), /Aucune équipe active/)
  assert.match(renderToStaticMarkup(createElement(TeamTrainingSummary, { team: {} })), /Aucun planning/)
  const anomaly = renderToStaticMarkup(createElement(TeamTrainingSummary, { team: { ...first, planning_entrainement_json: "{private broken" } }))
  assert.match(anomaly, /anomalie/); assert.doesNotMatch(anomaly, /private broken/)
})

for (const [kind, sheet, existingId, name, width, range] of [
  ["zones", "ZONES", "Z1", "nom_zone", 7, "'ZONES'!A:G"],
  ["ententes", "ENTENTES", "E1", "nom_entente", 13, "'ENTENTES'!A:M"],
] as const) {
  test(`${kind}: creation and edit ignore legacy division, preserve other cells and bound writes`, async () => {
    const f = fixture()
    const request = (body: unknown) => new Request("http://fixture.invalid/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const row = { id_federation: "FED1", [name]: "Nouvelle structure", ...(kind === "ententes" ? { id_structure_parent_coc: "L1", date_creation: "2026-10-02", observations: "NOUVELLE" } : { observations: "NOUVELLE" }), id_division: "D1", idDivision: "D2" }
    const created = await f.territorialWrite(kind, request({ row }), "POST")
    assert.equal(created.status, 200)
    const result = await created.json()
    assert.equal("id_division" in result.row, false)
    assert.equal("idDivision" in result.row, false)
    assert.ok(result.row[CNAC_KEYS[sheet]])
    assert.equal(result.row[CNAC_KEYS[sheet]], kind === "zones" ? "ZON-0001" : "ENT-0001")
    assert.equal(f.appends[0].range, range)
    assert.equal(f.appends[0].values[0].length, width)
    const createdRow = parseTable(sheet, f.matrices.get(sheet)!).rows.at(-1)!
    assert.equal(createdRow[name], "Nouvelle structure")
    assert.equal(createdRow.observations, "NOUVELLE")
    if (kind === "ententes") {
      assert.equal(createdRow.id_structure_parent_cnac, "L1")
      assert.equal(createdRow.date_creation, "2026-10-02")
    }
    const before = structuredClone(f.matrices.get(sheet)![1])
    const edited = await f.territorialWrite(kind, request({ id: existingId, row: { [name]: "Modifiée", id_division: "D4", idDivision: "D3" } }), "PUT")
    assert.equal(edited.status, 200)
    assert.equal("id_division" in (await edited.json()).row, false)
    assert.equal(f.updates.length, 1)
    assert.equal(f.updates[0].range, `'${sheet}'!${kind === "zones" ? "D" : "F"}2`)
    const after = f.matrices.get(sheet)![1]
    for (let index = 0; index < before.length; index++) if (index !== (CNAC_HEADERS[sheet] as readonly string[]).indexOf(name)) assert.equal(after[index], before[index])
    assert.ok(f.reads.flat().every(value => !value.includes("DIVISIONS") && !value.includes("CATEGORIES_CLUB")))
    assert.equal(f.accessChecks(), 2)
    assert.deepEqual(f.revalidations, [["/dashboard/federations/FED1", "layout"], ["/dashboard/federations/FED1", "layout"]])
    f.deny()
    assert.equal((await f.territorialWrite(kind, request({ row }), "POST")).status, 403)
    assert.equal(f.appends.length, 1)
  })
}

test("all federation screens and central referential load without DIVISIONS", async () => {
  const f = fixture()
  const data = await f.loadFederationData({ connected: true })
  assert.equal("divisions" in data, false)
  assert.equal(data.zones.length, 1)
  assert.equal(data.ententes[0].directParentId, "L1")
  assert.ok(f.reads.flat().every(value => !value.includes("DIVISIONS") && !value.includes("CATEGORIES_CLUB")))
  const central = await f.loadFederationData({ connected: true })
  assert.equal("divisions" in central, false)
  assert.ok(f.reads.flat().every(value => !value.includes("DIVISIONS") && !value.includes("CATEGORIES_CLUB")))
})

test("stale editor state and mappings discard division without mutating references or parent", () => {
  for (const kind of ["zones", "ententes"]) {
    const stale = { id_division: "D1", idDivision: "D2", id_structure_parent_coc: "L1", observations: "KEEP" }
    assert.deepEqual(territorialEditorRow(kind, stale), { id_structure_parent_coc: "L1", observations: "KEEP" })
    assert.equal(stale.id_division, "D1")
  }
  const zone = mapZoneRow({ id_zone_cnac: "Z1", id_division: "D1" })
  const entente = mapEntenteRow({ id_entente_coc: "E1", id_structure_parent_cnac: "L1", id_division: "D2" })
  assert.equal("id_division" in zone, false)
  assert.equal("id_division" in entente, false)
  assert.equal(entente.directParentId, "L1")
  assert.equal("division_applicable" in mapTypeStructureRow({ division_applicable: "OUI" }), false)
})

test("four real form renders have no Division field even when division_applicable is enabled", async () => {
  const noop = () => null
  // Le portail Radix est monté côté navigateur ; rendre ici son contenu inline.
  const inlineDialog = ({ children }: { children: ReactNode }) => createElement("div", null, children)
  const f = fixture({
    "next/navigation": { useRouter: () => ({ refresh: noop, replace: noop }) },
    [resolve(root, "lib/api/client.ts")]: { apiFetch: () => { throw new Error("Aucun appel réseau autorisé") } },
    [resolve(root, "components/dashboard/header.tsx")]: { Header: noop },
    [resolve(root, "components/dashboard/federation-logo-manager.tsx")]: { FederationLogoManager: noop },
    [resolve(root, "components/dashboard/entity-contacts-section.tsx")]: { EntityContactsSection: noop },
    [resolve(root, "components/ui/dialog.tsx")]: Object.fromEntries(["Dialog", "DialogContent", "DialogDescription", "DialogFooter", "DialogHeader", "DialogTitle"].map(key => [key, inlineDialog])),
    "next/link": { __esModule: true, default: ({ children, href }: { children: string; href: string }) => createElement("a", { href }, children) },
  })
  const data = await f.loadFederationData({ connected: true })
  const { default: Form } = f.load(resolve(root, "app/dashboard/federations/[id]/parametres/parametres-client.tsx")) as { default: ComponentType<{ data: FederationData; federationId: string; initialEditor: { resource: string; id?: string; row: SheetRecord } }> }
  for (const resource of ["zones", "ententes"] as const) {
    for (const edit of [false, true]) {
      const id = resource === "zones" ? "Z1" : "E1"
      const row = edit ? Object.fromEntries(Object.entries(data[resource][0]).map(([key, value]) => [key, String(value ?? "")])) : { id_federation: "FED1", statut: "ACTIF" }
      const html = renderToStaticMarkup(createElement(Form, { data, federationId: "FED1", initialEditor: { resource, ...(edit ? { id } : {}), row: { ...row, id_structure_parent_coc: resource === "ententes" ? "L1" : "", id_division: "D1", idDivision: "D2" } } }))
      assert.match(html, new RegExp(`${edit ? "Modifier" : "Ajouter"} ${resource === "zones" ? "zone" : "entente"}`))
      assert.match(html, new RegExp(resource === "zones" ? "Nom de la zone" : "Nom de l’entente"))
      assert.doesNotMatch(html, /Division|id_division|idDivision|Coming soon/)
      assert.doesNotMatch(html, /<(?:th|dt)\b[^>]*>Parent direct<\//)
      assert.match(html, /<th\b[^>]*>Sigle<\//)
      assert.match(html, /Enregistrer/)
      if (resource === "ententes") assert.match(html, /Ligue parent/)
      if (edit) assert.match(html, /value="(?:Zone|Entente) existante"/)
    }
  }
})

test("team creation and editing render each field once in the complete federation dialog", async () => {
  const base = fixture()
  const { TeamFormFields } = base.load(resolve(root, "components/dashboard/team-sporting-fields.tsx")) as { TeamFormFields: ComponentType<{ row: SheetRecord; update: () => void; refs: Record<string, SheetRecord[]> }> }
  const refs = Object.fromEntries([...base.matrices].map(([sheet, matrix]) => [sheet, parseTable(sheet, matrix).rows]))
  const noop = () => null
  const inlineDialog = ({ children }: { children: ReactNode }) => createElement("div", null, children)
  const f = fixture({
    "next/navigation": { useRouter: () => ({ refresh: noop, replace: noop }) },
    "next/link": { __esModule: true, default: ({ children, href }: { children: ReactNode; href: string }) => createElement("a", { href }, children) },
    [resolve(root, "components/dashboard/header.tsx")]: { Header: noop },
    [resolve(root, "components/dashboard/federation-logo-manager.tsx")]: { FederationLogoManager: noop },
    [resolve(root, "components/dashboard/entity-contacts-section.tsx")]: { EntityContactsSection: noop },
    [resolve(root, "components/dashboard/team-sporting-fields.tsx")]: { TeamSportingFields: (props: { row: SheetRecord; update: () => void }) => createElement(TeamFormFields, { ...props, refs }) },
    [resolve(root, "components/ui/dialog.tsx")]: Object.fromEntries(["Dialog", "DialogContent", "DialogDescription", "DialogFooter", "DialogHeader", "DialogTitle"].map(key => [key, inlineDialog])),
  })
  const data = await f.loadFederationData({ connected: true })
  const { default: Form } = f.load(resolve(root, "app/dashboard/federations/[id]/parametres/parametres-client.tsx")) as { default: ComponentType<{ data: FederationData; federationId: string; initialEditor: { resource: string; id?: string; row: SheetRecord } }> }
  for (const editing of [false, true]) {
    const html = renderToStaticMarkup(createElement(Form, { data, federationId: "FED1", initialEditor: { resource: "equipes", ...(editing ? { id: "T1" } : {}), row: { id_federation: "FED1", id_club_coc: "C1", nom_equipe: "Équipe conservée", id_equipe_federation: "FED-TEAM", statut: "ACTIF" } } }))
    const labels = [...html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)].map(match => match[1].replace(/<[^>]*>/g, "").trim())
    for (const field of ["Fédération", "Club", "Sport", "Discipline", "Nom de l’équipe", "Catégorie équipe", "Sexe", "Statut", "Observations", "ID fédéral"]) assert.equal(labels.filter(label => label.startsWith(field)).length, 1, `${editing ? "edit" : "create"}: ${field}`)
    assert.match(html, /value="Équipe conservée"/)
    assert.match(html, /value="FED-TEAM"/)
    assert.equal(labels.filter(label => label === "ID CNAC").length, editing ? 1 : 0)
  }
})

test("Zone and Entente detail pages render without Division and keep the direct parent", async () => {
  const f = fixture({
    "next/navigation": { notFound: () => { throw new Error("Fiche introuvable") } },
    [resolve(root, "components/dashboard/header.tsx")]: { Header: () => null },
    "next/link": { __esModule: true, default: ({ children, href }: { children: ReactNode; href: string }) => createElement("a", { href }, children) },
  })
  const { default: DetailPage } = f.load(resolve(root, "app/dashboard/federations/[id]/structures/[typeId]/[structureId]/page.tsx")) as { default: (props: { params: Promise<{ id: string; typeId: string; structureId: string }> }) => Promise<ReactElement> }
  for (const [typeId, structureId, name] of [["TYPSTR003", "Z1", "Zone existante"], ["TYPSTR004", "E1", "Entente existante"]]) {
    const html = renderToStaticMarkup(await DetailPage({ params: Promise.resolve({ id: "FED1", typeId, structureId }) }))
    assert.ok(html.includes(name))
    assert.doesNotMatch(html, /Division|id_division|idDivision|Coming soon/)
    if (structureId === "E1") {
      assert.match(html, /Parent direct/)
      assert.match(html, /Ligue test/)
      assert.match(html, /\+24300001/)
    }
  }
  assert.ok(f.reads.flat().every(value => !value.includes("DIVISIONS") && !value.includes("CATEGORIES_CLUB")))
})

test("authorized federation edits reach Sheets for Zone, Entente and identification", async () => {
  const f = fixture({}, { NODE_ENV: "test" })
  const request = (body: unknown, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/federations/zones", { method: "PUT", headers: { "Content-Type": "application/json", host: "localhost:3000", origin }, body: JSON.stringify(body) })
  for (const [resource, id, row] of [
    ["zones", "Z1", { nom_zone: "Modifiée localement" }],
    ["ententes", "E1", { nom_entente: "Modifiée localement" }],
    ["identification", "FED1", { observations: "Modification locale" }],
  ] as const) {
    const response = await f.territorialWrite(resource, request({ id, row }), "PUT")
    assert.equal(response.status, 200, resource)
  }
  assert.equal(f.updates.length, 3)
  assert.equal(f.accessChecks(), 3)
  assert.equal(parseTable("ZONES", f.matrices.get("ZONES")!).rows[0].nom_zone, "Modifiée localement")
  assert.equal(parseTable("ENTENTES", f.matrices.get("ENTENTES")!).rows[0].nom_entente, "Modifiée localement")
  assert.equal(parseTable("FEDERATIONS", f.matrices.get("FEDERATIONS")!).rows[0].observations, "Modification locale")
})


test("team form uses age references, ordered fields and current IDs in both modes", () => {
 const f=fixture()
 const {TeamFormFields}=f.load(resolve(root,"components/dashboard/team-sporting-fields.tsx")) as {TeamFormFields:ComponentType<{row:SheetRecord;refs:Record<string,SheetRecord[]>;update:()=>void}>}
 const refs=Object.fromEntries([...f.matrices].map(([sheet,matrix])=>[sheet,parseTable(sheet,matrix).rows]))
 refs.CATEGORIES_CLUB=[{id_categorie_club:"WRONG",nom_categorie_club:"Catégorie club interdite"}]
 const forms: SheetRecord[] = [{id_federation:"FED1"},{id_federation:"FED1",nom_equipe:"Elite",id_categorie_age:"AGE1",id_division:"D1",observations:"Conserver"}]
 for(const row of forms) {
  const html=renderToStaticMarkup(createElement(TeamFormFields,{row,refs,update:()=>{}}))
  const labels=["Fédération","Club","Sport","Discipline","Nom de l’équipe","Catégorie équipe","Sexe","Statut","Observations"]
  let previous=-1
  for(const label of labels){const index=html.indexOf(label);assert.ok(index>previous,label);previous=index}
  assert.doesNotMatch(html,/Division|Type de structure sportive|Structure sportive|Catégorie d’âge|Catégorie club interdite/)
  if(row.id_categorie_age){assert.match(html,/Seniors/);assert.match(html,/value="Elite"/);assert.match(html,/value="Conserver"/)}
 }
 const legacyHeaders=[...CNAC_HEADERS.EQUIPES,"id_type_structure_sportive","id_structure_sportive_cnac","id_division"]
 const legacyValues: SheetRecord = {id_equipe_cnac:"OLD",nom_equipe:"Ancienne",id_type_structure_sportive:"LEGACY",id_structure_sportive_cnac:"KEEP",id_division:"D1"}
 const legacy=parseTable("EQUIPES",[legacyHeaders,legacyHeaders.map(key=>(legacyValues[key]||""))])
 assert.equal(legacy.rows[0].nom_equipe,"Ancienne")
 assert.equal("id_type_structure_sportive" in legacy.rows[0],false)
 assert.equal("id_structure_sportive_cnac" in legacy.rows[0],false)
 assert.equal("id_division" in legacy.rows[0],false)
})


test("federation settings load actual CNAC age-category sheet without ownership columns",async()=>{
 const f=fixture()
 f.matrices.set("CATEGORIES_AGE",[["id_categorie_age","nom_categorie_age","âge_min","âge_max","observations"],["AGE1","Seniors","18","99",""]])
 f.matrices.get("EQUIPES")!.push(CNAC_HEADERS.EQUIPES.map(key=>({id_equipe_cnac:"T1",id_federation:"FED1",nom_equipe:"Équipe test",id_categorie_age:"AGE1"} as SheetRecord)[key]||""))
 const data=await f.loadFederationData({connected:true})
 assert.equal(data.equipes[0].nom_categorie_age,"Seniors")
 const {loadAffiliationReferences}=f.load(resolve(root,"lib/cnac/affiliation-data.ts")) as {loadAffiliationReferences:()=>Promise<Record<string,SheetRecord[]>>}
 const refs=await loadAffiliationReferences()
 assert.equal(refs.CATEGORIES_AGE[0].id_categorie_age,"AGE1")
 assert.equal(refs.CATEGORIES_AGE[0].nom_categorie_age,"Seniors")
})


test("athlete creation, identity edit, affiliation edit and reload use A:S without DIVISIONS",async()=>{
 const f=fixture({}, {NODE_ENV:"test"},true)
 const add=(sheet:CnacSheet,row:SheetRecord)=>f.matrices.get(sheet)!.push(CNAC_HEADERS[sheet].map(column=>row[column]||""))
 add("CLUBS",{id_club_cnac:"C1",id_federation:"FED1",id_structure_parent_cnac:"E1",nom_club:"Club X"})
 add("CLUBS",{id_club_cnac:"C2",id_federation:"FED1",nom_club:"Club Y"})
 add("SEXES",{id_sexe:"01",nom_sexe:"Masculin"})
 add("EQUIPES",{id_equipe_cnac:"T1",id_club_cnac:"C1",id_federation:"FED1",nom_equipe:"Senior",id_categorie_age:"AGE1"})
 add("EQUIPES",{id_equipe_cnac:"T2",id_club_cnac:"C2",id_federation:"FED1",nom_equipe:"Autre",id_categorie_age:"AGE1"})
 const {actorWrite}=f.load(resolve(root,"lib/cnac/actor-handler.ts")) as {actorWrite:(kind:string,request:Request,method:"POST"|"PUT")=>Promise<Response>}
 const identity={nom_complet:"Test Athlete",id_federation:"FED1",id_sexe:"01",date_de_naissance:"2000-01-01",telephone:"+243000000",observations:"KEEP",id_club_cnac:"C1",id_equipe_cnac:"T1"}
 const created=await actorWrite("athletes",request({row:identity}),"POST")
 assert.equal(created.status,200)
 const athlete=(await created.json()).row
 assert.equal(f.appends.at(-1)!.range,"'ATHLETES'!A:S")
 assert.equal(f.appends.at(-1)!.values[0].length,19)
 assert.equal(f.appends.at(-1)!.values[0][17],"C1")
 assert.equal(f.appends.at(-1)!.values[0][18],"T1")
 const edited=await actorWrite("athletes",request({id:athlete.id_athlete_cnac,row:{nom_complet:"Updated Athlete"}}),"PUT")
 assert.equal(edited.status,200)
 const moved=await actorWrite("athletes",request({id:athlete.id_athlete_cnac,row:{id_club_cnac:"C2",id_equipe_cnac:"T2"}}),"PUT")
 assert.equal(moved.status,200)
 const {getSheetRows,clearSheetCache}=f.load(resolve(root,"lib/cnac/sheets.ts")) as {getSheetRows:(params:unknown)=>Promise<SheetRecord[]>;clearSheetCache:()=>void}
 clearSheetCache()
 const [reloaded]=await getSheetRows({sheetName:"ATHLETES",spreadsheetId:"actors-fixture",bypassCache:true})
 for(const [key,value] of Object.entries({...identity,nom_complet:"Updated Athlete",id_club_cnac:"C2",id_equipe_cnac:"T2"}))assert.equal(reloaded[key],value)
 assert.equal("id_division" in reloaded,false)
 assert.ok(f.updates.some(cell=>cell.range==="'ATHLETES'!R2"))
 assert.ok(f.updates.some(cell=>cell.range==="'ATHLETES'!S2"))
 assert.ok(f.updates.every(cell=>!/^'ATHLETES'![Y-Z]/.test(cell.range)))
 assert.ok(f.reads.flat().every(range=>!range.includes("DIVISIONS")))
 assert.ok(f.reads.flat().filter(range=>range.startsWith("'ATHLETES'!")&&!/^'ATHLETES'!([A-Z]+):\1$/.test(range)).every(range=>range==="'ATHLETES'!A:S"))
 const before=structuredClone(f.matrices.get("ATHLETES"))
 const obsolete=await actorWrite("athletes",request({id:athlete.id_athlete_cnac,row:{id_division:"D1"}}),"PUT")
 assert.equal(obsolete.status,400)
 assert.deepEqual(f.matrices.get("ATHLETES"),before)
})

test("athlete creation and edit forms retain club and filtered team choices without Division",()=>{
 const f=fixture()
 const {AthleteAffiliationFields}=f.load(resolve(root,"components/dashboard/athlete-affiliation.tsx")) as {AthleteAffiliationFields:ComponentType<{value:SheetRecord;refs:Record<string,SheetRecord[]>;update:()=>void}>}
 const refs=Object.fromEntries([...f.matrices].map(([sheet,matrix])=>[sheet,parseTable(sheet,matrix).rows]))
 refs.CLUBS=[{id_club_cnac:"C1",id_federation:"FED1",id_structure_parent_cnac:"E1",nom_club:"Club X"}]
 refs.EQUIPES=[{id_equipe_cnac:"T1",id_federation:"FED1",id_club_cnac:"C1",nom_equipe:"Senior Messieurs",id_categorie_age:"AGE1"}]
 refs.SPORTS=[{id_sport:"SP1",utilise_equipes:"OUI"}]
 refs.FEDERATIONS[0].id_sport="SP1"
 const value={id_federation:"FED1",id_club_cnac:"C1",id_equipe_cnac:"T1"}
 for(const form of [value,{...value,id_club_cnac:"",id_equipe_cnac:""}]){
  const html=renderToStaticMarkup(createElement(AthleteAffiliationFields,{value:form,refs,update:()=>{}}))
  assert.doesNotMatch(html,/Division|id_division|division_applicable/)
  let last=-1;for(const label of ["F\u00e9d\u00e9ration","Club","\u00c9quipe"]){const index=html.indexOf(label);assert.ok(index>last);last=index}
  if(form.id_equipe_cnac)assert.match(html,/Club X \u2013 Senior Messieurs/)
 }
 refs.SPORTS[0].utilise_equipes="NON"
 const individual=renderToStaticMarkup(createElement(AthleteAffiliationFields,{value:{...value,id_equipe_cnac:""},refs,update:()=>{}}))
 assert.doesNotMatch(individual,/\u00c9quipe<\/label>/)
})

test("team reference service never requests divisions",async()=>{
 const f=fixture()
 const {loadTeamReferences}=f.load(resolve(root,"lib/cnac/affiliation-data.ts")) as {loadTeamReferences:()=>Promise<Record<string,SheetRecord[]>>}
 const refs=await loadTeamReferences()
 assert.equal(refs.CATEGORIES_AGE[0].nom_categorie_age,"Seniors")
 assert.equal("DIVISIONS" in refs,false)
 assert.ok(f.reads.flat().every(range=>!range.includes("DIVISIONS")))
})

test("athlete reference loading succeeds with no DIVISIONS matrix",async()=>{
 const f=fixture()
 const {loadAffiliationReferences}=f.load(resolve(root,"lib/cnac/affiliation-data.ts")) as {loadAffiliationReferences:()=>Promise<Record<string,SheetRecord[]>>}
 const refs=await loadAffiliationReferences()
 assert.equal("DIVISIONS" in refs,false)
 assert.ok(refs.CLUBS)
 assert.ok(f.reads.flat().every(range=>!range.includes("DIVISIONS")))
})

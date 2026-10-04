import { cnacUploadAvailability } from "../../lib/cnac/media-config.ts"
import assert from "node:assert/strict"
import test from "node:test"
import { CNAC_HEADERS } from "../../lib/cnac/schema.ts"
import { booleanCell,civilDate,displayCivilDate,parseTable,sheetDate,updateCells,appendValues } from "../../lib/cnac/model.ts"
import { cnacCredentials,cnacWorkbook } from "../../lib/cnac/config.ts"
import { cnacError } from "../../lib/cnac/errors.ts"
import { actorPatch } from "../../lib/cnac/actors-model.ts"
import { parentKind,resolveTerritorialRows,territorialPatch } from "../../lib/cnac/territorial-model.ts"
import { sexCode,sexId } from "../../lib/cnac/display.ts"
import { mapTypeStructureRow } from "../../lib/federations/mappers.ts"

const refs={FEDERATIONS:[{id_federation:"FED001",id_sport:"SP01"},{id_federation:"FED002",id_sport:"SP02"}],ENTITES:[{id_entite:"ENT001"}],SEXES:[{id_sexe:"01"},{id_sexe:"02"},{id_sexe:"03"}],SPECIALITES_MEDECIN:[{id_specialite_sante:"SPE01"}],TYPES_STRUCTURE:[{id_type_structure:"T1",nom_type_structure:"FEDERATION"},{id_type_structure:"T2",nom_type_structure:"LIGUE"},{id_type_structure:"T3",nom_type_structure:"CERCLE"},{id_type_structure:"T4",nom_type_structure:"CLUB"}],PROVINCES:[{id_province:"P1"}],VILLES:[{id_ville:"V1",id_province:"P1"}],CATEGORIES_CLUB:[{id_categorie_club:"CAT1",id_federation:"FED002"}]}
function tableRows(sheet:keyof typeof CNAC_HEADERS,rows:Record<string,unknown>[]) { const headers=[...CNAC_HEADERS[sheet]];return [headers,...rows.map(row=>headers.map(key=>row[key]??""))] }

test("CNAC exact headers resolve internal and federation identities separately",()=>{
  const table=parseTable("ATHLETES",tableRows("ATHLETES",[{id_athlete_cnac:"0001",id_athlete_federation:"FED-007",id_sexe:"01",telephone:"+24300123",nom_complet:"Test"}]))
  assert.equal(table.rows[0].id_athlete_coc,"0001");assert.equal(table.rows[0].id_athlete_cnac,"0001");assert.equal(table.rows[0].id_athlete_federation,"FED-007");assert.equal(table.rows[0].id_sexe,"01");assert.equal(table.rows[0].telephone,"+24300123")
})

test("referential contracts load without the removed sheet and structure flag",()=>{
 assert.equal("DIVISIONS" in CNAC_HEADERS,false)
 const table=parseTable("TYPES_STRUCTURE",[["id_type_structure","nom_type_structure","description","observations"],["TYPSTR003","ZONE","",""]])
 assert.deepEqual(mapTypeStructureRow(table.rows[0]),{id_type_structure:"TYPSTR003",nom_structure:"ZONE"})
})
test("Missing column, blank cell and unknown relation remain distinct",()=>{
  assert.throws(()=>parseTable("ATHLETES",[["id_athlete_cnac"]]),/Colonnes absentes/)
  const rows=parseTable("ATHLETES",tableRows("ATHLETES",[{id_athlete_cnac:"A",id_federation:"UNKNOWN"}])).rows
  assert.equal(rows[0].email,"");assert.equal(rows[0].id_federation,"UNKNOWN")
})
test("athlete media columns are preserved during reading and identity updates",()=>{
 const headers=[...CNAC_HEADERS.ATHLETES]
 const table=parseTable("ATHLETES",[headers,headers.map(key=>key==="id_athlete_cnac"?"A":key.endsWith("_url")?"https://fixture.invalid/file":"")])
 assert.equal(table.rows[0].avatar_drive_url,"https://fixture.invalid/file")
 assert.equal(table.rows[0].passeport_drive_url,"https://fixture.invalid/file")
 const patch=actorPatch("athletes",{nom_complet:"Changed",avatar_drive_url:"ignored"},{...table.rows[0],id_federation:"FED001",id_sexe:"01"},refs,table.rows)
 assert.deepEqual(patch,{nom_complet:"Changed"})
})

test("Federation logos from copied referential columns are not exposed",()=>{
 const headers=[...CNAC_HEADERS.FEDERATIONS,"logo_drive_id","logo_drive_url"]
 const values=[headers,headers.map(key=>key==="id_federation"?"FED001":key.startsWith("logo_drive_")?"legacy-logo":"")]
 const row=parseTable("FEDERATIONS",values).rows[0]
 assert.equal("logo_drive_id" in row,false);assert.equal("logo_drive_url" in row,false)
})
test("Empty sheets and unchecked contact-only rows do not create records",()=>{
  assert.deepEqual(parseTable("ATHLETES",[CNAC_HEADERS.ATHLETES as unknown as string[]]).rows,[])
  const contacts=parseTable("PERSONNES_CONTACT_ENTITES",tableRows("PERSONNES_CONTACT_ENTITES",[{est_contact_principal:false},{id_contact_entite:"P1",est_contact_principal:false}]))
  assert.equal(contacts.rows.length,1);assert.deepEqual(contacts.rowNumbers,[3]);assert.equal(booleanCell(contacts.rows[0].est_contact_principal),false)
  assert.equal(booleanCell("VRAI"),true)
})
test("Civil dates handle native serials, ISO, French dates and empty values",()=>{
  assert.equal(civilDate(2),"1900-01-01");assert.equal(civilDate("29/02/2024"),"2024-02-29");assert.equal(displayCivilDate("2024-02-29"),"29/02/2024")
  assert.equal(civilDate(""),"");assert.equal(sheetDate(""),"");assert.equal(civilDate(sheetDate("2000-01-01")),"2000-01-01")
  assert.throws(()=>civilDate("31/02/2026"),/invalide/);assert.throws(()=>civilDate("not a date"),/inconnu/)
})
test("Partial update uses fresh ID location through empty physical rows",()=>{
  const values=tableRows("ATHLETES",[{id_athlete_cnac:"B",nom_complet:"B"},{},{id_athlete_cnac:"A",nom_complet:"A",avatar_drive_id:"old-avatar",observations:"Keep",telephone:"+24300000"}])
  const table=parseTable("ATHLETES",values),cells=updateCells(table,"ATHLETES","id_athlete_coc","A",[{column:"nom_complet",value:"New"}])
  assert.equal(cells.length,1);assert.equal(cells[0].rowNumber,4);assert.equal(table.rows[1].avatar_drive_id,"old-avatar");assert.equal(table.rows[1].observations,"Keep")
  assert.throws(()=>updateCells(table,"ATHLETES","id_athlete_cnac","A",[{column:"id_athlete_cnac",value:"X"}]),/immuable/)
})
test("Duplicates and absent targets refuse writes",()=>{
  const table=parseTable("ATHLETES",tableRows("ATHLETES",[{id_athlete_cnac:"A"},{id_athlete_cnac:"A"}]))
  assert.throws(()=>updateCells(table,"ATHLETES","id_athlete_cnac","A",[{column:"email",value:"a@b.c"}]),/dupliqué/)
  assert.throws(()=>updateCells(table,"ATHLETES","id_athlete_cnac","X",[]),/introuvable/)
})
test("Service account configuration is mandatory and private key escaped lines supported",()=>{
  assert.throws(()=>cnacCredentials({}),/non configurée/)
  assert.throws(()=>cnacCredentials({GOOGLE_SERVICE_ACCOUNT_EMAIL:"A_COMPLETER",GOOGLE_PRIVATE_KEY:"A_COMPLETER"}),/non configurée/)
  assert.equal(cnacCredentials({GOOGLE_SERVICE_ACCOUNT_EMAIL:"test@example.invalid",GOOGLE_PRIVATE_KEY:"line1\\nline2"}).key,"line1\nline2")
  assert.throws(()=>cnacWorkbook("USERS","users",{}),/autorisés/)
  assert.throws(()=>cnacWorkbook("ATHLETES","wrong",{GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID:"actors"}),/classeur/)
})
test("Permission, quota and source failures receive different safe diagnoses",()=>{
  assert.equal(cnacError({response:{status:403}}).code,"GOOGLE_PERMISSION");assert.equal(cnacError({response:{status:429}}).status,429)
  assert.equal(cnacError(new Error("PRIVATE_SECRET_MUST_NOT_LEAK")).message.includes("PRIVATE_SECRET"),false)
})
test("Person sex selection preserves 01/02, excludes mixed, and never coerces unknown",()=>{
  assert.equal(sexId("FEMININ"),"02");assert.equal(sexId("MASCULIN"),"01");assert.equal(sexCode("UNKNOWN"),"UNKNOWN")
  const valid={nom_complet:"Test",id_federation:"FED001",id_sexe:"01"}
  assert.equal(actorPatch("athletes",valid,undefined,refs,[]).id_sexe,"01")
  assert.throws(()=>actorPatch("athletes",{...valid,id_sexe:"03"},undefined,refs,[]),/personne/)
})
test("Actor edits preserve omitted passports, nationality and relations",()=>{
  const current={id_medecin_cnac:"MED.000001",nom_complet:"Test",id_entite:"ENT001",id_sexe:"02",id_specialite_sante:"SPE01",passeport_drive_id:"ORIGINAL",nationalite:"RDC"}
  const patch=actorPatch("medecins",{telephone:"+243000001"},current,refs,[current])
  assert.deepEqual(patch,{telephone:"+243000001"});assert.equal(current.passeport_drive_id,"ORIGINAL")
  assert.throws(()=>actorPatch("medecins",{id_medecin_cnac:"NEW"},current,refs,[current]),/immuable/)
  assert.throws(()=>actorPatch("medecins",{id_specialite:"INVALID"},current,refs,[current]),/Spécialité/)
})
test("No national ID required and entity cannot be replaced with federation",()=>{
  assert.doesNotThrow(()=>actorPatch("athletes",{nom_complet:"Test",id_federation:"FED001",id_sexe:"02"},undefined,refs,[]))
  assert.throws(()=>actorPatch("officiels",{nom_complet:"Test",id_federation:"FED001",id_sexe:"01"},undefined,refs,[]),/n’existe pas/)
  assert.throws(()=>actorPatch("autres",{nom_complet:"Test",id_entite:"ENT001",id_sexe:"01",id_international:"X"},undefined,refs,[]),/n’existe pas/)
})

const territorial={HIERARCHIE:[{id_hierarchie:"H1",id_federation:"FED001",id_type_structure:"TYPSTR001",niveau_hierarchique:"1"},{id_hierarchie:"H2",id_federation:"FED001",id_type_structure:"TYPSTR002",niveau_hierarchique:"2"},{id_hierarchie:"H3",id_federation:"FED001",id_type_structure:"TYPSTR005",niveau_hierarchique:"3"},{id_hierarchie:"H4",id_federation:"FED001",id_type_structure:"TYPSTR006",niveau_hierarchique:"4"}],LIGUES:[{id_ligue_cnac:"L1",id_federation:"FED001",nom_ligue:"League",id_province:"P1"}],ENTENTES:[],CERCLES:[{id_cercle_cnac:"R1",id_federation:"FED001",id_structure_parent_cnac:"L1",nom_cercle:"Circle"}],CLUBS:[{id_club_cnac:"C1",id_federation:"FED001",id_structure_parent_cnac:"R1",nom_club:"Club"}],EQUIPES:[{id_equipe_cnac:"Q1",id_federation:"FED001",id_club_cnac:"C1"}]}
test("Different territorial parents derive ancestors without inventing an entente",()=>{
  assert.equal(parentKind("clubs","FED001",territorial,refs),"cercles")
  const resolved=resolveTerritorialRows(territorial)
  assert.equal(resolved.CLUBS[0].id_ligue_coc,"L1");assert.equal(resolved.CLUBS[0].id_cercle_coc,"R1");assert.equal(resolved.CLUBS[0].id_entente_coc,"")
  assert.equal(resolved.EQUIPES[0].parent_label,"Club")
})
test("Zone is a valid root entity and configured leagues select Zone as their direct parent",()=>{
 const data={...territorial,ZONES:[],LIGUES:[],HIERARCHIE:[{id_hierarchie:"HF",id_federation:"FED001",id_type_structure:"TYPSTR001",niveau_hierarchique:"1"},{id_hierarchie:"HZ",id_federation:"FED001",id_type_structure:"TYPSTR003",niveau_hierarchique:"2"},{id_hierarchie:"HL",id_federation:"FED001",id_type_structure:"TYPSTR002",niveau_hierarchique:"3"}]}
 const refsWithTypes={...refs,TYPES_STRUCTURE:[{id_type_structure:"TYPSTR001",nom_type_structure:"FEDERATION"},{id_type_structure:"TYPSTR002",nom_type_structure:"LIGUE"},{id_type_structure:"TYPSTR003",nom_type_structure:"ZONE"}]}
 assert.equal(parentKind("zones","FED001",data,refsWithTypes),undefined)
 assert.equal(parentKind("ligues","FED001",data,refsWithTypes),"zones")
 const zone=territorialPatch("zones",{id_federation:"FED001",nom_zone:"Zone Nord"},undefined,data,refsWithTypes)
 assert.deepEqual(zone,{id_federation:"FED001",nom_zone:"Zone Nord"})
 const withZone={...data,ZONES:[{id_zone_cnac:"ZONE1",id_federation:"FED001",nom_zone:"Zone Nord"}]}
 const league=territorialPatch("ligues",{id_federation:"FED001",nom_ligue:"Ligue Nord",id_province:"P1",id_structure_parent_coc:"ZONE1"},undefined,withZone,refsWithTypes)
 assert.equal(league.id_structure_parent_cnac,"ZONE1")
})
test("Missing and cross-federation parents are diagnostic values, not hidden records",()=>{
  const data={...territorial,CLUBS:[{id_club_cnac:"C2",id_federation:"FED001",id_structure_parent_cnac:"MISSING"},{id_club_cnac:"C3",id_federation:"FED002",id_structure_parent_cnac:"R1"}]}
  const rows=resolveTerritorialRows(data).CLUBS
  assert.equal(rows.length,2);assert.match(rows[0].relation_issue,/introuvable/);assert.match(rows[1].relation_issue,/autre fédération/)
})
test("Territorial form validates actual parent and owner and retains partial patch",()=>{
  const current=territorial.CLUBS[0]
  assert.deepEqual(territorialPatch("clubs",{nom_club:"Renamed"},current,territorial,refs),{nom_club:"Renamed"})
  assert.throws(()=>territorialPatch("clubs",{id_categorie:"CAT1"},current,territorial,refs),/autre fédération/)
  assert.throws(()=>territorialPatch("clubs",{id_cercle_coc:"MISSING"},current,territorial,refs),/Parent introuvable/)
})


test("Duplicated territorial parents remain ambiguous rather than choosing a record",()=>{
 const data={...territorial,CERCLES:[...territorial.CERCLES,{...territorial.CERCLES[0],nom_cercle:"Duplicate"}]}
 assert.match(resolveTerritorialRows(data).CLUBS[0].relation_issue,/ambigu/)
})

test("Missing optional OAuth disables uploads without altering Sheets configuration",()=>{
 assert.deepEqual(cnacUploadAvailability({}),{avatar:false,passeport:false,logo:false})
 assert.deepEqual(cnacUploadAvailability({GOOGLE_OAUTH_CLIENT_ID:"client",GOOGLE_OAUTH_CLIENT_SECRET:"secret",GOOGLE_DRIVE_REFRESH_TOKEN:"token",GOOGLE_DRIVE_ACTEURS_AVATARS_FOLDER_ID:"folder",GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID:"logos"}),{avatar:false,passeport:false,logo:false})
})

test("Native contact booleans retain the canonical value used by principal-contact validation",()=>{
 const headers=[...CNAC_HEADERS.PERSONNES_CONTACT_ENTITES]
 const values=headers.map(key=>key==="id_contact_entite"?"PCE1":key==="est_contact_principal"?true:"")
 assert.equal(parseTable("PERSONNES_CONTACT_ENTITES",[headers,values]).rows[0].est_contact_principal,"TRUE")
})


test("CNAC age categories accept actual global headers and preserve accented physical columns",()=>{
 const headers=["id_categorie_age","nom_categorie_age","âge_min","âge_max","observations"]
 const table=parseTable("CATEGORIES_AGE",[headers,["AGE001","Seniors","18","99","Conserver"]])
 assert.equal(table.rows[0].id_categorie_age,"AGE001")
 assert.equal(table.rows[0].nom_categorie_age,"Seniors")
 assert.equal(table.rows[0].age_min,"18")
 assert.equal(table.rows[0].age_max,"99")
 assert.deepEqual(table.headers,headers)
 const cells=updateCells(table,"CATEGORIES_AGE","id_categorie_age","AGE001",[{column:"age_min",value:"19"}])
 assert.equal(cells[0].columnIndex,2)
 assert.deepEqual(appendValues({...table,rows:[]},"CATEGORIES_AGE",{id_categorie_age:"AGE002",nom_categorie_age:"Juniors",age_min:"16",age_max:"17",observations:""}),["AGE002","Juniors","16","17",""])
 assert.throws(()=>parseTable("CATEGORIES_AGE",[["nom_categorie_age"]]),/id_categorie_age/)
 assert.throws(()=>parseTable("CATEGORIES_AGE",[["id_categorie_age"]]),/nom_categorie_age/)
 assert.throws(()=>parseTable("CATEGORIES_AGE",[[...headers,"age_min"]]),/dupliqués/)
 const scopedRow: Record<string,string> = {id_categorie_age:"AGE003",nom_categorie_age:"U18",id_federation:"FED001",id_sport:"SP01",id_discipline:"DIS01"}
 const scoped=parseTable("CATEGORIES_AGE",[[...CNAC_HEADERS.CATEGORIES_AGE],CNAC_HEADERS.CATEGORIES_AGE.map(key=>(scopedRow[key]||""))])
 assert.equal(scoped.rows[0].id_federation,"FED001")
})

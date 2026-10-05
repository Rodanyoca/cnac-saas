import test from "node:test"
import assert from "node:assert/strict"
import { CNAC_HEADERS } from "../../lib/cnac/schema.ts"
import { parseTable,updateCells } from "../../lib/cnac/model.ts"
import { actorPatch } from "../../lib/cnac/actors-model.ts"

// Fixture locale, aucune API Google : résultat final comparé aux données de départ.
test("Actor edit targets its current row after insertion and preserves every unrelated cell",()=>{
 const headers=[...CNAC_HEADERS.ATHLETES]
 const make=(id:string,name:string)=>headers.map(key=>({id_athlete_cnac:id,nom_complet:name,id_federation:"FED001",id_sexe:"01",avatar_drive_id:"COPIED_ORIGINAL",nationalite:"RDC",observations:"KEEP"} as Record<string,string>)[key]||"")
 const matrix:(string|number|boolean)[][]=[headers,make("ATH.NEW","Inserted"),[],make("ATH.000001","Original"),make("ATH.000002","Other")]
 const before=structuredClone(matrix)
 const table=parseTable("ATHLETES",matrix),current=table.rows.find(row=>row.id_athlete_cnac==="ATH.000001")!
 const patch=actorPatch("athletes",{telephone:"+243000001",date_de_naissance:"05/06/2000"},current,{FEDERATIONS:[{id_federation:"FED001"}],SEXES:[{id_sexe:"01"}]},table.rows)
 const cells=updateCells(table,"ATHLETES","id_athlete_cnac","ATH.000001",Object.entries(patch).map(([column,value])=>({column,value})))
 assert.ok(cells.every(cell=>cell.rowNumber===4))
 for(const cell of cells)matrix[cell.rowNumber-1][cell.columnIndex]=cell.value
 assert.deepEqual(matrix[1],before[1]);assert.deepEqual(matrix[4],before[4])
 const after=parseTable("ATHLETES",matrix).rows.find(row=>row.id_athlete_cnac==="ATH.000001")!
 assert.equal(after.telephone,"+243000001");assert.equal(after.date_de_naissance,"2000-06-05")
 for(const key of ["avatar_drive_id","nationalite","observations","id_federation","id_athlete_cnac"])assert.equal(after[key],current[key])
})

test("Typed contact edit stores boolean TRUE and plural observations without overwriting actor identity",()=>{
 const headers=[...CNAC_HEADERS.PERSONNES_CONTACT_ENTITES]
 const record={id_contact_entite:"PCE1",id_entite:"ENT001",id_type_acteur:"TYPACT003",id_acteur_cnac:"MED.000001",fonction_contact:"Medical",est_contact_principal:"FALSE",statut:"ACTIF",observations:"KEEP"}
 const matrix=[headers,headers.map(key=>record[key])]
 const table=parseTable("PERSONNES_CONTACT_ENTITES",matrix)
 const cells=updateCells(table,"PERSONNES_CONTACT_ENTITES","id_contact_entite","PCE1",[{column:"est_contact_principal",value:"TRUE"},{column:"observation",value:"Changed"}])
 assert.equal(cells[0].value,true);assert.equal(cells[1].columnIndex,headers.indexOf("observations"))
 assert.ok(cells.every(cell=>!["id_contact_entite","id_entite","id_type_acteur","id_acteur_cnac"].includes(headers[cell.columnIndex])))
})

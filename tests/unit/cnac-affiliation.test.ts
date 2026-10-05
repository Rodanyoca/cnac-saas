import assert from "node:assert/strict"
import test from "node:test"
import { actorPatch } from "../../lib/cnac/actors-model.ts"
import { territorialPatch } from "../../lib/cnac/territorial-model.ts"
import { teamCategory, activeAffiliationLabel, athleteAffiliationContext, sportUsesTeams, teamsForClub, updateAffiliation, type AffiliationReferences } from "../../lib/cnac/affiliation-model.ts"
import { appendValues, parseTable, updateCells } from "../../lib/cnac/model.ts"
import { CNAC_HEADERS } from "../../lib/cnac/schema.ts"

const refs: AffiliationReferences = {
  FEDERATIONS: [{id_federation:"F1",id_sport:"SP1",nom_federation:"Nationale X"},{id_federation:"F2",id_sport:"SP2"}],
  SPORTS: [{id_sport:"SP1",utilise_equipes:"OUI"},{id_sport:"SP2",utilise_equipes:"NON"}],
  CATEGORIES_AGE: [{id_categorie_age:"AGE1",nom_categorie_age:"Seniors"}],
  SEXES: [{id_sexe:"01"}], HIERARCHIE: [],
  CLUBS:[{id_club_cnac:"C1",id_federation:"F1",nom_club:"V Club",id_structure_parent_cnac:"E1"},{id_club_cnac:"C2",id_federation:"F1"},{id_club_cnac:"C3",id_federation:"F2"}],
  EQUIPES:[{id_equipe_cnac:"T1",id_club_cnac:"C1",id_federation:"F1",nom_equipe:"Seniors",id_categorie_age:"AGE1"},{id_equipe_cnac:"T2",id_club_cnac:"C2",id_federation:"F1"}],
  ZONES:[{id_zone_cnac:"Z1",id_federation:"F1",nom_zone:"Zone X"}],
  ENTENTES:[{id_entente_cnac:"E1",id_federation:"F1",nom_entente:"Entente X"}],
  CERCLES:[{id_cercle_cnac:"R1",id_federation:"F1",nom_cercle:"Cercle X"}],
  LIGUES:[{id_ligue_cnac:"L1",id_federation:"F1",nom_ligue:"Ligue nationale X"}],
}
const athlete={id_athlete_cnac:"A1",nom_complet:"Alice",id_federation:"F1",id_sexe:"01",id_club_cnac:"C1",id_equipe_cnac:"T1"}
test("current EQUIPES headers load without removed sporting columns and reject writes to them", () => {
 const headers = [...CNAC_HEADERS.EQUIPES]
 const row = { id_equipe_cnac: "T1", id_federation: "F1", id_club_cnac: "C1", id_categorie_age: "AGE1", nom_equipe: "Seniors" }
 const table = parseTable("EQUIPES", [headers, headers.map(key => row[key as keyof typeof row] || "")])
 assert.equal(table.rows[0].nom_equipe, "Seniors")
 assert.equal(appendValues({ ...table, rows: [] }, "EQUIPES", row).length, 15)
 assert.throws(() => parseTable("EQUIPES", [headers.filter(key => key !== "id_club_cnac")]), /id_club_cnac/)
 const legacy = parseTable("EQUIPES", [[...headers, "id_type_structure_sportive", "id_structure_sportive_cnac", "id_division"], [...headers.map(key => row[key as keyof typeof row] || ""), "OLD", "OLD", "D4"]])
 for (const column of ["id_type_structure_sportive", "id_structure_sportive_cnac", "id_division"]) {
  assert.equal(column in legacy.rows[0], false)
  assert.throws(() => updateCells(legacy, "EQUIPES", "id_equipe_cnac", "T1", [{ column, value: "OLD" }]), /Colonne absente/)
 }
})
test("team attachment changes validate the category while unrelated legacy edits remain possible", () => {
 const legacy = { id_equipe_cnac: "T1", id_federation: "F1", id_club_cnac: "C1", nom_equipe: "Ancienne" }
 assert.deepEqual(territorialPatch("equipes", { nom_equipe: "Renommée" }, legacy, refs, refs), { nom_equipe: "Renommée" })
 assert.throws(() => territorialPatch("equipes", { id_club_cnac: "C2" }, legacy, refs, refs), /catégorie équipe/)
 assert.throws(() => territorialPatch("equipes", { id_categorie_age: "UNKNOWN" }, legacy, refs, refs), /introuvable/)
 assert.deepEqual(territorialPatch("equipes", { id_categorie_age: "AGE1", id_club_cnac: "C2" }, legacy, refs, refs), { id_categorie_age: "AGE1", id_club_cnac: "C2" })
})
test("athletes can be created with federation and optional club without a territorial parent",()=>{
 const value={nom_complet:athlete.nom_complet,id_sexe:athlete.id_sexe,id_federation:"F1",id_club_cnac:"",id_equipe_cnac:""}
 assert.equal(actorPatch("athletes",value,undefined,refs,[]).id_federation,"F1")
 assert.equal(actorPatch("athletes",{...value,id_club_cnac:"C2"},undefined,refs,[]).id_club_cnac,"C2")
})
test("teams require a reference ID on creation and editing; legacy reads stay tolerant",()=>{
 const input={nom_equipe:"Seniors",id_federation:"F1",id_club_cnac:"C1",id_categorie_age:"AGE1",id_division:"D1"}
 assert.throws(()=>territorialPatch("equipes",{...input,id_categorie_age:""},undefined,refs,refs),/catégorie équipe/)
 assert.throws(()=>territorialPatch("equipes",{...input,id_categorie_age:"Seniors"},undefined,refs,refs),/introuvable/)
 const patch=territorialPatch("equipes",input,undefined,refs,refs)
 assert.equal(patch.id_categorie_age,"AGE1")
 const current={...patch,id_equipe_cnac:"T1"}
 assert.deepEqual(territorialPatch("equipes",{nom_equipe:"Elite"},current,refs,refs),{nom_equipe:"Elite"})
 assert.throws(()=>territorialPatch("equipes",{id_categorie_age:""},current,refs,refs),/catégorie équipe/)
 assert.equal(teamCategory({id_federation:"F1"},refs).label,"Non renseignée")
 assert.equal(teamCategory(current,refs).label,"Seniors")
 assert.equal("id_division" in patch,false)
})
test("athlete affiliation filters teams, changes club/federation and validates ownership",()=>{
 assert.deepEqual(teamsForClub(refs,"C1","F1").map(row=>row.id_equipe_cnac),["T1"])
 assert.equal(updateAffiliation(athlete,"id_club_cnac","C2").id_equipe_cnac,"")
 assert.equal(updateAffiliation(athlete,"id_federation","F2").id_club_cnac,"")
 assert.deepEqual(actorPatch("athletes",{telephone:"+243000000"},athlete,refs,[athlete]),{telephone:"+243000000"})
 assert.throws(()=>actorPatch("athletes",{id_club_cnac:"C2"},athlete,refs,[athlete]),/incompatible/)
 assert.throws(()=>actorPatch("athletes",{id_club_cnac:"C3",id_equipe_cnac:""},athlete,refs,[athlete]),/fédération/)
 assert.throws(()=>actorPatch("athletes",{id_division:"D1"},athlete,refs,[athlete]),/n.existe pas/)
 assert.equal(actorPatch("athletes",{id_club_cnac:"",id_equipe_cnac:""},athlete,refs,[athlete]).id_club_cnac,"")
 assert.equal(sportUsesTeams(refs,"F2"),false)
 assert.doesNotThrow(()=>actorPatch("athletes",{nom_complet:"Bob",id_federation:"F2",id_sexe:"01",id_club_cnac:"C3",id_equipe_cnac:""},undefined,refs,[]))
 assert.equal(sportUsesTeams({...refs,SPORTS:[]},"F1"),undefined)
})
test("physical mappings reach EQUIPES L:O and ATHLETES R/S, preserving other cells",()=>{
 const headers=[...CNAC_HEADERS.ATHLETES]
 const table=parseTable("ATHLETES",[headers,headers.map(key=>athlete[key as keyof typeof athlete]||"")])
 const cells=updateCells(table,"ATHLETES","id_athlete_cnac","A1",[{column:"id_club_cnac",value:"C2"},{column:"id_equipe_cnac",value:""}])
 assert.deepEqual(cells.map(cell=>cell.columnIndex),[17,18]);assert.equal(cells.length,2)
 const values=appendValues({...table,rows:[]},"ATHLETES",athlete)
 assert.equal(values[17],"C1");assert.equal(values[18],"T1")
 const team={...refs.EQUIPES[0],nom_equipe:"Seniors"}
 const teamTable=parseTable("EQUIPES",[[...CNAC_HEADERS.EQUIPES]])
 const teamValues=appendValues(teamTable,"EQUIPES",team)
 assert.equal(teamValues.length,15);assert.equal(teamValues[6],"AGE1")
 const existing = parseTable("EQUIPES", [[...CNAC_HEADERS.EQUIPES], teamValues])
 const trainingCells = updateCells(existing, "EQUIPES", "id_equipe_cnac", "T1", [
  { column: "lieu_entrainement", value: "Salle" }, { column: "adresse_entrainement", value: "Adresse" },
  { column: "fuseau_horaire_entrainement", value: "Africa/Kinshasa" }, { column: "planning_entrainement_json", value: "[]" },
 ])
 assert.deepEqual(trainingCells.map(cell => cell.columnIndex), [11,12,13,14])
 assert.deepEqual(teamValues.slice(11), ["", "", "", ""])
})


test("team Sheets writers reject removed fields even with legacy physical headers", () => {
 const headers=[...CNAC_HEADERS.EQUIPES,"id_type_structure_sportive","id_structure_sportive_cnac","id_division"]
 const team={id_equipe_cnac:"OLD",id_federation:"F1",nom_equipe:"Ancienne",id_club_cnac:"C1"}
 const table=parseTable("EQUIPES",[headers,headers.map(column=>team[column as keyof typeof team]||"")])
 assert.throws(()=>updateCells(table,"EQUIPES","id_equipe_cnac","OLD",[{column:"id_type_structure_sportive",value:"REMOVED"}]),/Colonne absente/)
 assert.throws(()=>appendValues({...table,rows:[]},"EQUIPES",{...team,id_type_structure_sportive:"REMOVED"}),/Colonne absente/)
 assert.throws(()=>updateCells(table,"EQUIPES","id_equipe_cnac","OLD",[{column:"id_division",value:"D2"}]),/Colonne absente/)
 assert.throws(()=>appendValues({...table,rows:[]},"EQUIPES",{...team,id_division:"D1"}),/Colonne absente/)
})


test("athlete Sheets contract is A:S and rejects retired fields including stale extra headers",()=>{
 assert.equal(CNAC_HEADERS.ATHLETES.length,19)
 assert.equal(CNAC_HEADERS.ATHLETES[17],"id_club_cnac")
 assert.equal(CNAC_HEADERS.ATHLETES[18],"id_equipe_cnac")
 const headers=[...CNAC_HEADERS.ATHLETES,"id_division"]
 const table=parseTable("ATHLETES",[headers,headers.map(column=>column==="id_division"?"D1":athlete[column as keyof typeof athlete]||"")])
 assert.equal("id_division" in table.rows[0],false)
 assert.equal(appendValues({...table,rows:[]},"ATHLETES",athlete).length,19)
 assert.throws(()=>updateCells(table,"ATHLETES","id_athlete_cnac","A1",[{column:"id_division",value:"D2"}]),/Colonne absente/)
 assert.throws(()=>appendValues({...table,rows:[]},"ATHLETES",{...athlete,id_division:"D1"}),/Colonne absente/)
 assert.throws(()=>parseTable("ATHLETES",[[...CNAC_HEADERS.ATHLETES.slice(0,17),"id_equipe_cnac","id_club_cnac"]]),/Ordre des colonnes/)
})
test("active affiliation preserves club, team and territorial summaries without divisions",()=>{
 assert.equal(activeAffiliationLabel(athlete,refs),"V Club \u2013 Seniors")
 assert.equal(activeAffiliationLabel({...athlete,id_equipe_cnac:""},refs),"Entente X")
 const circles={...refs,CLUBS:[{...refs.CLUBS[0],id_structure_parent_cnac:"R1"}]}
 assert.equal(activeAffiliationLabel({...athlete,id_equipe_cnac:""},circles),"Cercle X")
})

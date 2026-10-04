import assert from "node:assert/strict"
import test from "node:test"
import {readFileSync} from "node:fs"
import {validateAthleteParticipationInput} from "../../lib/competitions/validation.ts"
import {selectionCampaignDateError,validateSelectionInput} from "../../lib/equipes-nationales/validation.ts"

test("la période de campagne borne la date de sélection",()=>{
  assert.equal(selectionCampaignDateError("2024-01-01","2024-01-02","2024-03-03"),"La sélection doit être datée entre le 2024-01-02 et le 2024-03-03.")
  assert.equal(selectionCampaignDateError("2024-02-01","2024-01-02","2024-03-03"),"")
})

test("une sélection est valide sans participation",()=>{const row=validateSelectionInput({id_campagne:"CAM1",id_athlete:"ATH1",date_selection:"2028-06-01",id_statut_selection:"SELECTIONNE"});assert.equal(row.id_athlete,"ATH1")})
test("les cinq statuts de sélection sont acceptés",()=>{for(const statut of ["PRESELECTIONNE","SELECTIONNE","REMPLACANT","NON_RETENU","RETIRE"])assert.equal(validateSelectionInput({id_campagne:"CAM1",id_athlete:"ATH1",date_selection:"2028-06-01",id_statut_selection:statut}).id_statut_selection,statut)})
test("les statuts de participation restent distincts de la sélection",()=>{for(const statut of ["INSCRIT","PARTICIPANT","ABSENT","FORFAIT"])assert.equal(validateAthleteParticipationInput({id_engagement_campagne:"ENG1",id_selection:"SEL1",id_statut_participation:statut,date_statut:"2028-07-01"}).id_statut_participation,statut)})
test("un remplacement exige une autre sélection",()=>{assert.throws(()=>validateAthleteParticipationInput({id_engagement_campagne:"ENG1",id_selection:"SEL1",id_statut_participation:"REMPLACE",date_statut:"2028-07-01"}),/remplaçante/i);assert.throws(()=>validateAthleteParticipationInput({id_engagement_campagne:"ENG1",id_selection:"SEL1",id_statut_participation:"REMPLACE",id_selection_remplacement:"SEL1",date_statut:"2028-07-01"}),/elle-même/i)})
test("les interfaces expliquent qu’une sélection ne prouve pas la présence",()=>{const selections=readFileSync("components/dashboard/campaign-selections.tsx","utf8"),participants=readFileSync("components/dashboard/athlete-participations.tsx","utf8");assert.match(selections,/ne prouve jamais une participation/);assert.match(participants,/seul statut qui prouve une présence effective/);assert.doesNotMatch(selections,/overflow-x-auto/);assert.doesNotMatch(participants,/overflow-x-auto/)})
test("les API T07 imposent AUT-SPT côté serveur",()=>{for(const file of ["app/api/equipes-nationales/[id]/selections/route.ts","app/api/competitions/[id]/participants/route.ts"]){const source=readFileSync(file,"utf8");assert.match(source,/canAccess\("AUT-SPT","READ"\)/);assert.match(source,/runSportMutation|canAccess\("AUT-SPT","WRITE"\)/)}})

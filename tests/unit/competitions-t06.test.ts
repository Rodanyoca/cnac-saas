import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { validateEngagementInput, validateProgramInput } from "../../lib/competitions/validation.ts"
import { validateCampaignInput } from "../../lib/equipes-nationales/validation.ts"

test("valide plusieurs campagnes temporelles sans les confondre avec l’équipe permanente", () => {
  assert.equal(validateCampaignInput({ nom_campagne:"JO 2028",date_debut:"2028-07-14",date_fin:"2028-07-30",id_statut_campagne:"ACTIVE" }).id_statut_campagne,"ACTIVE")
  assert.throws(()=>validateCampaignInput({nom_campagne:"Sans période",id_statut_campagne:"ACTIVE"}),/dates/i)
})

test("exige programme, campagne, statut, date d’engagement et provenance", () => {
  assert.throws(()=>validateEngagementInput({}),/id_programme_competition/)
  const row=validateEngagementInput({id_programme_competition:"PRG1",id_campagne:"CAM1",id_statut_engagement:"confirme",date_engagement:"2028-07-01"})
  assert.equal(row.id_statut_engagement,"CONFIRME")
  assert.deepEqual(Object.keys(row),["id_programme_competition","id_campagne","id_statut_engagement","date_engagement","observation"])
})

test("un programme conserve une période interne cohérente",()=>{
  const data=readFileSync("lib/competitions/data.ts","utf8")
  assert.doesNotMatch(data,/assertProgramPeriod|commence avant la compétition|se termine après la compétition/)
  assert.deepEqual(validateProgramInput({id_epreuve:"EPR1",date_debut:"2028-07-01",date_fin:"2028-08-15"}),{id_epreuve:"EPR1",id_categorie_age:"",id_sexe:"",date_debut:"2028-07-01",date_fin:"2028-08-15",observations:""})
  assert.throws(()=>validateProgramInput({id_epreuve:"EPR1",date_debut:"2028-08-15",date_fin:"2028-07-01"}),/période/i)
})

test("les vues T06 sont responsives et n’exposent plus l’engagement direct de l’équipe",()=>{
  const engagement=readFileSync("components/dashboard/campaign-engagements.tsx","utf8"),competition=readFileSync("app/dashboard/competitions/[id]/competition-detail-client.tsx","utf8")
  assert.doesNotMatch(engagement,/overflow-x-auto/)
  assert.doesNotMatch(engagement,/date_transmission|Début opérationnel|Fin opérationnelle/)
  assert.match(competition,/TabsTrigger value="teams"/)
  assert.match(competition,/<CampaignEngagements/)
  assert.doesNotMatch(competition,/\/equipes-nationales.*method:/)
})

test("les deux API T06 contrôlent lecture et écriture côté serveur",()=>{
  for(const file of ["app/api/competitions/[id]/engagements/route.ts","app/api/equipes-nationales/[id]/campagnes/route.ts"]){const source=readFileSync(file,"utf8");assert.match(source,/canAccess\("AUT-SPT", "READ"\)/);assert.match(source,/runSportMutation|canAccess\("AUT-SPT", "WRITE"\)/)}
})

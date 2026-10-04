import assert from "node:assert/strict"
import {readFile} from "node:fs/promises"
import test from "node:test"
import {validateTeamInput} from "../../lib/equipes-nationales/validation.ts"

test("une équipe nationale appartient à une saison sans dates dupliquées",()=>{
 const row=validateTeamInput({id_federation:"FED001",id_sport:"SP001",nom_equipe_nationale:"RDC Basket",id_saison:"SAI_2026",statut:"ACTIF",date_debut:"1900-01-01",date_fin:"2999-12-31"})
 assert.equal(row.id_saison,"SAI_2026");assert.equal("date_debut" in row,false);assert.equal("date_fin" in row,false)
})

test("le formulaire remplace les dates par le référentiel des saisons",async()=>{
 const source=await readFile(new URL("../../components/dashboard/national-team-form.tsx",import.meta.url),"utf8")
 assert.match(source,/Label>Saison \*/);assert.match(source,/references\.seasons/);assert.doesNotMatch(source,/Date de début|Date de fin/)
})

test("une campagne conserve ses dates dans les bornes de la saison de son équipe",async()=>{
 const source=await readFile(new URL("../../lib/equipes-nationales/data.ts",import.meta.url),"utf8")
 assert.match(source,/assertCampaignPeriodWithinTeam/);assert.match(source,/campagne commence avant la saison/);assert.match(source,/campagne se termine après la saison/)
})

test("la vue globale relit les équipes et les classe par saison puis par nom",async()=>{
 const [page,client]=await Promise.all([
  readFile(new URL("../../app/dashboard/equipes-nationales/page.tsx",import.meta.url),"utf8"),
  readFile(new URL("../../app/dashboard/equipes-nationales/teams-client.tsx",import.meta.url),"utf8"),
 ])
 assert.match(page,/getNationalTeams\(\{\s*fresh:\s*true\s*\}\)/)
 assert.match(client,/team\.id_saison/)
 assert.match(client,/saison[^\n]*===\s*"toutes"/)
 assert.match(client,/b\.saison_(?:debut|label)[\s\S]{0,240}?nom_equipe_nationale\.localeCompare/)
 assert.match(client,/<TableHead>Saison<\/TableHead>/)
 assert.doesNotMatch(client,/<TableHead>Catégorie \/ sexe<\/TableHead>/)
})

import assert from "node:assert/strict"
import {readFile} from "node:fs/promises"
import test from "node:test"
const source=(path:string)=>readFile(new URL(`../../${path}`,import.meta.url),"utf8")

test("la liste finale masque les cérémonies et conserve une action accessible",async()=>{
 const code=await source("app/dashboard/competitions/competitions-client.tsx")
 for(const value of ["Nom de la compétition","Édition","Statut"])assert.match(code,new RegExp(value))
 assert.doesNotMatch(code,/<TableHead>Cérémonies<\/TableHead>|formatCompetitionCeremonies/)
 assert.doesNotMatch(code,/<TableHead>Identifiant<\/TableHead>/)
 assert.match(code,/Ouverture à partir du/);assert.match(code,/Clôture jusqu’au/);assert.match(code,/Voir les détails de/);assert.match(code,/TooltipContent>Voir les détails/);assert.doesNotMatch(code,/overflow-x-auto/)
})

test("la fiche finale possède cinq onglets et conserve le modèle campagne-programme-unité",async()=>{
 const code=await source("app/dashboard/competitions/[id]/competition-detail-client.tsx")
 const participants=await source("components/dashboard/competition-participants.tsx")
 const engagements=await source("components/dashboard/campaign-engagements.tsx")
 for(const tab of ["Général","Programmes","Participants","Équipes / unités","Résultats"])assert.match(code,new RegExp(`>${tab}<`))
 assert.match(participants,/id_engagement_campagne/);assert.match(engagements,/id_programme_competition/);assert.match(participants,/id_type_acteur/);assert.match(participants,/id_statut_participation/);assert.match(participants,/Aucun participant ne correspond aux critères/);assert.doesNotMatch(code,/overflow-x-auto/)
 assert.doesNotMatch(code,/Date de la cérémonie d’ouverture|Date de la cérémonie de clôture|formatCompetitionCeremonies/)
})

test("les écritures restent contextuelles et masquées sans droit",async()=>{
 const code=await source("app/dashboard/competitions/[id]/competition-detail-client.tsx"),participants=await source("components/dashboard/competition-participants.tsx"),list=await source("app/dashboard/competitions/competitions-client.tsx"),create=await source("app/dashboard/competitions/nouveau/page.tsx")
 assert.match(code,/canEdit&&<Button onClick=\{openEdit\}/);assert.match(participants,/canEdit&&<Button onClick=\{show\}/);assert.match(code,/<CampaignEngagements[^>]+canEdit=\{canEdit\}/);assert.match(code,/Ajouter ou modifier un résultat/);assert.match(participants,/\/api\/competitions/);assert.match(list,/Sheet open=\{createOpen\}/);assert.match(list,/CompetitionForm value=\{form\}/);assert.match(create,/redirect\("\/dashboard\/competitions\?nouveau=1"\)/)
})

test("les unités sont créables et modifiables, et les erreurs de résultat conservent le formulaire",async()=>{
 const units=await source("components/dashboard/participating-units.tsx"),participants=await source("components/dashboard/athlete-participations.tsx"),route=await source("app/api/competitions/[id]/unites/route.ts"),results=await source("components/dashboard/competition-results.tsx")
 assert.match(units,/method:\s*editing\s*\?\s*"PUT"\s*:\s*"POST"/);assert.match(units,/Modifier l’unité/);assert.match(units,/membres:\s*row\.membres\s*\|\|\s*\[\]/)
 for(const heading of ["Sport","Fédération","Période"])assert.match(units,new RegExp(`TableHead[^>]*>${heading}`))
 assert.doesNotMatch(units,/TableHead[^>]*>Date de début|TableHead[^>]*>Date de fin/)
 assert.doesNotMatch(units,/TableHead>Programme</)
 assert.match(participants,/router\.refresh\(\)/)
 assert.match(participants,/<Table>/);assert.match(participants,/<TableHead>Athlète<\/TableHead>/);assert.match(participants,/<TableHead>Campagne<\/TableHead>/);assert.doesNotMatch(participants,/ID acteur|ID engagement|<Card/)
 assert.match(route,/export async function PUT/);assert.match(results,/catch\s*\(error\)\s*\{\s*toast\.error/);assert.doesNotMatch(results,/catch\s*\(error\)[\s\S]*setForm\(empty\)/)
})

test("la fiche relit les participations modifiées directement dans le classeur",async()=>{
 const page=await source("app/dashboard/competitions/[id]/page.tsx"),data=await source("lib/competitions/data.ts")
 assert.match(page,/getCompetitionParticipants\(id, true\)/)
 assert.match(data,/PARTICIPATIONS_ACTEURS_COMPETITION[^\n]+bypassCache:\s*filters\.fresh/)
})

test("les participants sont regroupés par sport et type et l'ajout COC exclut les athlètes",async()=>{
 const ui=await source("components/dashboard/competition-participants.tsx"),data=await source("lib/competitions/data.ts")
 assert.match(ui,/Regroupés par sport puis par type d’acteur/);assert.match(ui,/TYPES\.filter\(value=>value!=="ATHLETE"\)/)
 assert.match(data,/id_campagne===engagement\.id_campagne&&row\.id_acteur_coc===actorId&&row\.id_type_acteur===type/)
 assert.match(data,/id_selection:"",id_affectation_staff:assignment\.id_affectation_staff/)
})

test("la liste des compétitions résiste au quota des données de délégation",async()=>{
 const page=await source("app/dashboard/competitions/page.tsx")
 assert.doesNotMatch(page,/getCompetitions\(\{\s*bypassCache:\s*true\s*\}\)/)
 assert.match(page,/Promise\.allSettled/)
 assert.match(page,/staffResult\.status === "fulfilled"/)
})

test("la fiche compétition ne conserve pas l’ancien résumé des équipes engagées",async()=>{
 const page=await source("app/dashboard/competitions/[id]/page.tsx")
 const detail=await source("app/dashboard/competitions/[id]/competition-detail-client.tsx")
 assert.doesNotMatch(page,/getTeamParticipations|teamsResult|teamsError/)
 assert.doesNotMatch(detail,/title="Équipes engagées"|selectedCount|participantCount|programMap|eventMap/)
 assert.match(detail,/<CampaignEngagements/)
 assert.match(detail,/<ParticipatingUnits/)
})

test("le tableau des résultats affiche la synthèse et la décision référencées",async()=>{
 const results=await source("components/dashboard/competition-results.tsx")
 assert.match(results,/<TableHead>Synthèse<\/TableHead>/)
 assert.doesNotMatch(results,/<TableHead>Statut<\/TableHead>|references\.statuses|id_statut_resultat/)
 assert.match(results,/formatResultSummary/)
 assert.match(results,/label\(references\.synthetics, row\.id_resultat_synthetique/)
 assert.match(results,/references\.decisions\.find/)
 assert.doesNotMatch(results,/formatResultSummary\(\{\s*synthetic:/)
 assert.match(results,/colSpan=\{6\}/)
})

test("les unités participantes partagent une seule lecture client",async()=>{
 const units=await source("components/dashboard/participating-units.tsx")
 const results=await source("components/dashboard/competition-results.tsx")
 const loader=await source("lib/competitions/client-units.ts")
 assert.match(units,/loadCompetitionUnits/)
 assert.match(results,/loadCompetitionUnits/)
 assert.doesNotMatch(results,/fetch\(`\/api\/competitions\/\$\{encodeURIComponent\(competitionId\)\}\/unites/)
 assert.match(units,/useEffect\(\(\) => \{[^\n]+loadCompetitionUnits\(competitionId\)/)
 assert.match(loader,/pendingUnitRequests/)
})

test("le formulaire de participation affiche la fédération à la place de l’identifiant programme",async()=>{
 const participants=await source("components/dashboard/athlete-participations.tsx")
 assert.match(participants,/federationLabel\(item\)/)
 assert.doesNotMatch(participants,/item\.nom_campagne\} · \{item\.id_programme_competition/)
})

test("la couche Sheets mutualise les lectures simultanées après un redémarrage",async()=>{
 const sheets=await source("lib/google/sheets.ts")
 assert.match(sheets,/__cocGoogleSheetsPendingReads/)
 assert.match(sheets,/pendingReads\.get\(cacheKey\)/)
 assert.match(sheets,/pendingReads\.set\(cacheKey, request\)/)
})

test("le formulaire de résultat affiche la fédération dans la liste des engagements",async()=>{
 const results=await source("components/dashboard/competition-results.tsx")
 assert.match(results,/references\.federations\?\.find/)
 assert.doesNotMatch(results,/id_programme_competition\}\s*·/)
})

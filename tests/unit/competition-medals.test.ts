import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { MEDAL_DISTINCTIONS, validateCompetitionMedalInput } from "../../lib/competitions/validation.ts"
import { readFile } from "node:fs/promises"
import { participatingUnitMedalLabel } from "../../lib/competitions/medals.ts"

test("valide les trois distinctions et une date ISO",()=>{
 for(const id_distinction of MEDAL_DISTINCTIONS)assert.equal(validateCompetitionMedalInput({id_resultat_logique:"RSL1",id_distinction,date_obtention:"2026-08-12"}).id_distinction,id_distinction)
 assert.throws(()=>validateCompetitionMedalInput({id_resultat_logique:"RSL1",id_distinction:"DIST_PLATINE",date_obtention:"2026-08-12"}),/or, d’argent et de bronze/i)
 assert.throws(()=>validateCompetitionMedalInput({id_resultat_logique:"RSL1",id_distinction:"DIST_OR",date_obtention:"12-08-2026"}),/date d’obtention/i)
})

test("l’ajout d’une médaille valide son contexte avec une lecture groupée sans projection enrichie",async()=>{
 const source=await readFile(new URL("../../lib/competitions/data.ts",import.meta.url),"utf8")
 const start=source.indexOf("async function getMedalMutationContext")
 const end=source.indexOf("export async function createTeamParticipation",start)
 const implementation=source.slice(start,end)
 assert.ok(start>=0)
 assert.match(implementation,/getSheetsRows/)
 assert.match(implementation,/RESULTATS/)
 assert.match(implementation,/MEDAILLES/)
 assert.doesNotMatch(implementation,/getCompetitionMedals\(/)
 assert.doesNotMatch(implementation,/getCompetitionResults\(/)
})

test("la donnée relie la médaille au résultat logique courant et protège les doublons",()=>{
 const source=readFileSync("lib/competitions/data.ts","utf8")
 assert.match(source,/getCompetitionResults\(competitionId,false\)/)
 assert.match(source,/id_resultat_logique===row\.id_resultat_logique/)
 assert.match(source,/possède déjà une médaille/)
 assert.match(source,/deleteSheetRow/)
})

test("affiche l’athlète pour une unité individuelle et le nom pour une équipe",()=>{
 assert.equal(participatingUnitMedalLabel({id_unite_participante:"UNI1",id_engagement_campagne:"ENG1",type_unite:"INDIVIDUEL",id_participation_acteur:"PAR1",nom_unite:"",observation:"",composition:["Amina Mbala"]}),"Amina Mbala")
 assert.equal(participatingUnitMedalLabel({id_unite_participante:"UNI2",id_engagement_campagne:"ENG1",type_unite:"EQUIPE",id_participation_acteur:"",nom_unite:"Relais 4 × 100 m",observation:"",composition:["Amina Mbala","Sarah Kanku"]}),"Relais 4 × 100 m")
})

test("l’interface couvre accessibilité et confirmation",()=>{
 const source=readFileSync("components/dashboard/competition-medals.tsx","utf8")
 assert.match(source,/Aucune médaille enregistrée pour cette compétition/)
 assert.match(source,/AlertDialogTitle>Supprimer cette médaille/)
 assert.match(source,/aria-label=\{label\}/)
 assert.doesNotMatch(source,/overflow-x-auto/)
})

test("l’API impose AUT-SPT et l’enveloppe ADMIN active",()=>{
 const source=readFileSync("app/api/competitions/[id]/medailles/route.ts","utf8")
 assert.match(source,/canAccess\("AUT-SPT","READ"\)/)
 assert.match(source,/runSportMutation/)
 assert.match(source,/export async function DELETE/)
})

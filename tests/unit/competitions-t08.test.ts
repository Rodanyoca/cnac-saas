import assert from "node:assert/strict"
import test from "node:test"
import {readFileSync} from "node:fs"
import {validateCompetitionResultInput} from "../../lib/competitions/validation.ts"

const base={id_engagement_campagne:"ENG1",id_unite_participante:"UNI1",date_resultat:"2028-07-10",id_statut_resultat:"BROUILLON"}
test("accepte victoire, nul, défaite et qualification sans calcul",()=>{for(const id of ["SYN_VICTOIRE","SYN_NUL","SYN_DEFAITE","SYN_QUALIFIE"])assert.equal(validateCompetitionResultInput({...base,id_resultat_synthetique:id}).id_resultat_synthetique,id)})
test("accepte un score ou une mesure avec unité",()=>{assert.equal(validateCompetitionResultInput({...base,valeur_coc:"82",valeur_adversaire:"76",type_adversaire:"EQUIPE",nom_adversaire:"Angola",id_unite_mesure:"UNIT_POINT"}).valeur_coc,"82");assert.equal(validateCompetitionResultInput({...base,valeur_coc:"10.12",id_unite_mesure:"UNIT_SECONDE"}).id_unite_mesure,"UNIT_SECONDE")})
test("accepte un rang sans inventer une unité",()=>{const row=validateCompetitionResultInput({...base,valeur_coc:"1"});assert.equal(row.valeur_coc,"1");assert.equal(row.id_unite_mesure,"")})
test("accepte une décision sans score et refuse un résultat vide",()=>{assert.equal(validateCompetitionResultInput({...base,id_decision_resultat:"DEC_FORFAIT"}).id_decision_resultat,"DEC_FORFAIT");assert.throws(()=>validateCompetitionResultInput(base),/synthèse/i)})
test("limite les statuts aux états métier",()=>{assert.throws(()=>validateCompetitionResultInput({...base,id_resultat_synthetique:"VICTOIRE",id_statut_resultat:"HOMOLOGUE"}),/statut/i)})
test("la correction est versionnée et ne modifie pas silencieusement le résultat",()=>{const source=readFileSync("lib/competitions/data.ts","utf8");assert.match(source,/id_resultat_precedent:current\.id_resultat/);assert.match(source,/numero_version:String\(Number\(current\.numero_version\)\+1\)/);assert.match(source,/id_statut_resultat",value:"CORRIGE"/)})
test("l’interface expose l’historique sans classement calculé",()=>{const source=readFileSync("components/dashboard/competition-results.tsx","utf8");assert.match(source,/Correction versionnée/);assert.match(source,/Aucun classement n’est calculé/);assert.doesNotMatch(source,/classement automatique|overflow-x-auto/)})
test("l’API résultats contrôle les droits serveur",()=>{const source=readFileSync("app/api/competitions/[id]/resultats/route.ts","utf8");assert.match(source,/canAccess\("AUT-SPT","READ"\)/);assert.match(source,/runSportMutation|canAccess\("AUT-SPT","WRITE"\)/)})

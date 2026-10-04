import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("le chargement normal du dashboard conserve le cache court",()=>{
 const page=readFileSync("app/dashboard/page.tsx","utf8"),loader=readFileSync("lib/dashboard/fresh-load.ts","utf8")
 assert.doesNotMatch(page,/clear:\s*clearSheetCache/)
 assert.doesNotMatch(loader,/input\.clear\(\)/)
})

test("les compteurs de médailles ne chargent pas tout le graphe compétition",()=>{
 const source=readFileSync("lib/competitions/dashboard.ts","utf8")
 assert.match(source,/getCompetitionMedalCounts/)
 assert.doesNotMatch(source,/getCompetitionMedals/)
})

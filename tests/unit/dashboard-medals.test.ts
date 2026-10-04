import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("le tableau de bord affiche le total des médailles par distinction",()=>{
 const data=readFileSync("lib/competitions/dashboard.ts","utf8"),source=readFileSync("lib/competitions/data.ts","utf8"),component=readFileSync("components/dashboard/medals-summary-section.tsx","utf8"),page=readFileSync("app/dashboard/page.tsx","utf8")
 assert.match(data,/getCompetitionMedalCounts/)
 assert.doesNotMatch(data,/getCompetitionMedals\(/)
 for(const distinction of ["DIST_OR","DIST_ARGENT","DIST_BRONZE"])assert.match(source,new RegExp(distinction))
 assert.match(component,/Médailles/);assert.match(component,/Récompenses obtenues dans les compétitions/)
 assert.match(component,/TableHeader/)
 assert.match(component,/Part du total/)
 assert.doesNotMatch(component,/sm:grid-cols|lg:grid-cols/)
 assert.match(page,/MedalsSummarySection/)
})

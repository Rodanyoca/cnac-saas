import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("les anomalies de qualité de même type utilisent une clé distincte par section",()=>{
 const source=readFileSync("components/dashboard/data-quality-summary.tsx","utf8")
 assert.match(source,/key=\{`\$\{item\.code\}:\$\{item\.scope\}:\$\{index\}`\}/)
 assert.doesNotMatch(source,/key=\{item\.code\}/)
})

import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import { navigationSnapshot } from "../../lib/navigation/navigation-snapshot.ts"

test("dashboard source outages retain the shell and never render protected content", async () => {
  const source = await readFile(new URL("../../app/dashboard/layout.tsx", import.meta.url), "utf8")
  for (const failure of ["session", "navigation", "none", "anonymous", "activation"]) {
    const exports: { default?: (props: {children:string}) => Promise<{type:string;props:Record<string,unknown>}> } = {}
    const jsx = (type: string, props: Record<string, unknown>) => ({type,props})
    const dependencies: Record<string, unknown> = {
      "react/jsx-runtime": {jsx,jsxs:jsx},
      "next/navigation": {redirect:(path:string)=>{throw new Error(`redirect:${path}`)}},
      "@/components/dashboard/dashboard-shell": {DashboardShell:"shell"},
      "@/components/dashboard/service-unavailable": {ServiceUnavailable:"outage"},
      "@/lib/auth": {
        getSession:async()=>{if(failure==="session")throw new Error("Google unavailable");return failure==="anonymous"?null:{estSuperAdmin:false,doitChangerMotDePasse:failure==="activation"}},
        getNavigationAccess:async()=>{if(failure==="navigation")throw new Error("Google quota");return {"AUT-SPT:READ":true}},
      },
    }
    runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:(id:string)=>dependencies[id]})
    if(failure==="anonymous"||failure==="activation") {await assert.rejects(exports.default!({children:"protected"}),new RegExp(`redirect:/${failure==="anonymous"?"login":"activation"}`));continue}
    const result=await exports.default!({children:"protected"})
    assert.equal(result.type,"shell")
    if(failure==="none")assert.equal(result.props.children,"protected")
    else {assert.equal(result.props.unavailable,true);assert.equal((result.props.children as {type:string}).type,"outage")}
  }
})

test("outage navigation snapshots retain only presentation metadata", () => {
  assert.equal(navigationSnapshot("broken"),null)
  assert.equal(navigationSnapshot('{"access":null}'),null)
  assert.deepEqual(navigationSnapshot(JSON.stringify({access:{"AUT-SPT:READ":true,"AUT-SPT:WRITE":true,"AUT-ADM:READ":"true",token:"secret"},isSuperAdmin:false})),{access:{"AUT-SPT:READ":true},isSuperAdmin:false})
})

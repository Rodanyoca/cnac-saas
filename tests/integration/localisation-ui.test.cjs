const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs/promises")
const path = require("node:path")
const http = require("node:http")
const { chromium } = require("@playwright/test")
const { webpack } = require("next/dist/compiled/webpack/webpack")

test("individual localisation drawers, persistence, permissions and mobile layout", { timeout: 120000 }, async () => {
  const root = path.resolve(__dirname, "../..")
  const output = path.join(root, ".cache/localisation-ui")
  await fs.mkdir(output, { recursive: true })
  await fs.writeFile(path.join(output, "loader.cjs"), `const ts=require(${JSON.stringify(require.resolve("typescript"))});module.exports=function(source){return ts.transpileModule(source,{fileName:this.resourcePath,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText}`)
  await fs.writeFile(path.join(output, "entry.tsx"), `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{AthleteLocalisation}from'@/components/dashboard/athlete-localisation';
const teams=[{id_equipe_cnac:'T1',id_club_cnac:'C1',id_federation:'F1',nom_equipe:'Equipe test',lieu_entrainement:'Salle collective',fuseau_horaire_entrainement:'Africa/Kinshasa',planning_entrainement_json:'[{"jour":1,"heure_debut":"16:00","heure_fin":"18:00"}]'}];
function App(){const[team,setTeam]=useState('T1');window.changeTeam=setTeam;return <main className="mx-auto max-w-5xl p-4"><AthleteLocalisation athleteId="A1" teams={teams} affiliation={{id_equipe_cnac:team,id_club_cnac:'C1',id_federation:'F1'}}/></main>}createRoot(document.getElementById('root')).render(<App/>);`)
  await new Promise((resolve, reject) => {
    const compiler = webpack({ mode: "development", devtool: false, entry: path.join(output,"entry.tsx"),
      output: { path: output, filename: "bundle.js" },
      resolve: { alias: { "@": root }, extensions: [".tsx",".ts",".jsx",".js"] },
      module: { rules: [{ test: /\.tsx?$/, use: path.join(output,"loader.cjs") }] },
    })
    compiler.run((error, stats) => compiler.close(() => error || stats.hasErrors() ? reject(error || new Error(stats.toString({all:false,errors:true}))) : resolve()))
  })
  const cssDir = path.join(root,".next/static/chunks")
  const cssFiles = (await fs.readdir(cssDir)).filter(file => file.endsWith(".css"))
  const css = (await Promise.all(cssFiles.map(file => fs.readFile(path.join(cssDir,file),"utf8")))).join("\n")
  const server = http.createServer(async (request,response) => {
    if (request.url === "/bundle.js") { response.setHeader("content-type","text/javascript"); response.end(await fs.readFile(path.join(output,"bundle.js"))); return }
    if (request.url === "/style.css") { response.setHeader("content-type","text/css"); response.end(css); return }
    response.setHeader("content-type","text/html; charset=utf-8")
    response.end('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>')
  })
  await new Promise(resolve => server.listen(0,"127.0.0.1",resolve))
  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({ viewport: {width:1280,height:1000} })
    const errors = []
    page.on("pageerror", error => errors.push(error.message))
    let rows = [], canWrite = true, failWrite = false, seq = 0
    await page.route("**/api/athletes/A1/club-coachs", route=>route.fulfill({json:{coaches:[{id:"COA1",nom:"Coach du club"}]}}))
    await page.route("**/api/athletes/A1/localisations", async route => {
      const request = route.request()
      if (request.method() === "GET") return route.fulfill({json:{localisations:rows,canWrite}})
      if (!canWrite) return route.fulfill({status:403,json:{error:"Accès refusé."}})
      if (failWrite) { failWrite=false; return route.fulfill({status:502,json:{error:"Échec Sheets simulé."}}) }
      const body = request.postDataJSON()
      const row = body.id ? {...rows.find(row=>row.id_localisation===body.id),...body.row} : {...body.row,id_localisation:`LOC-${++seq}`,id_athlete_cnac:"A1"}
      rows = body.id ? rows.map(item=>item.id_localisation===body.id?row:item) : [...rows,row]
      return route.fulfill({json:{ok:true,row}})
    })
    const url = `http://127.0.0.1:${server.address().port}`
    await page.goto(url)
    await page.getByRole("heading",{name:"Entraîneurs du club",exact:true}).waitFor()
    await page.getByText("Coach du club",{exact:true}).waitFor()
    await page.getByText("Aucun lieu d’entraînement individuel renseigné.",{exact:true}).waitFor()
    await page.getByRole("button",{name:"Ajouter un lieu d’entraînement",exact:true}).click()
    await page.getByRole("button",{name:"Enregistrer",exact:true}).click()
    await page.getByRole("alert").getByText("Le lieu d’entraînement est obligatoire.",{exact:true}).waitFor()
    assert.equal(rows.length,0)
    await page.getByLabel("Lieu d’entraînement",{exact:true}).fill("Salle individuelle")
    await page.getByLabel("Adresse du lieu",{exact:true}).fill("Adresse individuelle")
    await page.getByRole("button",{name:"Ajouter un créneau",exact:true}).click()
    await page.getByRole("combobox",{name:"Jour — créneau 1",exact:true}).click()
    await page.getByRole("option",{name:"Mercredi",exact:true}).click()
    await page.getByLabel("Heure de début",{exact:true}).fill("09:00")
    await page.getByLabel("Heure de fin",{exact:true}).fill("11:00")
    await page.getByRole("button",{name:"Ajouter un créneau",exact:true}).click()
    await page.getByRole("combobox",{name:"Jour — créneau 2",exact:true}).click()
    await page.getByRole("option",{name:"Mercredi",exact:true}).click()
    await page.getByLabel("Heure de début",{exact:true}).nth(1).fill("16:00")
    await page.getByLabel("Heure de fin",{exact:true}).nth(1).fill("18:00")
    await page.getByRole("button",{name:"Enregistrer",exact:true}).click()
    await page.getByText("Lieu d’entraînement enregistré.",{exact:true}).waitFor()
    await page.getByRole("dialog").waitFor({state:"hidden"})
    assert.equal(rows.length,1)
    assert.equal(JSON.parse(rows[0].planning_entrainement_json)[0].jour,3)
    await page.getByText("9 h–11 h",{exact:false}).waitFor()
    await page.screenshot({path:path.join(output,"desktop.png"),fullPage:true})
    await page.getByRole("button",{name:"Ajouter un lieu d’entraînement",exact:true}).click()
    assert.equal(await page.getByLabel("Lieu d’entraînement",{exact:true}).inputValue(),"")
    await page.getByLabel("Lieu d’entraînement",{exact:true}).fill("Deuxième lieu")
    await page.getByRole("button",{name:"Enregistrer",exact:true}).click()
    await page.getByText("Deuxième lieu",{exact:true}).waitFor()
    await page.getByLabel("Entraînements de l’équipe",{exact:true}).getByText("Adresse : Non renseignée",{exact:true}).waitFor()
    await page.getByLabel("Entraînements individuels",{exact:true}).getByText("Adresse : Non renseignée",{exact:true}).waitFor()
    await page.getByText("Adresse : Adresse individuelle",{exact:true}).waitFor()
    await page.getByRole("button",{name:"Modifier Salle individuelle",exact:true}).click()
    assert.equal(await page.getByLabel("Adresse du lieu",{exact:true}).inputValue(),"Adresse individuelle")
    assert.equal(await page.getByLabel("Heure de début",{exact:true}).first().inputValue(),"09:00")
    assert.equal(await page.getByLabel("Heure de début",{exact:true}).nth(1).inputValue(),"16:00")
    await page.getByLabel("Adresse du lieu",{exact:true}).fill("Nouvelle adresse")
    failWrite=true
    await page.getByRole("button",{name:"Enregistrer",exact:true}).click()
    await page.getByRole("alert").getByText("Échec Sheets simulé.",{exact:true}).waitFor()
    assert.equal(rows[0].adresse_entrainement,"Adresse individuelle")
    await page.getByRole("button",{name:"Enregistrer",exact:true}).click()
    await page.getByText("Adresse : Nouvelle adresse",{exact:true}).waitFor()
    page.once("dialog",dialog=>dialog.accept())
    await page.getByRole("button",{name:"Désactiver Salle individuelle",exact:true}).click()
    await page.getByRole("button",{name:"Afficher les lieux inactifs (1)",exact:true}).click()
    await page.getByRole("button",{name:"Réactiver Salle individuelle",exact:true}).click()
    await page.getByText("Lieu réactivé.",{exact:true}).waitFor()
    await page.evaluate(()=>window.changeTeam(""))
    await page.getByText("Aucune équipe active renseignée pour cet athlète.",{exact:true}).waitFor()
    await page.getByText("Salle individuelle",{exact:true}).waitFor()
    assert.equal(rows.length,2)
    await page.reload()
    await page.getByText("Adresse : Nouvelle adresse",{exact:true}).waitFor()
    await page.setViewportSize({width:390,height:844})
    await page.screenshot({path:path.join(output,"mobile.png"),fullPage:true})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false)
    await page.getByRole("button",{name:"Modifier Salle individuelle",exact:true}).click()
    await page.getByRole("dialog").evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)))
    await page.screenshot({path:path.join(output,"mobile-drawer.png"),fullPage:false})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false)
    await page.getByRole("button",{name:"Annuler",exact:true}).click()
    canWrite=false
    await page.reload()
    await page.getByText("Salle individuelle",{exact:true}).waitFor()
    assert.equal(await page.getByRole("button",{name:"Ajouter un lieu d’entraînement",exact:true}).count(),0)
    assert.equal(await page.getByRole("button",{name:"Modifier Salle individuelle",exact:true}).count(),0)
    assert.deepEqual(errors,[])
  } finally {
    await browser?.close()
    await new Promise(resolve=>server.close(resolve))
  }
})

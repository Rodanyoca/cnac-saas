import fs from "node:fs/promises"
import { google } from "googleapis"

const workbooks = [
  ["REFERENTIEL", "AUT-ADM", "GOOGLE_SHEETS_REFERENTIEL_SPREADSHEET_ID"],
  ["STRUCTURE_TERRITORIALE", "AUT-SPT", "GOOGLE_SHEETS_STRUCTURE_TERRITORIALE_SPREADSHEET_ID"],
  ["ACTEURS", "AUT-SPT", "GOOGLE_SHEETS_ACTEURS_SPREADSHEET_ID"],
  ["ACTEURS_AFFILIATIONS", "AUT-SPT", "GOOGLE_SHEETS_ACTEURS_AFFILIATIONS_SPREADSHEET_ID"],
  ["ACTIVITES", "AUT-ADM", "GOOGLE_SHEETS_ACTIVITES_SPREADSHEET_ID"],
  ["DOCUMENTS", "AUT-ADM", "GOOGLE_SHEETS_DOCUMENTS_SPREADSHEET_ID"],
  ["COMPETITIONS", "AUT-SPT", "GOOGLE_SHEETS_COMPETITIONS_SPREADSHEET_ID"],
  ["EQUIPES_NATIONALES", "AUT-SPT", "GOOGLE_SHEETS_EQUIPES_NATIONALES_SPREADSHEET_ID"],
  ["UTILISATEURS", "SUPER_ADMIN", "GOOGLE_SHEETS_USERS_SPREADSHEET_ID"],
]

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
})
const sheets = google.sheets({ version: "v4", auth })
const snapshot = { generatedAt: new Date().toISOString(), workbooks: [] }

for (const [name, block, envKey] of workbooks) {
  const spreadsheetId = process.env[envKey]
  if (!spreadsheetId) throw new Error(`${envKey} absent`)
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: "properties.title,sheets.properties.title" })
  const titles = (metadata.data.sheets ?? []).map((sheet) => sheet.properties?.title).filter(Boolean)
  const ranges = titles.map((title) => `'${String(title).replace(/'/g, "''")}'!1:1`)
  const headerResponse = ranges.length ? await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges }) : { data: { valueRanges: [] } }
  snapshot.workbooks.push({
    name,
    block,
    envKey,
    title: metadata.data.properties?.title ?? name,
    sheets: titles.map((title, index) => ({
      name: title,
      headers: (headerResponse.data.valueRanges?.[index]?.values?.[0] ?? []).map((value) => String(value).trim()),
    })),
  })
}

await fs.mkdir("docs/mappings", { recursive: true })
await fs.writeFile("docs/mappings/google-sheets-schema-snapshot.json", `${JSON.stringify(snapshot, null, 2)}\n`, "utf8")
const lines = ["# Cartographie des classeurs Google Sheets", "", `GÃ©nÃ©rÃ© le ${snapshot.generatedAt}. Ce document ne contient ni identifiant de classeur ni donnÃ©e mÃ©tier : uniquement les onglets et leurs en-tÃªtes.`, "", "## Blocs d'autorisation", "", "- `AUT-ADM` : administration, rÃ©fÃ©rentiels, activitÃ©s et documents.", "- `AUT-SPT` : fÃ©dÃ©rations, structures territoriales, acteurs, compÃ©titions et Ã©quipes nationales.", "- `AUT-COM` : communication; aucune source Google Sheets dÃ©diÃ©e n'est actuellement configurÃ©e.", "- `SUPER_ADMIN` : utilisateurs, rÃ´les, sessions et audit; donne aussi accÃ¨s Ã  tous les blocs.", "", "## RÃ¨gle de mapping", "", "Les noms ci-dessous sont les noms physiques. L'interface conserve ses noms fonctionnels historiques via des adaptateurs explicites. Toute nouvelle colonne doit d'abord Ãªtre ajoutÃ©e au classeur, puis au mapping et Ã  ses tests.", ""]
for (const book of snapshot.workbooks) {
  lines.push(`## ${book.name} â€” ${book.block}`, "", `Classeur : **${book.title}**. Variable : \`${book.envKey}\`.`, "")
  for (const sheet of book.sheets) lines.push(`- **${sheet.name}** : ${sheet.headers.filter(Boolean).map((header) => `\`${header}\``).join(", ") || "aucun en-tÃªte structurant"}`)
  lines.push("")
}
lines.push("## Anomalies connues", "", "- `TYPES_STRUCTURE` contient deux colonnes portant le mÃªme nom `observations`; elles doivent Ãªtre fusionnÃ©es dans le classeur source.", "- Les membres d'Ã©quipes nationales sont modÃ©lisÃ©s par campagnes (`SELECTIONS_ATHLETES` et `AFFECTATIONS_STAFF`), et non par un onglet gÃ©nÃ©rique.", "- Les colonnes physiques au singulier (`observation`) sont adaptÃ©es vers `observations` dans le modÃ¨le d'interface.", "")
await fs.writeFile("docs/mappings/google-sheets-workbooks.md", `${lines.join("\n")}\n`, "utf8")
console.log(snapshot.workbooks.map((book) => `${book.name}: ${book.sheets.length} onglet(s)`).join("\n"))

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("les lectures groupées Sheets réutilisent le cache par plage", async () => {
  const source = await readFile(new URL("../../lib/google/sheets.ts", import.meta.url), "utf8")
  const batchSection = source.slice(source.indexOf("export async function getSheetsRows"), source.indexOf("export async function getSheetsTables"))
  assert.match(batchSection, /getCached/)
  assert.match(batchSection, /if \(allCached\) return cachedResult/)
  assert.match(batchSection, /setCache/)
})

test("la connexion lit son contexte en un lot et reporte les écritures de succès", async () => {
  const source = await readFile(new URL("../../app/api/auth/login/route.ts", import.meta.url), "utf8")
  assert.match(source, /getAuthenticationSnapshot\(email\)/)
  assert.match(source, /after\(async \(\) =>/)
  assert.match(source, /Promise\.allSettled/)
  assert.doesNotMatch(source, /repository\.getAuthAttempts/)
  assert.doesNotMatch(source, /repository\.getUserByEmail/)
})

test("les chargements concernés utilisent un gris léger", async () => {
  const files = await Promise.all(["../../app/dashboard/federations/loading.tsx", "../../app/dashboard/federations/[id]/loading.tsx", "../../app/login/login.module.css"].map((path) => readFile(new URL(path, import.meta.url), "utf8")))
  assert.ok(files[0].includes("bg-slate-200/80"))
  assert.ok(files[1].includes("bg-slate-200/80"))
  assert.match(files[2], /\.submit:disabled \{ background: #e5e7eb;/)
})

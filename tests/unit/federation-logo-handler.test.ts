import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { handleFederationLogoUpload } from "../../lib/federations/logo-handler.ts"
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADklEQVQImWP4DwMMcBYAs2AR78H3GQQAAAAASUVORK5CYII=", "base64")

function request() {
  const data = new FormData()
  data.append("file", new File([png], "logo.png", { type: "image/png" }))
  return new Request("http://localhost/api/federations/FED-1/logo", { method: "POST", body: data })
}

test("refuse un utilisateur sans droit d’écriture AUT-SPT", async () => {
  let replaced = false
  const response = await handleFederationLogoUpload(request(), "FED-1", { canWrite: async () => false, replace: async () => { replaced = true; return { fileId: "x", url: "x" } } })
  assert.equal(response.status, 403)
  assert.equal(replaced, false)
})

test("retourne le nouveau logo après un envoi autorisé", async () => {
  const response = await handleFederationLogoUpload(request(), "FED-1", { canWrite: async () => true, replace: async (input) => { assert.equal(input.federationId, "FED-1"); return { fileId: "new", url: "https://image/new" } } })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { fileId: "new", url: "https://image/new" })
})

test("signale clairement un quota Google temporairement dépassé", async () => {
  const response = await handleFederationLogoUpload(request(), "FED-1", {
    canWrite: async () => true,
    replace: async () => { throw new Error("Quota exceeded for quota metric 'Read requests'") },
  })
  assert.equal(response.status, 429)
  assert.deepEqual(await response.json(), { error: "Google est temporairement saturé. Réessayez dans une minute." })
})

test("signale une configuration Drive absente en production", async () => {
  const response = await handleFederationLogoUpload(request(), "FED-1", {
    canWrite: async () => true,
    replace: async () => { throw new Error("GOOGLE_DRIVE_FEDERATION_LOGOS_FOLDER_ID est manquant.") },
  })
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: "Le stockage des logos de fédérations n’est pas configuré sur le serveur." })
})

test("le backend logo utilise le workflow CNAC prive avec confirmation", async () => {
  const source = await readFile(new URL("../../lib/federations/logo-data.ts", import.meta.url), "utf8")
  assert.match(source, /saveExistingImage/)
  assert.doesNotMatch(source, /uploadFileToDrive|permissions\.create/)
})

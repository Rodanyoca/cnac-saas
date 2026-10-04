import assert from "node:assert/strict"
import test from "node:test"
import { replaceFederationLogo } from "../../lib/federations/logo.ts"

test("remplace la référence Sheets avant de supprimer l’ancien logo", async () => {
  const events: string[] = []
  const result = await replaceFederationLogo({ federationId: "FED-1", fileName: "logo.png", mimeType: "image/png", buffer: Buffer.from("png"), folderId: "folder" }, {
    find: async () => ({ logoDriveId: "old" }),
    upload: async () => { events.push("upload:new"); return { fileId: "new", url: "https://image/new" } },
    update: async (_id, file) => { events.push(`update:${file.fileId}`) },
    remove: async (id) => { events.push(`remove:${id}`) },
  })
  assert.deepEqual(result, { fileId: "new", url: "https://image/new" })
  assert.deepEqual(events, ["upload:new", "update:new", "remove:old"])
})

test("supprime le nouveau fichier si l’écriture Sheets échoue", async () => {
  const removed: string[] = []
  await assert.rejects(() => replaceFederationLogo({ federationId: "FED-1", fileName: "logo.png", mimeType: "image/png", buffer: Buffer.from("png"), folderId: "folder" }, {
    find: async () => ({ logoDriveId: "old" }), upload: async () => ({ fileId: "new", url: "new-url" }),
    update: async () => { throw new Error("Sheets indisponible") }, remove: async (id) => { removed.push(id) },
  }), /Sheets indisponible/)
  assert.deepEqual(removed, ["new"])
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("calcule la taille des documents depuis les métadonnées Drive", async () => {
  const [data, drive] = await Promise.all([
    readFile(new URL("../../lib/documents/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../../lib/google/drive.ts", import.meta.url), "utf8"),
  ])
  assert.match(data, /getDriveFileSize\(document\.drive_document_id\)/)
  assert.match(data, /taille: sizes\[index\]/)
  assert.match(drive, /fields: "id,size"/)
  assert.match(drive, /DRIVE_SIZE_CACHE_TTL_MS/)
})

test("affiche la taille dans la liste, le stockage total et la fiche", async () => {
  const [list, detail] = await Promise.all([
    readFile(new URL("../../app/dashboard/documents/documents-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/dashboard/documents/[id]/document-detail-client.tsx", import.meta.url), "utf8"),
  ])
  assert.match(list, /<TableHead>Taille<\/TableHead>/)
  assert.match(list, /\["Stockage",formatSize\(String\(storage\)\)\]/)
  assert.match(detail, /\["Taille", formatSize\(document\.taille\)\]/)
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("le passeport officiel utilise les colonnes physiques OFFICIELS", async () => {
  const [route, page, mapping] = await Promise.all([
    readFile(new URL("../../app/api/upload-media/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../../app/dashboard/acteurs/officiels/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../docs/mappings/google-sheets-workbooks.md", import.meta.url), "utf8"),
  ])
  assert.match(mapping, /\*\*OFFICIELS\*\*[^\n]*`passeport_drive_url`/)
  assert.match(route, /officiels:[^\n]*passportUrlColumn: "passeport_drive_url"/)
  assert.match(page, /urlPasseport: row\.passeport_drive_url \|\| null/)
})

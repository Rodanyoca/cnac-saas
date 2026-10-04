import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("les colonnes passeport OFFICIELS sont conservées mais leur upload reste hors périmètre", async () => {
  const [route, page, mapping] = await Promise.all([
    readFile(new URL("../../app/api/upload-media/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../../app/dashboard/acteurs/officiels/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../docs/mappings/google-sheets-workbooks.md", import.meta.url), "utf8"),
  ])
  assert.match(mapping, /\*\*OFFICIELS\*\*[^\n]*`passeport_drive_url`/)
  assert.match(route, /kind !== "athletes" \|\| type !== "avatar"/)
  assert.doesNotMatch(route, /passportUrlColumn|uploadFileToDrive/)
  assert.match(page, /urlPasseport: row\.passeport_drive_url \|\| null/)
})

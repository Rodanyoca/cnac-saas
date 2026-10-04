import assert from "node:assert/strict"
import test from "node:test"
import sharp from "sharp"
import { validateImageFile } from "../../lib/cnac/image-validation.ts"
import { CnacDataError } from "../../lib/cnac/model.ts"
import { cnacMediaUrl, mediaCellReferences } from "../../lib/cnac/media-url.ts"

for (const [format, mime] of [["png", "image/png"], ["jpeg", "image/jpeg"], ["webp", "image/webp"]] as const) {
  test(`decodes a real ${format} image`, async () => {
    const buffer = await sharp({ create: { width: 4, height: 3, channels: 3, background: "white" } }).toFormat(format).toBuffer()
    assert.deepEqual(await validateImageFile(new File([buffer], `image.${format}`, { type: mime })), buffer)
  })
}
test("rejects a renamed document and a truncated PNG despite their declared image MIME", async () => {
  for (const bytes of [Buffer.from("<svg onload='alert(1)'></svg>"), Buffer.from([137,80,78,71,13,10,26,10])]) {
    await assert.rejects(validateImageFile(new File([bytes], "photo.png", { type: "image/png" })), error => error instanceof CnacDataError && error.code === "IMAGE_INVALID")
  }
})
test("rejects empty, disallowed and oversized images", async () => {
  await assert.rejects(validateImageFile(new File([], "empty.png", { type: "image/png" })), CnacDataError)
  await assert.rejects(validateImageFile(new File(["gif"], "image.gif", { type: "image/gif" })), CnacDataError)
  await assert.rejects(validateImageFile(new File([new Uint8Array(4 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" })), error => error instanceof CnacDataError && error.status === 413)
})
test("private image URLs use the record and its current version, never a Drive view URL", () => {
  assert.equal(cnacMediaUrl("avatar", "ATH-0001", "private"), "/api/athletes/ATH-0001/avatar?v=private")
  assert.equal(cnacMediaUrl("logo", "FED001", "private"), "/api/federations/logo/FED001?v=private")
  assert.equal(cnacMediaUrl("avatar", "ATH-0001", ""), "")
})
test("shared references are detected even with spaces or only a legacy Drive URL", () => {
  assert.equal(mediaCellReferences(" file-1 ", "file-1"), true)
  assert.equal(mediaCellReferences("https://drive.google.com/file/d/file-1/view", "file-1"), true)
  assert.equal(mediaCellReferences("https://drive.google.com/thumbnail?id=file-1", "file-1"), true)
  assert.equal(mediaCellReferences("/api/athletes/ATH-0001/avatar?v=file-1", "file-1"), true)
  assert.equal(mediaCellReferences("/api/athletes/ATH-0001/avatar?v=file-10", "file-1"), false)
})

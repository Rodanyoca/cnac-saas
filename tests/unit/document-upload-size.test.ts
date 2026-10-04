import assert from "node:assert/strict"
import test from "node:test"

import {
  validatePdf,
} from "../../lib/documents/validation.ts"
import {
  DOCUMENT_PDF_MAX_SIZE_BYTES,
  DOCUMENT_PDF_MAX_SIZE_MB,
} from "../../lib/documents/limits.ts"

test("un document PDF de 7 Mo est désormais accepté", () => {
  assert.equal(DOCUMENT_PDF_MAX_SIZE_MB, 25)
  assert.doesNotThrow(() => validatePdf({ size: 7 * 1024 * 1024 } as File))
})

test("la limite documentaire reste contrôlée côté serveur", () => {
  assert.doesNotThrow(() => validatePdf({ size: DOCUMENT_PDF_MAX_SIZE_BYTES } as File))
  assert.throws(
    () => validatePdf({ size: DOCUMENT_PDF_MAX_SIZE_BYTES + 1 } as File),
    /25 Mo/,
  )
})

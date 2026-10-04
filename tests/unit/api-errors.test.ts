import assert from "node:assert/strict"
import test from "node:test"
import { apiErrorPayload, classifyApiError } from "../../lib/api/errors.ts"

for (const [status, code] of [[400,"INVALID_DATA"],[401,"AUTHENTICATION_REQUIRED"],[403,"ACCESS_DENIED"],[404,"NOT_FOUND"],[409,"CONFLICT"],[429,"RATE_LIMITED"],[500,"INTERNAL_ERROR"]] as const) {
  test(`l'erreur ${status} produit le contrat API commun`, () => {
    const result = apiErrorPayload(new Error("message métier"), "request-123", status)
    assert.equal(result.status, status)
    assert.equal(result.payload.code, code)
    assert.equal(result.payload.request_id, "request-123")
    assert.equal(typeof result.payload.retryable, "boolean")
    assert.equal(result.payload.details_non_sensibles, null)
    assert.equal(result.payload.champ_concerne, null)
  })
}

test("une erreur Sheets est temporaire et son détail brut reste côté serveur", () => {
  const result = classifyApiError(new Error("Failed to read Google Sheet spreadsheetId=secret: quota exceeded"))
  assert.equal(result.status, 429)
  assert.equal(result.code, "RATE_LIMITED")
  assert.doesNotMatch(result.message, /spreadsheetId|secret/i)
  assert.equal(result.retryable, true)
})

import assert from "node:assert/strict"
import test from "node:test"

import { describeAuthenticationFailure } from "../../lib/auth/login-error.ts"

test("détecte clairement les erreurs de configuration d'authentification", () => {
  const serviceDown = describeAuthenticationFailure(new Error("GOOGLE_SHEETS_USERS_SPREADSHEET_ID est manquant."))
  const missingSecret = describeAuthenticationFailure(new Error("AUTH_SECRET is not defined in environment variables"))

  assert.equal(serviceDown.status, 503)
  assert.match(serviceDown.message, /configuration|GOOGLE_SHEETS_USERS_SPREADSHEET_ID/i)

  assert.equal(missingSecret.status, 503)
  assert.match(missingSecret.message, /configuration|AUTH_SECRET/i)
})

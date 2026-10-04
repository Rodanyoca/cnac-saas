import assert from "node:assert/strict"
import test from "node:test"
import { hasValidFederationLogoSignature, logoDialogReducer, validateFederationLogo } from "../../lib/federations/logo.ts"

test("accepte un logo PNG valide et refuse format ou taille invalides", () => {
  assert.deepEqual(validateFederationLogo({ name: "logo.png", type: "image/png", size: 1024 }), { ok: true })
  assert.deepEqual(validateFederationLogo({ name: "logo.svg", type: "image/svg+xml", size: 1024 }), { ok: false, error: "Format non supporté. Utilisez PNG, JPG, JPEG ou WebP." })
  assert.deepEqual(validateFederationLogo({ name: "logo.png", type: "image/png", size: 4 * 1024 * 1024 + 1 }), { ok: false, error: "Le fichier dépasse la taille maximale de 4 Mo." })
})

test("refuse une image dont le contenu ne correspond pas au format annoncé", () => {
  assert.equal(hasValidFederationLogoSignature(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true)
  assert.equal(hasValidFederationLogoSignature(Buffer.from("not-an-image"), "image/png"), false)
})

test("ouvre, ferme et réinitialise la modale du logo", () => {
  const opened = logoDialogReducer({ open: false, phase: "selection", error: "Erreur" }, { type: "open" })
  assert.deepEqual(opened, { open: true, phase: "selection", error: null })
  assert.deepEqual(logoDialogReducer(opened, { type: "close" }), { open: false, phase: "selection", error: null })
})

test("expose les états de confirmation, envoi, réussite et échec", () => {
  const initial = { open: true, phase: "selection" as const, error: null }
  const confirmation = logoDialogReducer(initial, { type: "confirm" })
  assert.equal(confirmation.phase, "confirmation")
  const uploading = logoDialogReducer(confirmation, { type: "upload" })
  assert.equal(uploading.phase, "uploading")
  assert.equal(logoDialogReducer(uploading, { type: "success" }).phase, "success")
  assert.deepEqual(logoDialogReducer(uploading, { type: "failure", error: "Échec" }), { open: true, phase: "selection", error: "Échec" })
})

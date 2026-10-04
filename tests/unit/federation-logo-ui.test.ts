import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const managerPath = new URL("../../components/dashboard/federation-logo-manager.tsx", import.meta.url)
const listPath = new URL("../../app/dashboard/federations/federations-client.tsx", import.meta.url)
const detailPath = new URL("../../app/dashboard/federations/[id]/page.tsx", import.meta.url)
const oldConflictingRoute = new URL("../../app/api/federations/[id]/logo/route.ts", import.meta.url)

test("affiche le logo disponible ou les initiales neutres sans bloquer la fiche", async () => {
  const [manager, detail] = await Promise.all([readFile(managerPath, "utf8"), readFile(detailPath, "utf8")])
  assert.match(manager, /logoUrl && <AvatarImage/)
  assert.match(manager, /<AvatarFallback/)
  assert.match(detail, /initialUrl={federation.logo_drive_url}/)
})

test("propose une modale compacte avec aperçu et confirmation explicite", async () => {
  const source = await readFile(managerPath, "utf8")
  assert.match(source, />Modifier le logo<\/Button>/)
  assert.match(source, /<DialogContent className="max-h-\[90vh\].*sm:max-w-sm/)
  assert.match(source, /Aperçu du logo sélectionné/)
  assert.match(source, />Confirmer l’envoi<\/Button>/)
  assert.match(source, /`\/api\/federations\/logo\/\${encodeURIComponent\(federationId\)}`/)
  assert.match(source, /role="status"/)
  assert.match(source, /role="alert"/)
})

test("place la colonne Logo immédiatement après Identifiant dans la liste", async () => {
  const source = await readFile(listPath, "utf8")
  assert.match(source, /<span>Identifiant<\/span><span>Logo<\/span><span>Nom et sigle<\/span>/)
  assert.match(source, /logo_drive_url/)
})

test("l’API logo n’utilise pas un slug concurrent de [resource]", async () => {
  await assert.rejects(() => readFile(oldConflictingRoute, "utf8"), { code: "ENOENT" })
})

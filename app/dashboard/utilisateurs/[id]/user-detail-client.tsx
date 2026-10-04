"use client"

import { apiFetch } from "@/lib/api/client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuditLogEntry, UserAuthorization } from "@/lib/users/types"

type User = { id: string; nomComplet: string; email: string; typeUser: string; statut: string; estSuperAdmin: boolean; doitChangerMotDePasse: boolean; sessionVersion: number }

export default function UserDetailClient({ initial, initialAuthorizations, audit }: { initial: User; initialAuthorizations: UserAuthorization[]; audit: AuditLogEntry[] }) {
  const [user, setUser] = useState(initial)
  const [authorizations, setAuthorizations] = useState(initialAuthorizations)
  const [message, setMessage] = useState("")
  const [secret, setSecret] = useState<string | null>(null)

  async function patchUser() {
    if (!confirm("Cette modification peut révoquer les sessions. Continuer ?")) return
    const response = await apiFetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: crypto.randomUUID(), patch: { nomComplet: user.nomComplet, email: user.email, typeUser: user.typeUser, statut: user.statut, estSuperAdmin: user.estSuperAdmin } }) })
    const result = await response.json()
    setMessage(response.ok ? "Compte mis à jour." : result.error)
    if (result.temporaryAccess) setSecret(result.temporaryAccess)
  }

  async function revoke() {
    if (!confirm("Déconnecter toutes les sessions de ce compte ?")) return
    const response = await apiFetch(`/api/users/${user.id}/revoke-sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: crypto.randomUUID() }) })
    const result = await response.json()
    setMessage(response.ok ? "Toutes les sessions sont révoquées." : result.error)
  }

  async function reset() {
    if (!confirm("Réinitialiser l’accès et révoquer toutes les sessions ?")) return
    const response = await apiFetch(`/api/users/${user.id}/reset-access`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: crypto.randomUUID() }) })
    const result = await response.json()
    setMessage(response.ok ? "Accès réinitialisé." : result.error)
    if (result.temporaryAccess) setSecret(result.temporaryAccess)
  }

  async function addAuthorization(form: FormData) {
    const response = await apiFetch(`/api/users/${user.id}/authorizations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: crypto.randomUUID(), block: form.get("block"), dateDebut: form.get("dateDebut"), dateFin: form.get("dateFin") }) })
    const result = await response.json()
    if (response.ok && result.authorization) setAuthorizations([...authorizations, result.authorization])
    else setMessage(result.error ?? "Requête déjà traitée.")
  }

  async function closeAuthorization(id: string) {
    if (!confirm("Retirer cette autorisation ?")) return
    const response = await apiFetch(`/api/users/${user.id}/authorizations`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: crypto.randomUUID(), id }) })
    const result = await response.json()
    if (response.ok) setAuthorizations(authorizations.map((item) => item.idUserAutorisation === id ? result.authorization : item))
    else setMessage(result.error)
  }

  return <main className="space-y-7 p-6">
    <h1 className="text-2xl font-semibold">{user.nomComplet}</h1>
    <section className="grid max-w-2xl gap-3 sm:grid-cols-2">
      <Label>Nom<Input value={user.nomComplet} onChange={(event) => setUser({ ...user, nomComplet: event.target.value })} /></Label>
      <Label>E-mail<Input type="email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} /></Label>
      <Label>Type<select value={user.typeUser} onChange={(event) => setUser({ ...user, typeUser: event.target.value })} className="block w-full rounded border p-2"><option>ADMIN</option><option>VIEWER</option></select></Label>
      <Label>Statut<select value={user.statut} onChange={(event) => setUser({ ...user, statut: event.target.value })} className="block w-full rounded border p-2"><option>ACTIF</option><option>INACTIF</option><option>BLOQUE</option></select></Label>
      <Label className="flex gap-2"><input type="checkbox" checked={user.estSuperAdmin} onChange={(event) => setUser({ ...user, estSuperAdmin: event.target.checked })} />Super-administrateur</Label>
    </section>
    <div className="flex flex-wrap gap-2"><Button onClick={patchUser}>Enregistrer</Button><Button variant="outline" onClick={reset}>Réinitialiser l’accès</Button><Button variant="destructive" onClick={revoke}>Déconnecter toutes les sessions</Button></div>
    {message && <p role="status">{message}</p>}
    {secret && <section role="dialog" aria-label="Accès temporaire"><strong>Affichage unique</strong><code className="block p-3">{secret}</code><Button onClick={() => setSecret(null)}>Fermer</Button></section>}
    <section><h2 className="text-lg font-semibold">Autorisations</h2><form action={addAuthorization} className="flex flex-wrap gap-2"><select name="block" aria-label="Bloc"><option>AUT-ADM</option><option>AUT-SPT</option><option>AUT-COM</option></select><Input name="dateDebut" aria-label="Date de début" type="date" required /><Input name="dateFin" aria-label="Date de fin" type="date" /><Button>Attribuer</Button></form><ul>{authorizations.map((item) => <li className="flex gap-3 py-2" key={item.idUserAutorisation}><span>{item.idBlocAutorisation} · {item.dateDebut} → {item.dateFin ?? "sans fin"} · {item.statut}</span>{item.statut === "ACTIF" && <Button size="sm" variant="outline" onClick={() => closeAuthorization(item.idUserAutorisation)}>Retirer</Button>}</li>)}</ul></section>
    <section><h2 className="text-lg font-semibold">Historique minimal</h2><ul>{audit.map((entry) => <li key={entry.idOperation}>{entry.dateOperation} · {entry.action} · {entry.resultat}</li>)}</ul></section>
  </main>
}

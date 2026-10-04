import { apiFetch } from "./client"

// Garder le ticket dans le formulaire jusqu'au succès confirmé. Une erreur réseau
// du commit peut être reprise avec ce ticket sans recréer une fiche ou un fichier.
const pending = new WeakMap<{ current: string }, Promise<Awaited<ReturnType<typeof saveRequest>>>>()
export async function confirmedSave(url: string, method: "POST" | "PUT", data: unknown, file: File | null, field: "avatar" | "logo" | "file", ticket: { current: string }) {
  const current = pending.get(ticket)
  if (current) return current
  const operation = saveRequest(url, method, data, file, field, ticket)
  pending.set(ticket, operation)
  try { return await operation } finally { if (pending.get(ticket) === operation) pending.delete(ticket) }
}
async function saveRequest(url: string, method: "POST" | "PUT", data: unknown, file: File | null, field: "avatar" | "logo" | "file", ticket: { current: string }) {
  for (let phase = 0; phase < 2; phase++) {
    const body = new FormData()
    body.set("data", JSON.stringify(data))
    if (file) body.set(field, file)
    if (ticket.current) body.set("ticket", ticket.current)
    let response: Response
    try { response = await apiFetch(url, { method, body, timeoutMs: 120_000 }) }
    catch { throw new Error("La connexion au serveur a été interrompue. Gardez ce formulaire ouvert et réessayez pour vérifier la même sauvegarde.") }
    const result = await response.json()
    if (response.status === 202 && result.prepared && result.ticket) { ticket.current = result.ticket; continue }
    if (!response.ok) { if (result.resetTicket) ticket.current = ""; throw new Error(result.error || "La sauvegarde n’est pas confirmée. Réessayez dans ce formulaire.") }
    ticket.current = ""
    return result
  }
  throw new Error("La préparation de la sauvegarde est invalide.")
}

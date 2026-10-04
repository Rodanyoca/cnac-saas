import type { Entite } from "./types"

export type EntityContact = {
  id: string
  nom: string
  fonction: string
  telephone: string
  email: string
}

export type FederationLinkedEntity = Entite & { contacts: EntityContact[] }

const value = (row: Record<string, unknown>, key: string) => String(row[key] ?? "").trim()

export function resolveActiveEntityContacts(rows: Record<string, unknown>[], entityId: string): EntityContact[] {
  if (!entityId) return []
  return rows
    .filter((row) => value(row, "id_entite") === entityId && value(row, "statut").toLocaleUpperCase("fr") === "ACTIF")
    .map((row) => ({
      id: value(row, "id_autre_acteur_coc"),
      nom: value(row, "nom_complet"),
      fonction: value(row, "type_autre_acteur"),
      telephone: value(row, "telephone"),
      email: value(row, "email"),
    }))
    .filter((contact) => contact.id || contact.nom)
}

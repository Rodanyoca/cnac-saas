export const ENTITY_CONTACT_SHEET = "PERSONNES_CONTACT_ENTITES"
export const ENTITY_CONTACT_HEADERS = ["id_contact_entite", "id_entite", "id_type_acteur", "id_acteur_coc", "fonction_contact", "est_contact_principal", "statut", "observation"] as const

export const CONTACT_ACTOR_TYPES = {
  TYPACT002: { label: "Entraîneur", sheet: "COACHS", idColumn: "id_coach_coc" },
  TYPACT003: { label: "Médecin", sheet: "MEDECINS", idColumn: "id_medecin_coc" },
  TYPACT004: { label: "Arbitre", sheet: "ARBITRES", idColumn: "id_arbitre_coc" },
  TYPACT005: { label: "Officiel", sheet: "OFFICIELS", idColumn: "id_officiel_coc" },
  TYPACT006: { label: "Autre acteur", sheet: "AUTRES", idColumn: "id_autre_acteur_coc" },
} as const
export type ContactActorTypeId = keyof typeof CONTACT_ACTOR_TYPES

export type EntityContact = {
  id_contact_entite: string; id_entite: string; id_type_acteur: string; id_acteur_coc: string
  fonction_contact: string; est_contact_principal: boolean; statut: "ACTIF" | "INACTIF"; observation: string
  nom_complet: string; telephone: string; email: string; type_acteur: string
}

const text = (value: unknown) => String(value ?? "").trim()
export function normalizeContactInput(input: Record<string, unknown>) {
  return {
    id_entite: text(input.id_entite), id_type_acteur: text(input.id_type_acteur), id_acteur_coc: text(input.id_acteur_coc),
    fonction_contact: text(input.fonction_contact), est_contact_principal: String(input.est_contact_principal).toUpperCase() === "TRUE" || input.est_contact_principal === true,
    statut: text(input.statut).toUpperCase() || "ACTIF", observation: text(input.observation),
  }
}

export function validateContactRules(input: ReturnType<typeof normalizeContactInput>, existing: Record<string, string>[], currentId = "") {
  if (!input.id_entite) throw new Error("L’entité est obligatoire.")
  if (input.id_type_acteur === "TYPACT001") throw new Error("Un athlète ne peut pas être une personne de contact.")
  if (!(input.id_type_acteur in CONTACT_ACTOR_TYPES)) throw new Error("Le type d’acteur n’est pas autorisé.")
  if (!input.id_acteur_coc) throw new Error("La personne est obligatoire.")
  if (!input.fonction_contact) throw new Error("La fonction auprès de l’entité est obligatoire.")
  if (!(["ACTIF", "INACTIF"] as string[]).includes(input.statut)) throw new Error("Le statut doit être ACTIF ou INACTIF.")
  const others = existing.filter((row) => row.id_contact_entite !== currentId)
  if (input.statut === "ACTIF" && others.some((row) => row.id_entite === input.id_entite && row.id_type_acteur === input.id_type_acteur && row.id_acteur_coc === input.id_acteur_coc && row.statut === "ACTIF")) throw new Error("Cette personne possède déjà une relation de contact active avec l’entité.")
  if (input.statut === "ACTIF" && input.est_contact_principal && others.some((row) => row.id_entite === input.id_entite && row.statut === "ACTIF" && row.est_contact_principal === "TRUE")) throw new Error("Cette entité possède déjà un contact principal actif.")
}

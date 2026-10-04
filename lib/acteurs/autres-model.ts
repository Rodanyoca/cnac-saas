export const OTHER_ACTOR_COLUMNS = [
  "id_autre_acteur_coc", "id_entite", "id_autre_acteur_entite", "id_national", "id_international", "nom_complet", "id_sexe", "date_de_naissance", "lieu_de_naissance", "nationalite", "type_autre_acteur", "telephone", "email", "adresse", "numero_passeport", "date_de_delivrance_passeport", "date_expiration_passeport", "statut", "avatar_drive_id", "avatar_drive_url", "passeport_drive_id", "passeport_drive_url", "observations",
] as const

export type OtherActor = Record<(typeof OTHER_ACTOR_COLUMNS)[number], string>
export type OtherActorView = OtherActor & { entiteNom: string; entiteSigle: string; federationId: string; federationNom: string; federationSigle: string }
export type OtherActorReferences = {
  entities: { id: string; name: string; acronym: string; category: string; address: string; phone: string; email: string; website: string }[]
  federations: { id: string; entityId: string; name: string; acronym: string }[]
  functions: string[]
  sexes: { id: string; label: string }[]
  statuses: string[]
}

export function mapOtherActorRow(row: Record<string, unknown>): OtherActor {
  return Object.fromEntries(OTHER_ACTOR_COLUMNS.map((column) => [column, String(row[column] ?? "").trim()])) as OtherActor
}

export const normalizeOtherActorName = (value: string) => value.trim().replace(/\s+/g, " ")

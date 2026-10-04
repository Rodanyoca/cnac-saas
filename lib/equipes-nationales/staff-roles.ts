type RoleOption = { id: string; label: string; parentId?: string }

const tokens: Record<string, string[]> = {
  COACH: ["ENTRAINEUR", "COACH"],
  MEDECIN: ["MEDECIN"],
  OFFICIEL: ["OFFICIEL", "CHEF_DELEGATION", "TEAM_MANAGER"],
  ARBITRE: ["ARBITRE", "OFFICIEL"],
}

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_")

export function roleForActorType(actorType: string, roles: RoleOption[]) {
  const preferred = tokens[normalize(actorType)] ?? []
  return roles.find((role) => preferred.some((token) => normalize(`${role.id} ${role.label}`).includes(token)))?.id || roles[0]?.id || ""
}

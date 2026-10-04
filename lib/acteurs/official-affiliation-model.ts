export type DatedOfficialAffiliation = {
  id_officiel_coc: string
  id_entite: string
  date_debut: string
  date_fin: string
}

/**
 * L'organisation principale d'un officiel est sa plus ancienne affiliation
 * encore ouverte. Une affiliation est ouverte uniquement lorsque date_fin est vide.
 */
export function getPrimaryOfficialAffiliation<T extends DatedOfficialAffiliation>(affiliations: T[]): T | undefined {
  return affiliations
    .filter((affiliation) => !affiliation.date_fin.trim())
    .sort((first, second) => {
      if (!first.date_debut) return 1
      if (!second.date_debut) return -1
      return first.date_debut.localeCompare(second.date_debut)
    })[0]
}

export function getPrimaryOfficialEntities<T extends DatedOfficialAffiliation>(affiliations: T[]) {
  const grouped = new Map<string, T[]>()
  for (const affiliation of affiliations) {
    const rows = grouped.get(affiliation.id_officiel_coc) || []
    rows.push(affiliation)
    grouped.set(affiliation.id_officiel_coc, rows)
  }

  return new Map(
    [...grouped].flatMap(([officialId, rows]) => {
      const primary = getPrimaryOfficialAffiliation(rows)
      return primary ? [[officialId, primary.id_entite] as const] : []
    }),
  )
}

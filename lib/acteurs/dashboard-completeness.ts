const hasValue = (row: Record<string, string>, keys: readonly string[]) =>
  keys.some((key) => String(row[key] || "").trim())

export function actorCompletenessChecks(
  row: Record<string, string>,
  affiliationKeys: readonly string[],
  relatedAffiliation = false,
) {
  return [
    hasValue(row, ["nom_complet"]),
    hasValue(row, ["id_sexe", "nom_sexe"]),
    relatedAffiliation || hasValue(row, affiliationKeys),
    hasValue(row, ["date_de_naissance", "date_naissance"]),
    hasValue(row, ["email"]),
    hasValue(row, ["statut"]),
  ]
}

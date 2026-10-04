function normalizeActorId(value: unknown) {
  return String(value ?? "").trim().normalize("NFKC").toLocaleUpperCase("fr")
}

export function findActorRowById<T extends Record<string, unknown>>(
  rows: T[],
  idColumn: keyof T,
  requestedId: string,
) {
  const normalizedId = normalizeActorId(requestedId)
  if (!normalizedId) return undefined
  return rows.find((row) => normalizeActorId(row[idColumn]) === normalizedId)
}

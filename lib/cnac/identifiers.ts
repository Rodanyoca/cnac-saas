import { CnacDataError, type SheetRecord } from "./model.ts"

export const CNAC_ID_PREFIXES = {
  HIERARCHIE: "HIE", ZONES: "ZON", LIGUES: "LIG", ENTENTES: "ENT",
  CERCLES: "CER", CLUBS: "CLB", EQUIPES: "EQP", ATHLETES: "ATH",
  COACHS: "COA", ARBITRES: "ARB", OFFICIELS: "OFF", MEDECINS: "MED", AUTRES: "AUT",
} as const

export function nextCompactCnacId(prefix: string, existingIds: Iterable<string>): string {
  const ids = new Set(existingIds)
  const pattern = new RegExp(`^${prefix}-(\\d{4,8})$`)
  let last = 0
  for (const id of ids) last = Math.max(last, Number(id.match(pattern)?.[1] || 0))
  if (last >= 99999999) throw new CnacDataError("ID_EXHAUSTED", "La séquence des identifiants CNAC est épuisée.")
  return `${prefix}-${String(last + 1).padStart(4, "0")}`
}

// Partager la file entre les bundles serveur pour sérialiser lecture + création.
const state = globalThis as typeof globalThis & { __cnacCreationQueues?: Map<string, Promise<unknown>> }
const queues = state.__cnacCreationQueues ??= new Map()
export async function withCnacCreationQueue<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve()
  const current = previous.catch(() => undefined).then(operation)
  queues.set(key, current)
  try { return await current } finally { if (queues.get(key) === current) queues.delete(key) }
}

export function recordIds(rows: SheetRecord[], column: string) {
  return rows.map(row => row[column]).filter(Boolean)
}

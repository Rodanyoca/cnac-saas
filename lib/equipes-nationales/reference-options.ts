import type { ReferenceOption } from "./types.ts"

export function uniqueReferenceOptions(options: readonly ReferenceOption[]): ReferenceOption[] {
  const unique = new Map<string, ReferenceOption>()
  for (const option of options) {
    const id = option.id.trim()
    if (!id || unique.has(id)) continue
    unique.set(id, { ...option, id })
  }
  return [...unique.values()]
}

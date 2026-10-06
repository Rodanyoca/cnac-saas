// Présentation uniquement : ce cache ne sert jamais à autoriser une page ou une API.
export const NAVIGATION_SNAPSHOT_KEY = "cnac.navigation.presentation"
export function navigationSnapshot(value: string) {
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed.access !== "object" || parsed.access === null) return null
    return { access: Object.fromEntries(Object.entries(parsed.access).filter(([key, value]) => /^AUT-(ADM|SPT|COM):READ$/.test(key) && typeof value === "boolean")) as Record<string, boolean>, isSuperAdmin: parsed.isSuperAdmin === true }
  } catch { return null }
}

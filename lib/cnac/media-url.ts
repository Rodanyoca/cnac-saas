export type CnacImageKind = "logo" | "avatar"
export function cnacMediaUrl(kind: CnacImageKind, recordId: string, fileId: string): string {
  if (!fileId) return ""
  const path = kind === "logo" ? `/api/federations/logo/${encodeURIComponent(recordId)}` : `/api/athletes/${encodeURIComponent(recordId)}/avatar`
  return `${path}?v=${encodeURIComponent(fileId)}`
}

export function mediaCellReferences(value: unknown, fileId: string) {
  const raw = String(value || "").trim()
  if (raw === fileId) return true
  try {
    const url = new URL(raw, "https://cnac.invalid")
    if (url.hostname === "drive.google.com") return url.searchParams.get("id") === fileId || url.pathname.split("/")[3] === fileId && url.pathname.startsWith("/file/d/")
    if (url.pathname.startsWith("/api/federations/logo/") || /^\/api\/athletes\/[^/]+\/avatar$/.test(url.pathname)) return url.searchParams.get("v") === fileId
  } catch { /* cellule sans URL */ }
  return false
}

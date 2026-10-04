const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

// No token in JavaScript: browser mutations must carry the exact application origin.
// Host comes from the ingress request; arbitrary X-Forwarded-Host is not trusted.
export function isSameOriginMutation(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true
  if (request.headers.get("sec-fetch-site") === "cross-site") return false
  const origin = request.headers.get("origin")
  if (!origin || origin === "null") return false
  try {
    const source = new URL(origin)
    const target = new URL(request.url)
    const host = request.headers.get("host") || target.host
    if (!["http:", "https:"].includes(source.protocol) || source.host !== host) return false
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || target.protocol.slice(0, -1)
    return source.protocol === `${protocol}:` && source.pathname === "/" && !source.search && !source.hash && !source.username && !source.password
  } catch {
    return false
  }
}

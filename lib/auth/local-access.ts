import { createHash, timingSafeEqual } from "node:crypto"
import { verifySessionToken } from "./session-token.ts"

type Environment = Record<string, string | undefined>
export const LOCAL_ADMIN_ID = "CNAC-LOCAL-ADMIN"

export function isLocalAuthentication(env: Environment = process.env) {
  return env.CNAC_LOCAL_AUTH === "true"
}

export function localCredentialsMatch(email: string, password: string, env: Environment = process.env) {
  if (!isLocalAuthentication(env) || !env.CNAC_LOCAL_EMAIL || !env.CNAC_LOCAL_PASSWORD) return false
  const digest = (value: string) => createHash("sha256").update(value).digest()
  return email.trim().toLowerCase() === env.CNAC_LOCAL_EMAIL.trim().toLowerCase() &&
    timingSafeEqual(digest(password), digest(env.CNAC_LOCAL_PASSWORD))
}

export async function resolveLocalSession(token: string | undefined, env: Environment = process.env) {
  if (!isLocalAuthentication(env) || !token || !env.AUTH_SECRET || !env.CNAC_LOCAL_EMAIL || !env.CNAC_LOCAL_PASSWORD) return null
  const payload = await verifySessionToken({ token, secret: env.AUTH_SECRET })
  if (!payload || payload.id_user !== LOCAL_ADMIN_ID || payload.session_version !== 1) return null
  return {
    id: LOCAL_ADMIN_ID, idUser: LOCAL_ADMIN_ID,
    nom: "Administrateur CNAC", email: env.CNAC_LOCAL_EMAIL,
    typeUser: "ADMIN" as const, estSuperAdmin: true,
    statut: "ACTIF" as const, sessionVersion: 1,
    iat: payload.iat, exp: payload.exp, doitChangerMotDePasse: false,
  }
}

const attempts = new Map<string, { failures: number; expires: number }>()
export function localLoginBlocked(key: string, now = Date.now()) {
  for (const [entry, state] of attempts) if (state.expires <= now) attempts.delete(entry)
  return (attempts.get(key)?.failures ?? 0) >= 8
}
export function recordLocalLogin(key: string, accepted: boolean, now = Date.now()) {
  if (accepted) { attempts.delete(key); return }
  const current = attempts.get(key)
  attempts.set(key, { failures: (current?.failures ?? 0) + 1, expires: current?.expires ?? now + 15 * 60 * 1000 })
}

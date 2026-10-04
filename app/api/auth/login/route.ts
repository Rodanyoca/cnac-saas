import { randomUUID } from "node:crypto"
import { after, NextResponse } from "next/server"
import { createSession } from "@/lib/auth"
import { attemptState, recordAttempt, progressiveDelay, waitForDelay } from "@/lib/auth/attempts"
import { describeAuthenticationFailure } from "@/lib/auth/login-error"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { postLoginRoute } from "@/lib/auth/post-login-route"
import { getTelemetryKey, pseudonymizeTelemetry } from "@/lib/auth/telemetry-hash"
import { AUDIT_ACTIONS } from "@/lib/audit/actions"
import { writeAudit } from "@/lib/audit/logger"
import { UserCommands } from "@/lib/users/commands"
import { createGoogleUsersSheetsAdapter } from "@/lib/users/google-adapter"
import { getAuthenticationSnapshot } from "@/lib/users/data"

import { isLocalAuthentication, LOCAL_ADMIN_ID, localCredentialsMatch, localLoginBlocked, recordLocalLogin } from "@/lib/auth/local-access"

const denied = () => NextResponse.json({ error: "Les informations saisies ne permettent pas d’accéder au système." }, { status: 401 })
const dummyHash = hashPassword(randomUUID())

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "adresse-indisponible"
}

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }) }
  const email = typeof body.email === "string" ? body.email.trim() : "", password = typeof body.password === "string" ? body.password : ""
  if (!email || !password) return NextResponse.json({ error: "Requête invalide." }, { status: 400 })

  const now = new Date(), requestId = request.headers.get("x-request-id")?.trim() || randomUUID()
  try {
    if (isLocalAuthentication()) {
      const key = `${clientAddress(request)}:${email.trim().toLowerCase()}`
      if (localLoginBlocked(key)) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429, headers: { "Retry-After": "900" } })
      const accepted = localCredentialsMatch(email, password)
      recordLocalLogin(key, accepted)
      if (!accepted) return denied()
      await createSession({ idUser: LOCAL_ADMIN_ID, sessionVersion: 1 })
      return NextResponse.json({ ok: true, redirectTo: "/dashboard" })
    }
    const adapter = createGoogleUsersSheetsAdapter(), telemetryKey = getTelemetryKey()
    const identifiantHash = pseudonymizeTelemetry(email, telemetryKey), ipHash = pseudonymizeTelemetry(clientAddress(request), telemetryKey)
    const { attempts, user, authorizations } = await getAuthenticationSnapshot(email)
    const state = attemptState(attempts, identifiantHash, ipHash, now)
    if (state.blocked) {
      await Promise.all([
        recordAttempt({ adapter, identifiantHash, ipHash, result: "REFUS_BLOCAGE_TEMPORAIRE", requestId, now }),
        writeAudit({ adapter, action: AUDIT_ACTIONS.LOGIN, typeObjet: "SESSION", result: "ECHEC", requestId, details: { motif: "REFUS_GENERIQUE" }, now }).catch(() => undefined),
      ])
      await waitForDelay(state.delayMs)
      return denied()
    }

    const passwordMatches = await verifyPassword(password, user?.passwordHash ?? await dummyHash)
    const temporaryAccessValid = !user?.doitChangerMotDePasse || Boolean(user.dateExpirationAccesTemporaire && Date.parse(user.dateExpirationAccesTemporaire) > now.getTime())
    const accepted = Boolean(user && user.statut === "ACTIF" && temporaryAccessValid && passwordMatches)
    if (!accepted) {
      await Promise.all([
        recordAttempt({ adapter, identifiantHash, ipHash, result: "ECHEC", requestId, now }),
        writeAudit({ adapter, actorId: user?.idUser, action: AUDIT_ACTIONS.LOGIN, typeObjet: "SESSION", objectId: user?.idUser, result: "ECHEC", requestId, details: { motif: "REFUS_GENERIQUE" }, now }).catch(() => undefined),
      ])
      await waitForDelay(progressiveDelay(state.failures + 1))
      return denied()
    }
    if (!user) throw new Error("État de connexion incohérent.")

    await createSession({ idUser: user.idUser, sessionVersion: user.sessionVersion })
    after(async () => {
      await Promise.allSettled([
        recordAttempt({ adapter, identifiantHash, ipHash, result: "SUCCES", requestId, now }),
        writeAudit({ adapter, actorId: user.idUser, action: AUDIT_ACTIONS.LOGIN, typeObjet: "SESSION", objectId: user.idUser, result: "SUCCES", requestId, now }),
        new UserCommands(adapter).replaceUser({ ...user, derniereConnexion: now.toISOString() }),
      ])
    })
    return NextResponse.json({ ok: true, redirectTo: postLoginRoute(user, authorizations) })
  } catch (error) {
    const failure = describeAuthenticationFailure(error)
    console.error("[auth/login] Échec de connexion", error)
    return NextResponse.json({ error: failure.message }, { status: failure.status })
  }
}

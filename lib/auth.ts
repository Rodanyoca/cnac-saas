import "server-only"

import { cookies } from "next/headers"
import { getAuthorizationsForUser, getUserById } from "@/lib/users/data"
import { authorize, authorizeWithSource, type AuthorizationAction } from "@/lib/auth/authorization"
import type { AuthorizationBlock } from "@/lib/users/types"
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session-cookie"
import { resolveSession } from "@/lib/auth/session-resolution"
import { createSessionToken } from "@/lib/auth/session-token"


import { getAuthSecret, validateAuthenticationConfiguration } from "@/lib/auth/config"
import { AuthenticationUnavailableError } from "@/lib/auth/errors"

type NewSessionInput = { idUser: string; sessionVersion: number }

function getSecret(): string {
  validateAuthenticationConfiguration()
  return getAuthSecret()
}

export async function createSession(input: NewSessionInput) {
  const token = await createSessionToken({ ...input, secret: getSecret() })
  const jar = await cookies()
  jar.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(process.env.NODE_ENV === "production"))
}

export async function destroySession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE_NAME)
}

export async function getSession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  const resolution = await resolveSession({ token, secret: getSecret(), loadUser: getUserById })
  if (!resolution.ok) {
    if (resolution.reason === "SOURCE_UNAVAILABLE") throw new AuthenticationUnavailableError()
    return null
  }
  const { user, payload } = resolution
  return {
    id: user.idUser,
    nom: user.nomComplet,
    email: user.email,
    idUser: user.idUser,
    typeUser: user.typeUser,
    estSuperAdmin: user.estSuperAdmin,
    statut: user.statut,
    sessionVersion: payload.session_version,
    iat: payload.iat,
    exp: payload.exp,
    doitChangerMotDePasse: user.doitChangerMotDePasse,
  }
}

type ResolvedSession = NonNullable<Awaited<ReturnType<typeof getSession>>>

export async function canAccess(block: AuthorizationBlock, action: AuthorizationAction): Promise<boolean> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE_NAME)?.value
  if (!token) return false
  const resolution = await resolveSession({ token, secret: getSecret(), loadUser: getUserById })
  if (!resolution.ok || resolution.requiresActivation) return false
  const decision = await authorizeWithSource({ user: resolution.user, requirement: { scope: "BUSINESS", blocks: [block] }, action, loadAuthorizations: () => getAuthorizationsForUser(resolution.user.idUser) })
  return decision.allowed
}

export async function getNavigationAccess(currentSession?: ResolvedSession) {
  const session = currentSession ?? await getSession()
  const blocks = ["AUT-ADM", "AUT-SPT", "AUT-COM"] as const
  const actions = ["READ", "WRITE"] as const
  if (session?.estSuperAdmin && !session.doitChangerMotDePasse) {
    return Object.fromEntries((blocks.flatMap((block) =>
      actions.map((action) => [`${block}:${action}`, true] as const)
    ))) as Record<`${AuthorizationBlock}:${AuthorizationAction}`, boolean>
  }
  if (!session || session.doitChangerMotDePasse) return Object.fromEntries(blocks.flatMap((block) => actions.map((action) => [`${block}:${action}`, false]))) as Record<`${AuthorizationBlock}:${AuthorizationAction}`, boolean>
  try {
    const authorizations = await getAuthorizationsForUser(session.idUser)
    return Object.fromEntries(blocks.flatMap((block) => actions.map((action) => [
      `${block}:${action}`,
      authorize({ user: { idUser: session.idUser, typeUser: session.typeUser, estSuperAdmin: session.estSuperAdmin }, authorizations, requirement: { scope: "BUSINESS", blocks: [block] }, action }).allowed,
    ]))) as Record<`${AuthorizationBlock}:${AuthorizationAction}`, boolean>
  } catch {
    throw new AuthenticationUnavailableError()
  }
}

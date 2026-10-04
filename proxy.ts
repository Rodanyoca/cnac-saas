import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie"
import { isPendingPasswordRouteAllowed } from "@/lib/auth/session-policy"
import { resolveSession } from "@/lib/auth/session-resolution"
import { authorizeWithSource } from "@/lib/auth/authorization"
import { routePolicy } from "@/lib/auth/route-policy"
import { getAuthorizationsForUser, getUserById } from "@/lib/users/data"
import { authenticationFailurePath } from "@/lib/auth/failure-navigation"
import { isCnacDemoMode } from "@/lib/demo-mode"

import { isLocalAuthentication, resolveLocalSession } from "@/lib/auth/local-access"

function isPublicRoute(pathname: string) {
  return pathname === "/login" || pathname === "/confidentialite" || pathname === "/conditions-utilisation" || pathname === "/service-indisponible" || pathname === "/api/auth/login"
}

function isMinimalSessionRoute(pathname: string) {
  return pathname === "/activation" || pathname === "/api/auth/activate" || pathname === "/api/auth/session" || pathname === "/api/auth/logout"
}

function isAccountRoute(pathname: string) { return pathname === "/mon-compte" || pathname === "/api/auth/change-password" }

function deny(request: NextRequest, status = 401) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const error = status === 503 ? "Service d’authentification indisponible." : "Session invalide."
    return NextResponse.json({ error }, { status })
  }
  return NextResponse.redirect(new URL(authenticationFailurePath(status), request.url))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (isPublicRoute(pathname)) return NextResponse.next()
  if (isLocalAuthentication()) {
    const session = await resolveLocalSession(request.cookies.get(SESSION_COOKIE_NAME)?.value)
    return session ? NextResponse.next() : deny(request)
  }
  if (isCnacDemoMode()) return NextResponse.next()
  const secret = process.env.AUTH_SECRET
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!secret || !token) return deny(request)

  const resolution = await resolveSession({ token, secret, loadUser: getUserById })
  if (!resolution.ok) return deny(request, resolution.reason === "SOURCE_UNAVAILABLE" ? 503 : 401)
  if (resolution.requiresActivation && !isPendingPasswordRouteAllowed(pathname)) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Activation du compte requise." }, { status: 403 })
    return NextResponse.redirect(new URL("/activation", request.url))
  }
  if (isMinimalSessionRoute(pathname)) return NextResponse.next()
  if (isAccountRoute(pathname)) return NextResponse.next()

  const policy = routePolicy(pathname, request.method)
  if (!policy) return deny(request, 403)
  const decision = await authorizeWithSource({ user: resolution.user, requirement: policy, action: policy.action, loadAuthorizations: () => getAuthorizationsForUser(resolution.user.idUser) })
  if (!decision.allowed) return deny(request, decision.reason === "SOURCE_UNAVAILABLE" ? 503 : 403)
  return NextResponse.next()
}

export const config = { matcher: ["/dashboard/:path*", "/api/:path*", "/login", "/activation", "/mon-compte"] }

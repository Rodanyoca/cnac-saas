import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { apiErrorPayload } from "@/lib/api/errors"
import { writeAudit } from "@/lib/audit/logger"
import { getSession } from "@/lib/auth"
import { authorizeWithSource } from "@/lib/auth/authorization"
import { getAuthorizationsForUser } from "@/lib/users/data"
import { createGoogleUsersSheetsAdapter } from "@/lib/users/google-adapter"
import { UsersRepository } from "@/lib/users/repository"

type MutationResult<T> = { row: T; objectId: string }
type SportMutationBody = Record<string, unknown> & { id?: unknown; row?: Record<string, unknown> }

export async function runSportMutation<T>(
  request: Request,
  meta: { action: string; typeObjet: string },
  operation: (body: SportMutationBody) => Promise<MutationResult<T>>,
) {
  const startedAt = performance.now()
  const session = await getSession()
  if (!session) {
    const failure = apiErrorPayload(new Error("Authentification requise."), randomUUID(), 401)
    return NextResponse.json(failure.payload, { status: 401 })
  }
  const access = await authorizeWithSource({
    user: session,
    requirement: { scope: "BUSINESS", blocks: ["AUT-SPT"] },
    action: "WRITE",
    loadAuthorizations: () => getAuthorizationsForUser(session.idUser),
  })
  if (!access.allowed) {
    const sourceUnavailable = access.reason === "SOURCE_UNAVAILABLE"
    const status = sourceUnavailable ? 503 : 403
    const failure = apiErrorPayload(new Error(sourceUnavailable ? "Service d’autorisation temporairement indisponible." : "Accès refusé."), randomUUID(), status)
    return NextResponse.json(failure.payload, { status })
  }

  const suppliedRequestId = request.headers.get("x-request-id")?.trim() || ""
  if (suppliedRequestId && (suppliedRequestId.length < 8 || suppliedRequestId.length > 100)) {
    const failure = apiErrorPayload(new Error("Identifiant de requête invalide."), randomUUID(), 400)
    return NextResponse.json(failure.payload, { status: failure.status })
  }
  const requestId = suppliedRequestId || createHash("sha256")
    .update(`${session.idUser}|${request.method}|${request.url}|${await request.clone().text()}|${Math.floor(Date.now() / 30_000)}`)
    .digest("hex")
  const adapter = createGoogleUsersSheetsAdapter()
  const processed = (await new UsersRepository(adapter).getAuditLog()).some((entry) => entry.requestId === requestId)
  if (processed) {
    const failure = apiErrorPayload(new Error("Cette requête a déjà été traitée."), requestId, 409)
    return NextResponse.json({ ...failure.payload, alreadyProcessed: true }, { status: failure.status })
  }

  try {
    const body = await request.json() as SportMutationBody
    const result = await operation(body)
    await writeAudit({ adapter, actorId: session.idUser, action: meta.action, typeObjet: meta.typeObjet, objectId: result.objectId, result: "SUCCES", requestId })
    const duration = Math.round(performance.now() - startedAt)
    return NextResponse.json(
      { ok: true, row: result.row, requestId, request_id: requestId, server_timing_ms: duration },
      { headers: { "x-request-id": requestId, "server-timing": `app;dur=${duration}` } },
    )
  } catch (error) {
    const failure = apiErrorPayload(error, requestId)
    await writeAudit({ adapter, actorId: session.idUser, action: meta.action, typeObjet: meta.typeObjet, result: "ECHEC", requestId, details: { message: failure.payload.message } }).catch(() => undefined)
    const duration = Math.round(performance.now() - startedAt)
    return NextResponse.json(failure.payload, {
      status: failure.status,
      headers: { "x-request-id": requestId, "server-timing": `app;dur=${duration}` },
    })
  }
}

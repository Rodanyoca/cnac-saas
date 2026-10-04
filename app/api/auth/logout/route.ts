import { NextResponse } from "next/server"
import { destroySession, getSession } from "@/lib/auth"
import { isSameOriginMutation } from "@/lib/auth/csrf"
import { UserCommands } from "@/lib/users/commands"
import { createGoogleUsersSheetsAdapter } from "@/lib/users/google-adapter"
import { writeAudit } from "@/lib/audit/logger"
import { randomUUID } from "node:crypto"

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 })
  try {
    const session = await getSession()
    if (session) {
      const adapter = createGoogleUsersSheetsAdapter()
      await new UserCommands(adapter).revokeSessions(session.idUser, session.sessionVersion)
      await writeAudit({ adapter, actorId: session.idUser, action: "DECONNEXION", typeObjet: "SESSION", objectId: session.idUser, result: "SUCCES", requestId: randomUUID(), now: new Date() })
    }
    await destroySession()
    return NextResponse.json({ ok: true })
  } catch {
    await destroySession()
    return NextResponse.json({ error: "Déconnexion serveur non confirmée. Service indisponible." }, { status: 503 })
  }
}

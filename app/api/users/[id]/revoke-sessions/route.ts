import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { revokeAllSessions } from "@/lib/users/administration-workflows"
import { createGoogleUsersSheetsAdapter } from "@/lib/users/google-adapter"
import { UsersRepository } from "@/lib/users/repository"
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const session = await getSession(); if (!session?.estSuperAdmin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 }); try { const body = await request.json(), requestId = String(body.requestId ?? "").trim(); if (!requestId) return NextResponse.json({ error: "request_id obligatoire." }, { status: 400 }); const adapter = createGoogleUsersSheetsAdapter(), target = await new UsersRepository(adapter).requireUserById((await params).id), user = await revokeAllSessions({ adapter, actorId: session.idUser, requestId, target }); return NextResponse.json({ ok: true, sessionVersion: user.sessionVersion }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Révocation impossible." }, { status: 400 }) } }

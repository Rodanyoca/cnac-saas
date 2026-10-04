import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { updateManagedUser } from "@/lib/users/administration-workflows"
import { createGoogleUsersSheetsAdapter } from "@/lib/users/google-adapter"
import { UsersRepository } from "@/lib/users/repository"
import { USER_STATUSES, USER_TYPES, type UserStatus, type UserType } from "@/lib/users/types"

type Context = { params: Promise<{ id: string }> }
type EditablePatch = { nomComplet?: string; email?: string; typeUser?: UserType; statut?: UserStatus; estSuperAdmin?: boolean }
const EDITABLE_FIELDS = new Set(["nomComplet", "email", "typeUser", "statut", "estSuperAdmin"])

function parsePatch(value: unknown): EditablePatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Modification invalide.")
  const source = value as Record<string, unknown>, unknown = Object.keys(source).find((key) => !EDITABLE_FIELDS.has(key))
  if (unknown) throw new Error(`Champ non modifiable : ${unknown}.`)
  const patch: EditablePatch = {}
  if ("nomComplet" in source) { if (typeof source.nomComplet !== "string" || !source.nomComplet.trim()) throw new Error("Nom complet invalide."); patch.nomComplet = source.nomComplet.trim() }
  if ("email" in source) { if (typeof source.email !== "string" || !/^\S+@\S+\.\S+$/.test(source.email.trim())) throw new Error("Adresse électronique invalide."); patch.email = source.email.trim() }
  if ("typeUser" in source) { if (typeof source.typeUser !== "string" || !USER_TYPES.includes(source.typeUser as UserType)) throw new Error("Type utilisateur invalide."); patch.typeUser = source.typeUser as UserType }
  if ("statut" in source) { if (typeof source.statut !== "string" || !USER_STATUSES.includes(source.statut as UserStatus)) throw new Error("Statut invalide."); patch.statut = source.statut as UserStatus }
  if ("estSuperAdmin" in source) { if (typeof source.estSuperAdmin !== "boolean") throw new Error("Indicateur super-administrateur invalide."); patch.estSuperAdmin = source.estSuperAdmin }
  if (Object.keys(patch).length === 0) throw new Error("Aucune modification valide.")
  return patch
}

export async function GET(_: Request, { params }: Context) {
  const session = await getSession()
  if (!session?.estSuperAdmin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  const repository = new UsersRepository(createGoogleUsersSheetsAdapter()), id = (await params).id
  try {
    const user = await repository.requireUserById(id), [authorizations, audit] = await Promise.all([repository.getAuthorizationsForUser(id), repository.getAuditLog()])
    return NextResponse.json({ user: { id_user: user.idUser, nom_complet: user.nomComplet, email: user.email, type_user: user.typeUser, statut: user.statut, est_super_admin: user.estSuperAdmin, doit_changer_mot_de_passe: user.doitChangerMotDePasse, date_creation: user.dateCreation, derniere_connexion: user.derniereConnexion, session_version: user.sessionVersion }, authorizations, audit: audit.filter((entry) => entry.idObjet === id || entry.idUser === id).slice(-50) })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Lecture impossible." }, { status: 404 }) }
}

export async function PATCH(request: Request, { params }: Context) {
  const session = await getSession()
  if (!session?.estSuperAdmin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 })
  try {
    const adapter = createGoogleUsersSheetsAdapter(), target = await new UsersRepository(adapter).requireUserById((await params).id)
    const body = await request.json() as { requestId?: unknown; patch?: unknown }, requestId = typeof body.requestId === "string" ? body.requestId.trim() : ""
    if (!requestId) return NextResponse.json({ error: "request_id obligatoire." }, { status: 400 })
    const result = await updateManagedUser({ adapter, actorId: session.idUser, requestId, target, patch: parsePatch(body.patch) })
    return NextResponse.json({ ok: true, alreadyProcessed: result.alreadyProcessed, sessionVersion: result.user.sessionVersion, temporaryAccess: result.temporaryAccess, expiresAt: result.user.dateExpirationAccesTemporaire })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Modification impossible." }, { status: 400 }) }
}

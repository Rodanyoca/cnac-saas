import { randomUUID } from "node:crypto"
import { hashPassword } from "../auth/password.ts"
import { generateTemporaryAccess, temporaryAccessExpiration } from "../auth/temporary-access.ts"
import { assertLastActiveSuperAdminProtected } from "../auth/authorization.ts"
import { AuthorizationCommands } from "./authorization-commands.ts"
import { UserCommands } from "./commands.ts"
import { UsersDataError } from "./errors.ts"
import { UsersRepository } from "./repository.ts"
import { normalizeEmail } from "./validation.ts"
import type { AuditLogEntry, AuthorizationBlock, User, UserAuthorization, UserStatus, UserType, UsersSheetsAdapter } from "./types.ts"

async function alreadyProcessed(adapter: UsersSheetsAdapter, requestId: string) { return (await new UsersRepository(adapter).getAuditLog()).some((entry) => entry.requestId === requestId) }
async function audit(input: { adapter: UsersSheetsAdapter; actorId: string; targetId: string; requestId: string; action: string; result?: "SUCCES" | "ECHEC"; details?: Record<string, unknown> }) {
  const entry: AuditLogEntry = { idOperation: `AUD-${randomUUID()}`, idUser: input.actorId, action: input.action, typeObjet: "USER", idObjet: input.targetId, dateOperation: new Date().toISOString(), resultat: input.result ?? "SUCCES", requestId: input.requestId, detailsNonSensibles: JSON.stringify(input.details ?? {}) }
  await new UsersRepository(input.adapter).appendAuditLog(entry)
}

export async function createManagedUser(input: { adapter: UsersSheetsAdapter; actorId: string; requestId: string; nomComplet: string; email: string; typeUser: UserType; estSuperAdmin: boolean; authorizations: { block: AuthorizationBlock; dateDebut: string; dateFin?: string | null }[]; now?: Date; generateAccess?: () => string }) {
  if (input.estSuperAdmin && input.typeUser !== "ADMIN") throw new UsersDataError("ROW_INVALID", "Un super-administrateur doit être de type ADMIN.")
  const repository = new UsersRepository(input.adapter), existing = await repository.getUserByEmail(input.email)
  if (existing) return { status: "EXISTING" as const, user: existing, temporaryAccess: null }
  const now = input.now ?? new Date(), temporaryAccess = (input.generateAccess ?? generateTemporaryAccess)()
  const user: User = { idUser: `USR-${randomUUID()}`, nomComplet: input.nomComplet.trim(), email: normalizeEmail(input.email), passwordHash: await hashPassword(temporaryAccess), typeUser: input.typeUser, estSuperAdmin: input.estSuperAdmin, doitChangerMotDePasse: true, statut: "ACTIF", dateCreation: now.toISOString(), dateModificationMotDePasse: null, derniereConnexion: null, sessionVersion: 1, dateExpirationAccesTemporaire: temporaryAccessExpiration(now) }
  await new UserCommands(input.adapter).createUser({ user })
  const created: UserAuthorization[] = []
  try { for (const item of input.authorizations) created.push(await new AuthorizationCommands(input.adapter).create({ idUser: user.idUser, idBlocAutorisation: item.block, statut: "ACTIF", dateDebut: item.dateDebut, dateFin: item.dateFin ?? null })) }
  catch (error) { await new UserCommands(input.adapter).replaceUser({ ...user, statut: "INACTIF", sessionVersion: 2 }); for (const item of created) await new AuthorizationCommands(input.adapter).deactivate(item.idUserAutorisation, item.dateDebut).catch(() => undefined); await audit({ adapter: input.adapter, actorId: input.actorId, targetId: user.idUser, requestId: input.requestId, action: "CREATION_UTILISATEUR", result: "ECHEC", details: { compensation: "COMPTE_DESACTIVE_AUTORISATIONS_FERMEES" } }).catch(() => undefined); throw new UsersDataError("WRITE_NOT_CONFIRMED", "Création partielle compensée : compte désactivé et autorisations fermées.", { cause: error }) }
  try { await audit({ adapter: input.adapter, actorId: input.actorId, targetId: user.idUser, requestId: input.requestId, action: "CREATION_UTILISATEUR", details: { blocs: input.authorizations.map((item) => item.block) } }) }
  catch (error) { await new UserCommands(input.adapter).replaceUser({ ...user, statut: "INACTIF", sessionVersion: user.sessionVersion + 1 }).catch(() => undefined); for (const item of created) await new AuthorizationCommands(input.adapter).deactivate(item.idUserAutorisation, item.dateDebut).catch(() => undefined); throw new UsersDataError("WRITE_NOT_CONFIRMED", "Création compensée après échec de journalisation.", { cause: error }) }
  return { status: "CREATED" as const, user, temporaryAccess }
}

export async function updateManagedUser(input: { adapter: UsersSheetsAdapter; actorId: string; requestId: string; target: User; patch: { nomComplet?: string; email?: string; typeUser?: UserType; statut?: UserStatus; estSuperAdmin?: boolean }; now?: Date; generateAccess?: () => string }) {
  if (await alreadyProcessed(input.adapter, input.requestId)) return { user: input.target, temporaryAccess: null, alreadyProcessed: true as const }
  const users = await new UsersRepository(input.adapter).getUsers(), next = { ...input.target, ...input.patch }
  if (next.estSuperAdmin && next.typeUser !== "ADMIN") throw new UsersDataError("ROW_INVALID", "Un super-administrateur doit être de type ADMIN.")
  assertLastActiveSuperAdminProtected({ target: input.target, users, willRemainActiveSuperAdmin: next.statut === "ACTIF" && next.estSuperAdmin && next.typeUser === "ADMIN" })
  const sensitive = next.typeUser !== input.target.typeUser || next.statut !== input.target.statut || next.estSuperAdmin !== input.target.estSuperAdmin || normalizeEmail(next.email) !== input.target.email
  let temporaryAccess: string | null = null
  if (normalizeEmail(next.email) !== input.target.email) { const duplicate = await new UsersRepository(input.adapter).getUserByEmail(next.email); if (duplicate && duplicate.idUser !== input.target.idUser) throw new UsersDataError("CONFLICT", "Cette adresse appartient déjà à un compte."); temporaryAccess = (input.generateAccess ?? generateTemporaryAccess)(); next.passwordHash = await hashPassword(temporaryAccess); next.doitChangerMotDePasse = true; next.dateExpirationAccesTemporaire = temporaryAccessExpiration(input.now ?? new Date()) }
  if (sensitive) next.sessionVersion += 1
  const user = await new UserCommands(input.adapter).replaceUser(next)
  try { await audit({ adapter: input.adapter, actorId: input.actorId, targetId: user.idUser, requestId: input.requestId, action: "MODIFICATION_UTILISATEUR", details: { champs: Object.keys(input.patch), sessionsRevoquees: sensitive } }) }
  catch (error) { await new UserCommands(input.adapter).replaceUser(input.target).catch(() => undefined); throw new UsersDataError("WRITE_NOT_CONFIRMED", "Modification compensée après échec de journalisation.", { cause: error }) }
  return { user, temporaryAccess, alreadyProcessed: false as const }
}

export async function revokeAllSessions(input: { adapter: UsersSheetsAdapter; actorId: string; requestId: string; target: User }) { if (await alreadyProcessed(input.adapter, input.requestId)) return input.target; const user = await new UserCommands(input.adapter).replaceUser({ ...input.target, sessionVersion: input.target.sessionVersion + 1 }); try { await audit({ adapter: input.adapter, actorId: input.actorId, targetId: user.idUser, requestId: input.requestId, action: "REVOCATION_SESSIONS" }); return user } catch (error) { await new UserCommands(input.adapter).replaceUser(input.target).catch(() => undefined); throw new UsersDataError("WRITE_NOT_CONFIRMED", "Révocation compensée après échec de journalisation.", { cause: error }) } }

export async function assignAuthorization(input: { adapter: UsersSheetsAdapter; actorId: string; requestId: string; target: User; block: AuthorizationBlock; dateDebut: string; dateFin?: string | null }) { if (await alreadyProcessed(input.adapter, input.requestId)) return null; const commands = new AuthorizationCommands(input.adapter), created = await commands.create({ idUser: input.target.idUser, idBlocAutorisation: input.block, statut: "ACTIF", dateDebut: input.dateDebut, dateFin: input.dateFin ?? null }); try { const user = await new UserCommands(input.adapter).replaceUser({ ...input.target, sessionVersion: input.target.sessionVersion + 1 }); await audit({ adapter: input.adapter, actorId: input.actorId, targetId: user.idUser, requestId: input.requestId, action: "ATTRIBUTION_AUTORISATION", details: { bloc: input.block } }); return created } catch (error) { await commands.deactivate(created.idUserAutorisation, created.dateDebut).catch(() => undefined); await new UserCommands(input.adapter).replaceUser(input.target).catch(() => undefined); throw new UsersDataError("WRITE_NOT_CONFIRMED", "Attribution compensée après échec de révocation des sessions.", { cause: error }) } }
export async function changeAuthorization(input: { adapter: UsersSheetsAdapter; actorId: string; requestId: string; target: User; before: UserAuthorization; after: UserAuthorization }) { if (await alreadyProcessed(input.adapter, input.requestId)) return input.before; const commands = new AuthorizationCommands(input.adapter); await commands.replace(input.after); try { const user = await new UserCommands(input.adapter).replaceUser({ ...input.target, sessionVersion: input.target.sessionVersion + 1 }); await audit({ adapter: input.adapter, actorId: input.actorId, targetId: user.idUser, requestId: input.requestId, action: "MODIFICATION_AUTORISATION", details: { bloc: input.after.idBlocAutorisation, statut: input.after.statut } }); return input.after } catch (error) { await commands.replace(input.before).catch(() => undefined); await new UserCommands(input.adapter).replaceUser(input.target).catch(() => undefined); throw new UsersDataError("WRITE_NOT_CONFIRMED", "Modification d'autorisation compensée après échec de révocation.", { cause: error }) } }

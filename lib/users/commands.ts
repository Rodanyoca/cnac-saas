import { UsersDataError, asSourceUnavailable } from "./errors.ts"
import { UsersRepository } from "./repository.ts"
import { parseUser, normalizeEmail } from "./validation.ts"
import { USERS_SHEET, type SheetRow, type User, type UsersSheetsAdapter } from "./types.ts"

export interface CreateUserCommand {
  user: User
}

export type CreateUserResult = { status: "CREATED" | "EXISTING"; user: User }

export function userToSheetRow(user: User): SheetRow {
  return {
    id_user: user.idUser,
    nom_complet: user.nomComplet,
    email: normalizeEmail(user.email),
    password_hash: user.passwordHash,
    type_user: user.typeUser,
    est_super_admin: user.estSuperAdmin ? "TRUE" : "FALSE",
    doit_changer_mot_de_passe: user.doitChangerMotDePasse ? "TRUE" : "FALSE",
    statut: user.statut,
    date_creation: user.dateCreation,
    date_modification_mot_de_passe: user.dateModificationMotDePasse ?? "",
    derniere_connexion: user.derniereConnexion ?? "",
    session_version: String(user.sessionVersion),
    date_expiration_acces_temporaire: user.dateExpirationAccesTemporaire ?? "",
  }
}

function samePersistedUser(actual: User, expected: User): boolean {
  return JSON.stringify(userToSheetRow(actual)) === JSON.stringify(userToSheetRow(expected))
}

export class UserCommands {
  private readonly repository: UsersRepository
  private readonly adapter: UsersSheetsAdapter

  constructor(adapter: UsersSheetsAdapter) {
    this.adapter = adapter
    this.repository = new UsersRepository(adapter)
  }

  async createUser(command: CreateUserCommand): Promise<CreateUserResult> {
    const candidate = parseUser(userToSheetRow(command.user), 2)
    const users = await this.repository.getUsers()
    const byId = users.find((user) => user.idUser === candidate.idUser)
    const byEmail = users.find((user) => user.email === candidate.email)

    if (byId || byEmail) {
      if (byId && byEmail && byId.idUser === byEmail.idUser && samePersistedUser(byId, candidate)) {
        return { status: "EXISTING", user: byId }
      }
      throw new UsersDataError("CONFLICT", "Un utilisateur existe déjà avec cet identifiant ou cette adresse e-mail.")
    }

    try {
      await this.adapter.appendRow(USERS_SHEET, userToSheetRow(candidate))
    } catch (error) {
      throw asSourceUnavailable(error, "la création de l'utilisateur")
    }

    const confirmed = await this.repository.getUserById(candidate.idUser)
    if (!confirmed || !samePersistedUser(confirmed, candidate)) {
      throw new UsersDataError("WRITE_NOT_CONFIRMED", "USERS : création non confirmée après relecture.")
    }
    return { status: "CREATED", user: confirmed }
  }

  async touchLastConnection(expected: User, date: string): Promise<User> {
    if (!this.adapter.updateRow) throw new UsersDataError("SOURCE_UNAVAILABLE", "La mise à jour USERS n'est pas disponible.")
    const unchanged = (user: User) => user.statut === "ACTIF" && user.sessionVersion === expected.sessionVersion && user.passwordHash === expected.passwordHash && user.doitChangerMotDePasse === expected.doitChangerMotDePasse && (!user.doitChangerMotDePasse || Boolean(user.dateExpirationAccesTemporaire && Date.parse(user.dateExpirationAccesTemporaire) > Date.now()))
    const current = await this.repository.requireUserById(expected.idUser)
    if (!unchanged(current)) throw new UsersDataError("CONFLICT", "Le compte a changé pendant la connexion.")
    try { await this.adapter.updateRow(USERS_SHEET, "id_user", current.idUser, { derniere_connexion: date }) }
    catch (error) { throw asSourceUnavailable(error, "la dernière connexion") }
    const confirmed = await this.repository.requireUserById(expected.idUser)
    if (!unchanged(confirmed) || confirmed.derniereConnexion !== date) throw new UsersDataError("WRITE_NOT_CONFIRMED", "Connexion non confirmée après relecture.")
    return confirmed
  }

  async revokeSessions(idUser: string, expectedVersion: number): Promise<void> {
    if (!this.adapter.updateRow) throw new UsersDataError("SOURCE_UNAVAILABLE", "La mise à jour USERS n'est pas disponible.")
    const current = await this.repository.requireUserById(idUser)
    if (current.sessionVersion !== expectedVersion) return
    try { await this.adapter.updateRow(USERS_SHEET, "id_user", idUser, { session_version: String(expectedVersion + 1) }) }
    catch (error) { throw asSourceUnavailable(error, "la révocation des sessions") }
    const confirmed = await this.repository.requireUserById(idUser)
    if (confirmed.sessionVersion <= expectedVersion) throw new UsersDataError("WRITE_NOT_CONFIRMED", "Révocation non confirmée après relecture.")
  }

  async replaceUser(user: User): Promise<User> {
    const candidate = parseUser(userToSheetRow(user), 2)
    if (!this.adapter.updateRow) throw new UsersDataError("SOURCE_UNAVAILABLE", "La mise à jour USERS n'est pas disponible.")
    const current = await this.repository.requireUserById(candidate.idUser)
    try { await this.adapter.updateRow(USERS_SHEET, "id_user", current.idUser, userToSheetRow(candidate)) }
    catch (error) { throw asSourceUnavailable(error, "la mise à jour de l'utilisateur") }
    const confirmed = await this.repository.requireUserById(candidate.idUser)
    if (!samePersistedUser(confirmed, candidate)) throw new UsersDataError("WRITE_NOT_CONFIRMED", "USERS : mise à jour non confirmée après relecture.")
    return confirmed
  }
}

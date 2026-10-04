import { randomUUID } from "node:crypto"
import { assertNoAuthorizationOverlaps } from "./authorizations.ts"
import { UsersDataError, asSourceUnavailable } from "./errors.ts"
import { UsersRepository } from "./repository.ts"
import { USER_AUTHORIZATIONS_SHEET, type SheetRow, type UserAuthorization, type UsersSheetsAdapter } from "./types.ts"

const row = (value: UserAuthorization): SheetRow => ({ id_user_autorisation: value.idUserAutorisation, id_user: value.idUser, id_bloc_autorisation: value.idBlocAutorisation, statut: value.statut, date_debut: value.dateDebut, date_fin: value.dateFin ?? "" })

export class AuthorizationCommands {
  private readonly adapter: UsersSheetsAdapter
  private readonly repository: UsersRepository

  constructor(adapter: UsersSheetsAdapter, repository?: UsersRepository) {
    this.adapter = adapter
    this.repository = repository ?? new UsersRepository(adapter)
  }
  async create(input: Omit<UserAuthorization, "idUserAutorisation"> & { idUserAutorisation?: string }) {
    const candidate: UserAuthorization = { ...input, idUserAutorisation: input.idUserAutorisation ?? `UA-${randomUUID()}` }
    const existing = await this.repository.getUserAuthorizations()
    assertNoAuthorizationOverlaps([...existing, candidate])
    try { await this.adapter.appendRow(USER_AUTHORIZATIONS_SHEET, row(candidate)) } catch (error) { throw asSourceUnavailable(error, "l'attribution d'autorisation") }
    const confirmed = (await this.repository.getUserAuthorizations()).find((item) => item.idUserAutorisation === candidate.idUserAutorisation)
    if (!confirmed) throw new UsersDataError("WRITE_NOT_CONFIRMED", "Autorisation non confirmée après écriture.")
    return confirmed
  }
  async replace(candidate: UserAuthorization) {
    if (!this.adapter.updateRow) throw new UsersDataError("SOURCE_UNAVAILABLE", "La mise à jour des autorisations n'est pas disponible.")
    const existing = await this.repository.getUserAuthorizations()
    if (!existing.some((item) => item.idUserAutorisation === candidate.idUserAutorisation)) throw new UsersDataError("NOT_FOUND", "Autorisation introuvable.")
    assertNoAuthorizationOverlaps([...existing.filter((item) => item.idUserAutorisation !== candidate.idUserAutorisation), candidate])
    await this.adapter.updateRow(USER_AUTHORIZATIONS_SHEET, "id_user_autorisation", candidate.idUserAutorisation, row(candidate))
    const confirmed = (await this.repository.getUserAuthorizations()).find((item) => item.idUserAutorisation === candidate.idUserAutorisation)
    if (!confirmed || JSON.stringify(confirmed) !== JSON.stringify(candidate)) throw new UsersDataError("WRITE_NOT_CONFIRMED", "Modification d'autorisation non confirmée.")
    return confirmed
  }
  async deactivate(id: string, endDate: string) { const current = (await this.repository.getUserAuthorizations()).find((item) => item.idUserAutorisation === id); if (!current) throw new UsersDataError("NOT_FOUND", "Autorisation introuvable."); return this.replace({ ...current, statut: "INACTIF", dateFin: current.dateFin ?? endDate }) }
}

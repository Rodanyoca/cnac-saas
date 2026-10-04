import "server-only"

import { getSheetRows, getSheetsTables } from "@/lib/google/sheets"
import { getUsersSpreadsheetId } from "./config"
import { createGoogleUsersSheetsAdapter } from "./google-adapter"
import { UsersRepository } from "./repository"
import { AUTH_ATTEMPTS_SHEET, USERS_SHEET, USER_AUTHORIZATIONS_SHEET, type User } from "./types"
import { normalizeEmail, parseAuthAttempt, parseUser, parseUserAuthorization, validateAuthAttemptHeaders, validateUserAuthorizationHeaders, validateUsersHeaders } from "./validation"
import { assertNoAuthorizationOverlaps } from "./authorizations"

function repository() {
  return new UsersRepository(createGoogleUsersSheetsAdapter())
}

// Compatibilité temporaire avec la route de connexion du LOT 1. Le basculement
// vers le modèle typé appartient à T03 ; cette lecture reste fraîche.
export async function getUsers() {
  return getSheetRows({
    sheetName: "USERS",
    spreadsheetId: getUsersSpreadsheetId(),
    bypassCache: true,
  })
}

export async function getTypedUsers(): Promise<User[]> {
  return repository().getUsers()
}

export async function getUserById(idUser: string): Promise<User | null> {
  return repository().getUserById(idUser)
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return repository().getUserByEmail(email)
}

export async function getUserAuthorizations() {
  return repository().getUserAuthorizations()
}

export async function getAuthorizationsForUser(idUser: string) {
  return repository().getAuthorizationsForUser(idUser)
}

export async function getAuthAttempts() {
  return repository().getAuthAttempts()
}

export async function getAuditLog() {
  return repository().getAuditLog()
}

export async function getAuthenticationSnapshot(email: string) {
  const tables = await getSheetsTables({ sheetNames: [USERS_SHEET, AUTH_ATTEMPTS_SHEET, USER_AUTHORIZATIONS_SHEET], spreadsheetId: getUsersSpreadsheetId() })
  validateUsersHeaders(tables[USERS_SHEET].headers)
  validateAuthAttemptHeaders(tables[AUTH_ATTEMPTS_SHEET].headers)
  validateUserAuthorizationHeaders(tables[USER_AUTHORIZATIONS_SHEET].headers)
  const users = tables[USERS_SHEET].rows.map((row, index) => parseUser(row, index + 2))
  if (new Set(users.map((item) => item.idUser)).size !== users.length || new Set(users.map((item) => item.email)).size !== users.length) throw new Error("USERS contient un identifiant ou un e-mail dupliqué.")
  const user = users.find((item) => item.email === normalizeEmail(email)) ?? null
  const attempts = tables[AUTH_ATTEMPTS_SHEET].rows.map((row, index) => parseAuthAttempt(row, index + 2))
  const allAuthorizations = tables[USER_AUTHORIZATIONS_SHEET].rows.map((row, index) => parseUserAuthorization(row, index + 2))
  assertNoAuthorizationOverlaps(allAuthorizations)
  const authorizations = user ? allAuthorizations.filter((item) => item.idUser === user.idUser) : []
  return { user, attempts, authorizations }
}

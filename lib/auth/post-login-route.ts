import { isAuthorizationActive } from "./authorization.ts"
import type { LoginRedirect } from "./login-redirect.ts"
import type { User, UserAuthorization } from "../users/types.ts"

export function postLoginRoute(user: User, authorizations: readonly UserAuthorization[], date?: string): LoginRedirect {
  if (user.doitChangerMotDePasse) return "/activation"
  if (user.estSuperAdmin) return "/dashboard"
  if (authorizations.some((authorization) =>
    authorization.idUser === user.idUser && isAuthorizationActive(authorization, date),
  )) return "/dashboard"
  return "/mon-compte"
}

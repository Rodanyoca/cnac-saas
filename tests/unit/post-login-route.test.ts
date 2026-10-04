import assert from "node:assert/strict"
import test from "node:test"
import { postLoginRoute } from "../../lib/auth/post-login-route.ts"
import type { User, UserAuthorization } from "../../lib/users/types.ts"

const user: User = {
  idUser: "USR-1", nomComplet: "Utilisateur Test", email: "test@example.org", passwordHash: "hash",
  typeUser: "ADMIN", estSuperAdmin: false, doitChangerMotDePasse: false, statut: "ACTIF",
  dateCreation: "2026-01-01T00:00:00+01:00", dateModificationMotDePasse: null, derniereConnexion: null,
  sessionVersion: 1, dateExpirationAccesTemporaire: null,
}

const authorization: UserAuthorization = {
  idUserAutorisation: "AUT-1", idUser: user.idUser, idBlocAutorisation: "AUT-SPT", dateDebut: "2026-01-01",
  dateFin: null, statut: "ACTIF",
}

test("redirige une activation obligatoire vers l'activation", () => {
  assert.equal(postLoginRoute({ ...user, doitChangerMotDePasse: true }, []), "/activation")
})

test("redirige un utilisateur avec un bloc métier vers le dashboard", () => {
  assert.equal(postLoginRoute(user, [authorization], "2026-09-01"), "/dashboard")
})

test("ne renvoie pas vers le dashboard un utilisateur sans bloc métier", () => {
  assert.equal(postLoginRoute(user, [], "2026-09-01"), "/mon-compte")
})

test("redirige un super-administrateur sans bloc vers le tableau de bord", () => {
  assert.equal(postLoginRoute({ ...user, estSuperAdmin: true }, [], "2026-09-01"), "/dashboard")
})

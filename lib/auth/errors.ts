export class AuthenticationUnavailableError extends Error {
  constructor() {
    super("Le service d’authentification CNAC ne peut pas confirmer votre accès.")
    this.name = "AuthenticationUnavailableError"
  }
}

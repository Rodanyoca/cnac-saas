type Environment = Record<string, string | undefined>

export function getAuthSecret(env: Environment = process.env): string {
  const secret = env.AUTH_SECRET?.trim()
  if (!secret || secret === "A_COMPLETER" || secret.length < 32) {
    throw new Error("AUTH_SECRET est manquant ou invalide (32 caractères minimum).")
  }
  return secret
}

export function validateAuthenticationConfiguration(env: Environment = process.env) {
  const secret = getAuthSecret(env)
  const telemetry = env.AUTH_TELEMETRY_HMAC_KEY?.trim()
  if (!telemetry || telemetry === "A_COMPLETER" || telemetry.length < 32 || telemetry === secret) {
    throw new Error("AUTH_TELEMETRY_HMAC_KEY est manquant ou invalide (32 caractères minimum, distinct de AUTH_SECRET).")
  }
}

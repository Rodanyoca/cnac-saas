import { apiFetch } from "../api/client.ts"

export function requestLogin(email: string, password: string, fetcher?: typeof fetch) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    // Authentication confirms several Sheets writes before issuing the session.
    // Its budget must exceed the generic 12-second read timeout.
    timeoutMs: 60_000,
    fetcher,
  })
}

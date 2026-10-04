import "server-only"

import { runResilientRequest } from "../http/resilience"

type GoogleRequestOptions = {
  idempotent?: boolean
  timeoutMs?: number
}

const GOOGLE_TIMEOUT_MS = Number.parseInt(process.env.GOOGLE_API_TIMEOUT_MS ?? "20000", 10)
const GOOGLE_RETRY_ATTEMPTS = Number.parseInt(process.env.GOOGLE_API_RETRY_ATTEMPTS ?? "3", 10)

export function runGoogleRequest<T>(task: () => Promise<T>, options: GoogleRequestOptions = {}) {
  return runResilientRequest(task, {
    attempts: options.idempotent === false ? 1 : GOOGLE_RETRY_ATTEMPTS,
    baseDelayMs: 250,
    maxDelayMs: 2_500,
    timeoutMs: options.timeoutMs ?? GOOGLE_TIMEOUT_MS,
  })
}

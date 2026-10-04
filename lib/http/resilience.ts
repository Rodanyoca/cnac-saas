export type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitter?: boolean
  timeoutMs?: number
  shouldRetry?: (error: unknown) => boolean
}

const DEFAULT_RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined
  const candidate = error as {
    code?: unknown
    status?: unknown
    response?: { status?: unknown }
  }
  for (const value of [candidate.code, candidate.status, candidate.response?.status]) {
    const status = typeof value === "string" ? Number.parseInt(value, 10) : value
    if (typeof status === "number" && Number.isFinite(status)) return status
  }
  return undefined
}

export function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error)
  if (status !== undefined) return DEFAULT_RETRYABLE_STATUS.has(status)
  const code = (error as { code?: string } | null)?.code
  return code === "ECONNRESET" || code === "ETIMEDOUT" || code === "EAI_AGAIN"
}

function delay(ms: number) {
  if (ms <= 0) return Promise.resolve()
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function runResilientRequest<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3)
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 200)
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 2_000)
  const shouldRetry = options.shouldRetry ?? isRetryableError

  for (let attempt = 1; ; attempt += 1) {
    try {
      if (!options.timeoutMs) return await operation(attempt)
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      try {
        return await Promise.race([
          operation(attempt),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(Object.assign(new Error(`Request timed out after ${options.timeoutMs}ms`), { code: "ETIMEDOUT" })),
              options.timeoutMs,
            )
          }),
        ])
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
      }
    } catch (error) {
      if (attempt >= attempts || !shouldRetry(error)) throw error
      const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
      const wait = options.jitter === false ? exponential : Math.random() * exponential
      await delay(wait)
    }
  }
}

export function isRetryableStatus(status: number) {
  return DEFAULT_RETRYABLE_STATUS.has(status)
}

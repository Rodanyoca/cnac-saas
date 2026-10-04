import { isRetryableStatus, runResilientRequest, type RetryOptions } from "../http/resilience.ts"

type ApiFetchOptions = RequestInit & {
  fetcher?: typeof fetch
  retry?: RetryOptions
  deduplicate?: boolean
  timeoutMs?: number
}

const pendingReads = new Map<string, Promise<Response>>()
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

function requestKey(input: RequestInfo | URL, init: RequestInit) {
  const url = input instanceof Request ? input.url : String(input)
  const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined))
  return `${(init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase()}:${url}:${JSON.stringify([...headers.entries()].sort())}`
}

async function execute(input: RequestInfo | URL, options: ApiFetchOptions, safe: boolean) {
  const { fetcher = fetch, retry, deduplicate, timeoutMs = 12_000, ...init } = options
  void deduplicate
  const attempts = safe ? retry?.attempts ?? 3 : 1

  return runResilientRequest(async (attempt) => {
    const controller = new AbortController()
    const abort = () => controller.abort(options.signal?.reason)
    options.signal?.addEventListener("abort", abort, { once: true })
    const timeoutId = setTimeout(
      () => controller.abort(Object.assign(new Error("API request timeout"), { code: "ETIMEDOUT" })),
      timeoutMs,
    )
    try {
      const response = await fetcher(input, { ...init, signal: controller.signal })
      if (safe && attempt < attempts && isRetryableStatus(response.status)) {
        const error = Object.assign(new Error(`HTTP ${response.status}`), { status: response.status })
        throw error
      }
      return response
    } finally {
      clearTimeout(timeoutId)
      options.signal?.removeEventListener("abort", abort)
    }
  }, { ...retry, attempts })
}

export async function apiFetch(input: RequestInfo | URL, options: ApiFetchOptions = {}): Promise<Response> {
  const method = (options.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase()
  const safe = SAFE_METHODS.has(method)
  if (!safe || options.deduplicate === false) return execute(input, options, safe)

  const key = requestKey(input, options)
  let pending = pendingReads.get(key)
  if (!pending) {
    pending = execute(input, options, true)
    pendingReads.set(key, pending)
    void pending.finally(() => {
      if (pendingReads.get(key) === pending) pendingReads.delete(key)
    }).catch(() => undefined)
  }
  return (await pending).clone()
}

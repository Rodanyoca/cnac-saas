import assert from "node:assert/strict"
import test from "node:test"

import { apiFetch } from "../../lib/api/client.ts"
import { runResilientRequest } from "../../lib/http/resilience.ts"

test("apiFetch absorbe un 503 transitoire sur une lecture", async () => {
  let calls = 0
  const fetcher: typeof fetch = async () => {
    calls += 1
    return calls === 1
      ? new Response(JSON.stringify({ error: "indisponible" }), { status: 503 })
      : new Response(JSON.stringify({ ok: true }), { status: 200 })
  }

  const response = await apiFetch("/api/health", {
    fetcher,
    retry: { attempts: 2, baseDelayMs: 0, jitter: false },
  })

  assert.equal(response.status, 200)
  assert.equal(calls, 2)
})

test("apiFetch ne rejoue jamais une mutation non idempotente", async () => {
  let calls = 0
  const fetcher: typeof fetch = async () => {
    calls += 1
    return new Response(null, { status: 503 })
  }

  const response = await apiFetch("/api/items", {
    method: "POST",
    fetcher,
    retry: { attempts: 3, baseDelayMs: 0, jitter: false },
  })

  assert.equal(response.status, 503)
  assert.equal(calls, 1)
})

test("les lectures concurrentes identiques sont dédupliquées", async () => {
  let calls = 0
  let release!: () => void
  const waiting = new Promise<void>((resolve) => { release = resolve })
  const fetcher: typeof fetch = async () => {
    calls += 1
    await waiting
    return new Response("ok")
  }

  const first = apiFetch("/api/items", { fetcher })
  const second = apiFetch("/api/items", { fetcher })
  release()
  await Promise.all([first, second])

  assert.equal(calls, 1)
})

test("runResilientRequest rejoue les erreurs 503 Google", async () => {
  let calls = 0
  const result = await runResilientRequest(async () => {
    calls += 1
    if (calls === 1) throw Object.assign(new Error("backend error"), { code: 503 })
    return "ok"
  }, { attempts: 2, baseDelayMs: 0, jitter: false })

  assert.equal(result, "ok")
  assert.equal(calls, 2)
})

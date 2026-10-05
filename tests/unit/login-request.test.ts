import assert from "node:assert/strict"
import test from "node:test"
import { requestLogin } from "../../lib/auth/login-request.ts"

test("a successful login after 13 seconds is not aborted or repeated", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] })
  let calls = 0
  const fetcher: typeof fetch = (_input, options) => new Promise((resolve, reject) => {
    calls += 1
    options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), { once: true })
    setTimeout(() => resolve(Response.json({ ok: true, redirectTo: "/activation" })), 13_000)
  })
  const response = requestLogin("test@example.invalid", "fixture-only", fetcher)
  const result = assert.doesNotReject(async () => {
    assert.deepEqual(await (await response).json(), { ok: true, redirectTo: "/activation" })
  })
  context.mock.timers.tick(13_000)
  await result
  assert.equal(calls, 1)
})

test("login retains a finite timeout and never retries a failed mutation", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] })
  let calls = 0
  const fetcher: typeof fetch = (_input, options) => new Promise((_resolve, reject) => {
    calls += 1
    options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), { once: true })
  })
  const result = assert.rejects(requestLogin("test@example.invalid", "fixture-only", fetcher), { code: "ETIMEDOUT" })
  context.mock.timers.tick(60_000)
  await result
  assert.equal(calls, 1)
})

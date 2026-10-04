import { purgeExpiredAttempts } from "../lib/auth/retention.ts"
import { createGoogleUsersSheetsAdapter } from "../lib/users/google-adapter.ts"
import { UsersRepository } from "../lib/users/repository.ts"

async function main() {
  const execute = process.argv.includes("--execute")
  const adapter = createGoogleUsersSheetsAdapter(), attempts = await new UsersRepository(adapter).getAuthAttempts()
  const result = await purgeExpiredAttempts({ adapter, attempts, execute })
  console.log(JSON.stringify({ mode: execute ? "EXECUTION" : "CONTROLE_A_BLANC", candidates: result.ids.length, deleted: result.deleted }))
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Purge impossible."); process.exitCode = 1 })

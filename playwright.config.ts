import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3199",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "cmd /c \"set NEXT_DIST_DIR=.next-t14&& next start --hostname 127.0.0.1 --port 3199\"",
    url: "http://127.0.0.1:3199/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

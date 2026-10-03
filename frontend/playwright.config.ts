import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:13000",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PLAYWRIGHT_CHANNEL || "chromium",
  },
  webServer: [
    {
      command: "node ../scripts/go.mjs start",
      url: "http://127.0.0.1:18080/api/health/ready",
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        APP_ADDRESS: "127.0.0.1:18080",
        APP_DATA_DIR: "../.cache/e2e-data",
      },
    },
    {
      command: "npm run start -- --port 13000",
      url: "http://127.0.0.1:13000",
      reuseExistingServer: false,
      timeout: 30_000,
      env: { ORCHESTRATOR_URL: "http://127.0.0.1:18080" },
    },
  ],
});

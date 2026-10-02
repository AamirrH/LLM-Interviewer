import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    channel: process.env.PLAYWRIGHT_CHANNEL || "chromium",
  },
  webServer: [
    {
      command: "node ../scripts/go.mjs start",
      url: "http://127.0.0.1:8080/api/health/ready",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { APP_DATA_DIR: "../.cache/e2e-data" },
    },
    {
      command: "npm run start",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});

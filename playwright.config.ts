import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/menu/cart",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      BANK_ACCOUNT_NAME: "Macarena Gelateria",
      BANK_ACCOUNT_CLABE: "123456789012345678",
      BANK_ACCOUNT_REFERENCE: "PEDIDO-MACARENA",
      PAYMENT_RECEIPT_PHONE: "+52 55 1234 5678",
    },
  },
});

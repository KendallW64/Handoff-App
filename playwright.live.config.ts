import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "pages-smoke.spec.ts",
  use: {
    ...base.use,
    baseURL:
      process.env.PAGES_URL || "https://kendallw64.github.io/Handoff-App/",
  },
  webServer: undefined,
  retries: 2,
});

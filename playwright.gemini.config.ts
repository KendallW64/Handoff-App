import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: "gemini-ui.spec.ts",
  use: { ...base.use, baseURL: "http://127.0.0.1:5180" },
  webServer: {
    command: "npm run dev -- --port 5180",
    url: "http://127.0.0.1:5180",
    reuseExistingServer: false,
    env: { VITE_AI_API_URL: "https://handoff-backend.example" },
  },
});

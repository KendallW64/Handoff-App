import { test, expect } from "@playwright/test";
test("Pages loads compiled assets, mounts React, and enters the demo", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) =>
    errors.push(`${r.method()} ${r.url()}: ${r.failure()?.errorText}`),
  );
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  const response = await page.goto("./");
  expect(response?.status()).toBe(200);
  const html = await response!.text();
  expect(html).not.toContain("/src/main.tsx");
  const scripts = await page
    .locator('script[type="module"][src]')
    .evaluateAll((elements) =>
      elements.map((e) => (e as HTMLScriptElement).src),
    );
  expect(scripts.length).toBeGreaterThan(0);
  for (const script of scripts) {
    expect(script).toContain(new URL("assets/", baseURL).href);
    expect(script).toMatch(/\.js$/);
  }
  await expect(
    page.getByRole("heading", { name: /Great people move on/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New handoff", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  await expect(
    page.getByRole("button", { name: "New handoff", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Great people move on/ }),
  ).toBeVisible();
  expect(
    errors,
    "No missing assets, network failures, or uncaught JavaScript errors",
  ).toEqual([]);
});

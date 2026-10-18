import { test, expect } from "@playwright/test";
test("a blocked application bundle displays diagnostics instead of an empty page", async ({
  page,
}) => {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.includes("/src/main.tsx") || /\/assets\/index-[^/]+\.js$/.test(url))
      return route.abort("failed");
    return route.continue();
  });
  await page.goto("./");
  await expect(page.locator("#startup-status")).toBeVisible();
  await expect(page.locator("#startup-message")).toContainText(
    "application file could not load",
  );
  await expect(
    page.getByRole("button", { name: "Reload Handoff" }),
  ).toBeVisible();
});

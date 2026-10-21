import { test, expect } from "@playwright/test";
test("complete handoff lifecycle and persistence", async ({ page }) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: /Great people move on/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  await page.getByRole("button", { name: "New handoff" }).click();
  await page
    .getByRole("button", { name: "Create handoff", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const form = page.getByRole("dialog");
  await form.getByLabel("Departing / transferring employee").fill("Avery Lane");
  await form.getByLabel("Position").fill("Cloud Engineer");
  await form.getByLabel("Department").fill("Delivery");
  await form.getByLabel("Receiving teammate").fill("Robin Vale");
  await form.getByLabel("Transition date").fill("2026-12-01");
  await form
    .getByLabel("Current responsibilities")
    .fill("Lead the sample migration.");
  await form
    .getByRole("button", { name: "Create handoff", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Avery Lane/ })).toBeVisible();
  await page.getByRole("button", { name: "Organize knowledge" }).click();
  await expect(
    page.getByRole("button", { name: "Generate sample manual" }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Include Atlas migration runbook" })
    .check();
  await page.getByRole("button", { name: "Read source" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("staging rehearsal");
  await page.getByRole("button", { name: "Done reading" }).click();
  await page.getByRole("button", { name: "Generate sample manual" }).click();
  for (const title of [
    "Who · Your people",
    "What · Your responsibilities",
    "When · Your rhythm",
    "Where · Your knowledge",
    "Why · The context",
    "How · Getting started",
  ])
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByRole("button", { name: "Approve manual" }).click();
  await expect(
    page.getByRole("button", { name: "Approved", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Great people move on/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign in", exact: false }).click();
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  await page.getByRole("button", { name: "Avery Lane Cloud Engineer" }).click();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Knowledge", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Include Architecture decision log" })
    .check();
  await expect(page.getByText("In progress", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Training manual" }).click();
  await expect(
    page.getByRole("button", { name: "Choose knowledge sources" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ask Handoff", exact: true }).click();
  await page
    .getByLabel("Knowledge from")
    .selectOption({ label: "Avery Lane → Robin Vale" });
  await page
    .getByRole("button", { name: "What are the migration steps?" })
    .click();
  await expect(page.locator(".answer")).toContainText("staging rehearsal");
  await expect(
    page
      .locator(".answer")
      .getByRole("button", { name: "Atlas migration runbook" }),
  ).toBeVisible();
  await page.getByLabel("Your question").fill("quantum banana payroll");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".answer").last()).toContainText(
    "could not find supporting information",
  );
  await page.getByRole("button", { name: "Leave workspace" }).click();
  await expect(
    page.getByRole("heading", { name: /Great people move on/ }),
  ).toBeVisible();
});
test("mobile layout and demo screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  await expect(page.getByRole("button", { name: "New handoff" })).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
});

test("desktop presentation, keyboard dialogs, and scoped knowledge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./");
  await page.screenshot({
    path: "docs/screenshots/01-landing.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await page.screenshot({
    path: "docs/screenshots/02-signin.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  await page.screenshot({
    path: "docs/screenshots/03-dashboard.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "New handoff" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close new handoff" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Create handoff", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close new handoff" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "New handoff" })).toBeFocused();
  await page
    .getByRole("button", { name: "Alex Morgan Senior Cloud Consultant" })
    .click();
  await page.getByRole("tab", { name: "Knowledge", exact: true }).click();
  await page.screenshot({
    path: "docs/screenshots/04-knowledge.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Generate sample manual" }).click();
  await page.screenshot({
    path: "docs/screenshots/05-manual.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ask Handoff", exact: true }).click();
  await page.getByLabel("Knowledge from").selectOption("h2");
  await page.getByRole("button", { name: "When are client updates?" }).click();
  await expect(page.locator(".answer")).toContainText(
    "could not find supporting information",
  );
  await page
    .getByLabel("Your question")
    .fill("How do I triage incident alerts?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".answer").last()).toContainText(
    "Acknowledge an alert",
  );
  await expect(page.locator(".answer").last()).not.toContainText(
    "Atlas migration",
  );
  await page.screenshot({
    path: "docs/screenshots/06-ask.png",
    fullPage: true,
  });
});

test("empty or corrupt saved records recover without a blank workspace", async ({
  page,
}) => {
  for (const stored of ["{broken-json"]) {
    await page.goto("./");
    await page.evaluate(
      (value) => localStorage.setItem("handoff-demo-v1", value),
      stored,
    );
    await page.reload();
    await page.getByRole("button", { name: "Explore the demo" }).click();
    await page.getByRole("button", { name: "Enter demo workspace" }).click();
    await expect(
      page.getByRole("button", { name: "Alex Morgan Senior Cloud Consultant" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Alex Morgan Senior Cloud Consultant" })
      .click();
    await expect(
      page.getByRole("heading", { name: /Alex Morgan/ }),
    ).toBeVisible();
  }
});

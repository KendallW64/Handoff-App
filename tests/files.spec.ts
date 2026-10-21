import { test, expect, type Page } from "@playwright/test";
import { zipSync, strToU8 } from "fflate";
import { PDFDocument, StandardFonts } from "pdf-lib";
const fixture = (
  name: string,
  buffer: Uint8Array | string,
  mimeType = "application/octet-stream",
) => ({
  name,
  mimeType,
  buffer: Buffer.from(typeof buffer === "string" ? buffer : buffer),
});
const office = (name: string, files: Record<string, string>) =>
  fixture(
    name,
    zipSync(
      Object.fromEntries(
        Object.entries(files).map(([key, value]) => [key, strToU8(value)]),
      ),
    ),
  );
async function enterFiles(page: Page) {
  await page.goto("./");
  await page.getByRole("button", { name: "Use my own files" }).click();
  await expect(page.getByLabel("Upload files")).toBeEnabled();
}
async function openSource(page: Page, title: string) {
  await page
    .locator(".resource-row")
    .filter({ has: page.getByText(title, { exact: true }) })
    .getByRole("button", { name: "Read source" })
    .click();
}
test("real files summarize, cite originals, persist, answer and invalidate when removed", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/generate", async (route) => {
    const body = route.request().postDataJSON();
    calls++;
    expect(body.contentConsent).toBe(true);
    expect(body.fictionalDataOnly).toBe(false);
    expect(body.uploadedDocuments).toHaveLength(1);
    expect(body.uploadedDocuments[0].text).toContain(
      "Orion renewal is due Friday",
    );
    expect(JSON.stringify(body)).not.toContain("THIS FILE MUST NOT BE SENT");
    expect(body.sourceIds).toEqual([body.uploadedDocuments[0].id]);
    const response =
      body.mode === "manual"
        ? {
            sections: ["Who", "What", "When", "Where", "Why", "How"].map(
              (kind) => ({
                kind,
                body: "Orion renewal is due Friday.",
                sourceIds: body.sourceIds,
              }),
            ),
          }
        : {
            text: "Orion renewal is due Friday. Contact the delivery owner.",
            sourceIds: body.sourceIds,
            insufficientEvidence: false,
          };
    await route.fulfill({
      json: { provider: "gemini", model: "mock-upload-test", ...response },
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  });
  await enterFiles(page);
  await expect(page.getByText("BridgePoint", { exact: true })).toHaveCount(0);
  await page
    .getByLabel("Upload files")
    .setInputFiles([
      fixture(
        "renewal.txt",
        "Orion renewal is due Friday. Contact the delivery owner.",
        "text/plain",
      ),
      fixture("unselected.csv", "THIS FILE MUST NOT BE SENT", "text/csv"),
    ]);
  await expect(page.getByRole("status")).toContainText("2 files imported");
  await page.getByRole("checkbox", { name: "Include renewal.txt" }).check();
  await page.getByRole("button", { name: "Generate document summary" }).click();
  await expect(page.getByRole("alert")).toContainText("Confirm permission");
  expect(calls).toBe(0);
  await page.getByRole("checkbox", { name: "I am authorized" }).check();
  await page.getByRole("button", { name: "Generate document summary" }).click();
  await expect(page.locator(".document-summary")).toContainText(
    "Orion renewal is due Friday",
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/07-files.png",
    fullPage: true,
  });
  await page
    .locator(".document-summary")
    .getByRole("button", { name: "renewal.txt" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Orion renewal is due Friday",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download original file" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("renewal.txt");
  await page.getByRole("button", { name: "Done reading" }).click();
  await page
    .getByRole("button", { name: "Generate with Gemini", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "How · Getting started" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Use my own files" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Include renewal.txt" }),
  ).toBeChecked();
  await expect(page.locator(".document-summary")).toContainText(
    "Orion renewal is due Friday",
  );
  await page.getByRole("button", { name: "Ask Handoff", exact: true }).click();
  await page.getByRole("checkbox", { name: "I am authorized" }).check();
  await page.getByLabel("Your question").fill("When is the renewal due?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".answer")).toContainText("Friday");
  await page.getByRole("button", { name: /^Handoffs/ }).click();
  await page.getByRole("tab", { name: "Knowledge", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove renewal.txt", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Include renewal.txt" }),
  ).toHaveCount(0);
  await expect(page.locator(".document-summary")).toHaveCount(0);
  await page.getByRole("tab", { name: "Training manual" }).click();
  await expect(
    page.getByRole("button", { name: "Choose knowledge sources" }),
  ).toBeVisible();
  expect(calls).toBe(3);
});
test("Office, PDF, email, spreadsheets and image readers extract real fixture content", async ({
  page,
}) => {
  test.setTimeout(60000);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("Synthetic PDF renewal due Friday", { font });
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6KQAAAABJRU5ErkJggg==",
    "base64",
  );
  const files = [
    office("notes.docx", {
      "word/document.xml":
        '<w:document xmlns:w="w"><w:body><w:p><w:r><w:t>Word review due Monday</w:t></w:r></w:p></w:body></w:document>',
    }),
    office("budget.xlsx", {
      "xl/workbook.xml":
        '<workbook xmlns:r="r"><sheets><sheet name="Budget" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels":
        '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
      "xl/sharedStrings.xml": "<sst><si><t>Renewal budget</t></si></sst>",
      "xl/worksheets/sheet1.xml":
        '<worksheet><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1"><v>42000</v></c></row></sheetData></worksheet>',
    }),
    office("slides.pptx", {
      "ppt/slides/slide1.xml":
        '<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><a:t>PowerPoint delivery plan</a:t></p:cSld></p:sld>',
    }),
    fixture("plan.pdf", await pdf.save(), "application/pdf"),
    fixture("diagram.png", png, "image/png"),
    fixture(
      "message.eml",
      "Subject: Renewal review\r\nFrom: fictional@example.test\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
        Buffer.from("Email approval due Tuesday").toString("base64"),
      "message/rfc822",
    ),
    fixture(
      "notes.html",
      "<h1>HTML planning &amp; delivery</h1><script>DO NOT EXECUTE</script>",
      "text/html",
    ),
    fixture(
      "notes.rtf",
      "{\\rtf1\\ansi RTF milestone due Wednesday}",
      "application/rtf",
    ),
    fixture("table.csv", "Task,Deadline\nReview,Thursday", "text/csv"),
  ];
  await enterFiles(page);
  await page.getByLabel("Upload files").setInputFiles(files);
  await expect(page.getByRole("status")).toContainText("files imported", {
    timeout: 45000,
  });
  const importErrors = await page.getByRole("alert").allTextContents();
  expect(importErrors, "All synthetic file formats should import").toEqual([]);
  await expect(page.getByRole("status")).toContainText("9 files imported");
  for (const [title, text] of [
    ["notes.docx", "Word review due Monday"],
    ["budget.xlsx", "42000"],
    ["slides.pptx", "PowerPoint delivery plan"],
    ["plan.pdf", "PDF attached for Gemini document reading"],
    ["message.eml", "Email approval due Tuesday"],
    ["notes.html", "HTML planning & delivery"],
    ["notes.rtf", "RTF milestone due Wednesday"],
    ["table.csv", "Review,Thursday"],
    ["diagram.png", "Image attached for Gemini"],
  ]) {
    await openSource(page, title);
    await expect(page.getByRole("dialog")).toContainText(text);
    await page.getByRole("button", { name: "Done reading" }).click();
  }
  await page.route("**/api/generate", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.uploadedDocuments).toHaveLength(1);
    expect(body.uploadedDocuments[0].inlineData.mimeType).toBe(
      "application/pdf",
    );
    expect(
      Buffer.from(body.uploadedDocuments[0].inlineData.data, "base64")
        .subarray(0, 5)
        .toString(),
    ).toBe("%PDF-");
    expect(JSON.stringify(body)).not.toContain("Email approval due Tuesday");
    await route.fulfill({
      json: {
        provider: "gemini",
        model: "mock-pdf-test",
        text: "PDF-backed summary.",
        sourceIds: body.sourceIds,
        insufficientEvidence: false,
      },
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  });
  await page.getByRole("checkbox", { name: "Include plan.pdf" }).check();
  await page.getByRole("checkbox", { name: "I am authorized" }).check();
  await page.getByRole("button", { name: "Generate document summary" }).click();
  await expect(page.locator(".document-summary")).toContainText(
    "PDF-backed summary.",
  );
});
test("unreadable and unsupported files are rejected without silent truncation or cross-handoff leakage", async ({
  page,
}) => {
  await enterFiles(page);
  await page
    .getByLabel("Upload files")
    .setInputFiles([
      fixture("old.doc", "legacy"),
      fixture("empty.txt", ""),
      fixture("large.txt", "x".repeat(120001)),
      fixture("bad.pdf", "not a PDF"),
    ]);
  await expect(page.getByRole("status")).toContainText("0 files imported", {
    timeout: 30000,
  });
  await expect(page.getByRole("alert")).toContainText("Unsupported format");
  await expect(page.getByRole("alert")).toContainText(
    "nothing has been silently truncated",
  );
  await page
    .getByLabel("Upload files")
    .setInputFiles(fixture("personal.txt", "Synthetic personal file content"));
  await expect(
    page.getByRole("checkbox", { name: "Include personal.txt" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Leave workspace", exact: true })
    .click();
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  await page
    .getByRole("button", { name: "Alex Morgan Senior Cloud Consultant" })
    .click();
  await page.getByRole("tab", { name: "Knowledge", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Include personal.txt" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "Include Atlas migration runbook" }),
  ).toBeVisible();
});

test("file workspace stays usable on mobile with long filenames", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterFiles(page);
  const name = "Long-business-document-".repeat(6) + ".txt";
  await page
    .getByLabel("Upload files")
    .setInputFiles(fixture(name, "Synthetic mobile document content."));
  await expect(
    page.getByRole("checkbox", { name: "Include " + name }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "docs/screenshots/08-files-mobile.png",
    fullPage: true,
  });
});

import { unzipSync } from "fflate";
import PostalMime from "postal-mime";
import { decode } from "html-entities";
import { XMLParser } from "fast-xml-parser";
const MAX_TEXT = 120000,
  MAX_NATIVE = 3 * 1024 * 1024;
function asArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
function flatten(node: unknown): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join(" ");
  return Object.entries(node as Record<string, unknown>)
    .filter(([key]) => !key.startsWith("@_"))
    .map(([, value]) => flatten(value))
    .join(" ");
}
function parse(xml: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml))
    throw Error(
      "This file contains unsupported XML entities. Export it as plain text or PDF.",
    );
  return new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: false,
    processEntities: true,
  }).parse(xml);
}
function office(bytes: Uint8Array, extension: string): string {
  let size = 0,
    entries = 0;
  const files = unzipSync(bytes, {
    filter(entry) {
      if (++entries > 3000 || (size += entry.originalSize) > 20 * 1024 * 1024)
        throw Error(
          "The Office file expands beyond the supported size. Export a smaller file.",
        );
      return /^(word\/document\.xml|xl\/(sharedStrings\.xml|workbook\.xml|_rels\/workbook\.xml.rels|worksheets\/[^/]+\.xml)|ppt\/slides\/slide\d+\.xml)$/.test(
        entry.name,
      );
    },
  });
  const xml = (name: string) =>
    parse(new TextDecoder().decode(files[name] || new Uint8Array()));
  if (extension === "docx") {
    if (!files["word/document.xml"])
      throw Error("This is not a readable Word document.");
    const doc = xml("word/document.xml");
    return (
      asArray(doc["w:document"]?.["w:body"]?.["w:p"])
        .map((p) => flatten(p))
        .join("\n") +
      "\n" +
      asArray(doc["w:document"]?.["w:body"]?.["w:tbl"]).map(flatten).join("\n")
    );
  }
  if (extension === "pptx") {
    const slides = Object.keys(files)
      .filter((k) => k.startsWith("ppt/slides/slide"))
      .sort(
        (a, b) =>
          Number(a.match(/slide(\d+)/)?.[1]) -
          Number(b.match(/slide(\d+)/)?.[1]),
      );
    if (!slides.length)
      throw Error("No slide text was found. Export image-only slides as PDF.");
    return slides
      .map((name, i) => `Slide ${i + 1}\n${flatten(xml(name))}`)
      .join("\n\n");
  }
  const shared = asArray(xml("xl/sharedStrings.xml").sst?.si).map(flatten);
  const sheets = asArray(
    xml("xl/workbook.xml").workbook?.sheets?.sheet,
  ) as Record<string, string>[];
  const relationships = asArray(
    xml("xl/_rels/workbook.xml.rels").Relationships?.Relationship,
  ) as Record<string, string>[];
  const names = new Map(relationships.map((r) => [r["@_Id"], r["@_Target"]]));
  return (
    "Spreadsheet extraction: formulas are not executed; cached values are shown when available. Numeric dates may be Excel serial values. Charts and formatting are not extracted.\n\n" +
    sheets
      .map((sheet, index) => {
        const target =
          names.get(sheet["@_r:id"]) || `worksheets/sheet${index + 1}.xml`;
        const file = target.startsWith("/")
          ? target.slice(1)
          : "xl/" + target.replace(/^\.\//, "");
        const rows = asArray(xml(file).worksheet?.sheetData?.row) as Record<
          string,
          unknown
        >[];
        const lines = rows.map((row) =>
          asArray(row.c)
            .map((cell: any) => {
              const value =
                cell["@_t"] === "s"
                  ? shared[Number(cell.v)] || ""
                  : cell["@_t"] === "inlineStr"
                    ? flatten(cell.is)
                    : String(cell.v ?? "");
              return `${cell["@_r"] || ""}: ${cell.f ? "=" + flatten(cell.f) + " [cached value: " + value + "]" : value}`;
            })
            .join(" | "),
        );
        return `Worksheet: ${sheet["@_name"] || index + 1}\n${lines.join("\n")}`;
      })
      .join("\n\n")
  );
}
function base64(bytes: Uint8Array) {
  let value = "";
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
self.onmessage = async (event: MessageEvent<File>) => {
  try {
    const file = event.data;
    if (file.name.length > 200)
      throw Error("Please shorten the filename to 200 characters or fewer.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!file.size || file.size > 8 * 1024 * 1024)
      throw Error(
        "Choose a non-empty file no larger than 8 MB. PDFs and images must be no larger than 3 MB.",
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    let text = "",
      inlineData: { mimeType: string; data: string } | undefined;
    if (["png", "jpg", "jpeg", "webp", "pdf"].includes(extension)) {
      if (bytes.length > MAX_NATIVE)
        throw Error(
          "PDFs and images must be no larger than 3 MB. Split or compress this file first.",
        );
      const mimeType =
        extension === "pdf"
          ? "application/pdf"
          : extension === "png"
            ? "image/png"
            : extension === "webp"
              ? "image/webp"
              : "image/jpeg";
      const signature = String.fromCharCode(...bytes.subarray(0, 12));
      if (
        (extension === "pdf" && !signature.startsWith("%PDF-")) ||
        (extension === "png" &&
          !(bytes[0] === 137 && signature.slice(1, 4) === "PNG")) ||
        (["jpg", "jpeg"].includes(extension) &&
          !(bytes[0] === 255 && bytes[1] === 216)) ||
        (extension === "webp" &&
          !(signature.startsWith("RIFF") && signature.slice(8, 12) === "WEBP"))
      )
        throw Error(
          "The file contents do not match the filename. Export a valid PDF or image.",
        );
      if (extension === "pdf") {
        if (
          /\/Encrypt\s+(?:\d+\s+\d+\s+R|<<)/.test(
            new TextDecoder("latin1").decode(bytes),
          )
        )
          throw Error(
            "This PDF is password-protected. Export an unprotected copy you are authorized to use.",
          );
        text =
          "PDF attached for Gemini document reading, including scanned pages and diagrams. Download the original file to review its pages and layout.";
      } else {
        text =
          "Image attached for Gemini visual reading. Verify extracted facts against the original image.";
      }
      inlineData = { mimeType, data: base64(bytes) };
    } else if (["docx", "xlsx", "pptx"].includes(extension)) {
      text = office(bytes, extension);
    } else if (
      [
        "txt",
        "md",
        "csv",
        "html",
        "htm",
        "rtf",
        "eml",
        "json",
        "xml",
        "log",
      ].includes(extension)
    ) {
      if (extension !== "eml") {
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          throw Error(
            "This text file is not UTF-8. Save it with UTF-8 encoding and try again.",
          );
        }
        if (/\x00/.test(text))
          throw Error(
            "This looks like a binary file. Export a supported text or Office file.",
          );
      }
      if (extension === "eml") {
        const mail = await PostalMime.parse(await file.arrayBuffer());
        text = `Subject: ${mail.subject || ""}\nFrom: ${mail.from?.address || ""}\nDate: ${mail.date || ""}\n\n${mail.text || decode((mail.html || "").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " "))}\n\nAttachments (not analyzed): ${mail.attachments.map((a) => a.filename || "unnamed attachment").join(", ")}`;
      }
      if (["html", "htm"].includes(extension))
        text = decode(
          text
            .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&"),
        );
      if (extension === "rtf")
        text = text
          .replace(/\\u(-?\d+)\??/g, (_, code) =>
            String.fromCharCode(Number(code) & 65535),
          )
          .replace(/\\'([0-9a-f]{2})/gi, (_, hex) =>
            new TextDecoder("windows-1252").decode(
              new Uint8Array([parseInt(hex, 16)]),
            ),
          )
          .replace(/\\[a-z]+-?\d*\s?/gi, " ")
          .replace(/[{}]/g, "");
    } else
      throw Error(
        "Unsupported format. Convert legacy .doc/.xls/.ppt, archives, or other files to PDF, DOCX, XLSX, PPTX, CSV, or text first.",
      );
    text = text.trim();
    if (!text)
      throw Error("No readable content was found. Try a PDF export or image.");
    if (text.length > MAX_TEXT)
      throw Error(
        "This file exceeds 120,000 extracted characters. Split it into smaller files; nothing has been silently truncated.",
      );
    self.postMessage({ text, inlineData });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error ? error.message : "This file could not be read.",
    });
  }
};

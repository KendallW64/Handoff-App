import { resources, type Resource } from "../src/data.ts";
export function selectedDocuments(body: Record<string, any>): Resource[] {
  if (
    !Array.isArray(body.sourceIds) ||
    !body.sourceIds.length ||
    body.sourceIds.length > 12 ||
    new Set(body.sourceIds).size !== body.sourceIds.length
  )
    throw Error("Select between 1 and 12 distinct sources.");
  const uploads = body.uploadedDocuments ?? [];
  if (!Array.isArray(uploads) || uploads.length > 8)
    throw Error("Select no more than 8 uploaded files.");
  if (uploads.length && body.contentConsent !== true)
    throw Error("Confirm permission to send selected file contents to Google.");
  if (!uploads.length && body.fictionalDataOnly !== true)
    throw Error("Choose valid demo sources or attach authorized files.");
  let textSize = 0,
    binarySize = 0;
  const seen = new Set<string>();
  const validated: Resource[] = uploads.map((doc) => {
    if (
      !doc ||
      typeof doc.id !== "string" ||
      !/^upload_[a-zA-Z0-9_-]{1,80}$/.test(doc.id) ||
      seen.has(doc.id) ||
      !body.sourceIds.includes(doc.id)
    )
      throw Error("Invalid, duplicated, or unselected uploaded file.");
    seen.add(doc.id);
    if (
      typeof doc.title !== "string" ||
      !doc.title.trim() ||
      doc.title.length > 200 ||
      typeof doc.text !== "string" ||
      !doc.text.trim() ||
      (textSize += doc.text.length) > 120000
    )
      throw Error(
        "Uploaded sources must contain readable text, with no more than 120,000 characters selected in total.",
      );
    const resource: Resource = {
      id: doc.id,
      title: doc.title,
      category: "Uploaded file",
      origin: "upload",
      text: doc.text,
    };
    if (doc.inlineData) {
      const { mimeType, data } = doc.inlineData;
      if (
        !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
          mimeType,
        ) ||
        typeof data !== "string" ||
        !data.length ||
        data.length % 4 !== 0 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(data) ||
        (binarySize +=
          (data.length * 3) / 4 -
          (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0)) >
          3 * 1024 * 1024
      )
        throw Error("Select at most 3 MB of PDF/image attachments in total.");
      const signature = atob(data.slice(0, Math.min(16, data.length)));
      const valid =
        mimeType === "application/pdf"
          ? signature.startsWith("%PDF-")
          : mimeType === "image/png"
            ? signature.charCodeAt(0) === 137 && signature.slice(1, 4) === "PNG"
            : mimeType === "image/jpeg"
              ? signature.charCodeAt(0) === 255 &&
                signature.charCodeAt(1) === 216
              : signature.startsWith("RIFF") &&
                signature.slice(8, 12) === "WEBP";
      if (!valid)
        throw Error("An attachment does not match its PDF or image type.");
      resource.inlineData = { mimeType, data };
    }
    return resource;
  });
  const library = [...resources, ...validated];
  if (
    body.sourceIds.some(
      (id: unknown) =>
        typeof id !== "string" || !library.some((r) => r.id === id),
    )
  )
    throw Error(
      "A selected source is missing. Reattach or select the file again.",
    );
  return library.filter((r) => body.sourceIds.includes(r.id));
}

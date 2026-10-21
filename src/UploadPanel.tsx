import { useState } from "react";
import {
  ACCEPT,
  extractFile,
  putDocument,
  deleteDocument,
  downloadOriginal,
  type UploadRecord,
} from "./documents";
export function UploadPanel({
  handoffId,
  records,
  loading,
  onChange,
  onRemove,
}: {
  handoffId: string;
  records: UploadRecord[];
  loading: boolean;
  onChange: (record: UploadRecord) => void;
  onRemove: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function importFiles(files: FileList | null) {
    if (!files || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    let count = 0;
    const errors: string[] = [];
    try {
      if (records.length + files.length > 20)
        throw Error(
          "Each handoff can hold 20 files. Remove older files before importing more.",
        );
      for (const file of Array.from(files)) {
        setMessage(`Reading ${file.name}…`);
        try {
          const resource = await extractFile(file);
          const record: UploadRecord = {
            id: resource.id,
            handoffId,
            resource,
            original: file,
          };
          await putDocument(record);
          onChange(record);
          count++;
        } catch (error) {
          errors.push(
            `${file.name}: ${error instanceof Error ? error.message : "Could not import this file."}`,
          );
        }
      }
      setMessage(
        `${count} file${count === 1 ? "" : "s"} imported. Review the extracted content before generating a summary.`,
      );
      if (errors.length) setError(errors.join("\n"));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not import these files.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="upload-panel" aria-label="File uploads">
      <h3>Bring your files into the handoff</h3>
      <p>
        PDF, DOCX, XLSX, PPTX, CSV, text/Markdown, HTML, RTF, EML, JSON/XML,
        PNG, JPEG, and WebP. Up to 8 MB per file; PDFs/images up to 3 MB.
        Scanned PDFs and images are read by Gemini, not local OCR. Legacy Office
        files must be converted first.
      </p>
      <label className="upload-picker">
        Import files
        <input
          aria-label="Upload files"
          type="file"
          accept={ACCEPT}
          multiple
          disabled={busy || loading}
          onChange={(event) => {
            void importFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      <p className="subtle">
        Files and extracted content are saved only in this browser, not in a
        public file library. Uploading alone does not send them to Google.
        Clearing site data removes them. This is not a shared company account.
      </p>
      {message && <p role="status">{message}</p>}
      {error && (
        <p className="notice" role="alert" style={{ whiteSpace: "pre-line" }}>
          {error}
        </p>
      )}
      {loading && <p role="status">Loading saved files…</p>}
      <ul className="uploaded-files">
        {records.map((record) => (
          <li key={record.id}>
            <span>
              <b>{record.resource.title}</b>
              <small>
                {record.resource.inlineData
                  ? "Attached for Gemini reading"
                  : record.resource.text.length.toLocaleString() +
                    " extracted characters"}
              </small>
            </span>
            <button
              className="text-link"
              onClick={() => downloadOriginal(record)}
            >
              Download original
            </button>
            <button
              className="text-link"
              disabled={busy}
              onClick={async () => {
                try {
                  await deleteDocument(record.id);
                  onRemove(record.id);
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Could not remove file.",
                  );
                }
              }}
              aria-label={"Remove " + record.resource.title}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

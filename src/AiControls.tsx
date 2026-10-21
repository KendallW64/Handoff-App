import { apiUrl } from "./ai";
export function AiControls({
  enabled,
  busy,
  onChange,
}: {
  enabled: boolean;
  busy: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="ai-controls">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          disabled={!apiUrl || busy}
          onChange={(e) => onChange(e.target.checked)}
        />{" "}
        Use Gemini AI · selected sources
      </label>
      <p>
        {enabled
          ? "Selected document contents, your question, and handoff details will be sent to Google through the backend. PDF/image originals are sent for document reading; other formats send extracted text. Check your Google API data terms, use only authorized information, and verify all AI output."
          : apiUrl
            ? "Sample mode is active. Enable Gemini to request real model responses."
            : "Gemini is not connected yet. The owner must deploy the backend and configure its public URL. Sample mode is active."}
      </p>
    </div>
  );
}

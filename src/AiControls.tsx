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
        Use Gemini AI · fictional data only
      </label>
      <p>
        {enabled
          ? "Selected sample documents, your question, and fictional handoff details will be sent to Google through the backend. Responses can be wrong; verify their sources."
          : apiUrl
            ? "Sample mode is active. Enable Gemini to request real model responses."
            : "Gemini is not connected yet. The owner must deploy the backend and configure its public URL. Sample mode is active."}
      </p>
    </div>
  );
}

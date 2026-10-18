import { resources, type Handoff, type Resource, type AiManual } from "./data";
export type { AiManual } from "./data";
export const apiUrl = (import.meta.env.VITE_AI_API_URL || "").replace(
  /\/$/,
  "",
);
export function isAiManual(value: unknown): value is AiManual {
  const v = value as AiManual;
  return (
    !!v &&
    typeof v.model === "string" &&
    Array.isArray(v.sections) &&
    v.sections.length === 6 &&
    v.sections.every(
      (s) =>
        typeof s.title === "string" &&
        typeof s.body === "string" &&
        Array.isArray(s.sources) &&
        s.sources.every(
          (r) =>
            r &&
            ["id", "title", "category", "text"].every(
              (k) =>
                typeof (r as unknown as Record<string, unknown>)[k] ===
                "string",
            ),
        ),
    )
  );
}
export async function requestAi(
  mode: "manual" | "answer",
  handoff: Handoff,
  question?: string,
) {
  if (!apiUrl)
    throw new Error(
      "The Gemini backend URL is not configured. Sample mode is still available.",
    );
  const endpoint = new URL(apiUrl);
  if (
    endpoint.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(endpoint.hostname)
  )
    throw new Error("The backend must use HTTPS.");
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(35000),
      body: JSON.stringify({
        mode,
        handoff: {
          name: handoff.name,
          role: handoff.role,
          department: handoff.department,
          recipient: handoff.recipient,
          type: handoff.type,
          due: handoff.due,
          responsibilities: handoff.responsibilities,
        },
        sourceIds: handoff.selected,
        question,
        fictionalDataOnly: true,
      }),
    });
  } catch {
    throw new Error(
      "The Gemini backend could not be reached. Check its address, availability, and allowed origin. No sample answer was substituted.",
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(result?.error || "The AI backend returned an error.");
  if (result?.provider !== "gemini" || typeof result.model !== "string")
    throw new Error("The AI backend returned an invalid response.");
  const handoffSource: Resource = {
    id: "handoff",
    title: "Handoff details",
    category: "Fictional user-entered details",
    text: JSON.stringify(
      {
        name: handoff.name,
        role: handoff.role,
        department: handoff.department,
        recipient: handoff.recipient,
        type: handoff.type,
        due: handoff.due,
        responsibilities: handoff.responsibilities,
      },
      null,
      2,
    ),
  };
  const allowed = [
    ...resources.filter((r) => handoff.selected.includes(r.id)),
    handoffSource,
  ];
  function citations(ids: unknown): Resource[] {
    if (
      !Array.isArray(ids) ||
      ids.some((id) => !allowed.some((r) => r.id === id))
    )
      throw new Error("The AI response included an invalid source reference.");
    return allowed.filter((r) => ids.includes(r.id));
  }
  if (mode === "answer") {
    if (typeof result.text !== "string")
      throw new Error("The AI response was incomplete.");
    return {
      text: result.text,
      sources: citations(result.sourceIds),
      model: result.model,
    };
  }
  const titles = [
    "Who · Your people",
    "What · Your responsibilities",
    "When · Your rhythm",
    "Where · Your knowledge",
    "Why · The context",
    "How · Getting started",
  ];
  if (!Array.isArray(result.sections) || result.sections.length !== 6)
    throw new Error("The AI response was incomplete.");
  const sections = result.sections.map(
    (s: { kind: unknown; body: unknown; sourceIds: unknown }, i: number) => {
      if (s.kind !== titles[i].split(" · ")[0] || typeof s.body !== "string")
        throw new Error("The AI response was incomplete.");
      return {
        title: titles[i],
        body: s.body,
        sources: citations(s.sourceIds),
      };
    },
  );
  return { model: result.model, sections };
}

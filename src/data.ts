export type Resource = {
  id: string;
  title: string;
  category: string;
  text: string;
  origin?: "upload";
  inlineData?: { mimeType: string; data: string };
};
export type AiManual = {
  model: string;
  sections: { title: string; body: string; sources: Resource[] }[];
};
export type Handoff = {
  id: string;
  name: string;
  role: string;
  department: string;
  type: string;
  recipient: string;
  responsibilities: string;
  due: string;
  selected: string[];
  generated: boolean;
  approved: boolean;
  aiManual?: AiManual;
  summary?: { text: string; model: string; sources: Resource[] };
};
export const resources: Resource[] = [
  {
    id: "migration",
    title: "Atlas migration runbook",
    category: "Process",
    text: "For the fictional Atlas cloud migration, Maya Chen is the project sponsor and Jordan Ellis is the technical lead. Every Tuesday at 10 AM Eastern, review the migration checklist with the delivery team. Find the checklist in the sample Atlas project folder. Before each migration, validate the backup, run a staging rehearsal, and obtain sponsor approval. This prevents data loss and unexpected downtime.",
  },
  {
    id: "client",
    title: "Client relationship notes",
    category: "Contacts",
    text: "For the fictional Atlas project, Maya Chen is the primary client contact. Route scope changes through the project sponsor before promising dates. Client updates occur every Thursday at 2 PM Eastern. Store approved meeting summaries in the sample Atlas project folder. Written approvals preserve the reasons behind scope and schedule decisions.",
  },
  {
    id: "operations",
    title: "Cloud operations checklist",
    category: "Responsibilities",
    text: "The fictional operations team reviews alerts at 9 AM Eastern each workday. Jordan Ellis owns incident triage. Find incident records in the sample operations knowledge folder. Acknowledge an alert, assess impact, record findings, and escalate to the technical lead before changing production. This keeps incident decisions traceable.",
  },
  {
    id: "decisions",
    title: "Architecture decision log",
    category: "Project history",
    text: "The fictional Atlas team chose phased migration so each service could be validated independently. Jordan Ellis maintains the decision log in the sample architecture folder. Review the log before proposing infrastructure changes. Record the problem, alternatives, decision, and rationale; request technical lead review before implementation.",
  },
];
export const initialHandoffs: Handoff[] = [
  {
    id: "h1",
    name: "Alex Morgan",
    role: "Senior Cloud Consultant",
    department: "Cloud Services",
    type: "Internal transfer",
    recipient: "Sam Rivera",
    responsibilities:
      "Lead the Atlas migration, maintain client communication, and coordinate cloud operations.",
    due: "2026-11-06",
    selected: ["migration", "client", "decisions"],
    generated: false,
    approved: false,
  },
  {
    id: "h2",
    name: "Taylor Brooks",
    role: "IT Operations Lead",
    department: "IT Operations",
    type: "Departure",
    recipient: "Jamie Parker",
    responsibilities: "Manage daily incident triage and cloud operations.",
    due: "2026-11-13",
    selected: ["operations"],
    generated: true,
    approved: false,
  },
  {
    id: "h3",
    name: "Casey Reed",
    role: "Solutions Architect",
    department: "Architecture",
    type: "Project transfer",
    recipient: "Drew Bennett",
    responsibilities:
      "Maintain architecture decisions and review infrastructure changes.",
    due: "2026-10-30",
    selected: ["decisions"],
    generated: true,
    approved: true,
  },
];
export const status = (h: Handoff) =>
  h.approved ? "Completed" : h.generated ? "Pending review" : "In progress";
export function manual(h: Handoff, library: Resource[] = resources) {
  const docs = library.filter((r) => h.selected.includes(r.id));
  return [
    {
      title: "Who · Your people",
      body: `${h.name} is transferring responsibilities as ${h.role} in ${h.department} to ${h.recipient}. Review the contacts in the selected sources before starting work.`,
      sources: [] as Resource[],
    },
    {
      title: "What · Your responsibilities",
      body: h.responsibilities,
      sources: [] as Resource[],
    },
    {
      title: "When · Your rhythm",
      body:
        `Target transition date: ${h.due}. ` +
        docs
          .filter((r) => /Tuesday|Thursday|workday/.test(r.text))
          .map((r) => r.text)
          .join("\n\n"),
      sources: docs.filter((r) => /Tuesday|Thursday|workday/.test(r.text)),
    },
    {
      title: "Where · Your knowledge",
      body: docs
        .map(
          (r) =>
            `${r.title}: ${r.category}. Open the source below to read the sample information and its folder reference.`,
        )
        .join("\n"),
      sources: docs,
    },
    {
      title: "Why · The context",
      body: docs.map((r) => r.text).join("\n\n"),
      sources: docs,
    },
    {
      title: "How · Getting started",
      body:
        "1. Read each selected source below.\n2. Walk through the documented steps with the receiving employee.\n3. Confirm owners, recurring activities, and approvals before acting.\n4. Review this draft together and approve the transfer when accurate.\n\n" +
        docs.map((r) => r.text).join("\n\n"),
      sources: docs,
    },
  ];
}
export function answer(
  question: string,
  h: Handoff,
  library: Resource[] = resources,
): { text: string; sources: Resource[] } {
  const terms =
    question
      .toLowerCase()
      .match(/[a-z]+/g)
      ?.filter(
        (w) =>
          w.length > 3 &&
          ![
            "what",
            "when",
            "where",
            "does",
            "should",
            "with",
            "about",
            "have",
            "that",
            "this",
            "which",
          ].includes(w),
      ) ?? [];
  const matches = library
    .filter((r) => h.selected.includes(r.id))
    .map((r) => ({
      r,
      score: terms.filter((t) =>
        (r.title + " " + r.text).toLowerCase().includes(t),
      ).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.r);
  return matches.length
    ? { text: matches.map((r) => r.text).join("\n\n"), sources: matches }
    : {
        text: "I could not find supporting information in this handoff’s selected sample sources. Try asking about a selected document, or add the relevant source in the Knowledge tab. I won’t guess an answer.",
        sources: [],
      };
}

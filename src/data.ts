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
    "id": "handbook",
    "title": "Handbook-first communication",
    "category": "Documentation",
    "text": "GitLab is intentional about documenting in a manner that creates a single source of truth.\n\nAt GitLab, we write things down *first*, and communicate that (E.g. Document the solution first, *then* announce via Slack or email.)."
  },
  {
    "id": "communication",
    "title": "GitLab communication",
    "category": "Communication",
    "text": "To accomplish this, we use asynchronous communication as a starting point and stay as open and transparent as we can by communicating through public issues, merge requests, and Slack channels.\n\nWe also place an emphasis on ensuring that conclusions of offline conversations are written down.\n\nWe communicate respectfully and professionally at all times."
  },
  {
    "id": "onboarding",
    "title": "Remote onboarding",
    "category": "Onboarding",
    "text": "GitLab believes the onboarding process is incredibly important. We don't expect anyone to hit the ground running from day one.\n\nWe anticipate the remote onboarding process to take at least two full weeks, with the third week designated for team-specific onboarding and training. We encourage new team members to participate in their teams' work in the first two weeks, but without pressure to contribute heavily."
  },
  {
    "id": "meetings",
    "title": "Meeting agendas",
    "category": "Meetings",
    "text": "Every work-related meeting should have a single live doc agenda affixed to the calendar invite at the time that the invite is added to calendars.\n\n[Meeting DRIs](/handbook/people-group/directly-responsible-individuals/) should prep the agenda at least 72 hours before the meeting."
  }
];
export const initialHandoffs: Handoff[] = [
  {
    "id": "gitlab-handbook",
    "name": "Handbook-first working",
    "role": "Public handbook topic",
    "department": "GitLab public handbook",
    "type": "Public-document review",
    "recipient": "Demo reader",
    "responsibilities": "Review the selected GitLab public handbook excerpts. No employee handoff, assigned owner or transition date is documented in this demo.",
    "due": "Not specified",
    "selected": [
      "handbook",
      "communication"
    ],
    "generated": false,
    "approved": false
  },
  {
    "id": "gitlab-onboarding",
    "name": "Remote onboarding review",
    "role": "Public handbook topic",
    "department": "GitLab public handbook",
    "type": "Public-document review",
    "recipient": "Demo reader",
    "responsibilities": "Review the selected GitLab public handbook excerpts. No employee handoff, assigned owner or transition date is documented in this demo.",
    "due": "Not specified",
    "selected": [
      "onboarding"
    ],
    "generated": false,
    "approved": false
  },
  {
    "id": "gitlab-meetings",
    "name": "Meeting practices review",
    "role": "Public handbook topic",
    "department": "GitLab public handbook",
    "type": "Public-document review",
    "recipient": "Demo reader",
    "responsibilities": "Review the selected GitLab public handbook excerpts. No employee handoff, assigned owner or transition date is documented in this demo.",
    "due": "Not specified",
    "selected": [
      "meetings"
    ],
    "generated": false,
    "approved": false
  }
];
export const status = (h: Handoff) =>
  h.approved ? "Completed" : h.generated ? "Pending review" : "In progress";
export function manual(h: Handoff, library: Resource[] = resources) {
  if(h.type === "Public-document review") {
    const docs=library.filter(r=>h.selected.includes(r.id));
    const timing=docs.filter(r=>r.id === "onboarding" || r.id === "meetings");
    return [
      {title:"Who · Your people",body:"These are GitLab public handbook excerpts. No specific employee, receiving teammate or actual personnel transition is identified. Demo reader is an interface label, not a GitLab employee.",sources:[] as Resource[]},
      {title:"What · Your responsibilities",body:docs.length ? docs.map(r=>r.text).join("\n\n") : "No sources selected.",sources:docs},
      {title:"When · Your rhythm",body:timing.length ? timing.map(r=>r.text).join("\n\n") : "No schedule or transition date is specified in the selected excerpts.",sources:timing},
      {title:"Where · Your knowledge",body:docs.map(r=>r.title+" — public handbook excerpt available below.").join("\n"),sources:docs},
      {title:"Why · The context",body:docs.map(r=>r.text).join("\n\n"),sources:docs},
      {title:"How · Getting started",body:"Read the selected public handbook excerpts below. This local reading guide does not establish an employee assignment or a GitLab-approved training manual.",sources:docs},
    ];
  }
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
            `${r.title}: ${r.category}. Open the source below to read the selected information.`,
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
        text: "I could not find supporting information in this handoff’s selected sources. Try asking about a selected document, or add the relevant source in the Knowledge tab. I won’t guess an answer.",
        sources: [],
      };
}

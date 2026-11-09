# GitLab demo verification report

Retrieved November 9, 2026 from GitLab’s official public handbook repository. This is an independent Handoff learning demo, not a GitLab deployment, employee directory, customer endorsement or record of actual employee transitions.

Pinned repository revision: `29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e`. The snapshots are a versioned source record, not a claim that the guidance will never change.

## Every source used

### 1. Handbook-first communication

- Published page: https://handbook.gitlab.com/handbook/company/culture/all-remote/handbook-first/
- Exact revision: https://gitlab.com/gitlab-com/content-sites/handbook/-/blob/29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e/content/handbook/company/culture/all-remote/handbook-first.md
- Raw file: https://gitlab.com/gitlab-com/content-sites/handbook/-/raw/29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e/content/handbook/company/culture/all-remote/handbook-first.md
- Included snapshot: [handbook.md](handbook.md)
- SHA-256: `b9e459295c13cb2fff64b69b98b56bcc10070a54278f9d0edc14cdf6ef0950fe`

The app uses only these exact quotations (not the entire page):

> GitLab is intentional about documenting in a manner that creates a single source of truth.

Snapshot line 15.

> At GitLab, we write things down *first*, and communicate that (E.g. Document the solution first, *then* announce via Slack or email.).

Snapshot line 19.

### 2. GitLab communication

- Published page: https://handbook.gitlab.com/handbook/communication/
- Exact revision: https://gitlab.com/gitlab-com/content-sites/handbook/-/blob/29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e/content/handbook/communication/_index.md
- Raw file: https://gitlab.com/gitlab-com/content-sites/handbook/-/raw/29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e/content/handbook/communication/_index.md
- Included snapshot: [communication.md](communication.md)
- SHA-256: `2328f8def18142113493e237e149148371b435930e95f2f5d4b916a197f7ea99`

The app uses only these exact quotations (not the entire page):

> To accomplish this, we use asynchronous communication as a starting point and stay as open and transparent as we can by communicating through public issues, merge requests, and Slack channels.

Snapshot line 8.

> We also place an emphasis on ensuring that conclusions of offline conversations are written down.

Snapshot line 10.

> We communicate respectfully and professionally at all times.

Snapshot line 12.

### 3. Remote onboarding

- Published page: https://handbook.gitlab.com/handbook/company/culture/all-remote/onboarding/
- Exact revision: https://gitlab.com/gitlab-com/content-sites/handbook/-/blob/29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e/content/handbook/company/culture/all-remote/onboarding.md
- Raw file: https://gitlab.com/gitlab-com/content-sites/handbook/-/raw/29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e/content/handbook/company/culture/all-remote/onboarding.md
- Included snapshot: [onboarding.md](onboarding.md)
- SHA-256: `45f2c6af79af0086a27514d8cc459adbd10375678a2e4b20155548bbc056e581`

The app uses only these exact quotations (not the entire page):

> GitLab believes the onboarding process is incredibly important. We don't expect anyone to hit the ground running from day one.

Snapshot line 21.

> We anticipate the remote onboarding process to take at least two full weeks, with the third week designated for team-specific onboarding and training. We encourage new team members to participate in their teams' work in the first two weeks, but without pressure to contribute heavily.

Snapshot line 23.

### 4. Meeting agendas

- Published page: https://handbook.gitlab.com/handbook/company/culture/all-remote/meetings/
- Exact revision: https://gitlab.com/gitlab-com/content-sites/handbook/-/blob/29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e/content/handbook/company/culture/all-remote/meetings.md
- Raw file: https://gitlab.com/gitlab-com/content-sites/handbook/-/raw/29ef154f7b8b4c30f6ca7d5ef8fa2fa7f121ef0e/content/handbook/company/culture/all-remote/meetings.md
- Included snapshot: [meetings.md](meetings.md)
- SHA-256: `5e37c91bfbe2553c08eb3d0c2973788230bb55c9f73e1ddac58bb5c0f1e0dac0`

The app uses only these exact quotations (not the entire page):

> Every work-related meeting should have a single live doc agenda affixed to the calendar invite at the time that the invite is added to calendars.

Snapshot line 133.

> [Meeting DRIs](/handbook/people-group/directly-responsible-individuals/) should prep the agenda at least 72 hours before the meeting.

Snapshot line 146.

## Every substantive external number used

| Figure in demo | Meaning and limits | Source |
|---|---|---|
| At least two full weeks | GitLab’s stated anticipated remote-onboarding duration; this is guidance in this source, not measured completion time or a promise. | Remote onboarding snapshot, “How long should remote onboarding take?” |
| Third week | Designated for team-specific onboarding and training in that same paragraph. | Remote onboarding snapshot, same paragraph |
| First two weeks | New team members are encouraged to participate without pressure to contribute heavily. | Remote onboarding snapshot, same paragraph |
| At least 72 hours before a meeting | Agenda preparation guidance for meeting DRIs. Not an invented recurring meeting schedule. | Meeting agendas snapshot, “All meetings must have an agenda” |

No revenue, headcount, customer count, performance improvements, fabricated dates or percentages are used. The previous decorative 78% graphic was removed. Other numbers in the complete source snapshots are not included in the app’s curated excerpts.

## App-derived counts and interface numbers

- Initial demo: 3 topic records, 3 in progress, 0 pending review, 0 completed, 0 approved, 0 generated manuals. These are calculated from `initialHandoffs` in `src/data.ts`, not external GitLab statistics. Counts change only with this browser’s demo actions.
- Four curated public source excerpts: counted from `resources` in `src/data.ts` and the four source records in this manifest.
- Six manual sections (Who, What, When, Where, Why, How): Handoff’s interface structure, not a GitLab statistic.
- Existing product limits shown in the interface: 20 imported files; 8 MB/file; 3 MB/PDF or image and combined native AI input; 120,000 extracted characters/file and combined AI input; 8 uploaded files / 12 total sources for summaries, manuals and questions; 20 uploaded files for organization; 4,000-character organization previews; 50 MB ZIP limit; 10 attempted AI requests per UTC day; 60-second provider and 75-second browser deadlines. These are Handoff implementation limits (`src/documents.ts`, `src/extract.worker.ts`, `src/ai.ts`, `src/OrganizationPanel.tsx`, `src/zip.worker.ts`, `server/documents.ts`, `server/worker.ts`), not GitLab claims or provider guarantees.

## What is deliberately unspecified

The three records are reading topics, not invented employees: Handbook-first working, Remote onboarding review, Meeting practices review. “Demo reader” and “Public handbook topic” are interface labels. No employee identity, departure, receiving employee, assigned owner, actual handoff event or transition deadline is asserted. Initial dates are “Not specified”; approvals and generated-manual flags start false. New user-created records remain user-entered data, not verified GitLab facts.

Local answers return selected quotations; the local manual explicitly identifies missing personnel information. Optional Gemini output is still generated text and must be verified against the supplied excerpts; it is not certified factual by these source checks.

## License and reproducibility

The official repository LICENSE at the same revision is included as LICENSE-GitLab.txt. Its copyright and permission notice is preserved in the verification pack and published as the demo’s License link. Source provenance is provided here for verification; no external source list is added to the website. `manifest.json` maps every excerpt to an exact snapshot with SHA-256 hashes. Automated tests check quotation membership, hashes and initial-state facts.

Old BridgePoint demo storage is retained separately and is not loaded into the GitLab demo. The personal file workspace is unchanged.

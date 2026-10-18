# Handoff

**Knowledge stays. Teams move forward.**

A functional, browser-based employee knowledge transfer prototype. Handoff is the software provider; BridgePoint is a fictional Atlanta IT consulting customer. Every person, document, client, and project is fictional. Use sample information only.

## Run locally

Install Node.js 22.12+ (Node 24 is also supported), then open a terminal in this repository:

```sh
npm ci
npm run dev
```

Vite prints the local address. Open it in your browser. Changes to the source update the page during development.

```sh
npm run build    # TypeScript check and production bundle in dist/
npm run preview  # Locally serve that production bundle
```

## Five screens and a demonstration walkthrough

1. **Public website:** Handoff's value proposition and an Explore the demo button. Nobody starts signed in.
2. **Demo sign-in:** explicitly enter BridgePoint; no passwords or personal information are requested.
3. **Dashboard:** active, review, and completed totals; search and filter handoffs. Choose New handoff and enter fictional details.
4. **Handoff workspace:** Overview records responsibilities and recipient. Knowledge lets you read and select sample documents. Generate a manual covering Who, What, When, Where, Why, and How. References open their original sample documents. Review and approve the manual; its dashboard status becomes Completed. Changing sources invalidates the generated manual and approval. Print / Save PDF uses your browser's print dialog.
5. **Ask Handoff:** choose a handoff, ask about its selected resources, and open the referenced sources. Unsupported questions produce an explicit no-evidence response.

Creation and source-review dialogs are panels within these screens. Leave workspace returns to the public website. Refresh also returns to the public website while preserving handoff records.

## Implemented versus simulated

**Implemented:** responsive navigation, labeled forms with required fields, whitespace validation, fictional handoff creation, local persistence, dashboard filtering, source selection and reading, manual assembly, approval, source-change invalidation, question matching with source references, and print styling. Dialogs support Escape, trapped keyboard focus, and focus restoration.

**Simulated:** authentication (no identity verification or security boundary), enterprise integrations (a built-in sample library only), and AI (deterministic local templates and keyword retrieval, not an LLM). Questions return matching source passages rather than independent generated claims. The same fictional library is available to every handoff, and only selected documents are used. There is no upload service or connection to company systems.

Manual sections identify whether their source is user-entered demo handoff details or selected sample documents. The Why and How sections preserve source passages to keep the demonstration verifiable; they are starting points for human review, not expert recommendations.

Browser localStorage stores handoff records on the current browser and origin. Records are not synchronized between devices, encrypted by this app, or sent to a server. Clearing site data clears records. Storage failures show a warning; corrupt/incompatible saved data falls back to sample records. To reset, clear the `handoff-demo-v1` localStorage key in browser developer tools. Do not store real employee data.

## Code map and decisions

- `src/main.tsx`: screen navigation, forms, workflow interactions, and application state.
- `src/data.ts`: typed domain records, fictional source library, manual assembly, and source-scoped answer retrieval. These functions can later be replaced by backend APIs.
- `src/style.css`: responsive design and print styles.
- `tests/workflow.spec.ts`: real-browser acceptance tests.
- `package-lock.json`: exact dependency versions, used by `npm ci`.

React keeps the interface in sync with application state. TypeScript checks the shapes of handoffs and resources before release. Vite builds static assets, keeping deployment straightforward. Fonts are packaged with the app and icons use Lucide; no external fonts or paid APIs are needed at runtime. Navigation uses in-memory state so this prototype does not require host-side URL rewrite rules.

## Test

The cloud machine has Chromium at `/usr/bin/chromium`:

```sh
npm test
```

On another machine, install Playwright Chromium (the configuration uses an installed system Chromium when available):

```sh
npx playwright install chromium
npm test
```

Set `CHROMIUM_PATH` only if a different executable is needed. Tests start Vite automatically. See `TESTING.md` for actual results and limitations.

For production-file tests at the Pages project path, run `npm run test:pages`. For the actual public site, run `npm run test:live` (or set `PAGES_URL` to the deployed URL). The live check does not start a local server.

## Publish to a public URL

### GitHub Pages

The repository now includes `.github/workflows/deploy-pages.yml`. Set **Settings → Pages → Source → GitHub Actions**, then run the workflow on `main`. It builds and tests the app, deploys only `dist`, and verifies the actual deployed URL. All three jobs must pass; a successful build alone does not prove the site loads.

See [Pages diagnosis and confirmation steps](docs/PAGES-DEPLOYMENT.md). The base-path failure was reproduced locally and corrected; the existing live Pages settings and site remain unverified from this network.

### Other static hosts

No hosting account or deployment credentials are included.

A beginner-friendly option is a static site on Netlify or Vercel:

1. Commit this project and push it to your GitHub repository.
2. Sign in to your hosting provider and import `KendallW64/Handoff-App` as a new project.
3. Choose Vite (if prompted). Set install command to `npm ci`, build command to `npm run build`, and output directory to `dist`.
4. Select a supported Node version (22.12+ or 24). No environment variables, API keys, database, or backend are required.
5. Deploy and copy the public URL displayed by the host. Test from a private browser window: it should start at the public landing page.
6. Repeat the full walkthrough on the public URL. Hosted local data is separate from local development data. Anyone opening the URL gets their own browser's sample records.

Alternatively upload the contents of `dist/` to a static host that supports HTTPS. Do not upload `node_modules`. Host terms, plan limits, and charges should be checked directly; this project makes no pricing guarantee.

## Assignment screenshots

Use fictional sample records. Capture these five views at approximately 1440 × 1000 pixels:

1. Public landing page with Handoff branding and tagline.
2. BridgePoint dashboard with handoff statuses.
3. Handoff Knowledge tab with selected sources.
4. Generated six-part manual with source links and approval.
5. Ask Handoff answer with supporting document references.

The screenshot list is five views across four main screens; sign-in is the fifth main screen in the app. Include the public URL in your proposal, caption every screenshot, and label authentication, AI, and integrations as simulated. Browser tests also capture mobile landing and dashboard screenshots under `test-results/`.

## Three technical facts with direct sources

These are technical facts, not invented research claims or cost estimates:

1. **React supports TypeScript**, including types for components and hooks. We use TypeScript to catch invalid record and prop shapes during build. [React: Using TypeScript](https://react.dev/learn/typescript).
2. **Vite's production build outputs static assets in `dist` by default**, which can be served by a static hosting provider. `vite preview` is for local preview, not a production server. [Vite: Deploying a Static Site](https://vite.dev/guide/static-deploy.html).
3. **localStorage persists across browser sessions and is scoped to an origin.** This supports a simple single-browser prototype but is not shared company storage. [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

These authoritative reference links are supplied for verification. Direct retrieval of those documentation domains was blocked by this cloud environment's egress policy during development; no claim is made that their pages were fetched in this session.

## Before production

Add real tenant isolation, authenticated sessions, role-based authorization, server-side validation and persistence, retention/deletion policies, audit logs, backup and recovery, secure document ingestion, and access-aware search. Real AI needs permission-filtered retrieval, prompt-injection defenses, evidence evaluation, and monitored model/API usage. Approval should record the authenticated reviewer, timestamp, and version. Test accessibility with assistive technology and run security and load reviews. This prototype is not a secure system for employee records.

## Microsoft AI roadmap and requirements review

[Microsoft integration proposal](docs/MICROSOFT-AI-PLAN.md) compares Foundry and Copilot Studio, required accounts, costs, Entra sign-in, server-side identities, tenant/document isolation, and acceptance gates. No real Microsoft integration is configured or claimed.

[Requirements review](docs/REQUIREMENTS-REVIEW.md) records implemented, simulated, and outstanding features against the original brief.

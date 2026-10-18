# Connect Gemini safely — fictional demo only

## What has been built

The frontend can request six-section manuals and source-referenced answers from a Cloudflare Worker. The Worker holds the Gemini key, sends only selected built-in sample documents, validates references, and uses an atomic D1 counter to permit at most **10 model requests per UTC day across the entire demo**. Failed provider attempts count too. There are no automatic model retries. The key is sent to Google's HTTPS API in a server-side header, never returned to the frontend.

This is a public, fictional-data demonstration, **not** production company authentication, tenant isolation, or authorization. Origin checks prevent ordinary cross-origin browser calls but are not authentication: non-browser callers can forge Origin and consume the shared allowance. The fixed public source library contains no private documents. Do not use this backend for real employee information. The separate enterprise architecture proposal still applies before production.

No Cloudflare deployment or successful real Gemini request has been performed yet. The tests use a fake provider; they are evidence for the connection code, not model availability, free-tier eligibility, output quality, or your key.

## Accounts and cost protection

- Keep your Google project **without paid billing enabled** and confirm the selected model is eligible for its free tier. Current quota/availability/data terms must be checked in AI Studio; not every listed model has free API usage.
- Use a **Cloudflare Free** Workers/D1 account. Check current account eligibility and plan limits; this repository does not purchase a paid plan. If a flow requires enabling paid billing or a paid model, pause.
- The 10-request ceiling is a request limit, not a dollar guarantee. Google free-tier limits may be lower. Avoid using the key in other apps; usage elsewhere is outside this counter. Restrict the key to the **Generative Language API** in Google's key settings where supported. A backend key should not use browser HTTP-referrer restrictions.
- Free-tier data may be processed under different terms than paid usage. Use fictional handoff details and questions only. Your public demo administrator should be able to disable the backend with `ENABLE_GEMINI=false` or revoke its key.

Official references: [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/). Current external pricing/eligibility has not been independently fetched and confirmed in this session; no guaranteed numeric free allowance is claimed.

## Publish the backend

You, as the account owner, run these commands on your own computer. Never send the key, Cloudflare token, or login credentials to chat.

1. Create/sign into your Cloudflare Free account. Download this GitHub repository (or `git pull` your existing clone). Install Node 24. In a terminal in the project directory, run:

   ```sh
   npm ci
   npx wrangler login
   npx wrangler d1 create handoff-ai-usage
   ```

   The login opens Cloudflare in your browser. The final command creates the small counter database and prints its database ID. The ID is not an API secret.

2. Edit `wrangler.jsonc`:
   - Replace `REPLACE_WITH_DATABASE_ID` with that database ID.
   - Replace `REPLACE_WITH_FREE_TIER_MODEL_ID` with the exact Gemini model ID currently available on your free tier in AI Studio. Choose a small text model supporting structured JSON output. Do not guess a display name or use a paid/preview model without checking its terms.
   - Keep `ALLOWED_ORIGIN` as `https://kendallw64.github.io` for the Pages site. An origin contains no `/Handoff-App/` path. For a custom domain, use its exact HTTPS origin instead.
   - Set `ENABLE_GEMINI` to `"false"` for a new installation’s initial deployment.

3. Initialize the remote database and deploy the disabled backend:

   ```sh
   npx wrangler d1 migrations apply handoff-ai-usage --remote
   npm run backend:deploy
   ```

4. Store the Gemini key privately:

   ```sh
   npx wrangler secret put GEMINI_API_KEY
   ```

   Paste the key **only into Wrangler's private secret prompt**. Do not put it in `wrangler.jsonc`, a command argument, a screenshot, a `VITE_` variable, or GitHub. Alternatively use the Cloudflare Worker dashboard's secret settings. An API key in GitHub Actions is not required for this manual deployment.

5. Set `ENABLE_GEMINI` to `"true"` in `wrangler.jsonc`, then run `npm run backend:deploy` again. Copy the HTTPS `workers.dev` URL printed by Wrangler. It is public configuration, not a credential. Keep the database ID/model settings consistent on later deployments; uploading the default template would disable the connection.

## Connect GitHub Pages

1. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables**.
2. Add a **repository variable** named `AI_API_URL`. Its value is your public Worker URL, for example `https://handoff-ai.YOUR-SUBDOMAIN.workers.dev` (no trailing slash or `/api`). This value is intentionally public; it contains no key.
3. Run the **Build, test, and deploy GitHub Pages** workflow on `main`. The workflow passes that URL as `VITE_AI_API_URL` at build time. Keep Pages Source set to GitHub Actions.
4. Open the deployed website in a private window. It must still show the public landing page. Enter BridgePoint intentionally, open a handoff's Knowledge tab, and enable **Use Gemini AI · fictional data only**. It is off by default on every page load.

## Verify an actual connection

- A health check can be made with:

  ```sh
  curl -H 'Origin: https://kendallw64.github.io' https://YOUR-WORKER.workers.dev/api/health
  ```

  `configured: true` only confirms local configuration is present. `connectionTested: false` deliberately prevents treating that as a successful Gemini call.

- Select a sample source and choose **Generate with Gemini**. Expect six sections, citations that open the selected sample sources, and a **Generated by Gemini (model ID)** label. Review before approving.
- In Ask Handoff, enable Gemini and ask about a selected document. Expect a model-labeled answer and valid sources, or an explicit insufficient-evidence response. No sample fallback should appear when the backend errors.
- In browser Network, confirm the POST goes to your Worker and returns `provider: "gemini"`, the configured model, and usable output. Requests/responses must not contain the key. A provider call returning validated output is the first actual connection evidence; record the time/model without screenshots of secrets or private content.
- Refresh and re-enter: generated manual content and provenance should persist locally. Changing selected sources must invalidate that manual and approval.

If you receive an error, do not repeatedly retry: failures consume the daily limit. Check the key's API restrictions, model ID and free-tier availability, database binding/migrations, exact frontend Origin, and `ENABLE_GEMINI`. The backend intentionally returns generic errors rather than echoing Google responses that could contain sensitive details. There is no document/prompt logging in this Worker. Usage counters store only a date and request count.

## Local development and automated checks

For a real local connection, create an ignored `.dev.vars` file locally containing the server key, model ID, `ENABLE_GEMINI=true`, and `ALLOWED_ORIGIN=http://localhost:5173`. Never commit that file. Apply local D1 migrations with `npx wrangler d1 migrations apply handoff-ai-usage --local`, run `npm run backend:dev`, and run Vite with public `VITE_AI_API_URL=http://localhost:8787`. The real key stays in Wrangler's ignored local secret file, not Vite's environment.

```sh
npm run check:backend
npm run test:backend       # provider is mocked; no paid calls
npm run test:gemini        # browser/API boundary is mocked; no paid calls
npm run test:pages         # compiled static app and existing workflow regression tests
```

Worker packaging is verified with `npx wrangler deploy --dry-run`. Local D1 migrations and the counter SQL were exercised against Wrangler's local D1 runtime. Deployment to Cloudflare needs account-owner login; it cannot be inferred from a successful dry-run.

## Files

- `server/worker.ts`: bounded requests, source selection, Gemini call, schema/reference validation, sanitized errors and atomic quota reservation.
- `server/migrations/0001_usage.sql`: persistent per-day usage table.
- `wrangler.jsonc`: non-secret deployment template, disabled by default.
- `src/ai.ts` and `src/AiControls.tsx`: frontend requests, disclosure, response validation, and mode switch.
- `.github/workflows/deploy-pages.yml`: public backend URL injection and mocked AI regression checks.

This addition changes the prototype's optional provider, not the production security roadmap. Microsoft Entra ID and customer-level ACLs remain unimplemented; real company documents are not supported.

## Configured public endpoint

The owner supplied `https://handoff-app.ansfwatson4.workers.dev`. It is now the frontend default (overridable with `AI_API_URL` in the Pages workflow). The Worker deployment name is aligned to `handoff-app` so future deployments target the same Worker. This URL is public configuration, not a credential. Direct verification from this cloud was blocked by the environment proxy before reaching Cloudflare. At that stage, the model placeholder and disabled setting remained pending owner configuration; see the owner configuration update below for the subsequent test settings. No successful real model request has been observed.

### Owner configuration update

The owner reports the Cloudflare key secret is saved and supplied the model ID `gemini-3.8-flash`. The repository now requests that exact ID with `ENABLE_GEMINI=true` so the next successful Worker deployment can be tested. The frontend still defaults to sample mode. The ID, account eligibility, deployed configuration, and provider response have not been independently verified: direct requests to the Worker and Google model documentation remain blocked by the cloud proxy. A successful actual model request is still required. If the model is unavailable, correct the API model ID from AI Studio; do not enable paid billing to troubleshoot it. No credential was added to the repository.

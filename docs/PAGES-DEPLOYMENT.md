# GitHub Pages white-screen diagnosis and verification

## What was established

The original checked-in `vite.config.ts` used Vite's default base `/`. A production build emitted `/assets/index-….js` and `/assets/index-….css`. At a GitHub project site under `/Handoff-App/`, these point to the account root, outside the deployed project. A strict local static host reproduced the failing JavaScript URL `http://127.0.0.1:4173/assets/index-….js`; the regression test failed before the fix.

There was also **no checked-in GitHub Actions deployment workflow**. `index.html` in the source checkout points to `/src/main.tsx`. A branch deployment of the source tree does not compile React/TypeScript or package dependencies. The correct deployable output is `dist`, not the checkout root.

The live site's existing HTML, console, Pages source setting, and Actions history could not be inspected: `kendallw64.github.io` and `api.github.com` were denied by the environment proxy (CONNECT 403 / Forbidden). Therefore the base-path defect is reproduced, and the missing build workflow is confirmed, but the exact existing live deployment mode and live failure are **not independently confirmed**. A local build is not evidence that the public deployment is repaired.

## Changes

- `vite.config.ts`: `base: './'` produces asset URLs relative to the built HTML. This supports both the repository subpath and a root custom-domain deployment for this app's in-memory navigation.
- `.github/workflows/deploy-pages.yml`: build and browser-test on a strict static host, upload only `dist`, deploy through GitHub Pages, then run the same deployment smoke check against the URL returned by GitHub. Build has read-only repository permission; deploy alone gets `pages: write` and `id-token: write`.
- `scripts/static-pages-server.mjs`: strict local production-file host mounted at `/Handoff-App/`, without a dev transformation or SPA fallback that could conceal missing assets.
- `playwright.pages.config.ts` and `tests/pages-smoke.spec.ts`: check compiled module URLs, HTTP failures, React mounting, intentional demo sign-in, refresh, request failures, and uncaught JavaScript errors.
- `playwright.live.config.ts`: runs the smoke check against the real site, not a local server. It retries to tolerate short publication propagation delays, but still fails if the deployed site does not load.
- `playwright.config.ts`: portable browser selection; existing workflow tests use relative navigation so they also run under the project subpath.
- `src/main.tsx`: reject empty stored record arrays so entering a handoff cannot crash on missing data. This is a separate robustness issue found during the requirements review, not evidence for the initial deployment failure.

React uses in-memory navigation, not BrowserRouter/history paths. There are no nested server routes requiring a GitHub Pages 404 rewrite. All icons/fonts are bundled; no missing remote assets are required for startup. `dist` is generated and intentionally ignored by Git; Actions creates and publishes it.

## Repository setting required once

In **KendallW64/Handoff-App → Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. Then open **Actions → Build, test, and deploy GitHub Pages** and run it on `main`, or let a push to `main` start it. If Pages is disabled, unavailable under the repository's visibility/plan, or Actions requires approval, resolve that repository setting first. A workflow file cannot establish those settings by itself.

The deployment uses the protected `github-pages` environment. Approve only if your repository's own rules require it. Check that the latest run has all three jobs green: **build**, **deploy**, and **verify-live**. A green build alone is insufficient. A failed `verify-live` job means the public site did not pass the loading check even if deployment completed.

## Confirm the public fix

Expected project URL: `https://kendallw64.github.io/Handoff-App/` (use the exact deployment URL if a custom domain is configured).

1. Open that URL in a private window. Expect the public Handoff landing page, not a BridgePoint dashboard.
2. Open browser Developer Tools → Network and Console; reload. The compiled JS, CSS, and fonts must return successfully, with no unhandled JavaScript error. The HTML must reference a compiled `assets/*.js`, not `/src/main.tsx`.
3. Explore the demo, enter BridgePoint, create a fictional handoff, select sources, generate and approve a manual, and ask a source-backed question. Refresh: the public landing page returns, and the handoff is still present after entering the demo again.
4. Run `PAGES_URL=https://kendallw64.github.io/Handoff-App/ npm run test:live` from a machine with site access and Chromium/Playwright installed. The workflow automatically runs this against its deployed URL.

For local reproduction use `npm run test:pages`. Unlike `npm test`, this builds and serves **only static output** at the actual project subpath.

## Current status

Reproduced the original base-path failure locally. The repaired static deployment and important workflows are tested locally; see `TESTING.md` for counts. Live verification remains unconfirmed until a successful public-site test and deployment status can be observed. Environment network additions for the public site and GitHub API were saved for review; saving a draft does not apply networking. No claim of a repaired live site is made without that evidence.

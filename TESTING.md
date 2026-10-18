# Validation report

Validated in this cloud machine on October 18, 2026 with Node 24, Vite, and installed system Chromium.

## Results

- Clean lockfile install: `npm ci --cache /tmp/handoff-npm-cache` passed.
- TypeScript and production build: `npm run build` passed.
- Playwright: **3 tests passed**, with no skipped tests.
- End-to-end lifecycle: intentional demo entry; required-field rejection; fictional handoff creation; empty selection disables generation; selected source opens and contains expected information; six manual sections render; approval completes the handoff; records survive refresh while access returns to the public landing; source changes invalidate the manual and approval; source-backed answers and unsupported-question responses; leave workspace returns to landing.
- Knowledge scope: the operations-only handoff cannot answer a client-update question using another handoff's client source. An operations question returns the selected operations source.
- Keyboard: dialog focus remains within controls, Shift+Tab and Tab wrap, Escape closes, and focus returns to its trigger.
- Responsive: mobile landing and dashboard have no document-level horizontal overflow at 390 × 844; the dashboard table scrolls within its own container. Desktop captured at 1440 × 1000.
- Visual review: inspected generated mobile landing and desktop dashboard screenshots.

## Problems found and corrected

- Playwright's default browser cache was not writable. A download into a writable path then met an egress denial. Used the already-installed `/usr/bin/chromium`; no verification was disabled.
- Dialog focus initially failed to return to the trigger because automatic input focus ran before focus capture. Removed competing automatic focus; the keyboard regression test now passes.
- Mobile navigation initially hid workspace exit. Added a labeled mobile header exit control.
- Bundled fonts locally to remove an external font request from the runtime.

## Evidence

Desktop screenshots generated from the tested application:

- [Public website](docs/screenshots/01-landing.png)
- [Demo sign-in](docs/screenshots/02-signin.png)
- [Dashboard](docs/screenshots/03-dashboard.png)
- [Knowledge collection](docs/screenshots/04-knowledge.png)
- [Training manual](docs/screenshots/05-manual.png)
- [Ask Handoff](docs/screenshots/06-ask.png)

Mobile screenshots are regenerated in ignored `test-results/` by `npm test`.

## Limits and remaining work

No public hosting deployment has been performed. No credentials were requested or used. The demo does not implement secure authentication, real AI, external integrations, or multi-user storage. Native Print / Save PDF is exposed but the operating-system print dialog was not automated. Cross-browser Safari/Firefox, screen-reader testing, browser storage quota exhaustion, and production security/load testing were not performed. Documentation links were supplied but their domains were blocked from direct retrieval in this environment. These limits do not change the tested simulated nature of the prototype.

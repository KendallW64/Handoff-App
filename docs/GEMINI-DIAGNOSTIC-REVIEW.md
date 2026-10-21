# Gemini and file diagnostic review

Reviewed October 21, 2026. Investigation only: Gemini behavior and importer behavior have not been changed pending user approval.

Confirmed with synthetic requests to the Worker (mock provider, no real model calls):
- Nine uploaded files in a summary request fail before any provider request. The importer/organizer supports 20 files, but summary/manual/answer permits eight uploaded files. Select all can exceed that limit; frontend preflight does not check the count.
- An immediate provider network exception returns the same 504 timeout message as an expired request. The current message does not establish that a timeout actually happened.
- Provider HTTP 400, 403, 404 and 503 responses produce the same generic 502 message. Model/input problems, permission problems, and temporary provider failures cannot be distinguished in the interface.

Code findings:
- Provider request deadline is 25 seconds; browser deadline is 35 seconds. Complex documents may exceed this, but no live timing evidence was available to establish the cause of the user's failed request.
- Failed provider attempts count against the existing global 10-attempt UTC daily ceiling. Retries are manual. A free Google quota rejection has a separate 429 response.
- Files are limited to 8 MB, PDFs/images to 3 MB individually and combined per AI request; text is limited to 120,000 extracted characters individually and combined. Imports reject non-UTF-8 plain text/CSV, password-protected PDFs, unsupported formats, and oversized Office expansions. Some normal business exports therefore cannot be imported even before Gemini is involved.
- Gemini model is configured as `gemini-3.8-flash`. Its availability for the owner's account was not independently verified; do not substitute a model without checking account support.

Suggested changes for approval: frontend preflight that explains operation-specific limits; safe, distinct timeout/network/quota/model/permission/provider errors without exposing provider bodies or credentials; a longer bounded request deadline with matching browser deadline and full response-body handling; explicitly detected UTF-16 text/CSV decoding, retaining errors for ambiguous encodings. Preserve existing quota, size limits, no automatic retries, and no billing changes. These changes improve diagnosis and supported inputs but cannot guarantee real model availability or eliminate free-tier quota limits.

The execution network returned a proxy CONNECT 403 for the live Worker health URL. That is a restriction on this diagnostic environment, not evidence that the deployed Worker itself rejected the user's request. No real documents or secrets were sent during this investigation.

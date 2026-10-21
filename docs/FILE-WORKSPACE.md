# Working with your own business files

The file workflow is implemented alongside the BridgePoint demo. The public website now offers **Use my own files**, which opens a separate browser-local workspace with no sample company documents selected or included. This is an individual file tool, not a production multi-company identity system.

## Use it

1. Open Handoff and choose **Use my own files**. You can also find that choice on the demo sign-in screen. It intentionally enters a local workspace; no Microsoft/Google password is requested.
2. In **Knowledge**, choose **Import files**. Multiple files can be chosen. Each file is read in a dedicated browser worker and saved only after successful extraction/validation. Failures are shown individually; one bad file does not silently discard successful imports.
3. Use **Read source** to review the extracted content. For PDFs/images, use **Download original file**: these are read by Gemini from their original bytes rather than a local OCR preview. Imported files can also be downloaded or removed from the file list.
4. Select the sources to use. Unselected files are not sent in the AI request. Enable **Use Gemini AI**, then confirm that you are authorized to send the selected files to Google. Selection changes reset that confirmation.
5. Choose **Generate document summary** for key points, responsibilities, decisions, dates, action items, and missing information. Citations open the exact source used. **Download summary** saves a text copy with source filenames.
6. Choose **Generate with Gemini** for the six-section Who/What/When/Where/Why/How training manual. Review its sources before approval.
7. Open **Ask Handoff**, choose the relevant handoff, confirm permission if needed, and ask about those selected files. Sources are the same selected file set. Without sufficient evidence, the backend returns an explicit abstention instead of guessing.
8. Refresh and re-enter **Use my own files** to return to your saved workspace. Original files/extracted content use IndexedDB; handoff metadata, summaries and manuals use localStorage. Removing a file or changing selection invalidates the derived summary/manual and approval so stale material is not presented as current.

The original BridgePoint demo remains available through **Explore the demo → Enter demo workspace**. It has its own handoff records. Files are scoped by handoff; personal workspace uploads do not appear in BridgePoint handoffs.

## Supported formats and honest limits

| Format                        | How it is processed                                                                                                              | Important limit                                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PDF                           | Original PDF is sent as a Gemini PDF attachment only when requested; supports the provider's document/image-reading capabilities | Up to 3 MB/file; encrypted PDFs are rejected; no local OCR promise. Actual recognition quality depends on the deployed model.                                            |
| PNG, JPEG/JPG, WebP           | Original image is sent to Gemini for visual reading                                                                              | Up to 3 MB/file; verify the original, particularly numbers, handwriting, and small text.                                                                                 |
| DOCX                          | Browser extracts document paragraphs and table text                                                                              | Headers, footers, tracked changes, embedded objects and images are not analyzed. Export to PDF when layout/graphics matter.                                              |
| XLSX                          | Browser extracts named worksheets, cell references, text, numbers, formulas and cached values                                    | Does not calculate formulas or interpret styles/charts. Dates may be Excel serial numbers. Export a rendered sheet/chart as PDF if interpretation depends on formatting. |
| PPTX                          | Browser extracts numbered slide text                                                                                             | Speaker notes, animations, embedded objects and slide graphics are not analyzed. Export to PDF for visual analysis.                                                      |
| CSV                           | UTF-8 text with original rows/fields                                                                                             | No formula execution or automatic data-type conversion.                                                                                                                  |
| TXT, Markdown, JSON, XML, LOG | UTF-8 text                                                                                                                       | Files are treated as document data, never executable instructions.                                                                                                       |
| HTML/HTM                      | Text with tags and script/style blocks removed; character entities decoded                                                       | Not a rendered webpage or an external-site crawler.                                                                                                                      |
| RTF                           | Basic plain text extraction with formatting removed                                                                              | Complex layout, objects and some advanced encodings need a PDF/DOCX export.                                                                                              |
| EML                           | Subject, sender, date and decoded body                                                                                           | Attachment names are listed but nested attachments are not analyzed. Import those files separately.                                                                      |

There is no universal "any file" reader. Legacy `.doc`, `.xls`, `.ppt`, Outlook `.msg`, OpenDocument formats, ZIP archives, audio/video, CAD, executables, password-protected and other unsupported files require conversion to an appropriate supported format first. Audio/video can be provided as a text transcript. Do not merely rename an extension: contents and signatures are checked where applicable.

- 20 imported files per handoff; browser storage capacity may impose a lower practical limit.
- 8 MB per file; PDFs/images must be 3 MB or smaller.
- Each extracted text file must fit 120,000 characters. Exceeding that rejects the file with a split/export message; text is not silently cut off.
- Each AI request can select at most 8 uploaded files (12 total sources including built-in sample sources), with 120,000 combined extracted characters and 3 MB combined native PDF/image bytes. Select fewer/smaller files or split the documents when needed. These are explicit context limits, not whole-library search.
- Office ZIP expansion is bounded (20 MB total declared uncompressed content and 3,000 entries); XML entity declarations are rejected. Parsing runs in disposable workers with a 30-second timeout.
- The existing shared server limit remains **10 attempted AI requests per UTC day**. Summaries, manuals, and questions each use one request. Provider errors also consume quota. Google free-tier limits can be lower. Paid billing is neither required nor enabled by this code.

## Where information goes

Importing alone reads and stores files in this browser. Processing is explicit: selected extracted text is sent over HTTPS to your Cloudflare Worker and then Google's Gemini API; PDFs/images send the selected original file bytes. Questions and handoff details are included too. The Worker stores only a date/request count in D1, not documents, prompts, answers or file URLs. It has no endpoint for retrieving another browser's files and no cross-request conversation memory or shared document index. It never logs document content or exposes the Gemini key to the frontend.

Google API data-handling terms apply to submitted content, including free-tier terms. This app does not make free-tier processing confidential. Only send information you are authorized to disclose to that provider. For confidential or regulated company data, use an organizationally approved provider agreement, authentication, access controls and data-retention design before deployment. The enterprise plan remains separate.

Browser-local data is not encrypted or isolated between people sharing a browser profile. Other devices/browsers do not see it; clearing site data removes it, and this app cannot restore it from the cloud. Original bytes and extracted document text stay in IndexedDB. Citations saved with derived outputs contain metadata references rather than duplicate copies of original file bytes or extracted text. The summaries/manuals themselves still contain derived information and are stored locally. All documents remain untrusted input: prompts instruct the model not to execute their instructions, and citations are validated against selected IDs. That limits reference fabrication but does not prove every model statement is true.

## Deployment

Pushes to `main` use the existing Pages workflow for the frontend and the owner's connected Cloudflare Git build for the Worker. Both must successfully deploy this revision: the older demo-only Worker will reject uploaded-document requests. No new secret or D1 migration is needed; the existing `GEMINI_API_KEY`, model ID and usage database are reused. The key stays in Cloudflare secret settings, never GitHub/frontend code. No paid resource is created by this change.

The owner previously confirmed Gemini manuals and questions on sample documents. New file extraction, transport, citations and workflow behavior have been tested using synthetic files and mocked provider responses. Actual new-format model processing, especially visual/PDF interpretation, still needs a successful live request after deployment. Do not label mocked tests as a real OCR or provider evaluation.

A sensible first live check uses a small non-confidential file containing a fictional deadline, then verifies the summary and source reference. Follow with one small PDF/image and check the original. Avoid repeated retries: the shared quota is intentionally small.

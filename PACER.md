# Pacer (`/pacer`): a pacing reader for PDFs and EPUBs

A free reader that paces your reading at a speed you choose. **Local by default: reading and text extraction always happen in your browser, and without an account nothing leaves the device.** The extracted text and your place are kept on the device only (IndexedDB for books, localStorage `pacer:v1` for place, speed, settings and session history).

## Why pacing and not just auto-scroll
Plain auto-scroll is the weakest speed-reading method, and "read at 1,000 wpm" claims are oversold: understanding falls as speed rises, especially for hard text. What helps is a **pacer** that stops rereading and drifting, then finding the fastest speed that still keeps comprehension. So Pacer has three modes and a recall loop:
- **Focus** (RSVP): one word, or 2-3, at a time with a fixed red pivot letter (`splitOrp`), plus the current sentence in faint context underneath.
- **Pacer**: the real page with a moving highlight (best evidence). Click any word to jump there.
- **Scroll**: the page glides under a fixed reading line (eased, honours reduced motion).
- **Training**: optional warm-up ramp (+10 wpm per 100 words up to a limit) and **recall check-ins** (every 250/500/1000 words it pauses; "Missed it" takes ~12% off the speed and rewinds, three clean checks put ~6% back). Session summary (real wpm, recall %) and a progress chart on the library page.
- Timing is real time (requestAnimationFrame), 60-1200 wpm; "smart pauses" make long words, numbers, commas and sentence ends linger slightly. Space, arrows (speed, sentence), 1/2/3 (mode), [ ] (chapter), Esc.

## Files
- `lib/pacer/engine.mjs` pure: `tokenize`, `splitOrp`, `delayMs`, `chunkEnd`, sentence navigation, `rampWpm`, `adaptWpm`, `sessionStats`. `text.mjs`: plain text to paragraphs, and `pagesToParas` (PDF lines to paragraphs: drops running headers/footers and page numbers, rejoins hyphens and page-spanning sentences, finds headings). `epub.mjs`: `parseEpub` (spine order, nav/NCX titles, DRM refusal). Tests: `arcade-server/tests/pacer.test.mjs` (run by `npm run arcade:test`).
- `lib/pacer/extract.ts` (pdf.js is imported only when a PDF is opened; chapters from the PDF outline or page blocks; chapters are split at about 4000 words so the page view stays light), `store.ts`, `sample.ts`.
- `components/pacer/`: `Pacer.tsx` (library), `Reader.tsx` (modes, clock, check-ins), `ReaderSettings.tsx`, `pacer.css` (four themes via CSS variables).
- Browser check: `node scripts/pacer-e2e.mjs` builds a REAL PDF (Chromium prints it with a running header and page numbers), an EPUB, a DRM EPUB and an image-only PDF, opens them through the file input, and checks extraction, the modes, real-time pacing, speed keys, check-ins, resume and fit at six sizes.

## Limits (honest)
- Scanned PDFs (pictures of pages) have no text; Pacer says so instead of guessing (no OCR). DRM-protected EPUBs are refused. PDF layout recovery is heuristic: columns, tables and footnotes can interleave, so a two-column paper will read worse than a novel.
- Recall check-ins are self-reported (no question generation); generated questions would need an AI call and are not built.
- Very high speeds in Focus mode flash words quickly; the help text warns about it.

## Account sync (optional)

Sign in with a Margins account (same login on every device) and Pacer saves each book you open to your account so you can pick it up on a phone or iPad.

- Only the **extracted text** (chapters + title) is stored, gzipped, in Postgres (`pacer_books`, `pacer_state`; `lib/pacerDb.ts`). The original PDF/EPUB is never uploaded. Needs `DATABASE_URL`; without it the API reports `sync:false` and Pacer stays local-only.
- Honest privacy note: stored text is readable by the site operator with database access. Only save files you have the right to read. Remove a book from the account with "Delete from my account too"; sign out can also clear the device.
- Quotas: 60 books, 200 MB total, 25 MB per book; 40 uploads/hour. Server re-validates and rebuilds uploaded JSON (`lib/pacer/validate.mjs`).
- Conflicts: reading position/speed newest-timestamp-wins (a stale tab cannot move you back); settings newest-wins; session history is merged. Writes require a same-origin request.
- Routes: `/api/pacer/{library,books/[id],progress,state}`. Client: `lib/pacer/cloud.ts`, merge in `Pacer.tsx` `refreshCloud`.
- Check: `node scripts/pacer-sync-e2e.mjs` against a server with a real database (use `next dev`; production builds force SSL for pg). Phone and iPad contexts, newest-wins, ownership, cross-origin refusal.
- Not done: offline service worker / installable PWA, scanned or DRM books.

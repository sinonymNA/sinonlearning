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

## Find your spot

The magnifier button (or `/` / `F`) opens a search box. Type a word or a few consecutive words (the last word can be partial); results show the surrounding sentence, chapter and percent through the book, with the first match after your current position marked. Tap one, or press Enter, to jump there. Engine: `findMatches` in `lib/pacer/engine.mjs` (tested).

## Read aloud and background music

Both live behind the ♪ button (Sound panel) and are stored per device in localStorage (`pacer:audio:v1`), never synced, never sent to the site.

- **Read aloud** uses the browser's built-in speech voices (`lib/pacer/voice.mjs`). `pickVoices` ranks them (Natural / Neural / Enhanced / Premium / Siri first, robotic novelty voices last) and the Sound panel lets you choose and hear one. The voice is the clock: one sentence (or clause, when long) per utterance, and the highlight follows the voice's word-boundary events. Where a voice sends none, a timer estimates progress inside each segment and the end of the segment re-syncs it, with a watchdog if the voice never reports the end. Your wpm becomes a voice rate (`rateFor`, about 170 wpm at 1.0x, capped near 500 wpm). Pause cancels speech and resume restarts from the current word. Recall check-ins, ramping, sentence skip, find and chapter jumps all work with the voice. Honest limit: it is only as natural as the voices on the device. There is no paid cloud TTS, on purpose (cost per child, and sending book text to a third party).
- **Music** takes YouTube video or playlist links (`lib/pacer/youtube.mjs`, only youtube.com / youtu.be / music.youtube.com / youtube-nocookie.com are accepted) and plays them in YouTube's official IFrame player via the privacy-enhanced host `youtube-nocookie.com` (`MusicDock.tsx`). The YouTube script is loaded only after you press play on music. YouTube's rules require the player to stay visible (at least 200 x 200), so it is a small dock you can move between corners; it cannot be hidden or run audio-only. Music can start and pause with reading, with its own volume. Some videos block embedding (the dock says so and skips). On iPhone/iPad the first play may need a tap in the player and iOS stops it when the screen locks.
- Checks: voice/link tests in `pacer.test.mjs`; `node scripts/pacer-sound-e2e.mjs` installs a FAKE speech engine and a FAKE YouTube API (headless Chromium has no voices and the sandbox cannot reach YouTube) and checks the integration at three sizes. Real voices and real YouTube playback have not been verified in this environment.

### HD voice (Kokoro, in the browser)

An opt-in alternative to the device voices, chosen in the Sound panel. It runs **Kokoro** (82M parameters, Apache-2.0, an audiobook-style voice; `kokoro-js` + transformers.js) on the device with WebAssembly, inside a Web Worker (`components/pacer/kokoro.worker.ts`) so reading stays smooth. Reading text never leaves the device. It replaced Piper, whose voices sounded flat in real use.

- **Size:** the quantized model is about 90 MB, downloaded once on tap (never automatically) and kept in the browser's Cache API (`transformers-cache`, so it also works on Safari). Voices are small files and can be switched without downloading again.
- **Where files come from:** only the model (and its small config/tokenizer files) come from huggingface.co. The onnx runtime WebAssembly and the voice files are served by this site from `/pacer-hd`, copied out of node_modules by `scripts/copy-hd-assets.mjs` (runs as `predev`/`prebuild`; output is gitignored; keep its voice list in step with `HD_VOICES`). The worker redirects Kokoro's voice-file requests to those copies. `.npmrc` sets `onnxruntime-node-install-cuda=skip` so installs do not try to download CUDA binaries for a Node-only dependency.
- **How it works:** `lib/pacer/neural.mjs` (same interface as `voice.mjs`): one sentence per clip, the next sentence made while the current plays, words placed across a clip by length (a clip has no word events) and re-synced at each clip end, speed via `playbackRate` (`hdRate`, about 165 wpm at 1.0x). One audio element is unlocked inside the Play tap (`prime`) so iOS lets it play later. "Hear it" also measures how much faster than real time the device makes speech and warns when it is too slow.
- **Fallbacks:** if the HD voice is not downloaded, still loading, or fails, Pacer uses the device voice.
- **Honest limits:** Kokoro on WebAssembly is heavier than Piper. A recent iPad or laptop should keep ahead of the voice; an older phone may not and will pause between sentences. Voice names and ratings (Heart and Bella are the ones Kokoro's authors rate best) come from memory of its documentation, not from listening.
- **Verified vs not:** unit tests (`neural.mjs`), `pacer-sound-e2e.mjs` with a FAKE synthesizer (dev-only `__pacerHdFake` hook, disabled in production builds) for the whole reading path, and a real-worker check that the Kokoro worker boots in a browser, requests the right Hugging Face files and fails cleanly (Hugging Face is blocked in the build environment, so the 404 is faked). The real model download, real synthesis speed, sound quality and iPad behaviour have NOT been verified.

## Rain

A synthesized rain sound (`lib/pacer/rain.mjs` pure noise maths, `components/pacer/Rain.ts` the Web Audio graph): two layers of filtered pink noise plus random little drops, three strengths (Light, Steady, Heavy), its own volume. Nothing to download, works offline. It plays while you read and fades when you pause (switch "Play only while I read" off to keep it running). It is started inside the Play tap so iOS allows it, and the audio context is suspended after a fade-out so it does not use the CPU. Checked by unit tests and `pacer-sound-e2e.mjs` (an AudioContext is created, runs while reading, suspends on pause); how it actually sounds has not been listened to by the author.

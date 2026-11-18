# Arcade test log

Everything below was actually executed in this repository (Linux container, Node 22, Chromium 1243 via Playwright, PostgreSQL 16 for the account tests). "Not executed" items are listed at the end.

## 1. Automated unit/integration tests - `npm run arcade:test` (node:test)
**89 tests, 89 pass (~0.9 s, fake clock; stable over repeated runs).**

| File | Tests | Covers |
|---|---|---|
| `core.test.mjs` | 14 | room creation/codes, join/capacity 40, nickname moderation, token privacy, reconnect/disconnect detection, late joiners, pause/resume/skip (server timers), teacher authorization (guest/student/other teacher/creator), malformed input, rate limiting, remove player, end session, grouping (35 → 5×7 / 7×5), 35-player start, min-player rules |
| `hotPotato.test.mjs` | 11 | dictionary/sequence quality, 35 players in groups, word validation + repeats, stale-turn duplicate protection, random transfer distribution (never self/prev), hidden fuse, explosion + ghosts, late word after expiry, disconnected holder, teacher vocab, full 35-bot game |
| `lastOneStanding.test.mjs` | 10 | ladder 35→20→10→5→2→1, round-1 advancement, early/duplicate/late answers, answer not leaked, tie-window fair draw, nobody-correct re-ask, final showdown/sudden death, consolation scoring, teacher questions, 35-bot game |
| `quickDraw.test.mjs` | 7 | secret word never in guesser/projector views, artist-only drawing, stroke validation/clamping/limits, incremental sync + clear, guess scoring/duplicates/close feedback, artist rotation, artist disconnect, 35-bot game |
| `telephone.test.mjs` | 6 | chain assignment (nobody gets own chain; each chain used once per stage), 45/20/45 timings + private task, draw→describe→draw flow, timeout fill-ins + full reveal payload, voting, 35-bot game |
| `imposter.test.mjs` | 14 | 7×5 groups for 35, exactly one imposter, role privacy (imposter/crew/projector/host), question rotation + 10/20/5 s timings, hidden answers + simultaneous reveal, "No answer."/disconnect, fallback questions, secret-word blocking/censoring, vote rules (15 s, no self-vote, hidden), correct guess wins, wrong accusation, tie → runoff → second tie, runoff resolution, reveal gating, 35-bot game |
| `economy.test.mjs` | 7 | 12 characters/odds sum, statistical odds, coin awards (signed-in only, idempotent, 150 cap, ≥3 players), pack opening (cost, once, duplicate/concurrent requests), guests, delete-my-data, unowned avatars |
| `content.test.mjs` | 7 | built-in content, CSV import, moderation, compatibility/fallback, teacher content API ownership, teacher set used by game, Game Show import |
| `moderation.test.mjs` | 6 | profanity/leet, PII, in-game text moderation, teams, content-set selection API, data-retention cleanup |
| `party.test.mjs` | 7 | **complete 35-bot Arcade Party (all 5 games)**, score normalisation/cap, teacher controls, restart, API-level 35-client join/poll privacy, developer-lab authorization + bots + disconnect/reconnect |

## 2. Network load test - `scripts/arcade-load-test.mjs`
35 independent HTTP clients (separate async clients with their own credentials, real sockets, separate process) against `next dev` on localhost, playing the **full 5-game Arcade Party in real time** while the browser e2e below ran concurrently:
- session completed: **YES**, 5/5 games, 643 s
- 21,653 requests, **0 network errors**, 155 HTTP 400 (the server correctly rejecting late/invalid/duplicate actions)
- latency: **p50 6 ms, p95 18 ms, p99 159 ms, max 1831 ms**
- Caveat: localhost, dev server, same machine as the clients. Not a WAN/Wi-Fi test.

## 3. Real-browser tests (Playwright / Chromium, dev server with `ARCADE_DEV_AUTH=1`)
- `scripts/arcade-e2e.mjs`: a real mobile-viewport browser (390×844, touch) plays a **full 5-game Arcade Party** through the actual UI (types Hot Potato words, answers Last One Standing, draws with the mouse, guesses, describes, writes Imposter questions/answers) with 24–34 bots, while the teacher dashboard (button click starts the session) and projector run in other contexts. Result: reached the final podium, history = all 5 games, **no page errors or console errors** (run twice; second run with 35 players at 0.1× time scale). Screenshots reviewed for lobby, Hot Potato, Last One Standing, Quick Draw, Telephone reveal, Imposter, results, final (phone and projector).
- `scripts/arcade-e2e-sync.mjs` (12 checks, all PASS): two independent browsers join by code; artist's mouse strokes appear on the guesser's canvas (≈10.8k px matched within 0.1 %); guesser's DOM never contains the secret word; wrong guess handled privately; **page reload resumes the same seat**; correct guess scores; both show connected.

## 4. Real accounts + PostgreSQL - `scripts/arcade-e2e-accounts.mjs` (28 checks, all PASS)
Run against **both `next dev` and the production build (`next build` + `next start`, NODE_ENV=production, SSL Postgres 16)** using the real Margins signup route: guest/student/other-teacher cannot host or control rooms; developer lab blocked for non-listed users; content sets persist and are owner-only; room uses teacher's set; signed-in student's coins earned server-side after a real game; guests blocked from packs; insufficient coins rejected; **two simultaneous identical pack requests return one character and charge 150 once**; retry never double-charges; collection persisted; owned avatar usable, unowned rejected; delete-my-data. Also confirmed: with `ARCADE_DEV_AUTH=1` set, the dev cookie is **ignored in production** (403).

## 5. Build / lint / types
- `npm run build`: **passes** (Next 16.2.9, Turbopack) with all arcade routes; `npx tsc --noEmit`: clean.
- ESLint on arcade code: only the same `@ts-nocheck`/`any` style errors the existing `app/api/suspect/route.ts` pattern produces (5 `ban-ts-comment`, 6 `no-explicit-any`) plus 2 exhaustive-deps warnings.
- Existing pages respond 200 on the production server: `/`, `/tools`, `/margins/login`, `/dash` (`/suspect` redirects to login as before).

## 6. Not executed / remaining verification
- Real devices: Chromebooks, iPad/Safari, Firefox, school Wi-Fi with ~35 physical devices; WAN latency.
- Load test against the Railway deployment (only localhost was available).
- Audio output (sound effects) and screen-reader behaviour were not machine-verified; no formal accessibility audit.
- Colour/animation polish was reviewed from screenshots only (no video).

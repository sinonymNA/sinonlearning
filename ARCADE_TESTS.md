# Arcade test log

Everything below was actually executed in this repository (Linux container, Node 22, Chromium 1243 via Playwright, PostgreSQL 16 for the account tests). "Not executed" items are listed at the end.

## 1. Automated unit/integration tests - `npm run arcade:test` (node:test)
**100 tests, 100 pass (~0.9 s, fake clock; stable over repeated runs).**

| File | Tests | Covers |
|---|---|---|
| `core.test.mjs` | 14 | room creation/codes, join/capacity 40, nickname moderation, token privacy, reconnect/disconnect detection, late joiners, pause/resume/skip (server timers), teacher authorization (guest/student/other teacher/creator), malformed input, rate limiting, remove player, end session, grouping (35 → 5×7 / 7×5), 35-player start, min-player rules |
| `hotPotato.test.mjs` | 14 | dictionary/sequence quality, 35 players in groups, word validation + repeats, stale-turn duplicate protection, random transfer distribution (never self/prev), hidden fuse, explosion + ghosts, late word after expiry, disconnected holder, teacher vocab, full 35-bot game |
| `lastOneStanding.test.mjs` | 10 | ladder 35→20→10→5→2→1, round-1 advancement, early/duplicate/late answers, answer not leaked, tie-window fair draw, nobody-correct re-ask, final showdown/sudden death, consolation scoring, teacher questions, 35-bot game |
| `quickDraw.test.mjs` | 8 | secret word never in guesser/projector views, artist-only drawing, stroke validation/clamping/limits, incremental sync + clear, guess scoring/duplicates/close feedback, artist rotation, artist disconnect, 35-bot game |
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

## 7. Polish pass (Phase 1 of ARCADE_POLISH_PLAN.md)
Added tests: Hot Potato live-typing moderation/privacy, boom-guess scoring, quick bonus + awards; Quick Draw word choice (options never leak to guessers, auto-pick). Re-ran the two-browser sync test (13/13 pass, now includes the word-choice phase) and a real-browser Hot Potato + Quick Draw party (no console errors). Awards and BOOM visuals confirmed from screenshots. The full 5-game browser e2e and the 35-client load test were NOT re-run after this pass.

## 8. Hot Potato pacing + characters/packs
Hot Potato slowed (fuse 14–24 s, 4.5 s boom pause, 7 rounds, ~3 min with 35 bots). Characters grew 12 → 40; economy test now asserts 40 unique drawable characters and odds still sum to 100 %. Pack-opening demo (`/arcade/shop/demo`) and the real shop share `PackOpener`; verified in Chromium (shake/reveal/confetti, 40-character sheet, no console errors). Unit tests: 93/93. The real (paid) opening path through `PackOpener` was not re-run against Postgres after this UI change.

## 9. Accounts + solo practice
- `accounts.test.mjs` (7): username/password validation, store keeps only username + hash (no email/name), session token hashed/expiring, delete-account wipes coins+collection, brute-force throttle, all 5 solo games run to the end with correct bot counts, solo coins by place x difficulty, guests earn nothing, 150/day cap holds, solo pause/quit authorization.
- `scripts/arcade-e2e-solo.mjs` (9 checks PASS, run against `next dev` with the in-memory store AND with local PostgreSQL 16): signup form has exactly two fields and no email; account created; solo Last One Standing started with a free-form nickname; coins awarded; shop shows them; log out/in restores coins; no console errors. Postgres rows inspected: `arcade_accounts` holds only username + hash prefix, one hashed session, one `solo ...` award.
- Not run: solo practice for the other four games in a real browser (covered by unit tests only); paid pack opening after the account change; production-build run of the account flow.

## 10. Desktop "fit the screen" layout
Desktop (>=900 px wide, >=520 px tall) now uses a full-height shell: slim top bar, one main stage and a score sidebar; games use two-column layouts and the drawing canvas sizes itself from the remaining height. Phones/tablets keep the scrolling layout. `scripts/arcade-fit-check.mjs` plays a real 5-game party in Chromium and records the worst vertical overflow (page and inner panels) per screen. Results: at 1366x768, 1280x720 and 1920x1080 every in-game screen reads 0 px (Hot Potato, Last One Standing, Quick Draw, Telephone, Imposter, results, final); the only non-zero readings (≤ 91 px) were the intro screen's slide-in animation, confirmed visually fit from screenshots. Projector at 1366x768: all games 0 px. Re-ran: two-browser sync test (PASS), phone-viewport Hot Potato + Imposter party (no errors), 100/100 unit tests. Not checked: the teacher host dashboard (still a normal scrolling control page), the solo menu/shop/account pages, ultra-short laptop windows (< 520 px tall fall back to scrolling).

## 11. Session 3 (revive, Piggy Bank, host bots, quick chat, drawing time)
Unit/integration: **111 tests, all pass** (new `piggyBank.test.mjs` covers scoring, chest rules incl. locked WILD, steal math/caps/shields, swap/jackpot/oops via forced rolls, auto-pick, privacy, teacher question sets, quick chat rules + cooldown + teacher switch, API rate limits, host bots lobby-only/cap 40; LOS second-chance test added; QD/Telephone timing tests updated). Browser: `scripts/arcade-e2e-chat.mjs` (6 PASS: pop-up appears on the other browser with the sender's name, palette closes, no free-text box, teacher off/on switch); `scripts/arcade-e2e.mjs` Piggy Bank + Last One Standing party with a real browser player (chests + answers, no console errors; screenshots reviewed incl. projector heist feed and bot chat pop-ups); desktop fit check: Piggy Bank 0 px overflow at 1366x768. Not run this session: the 35-client HTTP load test (it covers only the five original games and was not extended to Piggy Bank), the paid-pack path, the host dashboard bot controls in a real browser (covered by API tests only), Last One Standing revive in a real browser (unit-tested only).

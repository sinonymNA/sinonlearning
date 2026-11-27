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

## 12. Imposter pacing + preset questions
113 unit tests pass (new: slower timers asserted exactly; presets are private/safe, reshuffle limit, preset vs typed, asked questions are not offered again). Real browser (1366x768, lab room): the asker sees 6 presets + shuffle + "write your own", clicking a preset starts the answer phase, page overflow 0 px, no console errors. Not re-run: the full browser party or the load test after the new timers.

## 13. Corny chat expansion
Quick chat grew from ~65 to 222 unique phrases (84 corny jokes/puns, more cheers, 15 lines per game incl. Piggy Bank) plus a "🎲 Surprise me!" button; a test asserts uniqueness, length and the corny count. 113 unit tests pass; chat e2e (6 PASS) re-run; palette checked in a screenshot.

## 14. Paint bucket + image icons
114 unit tests pass (new: fill validation/clamp/only-artist/synced/cap). Real browsers: the two-browser sync test now also draws a closed circle, picks the fill tool and a colour, clicks inside, and asserts the interior is filled (47,209,165) and the outside stays white on BOTH the artist and guesser canvases (17 PASS). Image icons: verified once with a temporary SVG character (rendered in the avatar grid), then removed - no real image icons exist yet. Not verified: fill on Safari/Firefox (anti-aliasing could change the filled edge slightly), fill inside a Telephone reveal replay in a browser (shares the same renderer).

## 15. Four packs
116 unit tests pass (new: prices ascend, every pack's odds sum to 100 %, statistical guarantees - Super never common, Legend never common/uncommon, Starter never legendary, better packs score higher on average; each pack charges its own price; unknown pack rejected; Legend needs 600). Account/PostgreSQL integration script re-run against local PG16 (all checks pass, Classic = 100 coins, concurrent duplicate requests still charge once). Shop + demo pages checked in Chromium (pack picker, per-pack odds, coloured wrappers, Legend demo reveal; no console errors). Not re-run: paid opening of Super/Legend packs through a real signed-in browser session (covered by unit + API tests).

## 16. Snack Squad + Snack Pack
118 unit tests pass (new: 56 unique characters incl. 16 snack; Snack Pack only drops snack and all 16 are obtainable over 6000 rolls; the other four packs never drop snack characters; odds sum to 100 %; each of the five packs charges its own price; snack characters must be owned to be used as an avatar). Shop, demo (Snack tab, peek sheet, reveal) and collection checked in Chromium, no console errors; all 16 characters reviewed in a screenshot (the ice-cream cone's drip artwork was redrawn after it looked like a mustache). Not tested: opening a Snack Pack through a real signed-in session against PostgreSQL, and the collection page with owned snack characters.

## 17. Skip pack animation switch
A "⚡ Skip pack animation" switch (remembered in the browser) sits under every pack opener (shop and demo). Chromium check on the demo page: animated reveal ~3.0 s, with the switch on ~0.15 s with no flip animation, the setting survives a reload, and switching it off restores the shaking pack; no console errors. The paid shop path uses the same component but was not clicked through with a real signed-in account.

## 18. Teacher gift button
119 unit tests pass (new gift test: signed-in only, guests/bots skipped, host-only, 3 per session, daily cap across rooms, empty-room error, the student's own view carries the gift). `scripts/arcade-e2e-gift.mjs` (5 PASS, real browsers, in-memory store): teacher presses the button, sees "Gave 100 coins to 1 signed-in student (1 guest skipped)", the signed-in student gets the toast and the shop shows 100 coins, the guest gets nothing. Not run against PostgreSQL (the capped-award SQL path is shared with solo practice, which was verified there). Also raised the 35-bot Imposter/Telephone test time budgets (they were borderline after the slower timers).

- Added: gallery test, hot-hands stall test, group-balance test (sizes 2..40), sit-out test. Suite: 123 passing. Phone fit check: `node scripts/arcade-fit-check.mjs --size 390x844 --scale 0.25` (not all screens at 0 yet; see ARCADE_PROGRESS.md).

- Added: aiContent.test.mjs (AI plumbing with a fake generator), Quick Draw "everybody draws" for sizes 3..40, Hot Potato brain pass / starts-with / surprise toss (`HotPotato.forceKind` test hook), shop tests (deterministic daily shop, spotlight statistics, server-side deal price, daily claim once). Suite: 133 passing. `npm run build` passes.
- Not verified in a real browser: Brain Pass UI, spotlight/deal shop interactions while signed in, AI builder against the live model.

- Added mastery.test.mjs (9 tests). Suite: 142 passing.

- Added daily.test.mjs (determinism, solvability, no answer leaks, tries/reveal/streaks, API guest + signed-in, coins once/day). Suite: 149 passing. Browser-checked (dev auth): boot intro, home at 1366x768 (page does not scroll), phone 390x844, wrong-answer flash.

- Added abyss.test.mjs (prompt-bank validation incl. startsWith/endsWith rules, matching, daily determinism, scoring/timing, unlimited, signed-in API, archive/guest, pearls/fish/streak fish/account deletion). Suite: 158 passing.
- Abyss v2: +2 tests (retry-until-match, API retries). Suite: 160 passing.
- Abyss v3: LEAD_MS lead-in, tests adjusted for the 2.5 s lead. Suite: 160 passing.
- Content tests: built-in bank sizes/validity, Abyss bank size. Suite: 162 passing.
- Puffer Party: 8 tests (registration, scoring by rarity, dup/unlisted keep the turn, no answer-key leak, pop/lives/new category, disconnect, 35 players, bot picks). Suite: 170 passing.
- Puffer Party host-crash regression: compatibility() must have an entry for every game (test added). Suite: 171 passing. Full flow (teacher host + 3 students + projector, through a pop) browser-checked.

## 19. Retro Gridiron
- `arcade-server/tests/gridiron.test.mjs` (included in `npm run arcade:test`, 216 passing overall): playbook shape, routes move, defence states, man shadowing, throw targeting/lead, ball flight arc, outcome variety, rating effects (accuracy, catching, speed, pressure), sack, carry auto-run/steer/no-teleport, TD, OOB, tackle/broken/missed/gang, blockers, rules (first down, downs, INT, incomplete clock, sack/safety, TD, FG, punt, quarters, halftime, final, two-minute), CPU drive determinism, bot-played full Quick and Two-Minute games.
- Browser: `node scripts/gridiron-e2e.mjs --url http://localhost:3100 --shots <dir>` (menu -> plays -> snap -> throw -> carry -> cpu drive; pause; phone landscape/portrait + tablet overflow checks). Run against `next dev -p 3100`. Debug hook: `/arcade/gridiron?debug=1` exposes `window.__gr` for tests.

## 20. Abyss themed dives
- `arcade-server/tests/abyssThemes.test.mjs`: theme banks (all tiers filled, no cross-entry duplicate answers), run shape (7 distinct prompts from one theme, reproducible per id), scoring/finish with no lives, sanitizeRun, signed-in API flow (save, resume, pearls once, per-theme best, fresh run after finish), guest flow, no answer-key leak.
- Browser: `node scripts/abyss-theme-e2e.mjs --url http://localhost:3100 --shots <dir>` plays a full Music themed dive and a daily dive on a 390x844 phone viewport and opens the Themed Dives sheet.

## 21. Abyss rarity + performance
- Unit: `abyssThemes.test.mjs` fame-aware rarity tests; `abyss.test.mjs`/`pufferParty.test.mjs` use each prompt's deepest available tier.
- Perf: `node scripts/abyss-draw-calls.mjs` (production build) prints canvas draw calls per frame for home, ocean and the five themed scenes.

## 22. Dacula Dash
- Unit: `daculaGraph` (connectivity from junction ids only, all checkpoints reachable both ways, movement bounds, early stop, construction safety), `daculaQuestions` (bank integrity, answer-not-in-question, CSV/JSON import, duplicates, sanitising), `daculaDash` (state machine, dice bounds, wedge rules, final, timeout ranking + ties, server authority, no answer leaks, idle/disconnect, boards of <=6, simulations), `daculaImporter` (projection, junction splitting, bridges, query).
- Simulation: `node scripts/dacula-sim.mjs --games 30`. Browser: `node scripts/dacula-e2e.mjs --url http://localhost:3100 --size 1366x768 | 390x844`.

## 20. Gridiron student plays, hotkeys, Coach Career
- `arcade-server/tests/career.test.mjs` (round robin, full season, carry-over, free agents, training, strength matters, engine honours roster/opponent) plus the updated playbook test; 295 passing overall.
- Browser: `node scripts/gridiron-career-e2e.mjs --url http://localhost:3100 --shots <dir>` (R/Shift/W hotkeys, new career, train, sign, sim week, reload persistence, one live game to the final, week advances).

## 21. Pack Rush
- v2.1 additions covered: combo, golden packs, fusion, orders; browser test also checks lab, fusing, combo meter, damage numbers, orders.
- `arcade-server/tests/packs.test.mjs` (cards/finishes, odds vs simulation, buy/slots/stock, tap damage and crits, album discovery vs storage vs overflow, selling, unlocks/upgrades/staff, restock and staff jobs, free sample, offline, expected value, determinism, human-speed economy bands).
- Browser: `node scripts/packs-e2e.mjs --url http://localhost:3100 --shots <dir>` at six viewports (buy, tap damages pack, burst reveals a card on screen, save persists, every tab without overflow, album close-up, odds lab) using a seeded save to show every finish.

## 22. Hub shelves
- `arcade-server/tests/hub.test.mjs`: catalog valid (unique ids/links, known moods, taglines <= 5 words), every link has a real page, shelf cap and See all, path-to-game mapping, recent list ordering/cap.
- Browser: `node scripts/hub-e2e.mjs --url http://localhost:3100 --shots <dir>` at six viewports (3 to 4 mood shelves, never more than 3 cards per shelf, no Continue for new visitors, Continue newest first after playing, no looping animations in the hub, no horizontal overflow, intro remembered per device).

## 23. Meowdoku (was Cat Grid)
- `arcade-server/tests/catgrid.test.mjs`: puzzles valid (connected colours, legal cat layout, exactly one solution, logic-solvable, deterministic), shipped level table valid and unique, transforms keep uniqueness, rules (rows, columns, colours, corner touching), tap cycle/fish/win/lose/undo, hints are always right and solve sampled levels, smartHint catches a wrong X, Cat Helper, scoring/profile caps.
- Browser: `node scripts/meowdoku-e2e.mjs --url http://localhost:3100 --shots <dir>` at six viewports (tap = X then cat, touching cat costs a fish, hint explains itself, solve level 1 through the UI, next level, save/reload, 9x9 board fits without scrolling, keyboard).
- Added after real-device feedback: difficulty ramp tests (levels 1-4 tier 0 with one step per cat, tiers within allowance, a one-square colour on level 1), deterministic gesture tests (toggleX/toggleCat/retract, double-tap from empty/X/cat), and e2e checks for real double-taps, the TAP switch, the free coach, the how-to card, and the 4x4 -> 5x5 progression.
- Map + swipe update: area/level tests (10 named worlds cover 1-100, finales), stars and first-clear-only rewards, strokes undone together, ramp over 100 levels; e2e checks the map (10 worlds, 100 nodes, only level 1 open, opens on your level, no sideways scroll, 44px+ targets), a real swipe drawing/erasing X's, one Undo for a swipe, the X bars turning around their centre, stars on the map, unlocking, saved progress, and a 9x9 board at level 66.
- Meowdoku upgrade: engine tests for the three generator styles (unique, in tier, deterministic), Daily (same for everyone, all 7 weekdays unique, streak and one payout a day), Endless (size, fish by difficulty, 5 paid wins a day), shop, old-save migration, combo, Sweep (never crosses a true cat spot, one Undo), Sardine caps, campaign yarn/finale chest/speed badge. Browser e2e at 6 sizes also checks the home screen (fits, no scroll, pixel font), Daily start/finish/streak, Endless setup (5x5 Hard = 2 fish) and AGAIN, Sweep/Sardine/shop flow, combo chip, ripple, win banner and reward chips.
- Meowdoku map polish: e2e checks 150+ props, 14+ cats and a road in all 10 worlds, and that tapping a map cat makes it talk (all six viewports).
- Shelf Stocker: engine tests (bay rules and refusal messages, win rule, hidden items, carts, 120 solvable levels across three departments, hints, stars) in shelf.test.mjs and a browser e2e (shelf-e2e.mjs) at six sizes that plays real levels in every department and measures frame time.
- Shelf Stocker upgrade: tests that a wrapped item never moves with a run and that a finished shelf unwraps and undo re-wraps; browser e2e now covers the home screen (fit, tappable display, CONTINUE), the animated scene, and that lifting never takes a wrapped item (every shelf of level 30).
- Shelf Stocker Phase 1 + Toy Aisle + Pantry: engine tests for size order (nesting runs, sorted finish), fragile jars (moves, cracking, undo), five-department specs, every level 1-150 solvable and fully dealt, the level table (picks reproduce boards near the curve), stricter stars/perfect/boss bonus; browser e2e covers the guided first move, Toy Aisle refusal + solve, Pantry cracking + solve, 5 department cards, at six sizes.
- Shelf Stocker finale: engine tests for pairs, padlocks (open on finish, close on undo), orders (bag rules, ticket), Mixed Day, Daily Delivery (same board per day, streaks, one payout), coins, decor shop, dead-end check, and the cracked-jar regression; browser e2e covers 9 department cards, Shoe Wall/Gift Corner/Orders/Mixed Day (rules, refusals, real solves), drag-to-move (green/red drop, spring back), ghost hint, settings switches, seasons, decorating (buy, equip, shows on Home and in play), and a full Daily Delivery at six sizes.
- Back Issues: 12 engine tests (word bank, unlock ramp, crossword/sudoku uniqueness/word search/cipher generators, every paper 1-150 builds and is winnable through the actions, clock/relaxed, stars/profile); browser e2e (backissues-e2e.mjs, 188 checks at six sizes) plays papers 1, 4, 7, 11 through real input, the timeout card, Try Again, relaxed mode, and the clock pausing behind cards.
- Back Issues v2: e2e now also checks every crate tile and arrow is on screen at six sizes and waits out the unfold animation before measuring (200 checks).
- Back Issues v3: variety test (60 papers use 380+ distinct words, no repeats inside a paper, no unscramble clues before paper 6); e2e now plays through the front page, checks front-page fit (boxes whole and tappable, masthead unclipped) at six sizes including a six-puzzle paper (296+ checks).
- Meowdoku closet: meowdokuCloset.test.mjs (8 tests: catalog completeness, breed looks, palette names unique, old-save migration, buy/equip rules, milestone unlocks, unlock reports from level/daily/endless, economy sanity); meowdoku.test.mjs updated for 200 levels, 10x10, 20 worlds (391 arcade tests pass). meowdoku-e2e.mjs now also covers the closet (fit, preview, buy, equip, the board wearing colours/frame/mark/cat) and a 10x10 board at six sizes.
- Shelf closet: shelfCloset.test.mjs (7 tests: catalog completeness, every room has a full look, old-save migration, buy/wear rules, unlocks by department/stars/solved/perfect/daily, unlock reports from levels and the Daily, economy sanity); shelf-e2e.mjs now covers the shop (fit, 11 tabs, preview does not equip, earned item shows its goal, buying, the room and pet in play) at six sizes.
- Pacer: pacer.test.mjs (10 tests: tokenizing, pivot letter, timing, sentence navigation, ramp/adapt, plain text, PDF layout cleanup, EPUB spine/DRM); pacer-e2e.mjs (139 checks, real PDF/EPUB/DRM/scanned files, six sizes, real-time pacing, check-ins, resume).
- Pacer sync: pacer.test.mjs now 13 tests (validation, sanitizers, merge rules); scripts/pacer-sync-e2e.mjs (22 checks, real Postgres + signup); pacer-e2e.mjs 139 checks still green.
- Pacer find: findMatches test in pacer.test.mjs (412 total); pacer-e2e.mjs 149 checks incl. find at six sizes.
- Pacer sound: voice/youtube tests in pacer.test.mjs (416 total); scripts/pacer-sound-e2e.mjs (66 checks, fake speech + fake YouTube API, 3 sizes); pacer-e2e.mjs 147 checks green.
- Pacer HD voice: neural.mjs tests (418 total); pacer-sound-e2e.mjs 88 checks incl. fake-Piper HD path at two sizes.
- Pacer rain + HD fixes: rain noise test (419 total); pacer-sound-e2e.mjs 103 checks (rain on/off/follow, self-hosted runtime files served, cache writer round trip).
- After reverting to Piper: pacer-sound-e2e.mjs and unit tests rerun (see below).

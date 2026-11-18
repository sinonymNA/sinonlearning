# Classroom Arcade progress

## Current phase
Feature-complete against the written spec; in final verification/polish. All five games, party mode, teacher dashboard + projector, coins/characters/packs, content manager, developer lab, load test and e2e tooling are implemented and verified (details in ARCADE_TESTS.md).

## Completed features
See ARCADE_PLAN.md (all boxes ticked except the partially-verified visual/sound item).

## Architecture (where things live)
- `arcade-server/` engine (plain ESM): `room.mjs`, `games/*.mjs`, `api.mjs`, `bots.mjs`, `content.mjs`, `characters.mjs`, `store.mjs`, `drawing.mjs`, `dictionary.mjs`, `moderation.mjs`, `data/words.mjs`, `tests/*.test.mjs`.
- `lib/arcadeRuntime.ts`, `arcadeAuth.ts`, `arcadeDb.ts`, `arcadeHttp.ts`, `arcadeCatalog.ts`; routes `app/api/arcade/{,economy,content,dev}`; pages `app/arcade/**`; UI `components/arcade/**`.
- Scripts: `scripts/arcade-load-test.mjs`, `arcade-e2e.mjs`, `arcade-e2e-sync.mjs`, `arcade-e2e-accounts.mjs`.

## Known bugs / limitations
- Polling (not WebSocket): remote clients see other players' changes up to ~1 s late; fairness handled with a 250 ms tie window and question pre-load, not by trusting arrival times.
- Rooms are in one Node process's memory: a server restart ends live sessions (accounts/coins/content persist in PostgreSQL). Several app instances would need sticky routing or a shared store.
- Moderation is a small blocklist: it over-blocks words containing strong substrings (e.g. place names containing "cunt") and cannot catch everything. Teachers should supervise.
- Imposter: the imposter's text is censored (not rejected) if it happens to contain the secret word, so the game can't be used to probe for the word.
- Hot Potato pass animation is a highlight/feed rather than a flying-potato tween.
- Telephone is ~3.9 min (spec target 4–5), Quick Draw ~3.5 min with 35 players.
- Unit/e2e/load tests ran on one machine against `next dev` (and the production build for the API/account checks). Not yet run on real classroom Wi-Fi, Chromebooks, Safari or Firefox.

## Remaining tasks (optional polish)
- Real-device pass (Chromebook + iPad Safari) on school Wi-Fi with ~35 devices.
- Optional: SSE/WebSocket transport (custom server) if sub-second push is wanted; Redis-backed rooms for multi-instance deploys.
- Optional: flying-potato transfer animation; more built-in content; school-specific moderation lists.

## Next exact action
Run `npm run arcade:load -- --url https://<deployed-host>` and a Chromebook/iPad session against the Railway deployment (set `DATABASE_URL`).

## External blockers
None for development. Needs from the owner: production `DATABASE_URL` (already required by Margins), and a policy/legal review before classroom use with minors.

## Gallery / hot hands / groups / phone fit pass
- Quick Draw: every drawing saved per turn and shown in an end-of-game gallery with the target word (cursor `gal`; tests added).
- Imposter: secret/role can be hidden on screen (tap-to-peek chip + role-phase hide toggle).
- Hot Potato: 8 s hold limit ("hot hands": -5 pts, fuse -2 s), animated potato flight between avatars.
- Groups: partition verified balanced (spread <= 1); players absent >20 s at launch are sat out. Original "10 vs 3" report not reproduced.
- Phone layout (`@media (max-width: 899px)`): at 390x844 most screens fit. Known remaining overflow: Telephone reveal (~70 px), results (~58 px), Imposter (31-109 px depending on phase), Hot Potato ~20 px. Not checked at 360x740 or landscape; no real-device test.

## Round: AI set builder, daily shop, Crew set, Hot Potato variety, everyone draws
- Teacher AI set builder: `ai_generate` in `handleContent` (teacher-only, 12/hour, 60k chars, output run through `sanitizeLoose`); `lib/arcadeAi.ts` uses `callKoraStructured` (needs ANTHROPIC_API_KEY; otherwise "not switched on"). Questions now carry optional `explain` + `concept` (for Mastery Peak). UI: "Build a set with AI" panel in the content manager. NOT run against the real model in this environment (no key): only the plumbing/validation is tested with a fake generator.
- Content libraries: 251 draw prompts, 127 telephone prompts, 70 imposter words, 138 questions (`arcade-server/data/extraContent.mjs`).
- Quick Draw: root cause of "some people don't draw" was `turns = min(members, 4)` with groups up to 7. Now groups max 5 and turns = group size.
- Hot Potato: every pass gets a random challenge (letters / starts-with / class quiz "Brain Pass"), mid-round surprise toss, longer fuse (18-30 s) and hold limit (12 s), wrong quiz answer = -2 pts and -1.5 s fuse. Quiz answer index never leaves the server.
- Shop: `arcade-server/shop.mjs` daily shop (pure function of UTC date): deal of the day (20-40% off, never Starter), spotlight character (3x inside its tier, odds table reflects it), daily check-in +15 coins. Server charges the deal price (client cannot choose a price). New "Classroom Crew" set (16 procedural characters) + Crew Pack (130).
- Mastery Peak: brainstorm + plan in `ARCADE_MASTERY_PEAK.md` (not built).

## Mastery Peak v1
See ARCADE_MASTERY_PEAK.md ("Status"). Tests: `arcade-server/tests/mastery.test.mjs` (engine, API, rewards, double-submit, report, AI variants with a fake generator). Browser-checked (dev auth): start, answer, slip + explanation, map. Not browser-checked: summit screen, teacher report, variants button, phone layout.

## AI builder: coverage + forgiving save (user feedback)
- Saving used strict validation: one bad row (e.g. duplicate choices, over-long text, flagged word) rejected the whole set. `save` now uses `sanitizeLoose` (drops bad rows, reports counts + reasons). Content route body limit raised to 400 KB (a big AI set can exceed the old 90 KB).
- The AI builder asked for ~30 items per type in ONE call. Now: per-type parallel calls (25 questions per batch), `RECOMMENDED` targets per game (60 questions, 60 draw prompts, 40 vocab, 40 telephone, 30 secret words), "fill to recommended" / "big (2x)" modes that ask only for the shortfall and pass existing items so the AI avoids repeats. Content manager shows per-game coverage bars.
- I could not see the user's actual save error, so the cause is inferred, not confirmed.

## App shell, boot intro, Daily Puzzle home
- `components/arcade/AppShell.tsx`: every /arcade page except /arcade/room/* now lives in a screen-locked shell (fixed 100dvh): top bar (logo, streak, coins, account) + bottom menu bar (Home/Play/Solo/Peak/Shop/Me, +Host for teachers); only the middle area scrolls. Boot intro (potato drop, letter pop-in, loading bar, tap-to-skip) plays once per browser session on /arcade, skipped for prefers-reduced-motion. Entrance animations on bars, tiles, cards.
- Front page: generic hero copy removed. It is now the Daily Puzzle (`arcade-server/daily.mjs`, `handleDaily`, `/api/arcade/daily`): 5 puzzles/day (unscramble, number sequence, odd one out, missing vowels, trivia), same for everyone per UTC date, 2 tries each, answers stay on the server until solved/failed. Signed-in: progress + streak stored server-side, coins once a day (5 + 3 per solve, capped 20/day). Guests: stateless checks, progress in localStorage, no coins.
- Not verified: real-device Safari, the finish/summary screen in a browser (unit-tested only), rooms (/arcade/room/*) are unchanged and not inside the shell.

## Abyss mode + Party/Abyss mode switch
See ARCADE_ABYSS.md. App shell has a Party | Abyss switch; Abyss has its own ocean theme and tab bar (Dive, Unlimited, Fish, Log). Browser-checked (dev auth): Abyss home, question, miss reveal, fish pack page, fish art grid, phone layout. Not browser-checked: finishing a dive (unit-tested), opening a fish pack, archive, Safari/real devices.

## Abyss v2 (user feedback)
- Rule fix: unlisted answers no longer consume the prompt (retry until a match, the clock expires, or 12 guesses). Client sends `expired: true` at 0 s; the server only honours it near the real limit.
- Visual rebuild: centred fish + timer ring in an animated depth-reactive underwater scene, title-screen home with dock + sheets. Browser-checked (dev auth): home, wrong guesses, reveal, a full 7-prompt dive to the done screen (pearls + streak awarded), phone sizes 390x844 and 360x640 fit without scrolling. Not checked: Safari/real devices, Unlimited death/cash-out in browser.

## Abyss v3 (pixel art, from reference screenshots)
Pixel canvas ocean + pixel HUD/menus, lead-in countdown, DOM labels for crisp text. Browser-checked (dev auth): home, lead-in, question, wrong guess, sink + tier banner, full 7-prompt dive to results at 390x780, 360x640, desktop. Not checked: real iOS Safari (canvas text/pixelation, safe areas), performance on low-end phones.

## Content round 3 (user: "way more questions and word banks")
- Abyss: 23 -> 58 prompts (~5,500 answers, 17 categories): + US states, Europe/Asia/Africa, rivers, islands, deserts, presidents, bones, gems, constellations, trees, flowers, insects, safari animals, reptiles, weather, vegetables, spices, pizza toppings, desserts, candy, breakfast, drinks, NBA/NFL teams, Pixar, superheroes, video games, cartoons, bands, colours, jobs, animals/countries starting with S. `npm run abyss:audit`. `npm run abyss:draft` (untested, needs a key) drafts more for review.
- Party banks (`data/extraContent2.mjs`): draw prompts 251 -> 612, telephone 127 -> 229, imposter words 70 -> 115, quiz questions 138 -> 277. The 139 new questions carry concept labels (Fractions, Geometry, Living things, US history ...), so Mastery Peak's built-in set now has real subject camps; the 138 older ones are still grouped as generic camps. Hot Potato Brain Pass and Last One Standing draw from the bigger pool.
- Not done: Hot Potato vocab list (still dictionary + teacher vocab), per-grade tagging of questions, more imposter "related word" depth.
- Known risk: answer correctness of deep-tier Abyss entries is unverified by a second person.

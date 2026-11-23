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

## Hub redesign (v4): three doors + pixel look
- /arcade is now a lobby: welcome card with coins/pearls/streak, a featured Daily Puzzle card, and three animated portals: Solo Games, Multiplayer, Shop; a ticker of the six party games; teacher tools row (teachers only). Bottom bar is five tabs: Home, Solo, Multiplayer, Shop, Me (the old Party|Abyss switch and Play/Peak tabs are gone).
- /arcade/solo = hub (Abyss, Practice vs bots, Mastery Peak, Daily Puzzle) with live status badges; the old practice menu moved to /arcade/solo/practice. /arcade/multiplayer = join with a code, host (teachers), the six games, 3 steps. /arcade/shop = one shop with tabs (Characters/coins, Abyss fish/pearls, `?tab=fish`). /arcade/daily = the daily puzzle on its own page.
- Fonts: hub/shell pages now use the Abyss pixel fonts (VT323 body, Press Start 2P headings). Swap by editing `--f-body` / `--f-head` on `.app-shell:not(.immersive)` in `arcade.css` (Fredoka is still what the live game rooms use, deliberately: long text in the pixel fonts is harder for kids to read). Components: `components/arcade/hub/*`.
- Browser-checked (dev auth) at 1366x768 and 390x844: home, solo, multiplayer, shop (both tabs), daily, practice. Not checked: real devices; the old content/account/test-lab/characters pages inherit the new fonts but were only spot-checked.

## Round: Abyss any-screen + 242 prompts + Puffer Party
See ARCADE_ABYSS.md "v4". Browser-checked (dev auth): Abyss at 820x1180 (iPad), 1366x768, 390x844; Puffer Party solo practice at phone + desktop (own turn, wrong guess, bots passing, said-answer bubbles, no horizontal overflow). Not browser-checked: Puffer Party projector view and the pop animation in motion; multi-human tables; real devices. Auto-tiered Abyss prompts have not been reviewed by a person.

## Round: Retro Gridiron
Built a complete 2D pixel football game (see ARCADE_GRIDIRON.md). Engine first (`arcade-server/gridiron/*`, 45 node:test cases covering routes, defence states, throws/catches/INT/drop/deflection/sack, carry steering/tackles/TD/OOB, downs/first downs/turnovers/clock/quarters/FG/punt/safety/two-minute/CPU drives, and bot-played full games), then the canvas client, controls, menus, and arcade integration. Balance pass with a bot: tackle radius/probability and pursuit speed raised after YAC was too high (median now ~6 yd, breakaways <2%); INT/drop rates reduced. `scripts/gridiron-e2e.mjs` smoke-tests the browser flow.

## Round: Gridiron feel pass
User feedback: "not really playable or fun, drops the ball too much". Changes: skill-based catches (open = caught; dice only when a defender is on the throw), tighter 46x30-yard camera with 2x sprites and edge markers, auto play-calling with a one-tap audible (replaces the 8-card grid), juice (hit-stop, shake, particles, ball trail/bounce, TD celebration), faster pocket + x1.2 game speed, skippable CPU drive log. Engine tests 220 passing; browser smoke re-run on desktop/tablet/phone. Not human-playtested for feel.

## Round: Gridiron run game + juke/boost
User: still "doesn't feel like a good football game", asked for a Retro-Bowl-style remake. Not copying any commercial files/art (not available, and copyrighted); instead added the missing arcade mechanics as original work: handoff run plays with a RB, free-feel carrying (steer, boost with stamina, brake) and a juke with a tackle-whiff window. Runs average ~2.9 yd unsteered. 226 engine tests; browser run verified a handoff, jukes and boost with no console errors. Still needs human playtesting.

## Round: Gridiron drag/swipe controls + any-size layout
User feedback: much better; wanted Retro-Bowl-style drag/swipe strafing, a visible running back, and portrait/any resolution. Added tap-to-throw on the field, drag steering (up boost / down brake), flick-to-juke, a PASS/RUN toggle with an RB label, and a canvas whose logical height follows the container. Browser-verified: 11/11 tap throws, drag steering, boost via drag, flick juke, nine viewport sizes without overflow. 228 engine tests.

## Round: Gridiron drag-and-place passing
User: wanted to drag and place the ball instead of pressing receiver buttons. `PlaySim.throwAt(x,y)` (aim assist, free throws, nearest-receiver catch), reticle + arc UI, tap still throws to a receiver. Browser-verified (assist 4/5, free throws 5/5, no errors). 232 engine tests.

## Round: Gridiron drag-and-place + Abyss themed dives
User: drag-and-place passing in Gridiron; make Abyss better with animations, more questions and specialty themed modes with themed backgrounds (like movie / sports trivia in a competitor). Built original equivalents: `throwAt` drag-and-place passing with aim assist, and Abyss themed dives (5 themes, 58 prompts, themed animated scenes, ocean creatures + reaction effects). 240 engine tests (new `abyssThemes.test.mjs`); browser e2e for a full themed dive.

## Round: Abyss rarity + performance fixes
User: themed button lags badly; "not niche" answers (Hulk) rated as the most niche. Rarity is now fame-aware (cross-bank caps, sequel/extension rule, alias-merge data fix; 244 tests), and the themed scenes were rebuilt around cached strips (draw calls per frame: sports 2,724 -> 31, TV 3,953 -> 369, movies 3,153 -> 567) with a 30 fps cap and pausing behind sheets. Not verified on a physical iPhone (measured by draw-call counts and 4x CPU throttle in headless Chrome).

## Round: Dacula Dash
Built a complete multiplayer trivia board game (see ARCADE_DACULA.md). Because every map service was unreachable, the playable board is a hand trace of the user's two Apple Maps screenshots (clearly labelled approximate), with a tested OSM importer ready to replace it. Engine, bots, simulations, 40+ tests (287 total passing), pixel client, browser verification at desktop and phone sizes.


User: add coaching career mode (season, free agents), a student's nine plays, and WASD/Shift/R hotkeys to Gridiron
- Done: nine student plays (interpreted from a drawing), hotkeys, `career.mjs` + `Career.tsx` + menu button + persistence, tests, docs. See ARCADE_GRIDIRON.md. Not playtested by a human.


User: add Telatro (external HTML game) as a solo game, embedded by link
- Done: `/arcade/telatro` embeds https://telatro.tomcat.sh in a sandboxed iframe mounted only after PLAY (no load on the hub), responsive via 100dvh + safe areas, Full/Open-in-new-tab buttons, hub card. Layout checked at 6 viewport sizes. NOT verified: that the host actually allows framing (sandbox network blocks the host). No Telatro files were in the repo/branches visible to the agent, none were touched.


User: replace the Telatro embed (an unofficial Balatro port) with an original idle pack-cracker; fantasy football idle game to follow
- Done: Pack Rush (`ARCADE_PACKS.md`), hub card, tests, economy simulator, browser smoke. Telatro route and card removed. Next: fantasy football idle game.


User feedback: Pack Rush felt like a robot idle game; cards were icons. Rebuilt as shop -> table -> tap-to-tear packs -> framed cards with 6 finishes -> sell duplicates -> staff.
- Done: engine v2, parts-based card art, tear/flip/particle UI, album close-ups, odds lab, tests, econ sim, browser smoke. Reboot tree dropped.


User: make Pack Rush as good as possible, better pack art, sprite sheets, mechanics, feel
- Done: combo, golden packs, fusion lab, orders, layered peeling pack art with light leak, damage numbers, shake, rarity suspense + rays, coin flights, counting cash, pitch-rising tap sound, sprite-sheet loader + template sheets + artist guide (ARCADE_PACKS_ART.md).

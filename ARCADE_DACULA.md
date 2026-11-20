# Dacula Dash

A turn-based, Trivial-Pursuit-style race around a pixel-art map of Dacula, Georgia. Roll, choose a route along real roads, answer a category question at each landmark to win a colour wedge, then race back to Dacula High School and win the final question. It is a normal Classroom Arcade party game (`dacula_dash`): teacher rooms, join codes, bots, solo practice and the results screen all work like the other games.

## Play
1. **Roll** a server-side die (1-6, plus up to 2 earned bonus moves, plus a green-light bonus if you have one).
2. **Pick a route**: tap a glowing space on the map or choose a destination from the list (arrows show compass direction). A green line previews the exact road path.
3. **Land** on a landmark to answer its colour question. A correct answer earns the wedge (you never need an exact roll: you may stop early at any landmark you still need). A wrong answer earns nothing; on a later turn you may "stay and retry" with a fresh question.
4. **Normal spaces:** coloured spaces ask a bonus question (correct = a bonus move; trailing players get one extra), yellow spaces trigger an event, and landing on another player starts a *trivia duel* (bonus question, nothing is ever stolen).
5. **Win:** collect all six wedges, return to the school and answer the FINAL question (medium/hard) correctly. At 75% of the session a bell rings ("HOME STRETCH"). At the 20-minute cap the board ends and players are ranked by **wedges, then correct answers, then spaces from school, then earliest last wedge**; exact ties share a rank.

Events (original, capped): GREEN LIGHT (+2 on the next roll), SHORTCUT (a question worth 2 bonus moves), ROAD CONSTRUCTION (one road closed for about two rounds; only chosen if the whole map stays connected; at most one at a time). "Wrong turn" setbacks were deliberately not built (no unavoidable punishment).

A class larger than six is split into **boards of at most six** (each board has its own turn order and winner).

## Where things live
| What | Where |
|---|---|
| Board data in use | `arcade-server/dacula/board.mjs` (re-exports the active data) |
| Hand-traced board (default) | `arcade-server/dacula/traced.mjs` |
| Road graph, reachability, shortest paths | `arcade-server/dacula/graph.mjs` |
| Game rules / turn state machine / bots hooks | `arcade-server/games/daculaDash.mjs` |
| Question bank (original) | `arcade-server/data/daculaQuestions.mjs` |
| Teacher import (CSV/JSON) + validation | `arcade-server/dacula/questionIO.mjs` |
| Simulation harness | `arcade-server/dacula/sim.mjs`, `node scripts/dacula-sim.mjs` |
| OSM importer | `scripts/dacula-geo-import.mjs` |
| Pixel map art + sprites | `components/arcade/dacula/mapArt.ts` |
| UI | `components/arcade/games/DaculaDash.tsx`, `components/arcade/dacula/dacula.css` |
| Tests | `arcade-server/tests/daculaGraph|Questions|Dash|Importer.test.mjs` (`npm run arcade:test`) |
| Browser smoke test | `node scripts/dacula-e2e.mjs --url http://localhost:3100 --shots /tmp --size 1366x768` |

## Configuration
Room settings (host "settings" action, lobby only): `dacula: { minutes: 2-40 (default 20), questionSeconds: 5-60 (default 15) }`, and an optional `seed` for reproducible games. Solo practice uses a shorter 6-minute match. Timers (roll 12 s, route 22 s, question 15 s) auto-act for idle or disconnected players, so a board never stalls; the teacher "skip" control moves a board past its current player.

## Geography: READ THIS
* **The map in the game is a hand trace, not surveyed data.** The build environment could not reach OpenStreetMap, Overpass, Nominatim or Gwinnett GIS (every host refused the connection), and the brief forbids inventing map data. The board was therefore traced by hand from two Apple Maps reference screenshots supplied by the game owner. Relative placement and connectivity follow what is visible there; positions are good to roughly 40 m, some road names are unknown, and a few connections are plausible but not visible (flagged `inferred: true`: the campus drive, school access road and park drive). No Apple Maps imagery or data is stored or redistributed, only a coarse trace.
* **Checkpoints.** As requested: Dacula Park (Geography/blue), Dacula Library (History/yellow), Dacula Falcons Stadium (Entertainment/pink). **Substituted** because they are outside the traced area: Olde Mill Park for Little Mulberry Park (Science/green), Gwinnett County Fire Station #16 for Dacula City Hall (Arts & Literature/purple), Dacula Family Sports for Rabbit Hill Park (Sports/orange). Substitutions are recorded in `CHECKPOINTS[].status`. The assignment of category to landmark is arbitrary, as the brief says.
* **The school.** Placed at the large campus building beside the stadium. The address "123 Broad Street" was **not verified** and Broad Street is outside the traced area. Fence Rd, Auburn Ave, Harbins Rd and Winder Hwy are likewise not on the board.
* **Playable network:** Dacula Rd, Hebron Church Rd, Whisper Way, Wilson St, Stanley Rd and three service links. 67 movement spaces (about 85 m apart). Roads connect only at named junctions (never because lines cross). The graph is mostly spurs with three real loops, so route choices matter at a handful of intersections; the stadium is 2 spaces from school (they share a campus), the farthest checkpoint is 10.
* **To use real data:** from a machine with internet run `node scripts/dacula-geo-import.mjs --activate`. It queries Overpass (retries with back-off, two mirrors), saves the raw response and provenance under `arcade-server/dacula/data/`, splits roads at shared OSM node ids (bridges stay disconnected), writes GeoJSON, reports any landmark it cannot find (never inventing one) and rewrites `board.mjs`. If the real landmarks are many kilometres apart the board will be large: re-run with `--spacing` / `--bbox` and re-tune with the simulator. Output must carry "(c) OpenStreetMap contributors, ODbL 1.0".
* Runtime never calls a map service; everything is prepared locally.

## Questions
182 original questions (30+ per category, difficulty 1-3) written for this project and marked `review: "unreviewed"`: **a teacher should review them** before classroom use. Facts were limited to well-established ones, but the bank has not been fact-checked by a second person. Teachers can add questions: `importQuestions(csvOrJson)` validates categories (with friendly aliases), four distinct answers, lengths, duplicate questions and strips markup; the game accepts them through room content (`content.items`). **Not yet built:** a teacher UI for uploading a file (the validated importer and the engine hook exist and are tested). No AI-generated questions are used.

## Balance (simulated, 15 games per row, full engine, think-time model)
| Players | Accuracy | Median min | p90 | Ends with a winner |
|---|---|---|---|---|
| 2 | 50 / 70 / 90% | 8.7 / 7.2 / 5.7 | 11.3 / 8.5 / 7.3 | 100% |
| 4 (default) | 50 / 70 / 90% | 16.1 / 12.3 / 11.1 | 18.9 / 15.1 / 12.6 | 93 / 100 / 100% |
| 6 | 50 / 70 / 90% | 20.1 / 18.6 / 15.4 | 20.1 / 20.1 / 17.4 | 13 / 87 / 100% |

Every game is capped at the session length; six players at 50% accuracy usually reach the timeout ranking, which is by design. Re-run with `node scripts/dacula-sim.mjs --games 30`.

## Pixel art, sound, accessibility
All art is original and generated in code (the pre-rendered map, school, stadium, parks, cars, wedge shapes); the UI uses the same VT323 / Press Start 2P pixel fonts, notched plates and CRT overlay as Abyss. Sound reuses the shared WebAudio synth (mute in the room toolbar; reduced-motion disables animation). Wedges differ by SHAPE and icon as well as colour. Buttons, route list and answers are keyboard-operable (A-D / 1-4 answer, Space rolls).

## Limitations / honest gaps
* Map data is hand-traced (see above); real OSM import is built but could not be run here.
* Three of six checkpoints are substitutions; school address unverified.
* Question bank unreviewed; no teacher upload screen; no host UI for the minutes setting yet (the lobby action exists).
* Verified in headless Chromium (desktop 1366x768 and a 390x844 phone) against bots; not tested on physical Chromebooks or phones, and the audio was not listened to. A full 20-minute human match was not played end to end in a browser (engine-level full matches are simulated and tested).
* The die is an ordinary d6; "duel" is a bonus question, not a head-to-head.

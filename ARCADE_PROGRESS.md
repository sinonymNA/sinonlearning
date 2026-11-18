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

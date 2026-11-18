# Arcade development notes

- Preserve the existing Next.js App Router, PostgreSQL helpers, Margins auth, and node-runtime room pattern used by `app/api/suspect/route.ts`.
- Prefer server-authoritative room state and polling when deployment does not provide durable WebSockets; never make local browser state the source of truth.
- Keep private game data out of public room state.
- Run `npm run build` after route or type changes.
- Continue toward the complete Classroom Arcade acceptance criteria; intermediate milestones are not final completion.

## Classroom Arcade architecture (read before editing `arcade-server/`)

- `arcade-server/` is plain ESM (no Next imports) so it is unit-testable with `node --test`. `room.mjs` = session lifecycle, host controls, normalised cumulative scoring; `games/*.mjs` = one authoritative class per game (`tick`, `act`, `view`, `points`); `api.mjs` = the single request handler used by the Next routes AND the tests; `bots.mjs` = developer-lab bots that act only through `room.act()`.
- Games read time only via `room.t()` (freezes while paused) and `room.dur(ms)` (test time scale). Never use `Date.now()` in a game.
- Views are the only thing clients see. Private data (imposter role/word, secret draw word, correct answer, hot-potato fuse) must never appear in a view for someone who should not have it. `arcade-server/tests/imposter.test.mjs` and `quickDraw.test.mjs` assert this; keep them green.
- Drawing: ONE protocol/validator (`drawing.mjs`) and ONE client engine (`components/arcade/DrawingCanvas.tsx`) shared by Quick Draw and Telephone.
- Rooms live in process memory (`lib/arcadeRuntime.ts`, same pattern as `/api/suspect`); coins/collections/content sets persist via `lib/arcadeDb.ts` (Postgres) or `MemoryStore` when `DATABASE_URL` is unset.
- Developer lab access: any signed-in teacher account (`isDeveloper` in `arcade-server/api.mjs`); guests and students are refused and each lab room is owned by its creator. `ARCADE_DEV_AUTH=1` (never honoured when NODE_ENV=production) enables a cookie identity for local browser/load tests.
- Accounts: `arcade-server/accounts.mjs` (username+password only, session token stored hashed, cookie `arcade_session`); never add email/real-name fields. Solo practice = `solo_create` in `api.mjs` (real engine + bots; `awardSolo` in `room.mjs`; per-day cap via `store.awardCapped`).
- Tests: `npm run arcade:test`. Load test (35 real HTTP clients): `npm run arcade:load -- --url http://localhost:3100`. Browser e2e: `node scripts/arcade-e2e.mjs`.
- Memory files to keep current after every milestone: `ARCADE_PLAN.md` (checklist), `ARCADE_PROGRESS.md`, `ARCADE_TESTS.md`. Do not tick a box unless it was verified.

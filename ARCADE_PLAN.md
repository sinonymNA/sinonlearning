# Classroom Arcade acceptance checklist

Legend: [x] implemented AND verified (see ARCADE_TESTS.md for how) · [~] implemented, verification partial · [ ] not done.

## Platform & integration
- [x] Arcade homepage `/arcade`, host `/arcade/host`, join `/arcade/join`, live room `/arcade/room/[code]` (+ `/host` dashboard, `/projector`), collection `/arcade/characters`, shop `/arcade/shop`, teacher content `/arcade/content`, private developer lab `/arcade/test-lab`.
- [x] Reuses existing Next.js App Router, Margins accounts (teacher/student roles), PostgreSQL helpers (`lib/db.ts` + new `transaction()`), node-runtime in-memory room pattern from `/api/suspect`. No new runtime dependencies. Linked from Classroom Tools and the footer.
- [x] Existing site pages still build and respond (200): `/`, `/tools`, `/margins/login`, `/dash`; `npm run build` passes.
- [x] Real multiplayer, server-authoritative: state/timers/scores live on the server; clients poll (650–1000 ms) and send validated actions. Transport trade-off documented in README (no WebSocket: Next route handlers cannot upgrade; see "Known limitations").
- [x] Six-character room codes (unambiguous alphabet), nickname + avatar join, live lobby, reconnection (id+token in localStorage; host by account), late-join rule (wait for next game; teacher can disable), automatic grouping, final results, solo and optional team scoring (2–6 teams).
- [x] Capacity 40 (target 35). 35-player in-process sessions and a 35-client HTTP load test complete all five games.

## Games
- [x] Hot Potato: groups of ≤7, random transfer never to self/previous holder, hidden fuse, 3 hearts, real 264k-word dictionary with server validation, repeats rejected, sequences verified to have many answers, ghost participation (cool the potato), reactions, overheat animation, vocab support.
- [x] Quick Draw: shared compact-stroke canvas, pen/eraser/8 colors/4 sizes/clear, touch+mouse, cursor-based incremental sync, secret word never sent to guessers, speed scoring, artist scoring, automatic rotation, hints, close-guess feedback.
- [x] Last One Standing: 35→20→10→5→2→1 ladder, server-side advancement, 250 ms tie window with fair random draw, nobody-correct re-ask, sudden-death finale, consolation competition, platform with falling avatars, teacher questions.
- [x] Telephone: draw 45 s / describe 20 s / draw 45 s, derangement-style chain assignment (nobody gets own chain after stage 1), shared canvas engine, animated reveal of full chains, funniest-chain vote, participation points.
- [x] Imposter: groups of 4–5 (35 → seven × five), exactly one imposter, private roles, 10 s ask / 20 s simultaneous hidden answers / 5 s reveal, every player asks once, fallback questions, "No answer.", disconnect-safe, 15 s vote (no self vote, hidden until close), runoff, 10 s final guess, table UI, scoring.
- [x] Per-game durations measured with bots: HP ≈ 2.4 min, LOS ≈ 1.9 min, QD ≈ 3.5 min (35 players, real-time), Telephone ≈ 3.9 min, Imposter ≈ 4.0 min.

## Teacher & party
- [x] Dashboard: code, player count, game picker, playlist order, content set, scoring mode, late-join rule, start, pause/resume, skip, remove player, end, live leaderboard, projector mode (no private roles/answers).
- [x] Arcade Party: intro → play → results → leaderboard → next game, normalised cumulative scores (per-game points scaled to ≤1000 vs. the game's best / par), final podium, game winners, team board.

## Progression & content
- [x] Coins separate from points; awarded server-side to signed-in players only (≥3 players, 150/session cap, idempotent per game); 12 original characters (5 rarities); Basic pack 150 coins with published odds; atomic, duplicate-safe pack opening (row lock + request-id idempotency); guests can play but cannot keep coins; delete-my-data.
- [x] Teacher content sets (questions, vocab, draw prompts, telephone prompts, secret words), manual entry, CSV import, per-game compatibility check, built-in defaults, reuse of existing Game Shows (Race/Memory/Wheel import).
- [~] Visual/sound polish: CSS/SVG/Canvas only; WebAudio sfx with mute and reduced-motion toggle. Verified by screenshots in Chromium (desktop + 390 px phone). Audio itself is not machine-verifiable; no real Chromebook/Safari/Firefox runs.

## Developer lab & tests
- [x] Lab: create test room, up to 39 bots + 1 real player, pick game/behavior (smart/average/sloppy/afk/chaotic/mixed), start/pause/skip/end, disconnect/reconnect bots, game log, scores, metrics; every call re-authorised server-side (`ARCADE_DEV_EMAILS`).
- [x] Game-specific bots act only through `room.act()` (same validation as students).
- [x] Separate network load script `scripts/arcade-load-test.mjs` (independent HTTP clients, not objects in one browser).
- [x] Automated tests (89 unit/integration), browser e2e scripts, account/PostgreSQL integration script, production build.

## Safety
- [x] Private room codes, teacher auth, nickname filter, text moderation + PII blocking, teacher remove, rate limiting (join/act/create/draw), server-side validation, private role delivery, no chat/DMs/public profiles, minimal data (nickname in memory only; account link only for coins), rooms auto-deleted (4 h idle / 30 min after end), delete-my-data. No compliance claims; needs school review.

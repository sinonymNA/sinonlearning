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
- [x] Coins separate from points; awarded server-side to signed-in players only (≥3 players, 150/session cap, idempotent per game); 12 original characters (5 rarities); four packs (Starter 40, Classic 100, Super 250, Legend 600) with published odds per pack; atomic, duplicate-safe pack opening (row lock + request-id idempotency); guests can play but cannot keep coins; delete-my-data.
- [x] Teacher content sets (questions, vocab, draw prompts, telephone prompts, secret words), manual entry, CSV import, per-game compatibility check, built-in defaults, reuse of existing Game Shows (Race/Memory/Wheel import).
- [~] Visual/sound polish: CSS/SVG/Canvas only; WebAudio sfx with mute and reduced-motion toggle. Verified by screenshots in Chromium (desktop + 390 px phone). Audio itself is not machine-verifiable; no real Chromebook/Safari/Firefox runs.

## Developer lab & tests
- [x] Lab: create test room, up to 39 bots + 1 real player, pick game/behavior (smart/average/sloppy/afk/chaotic/mixed), start/pause/skip/end, disconnect/reconnect bots, game log, scores, metrics; every call re-authorised server-side (signed-in teacher required).
- [x] Game-specific bots act only through `room.act()` (same validation as students).
- [x] Separate network load script `scripts/arcade-load-test.mjs` (independent HTTP clients, not objects in one browser).
- [x] Automated tests (89 unit/integration), browser e2e scripts, account/PostgreSQL integration script, production build.

## Safety
- [x] Private room codes, teacher auth, nickname filter, text moderation + PII blocking, teacher remove, rate limiting (join/act/create/draw), server-side validation, private role delivery, no chat/DMs/public profiles, minimal data (nickname in memory only; account link only for coins), rooms auto-deleted (4 h idle / 30 min after end), delete-my-data. No compliance claims; needs school review.

## Accounts & solo (added)
- [x] Username + password arcade accounts (no email/real name), hashed session tokens, delete-account, rate limits.
- [x] Solo practice vs bots for all 5 games, 3 difficulties, placement coins x difficulty, 150/day cap, guests earn nothing.
- [ ] True solo modes (see ARCADE_SOLO_IDEAS.md): Potato Rush, Streak Climb, Daily Challenge - brainstormed, not built.

## Session 3 additions
- [x] Second chance in Last One Standing: knocked-out players keep answering; 2 correct in a row puts them back on the platform (never into the finale, capped per game).
- [x] Piggy Bank (6th game): nobody is eliminated; answer for coins, then pick SAFE / SPICY (steal) / WILD (jackpot, steal from leader, swap, oops; unlocked by a right answer); shields; heist feed; awards.
- [x] Teachers can add/remove practice bots in a normal room (lobby only, max 40 players, bots never earn coins).
- [x] Quick chat: curated jokes/cheers/emoji + per-game phrases, pop-ups on every screen incl. projector, cooldown, teacher on/off. No free-text chat by design.
- [x] More drawing time: Quick Draw 55 s per turn (4 turns), Telephone 75 s / 25 s / 75 s.

## Imposter pacing change (owner request, overrides the original 10/20/5 s spec)
Timers are now role 6 s, ask 20 s, answer 30 s, answers shown 10 s, vote 20 s (runoff 12 s), final guess 15 s. The asker can click one of six private preset questions (shuffle up to 3 times) or type their own; fallback questions still cover silence. A typical 5-player group now takes ~5-6 minutes if everyone uses the full time.

## Drawing + icons
- [x] Paint bucket fill in Quick Draw and Telephone (one shared tool: protocol segment t=3, validated, capped at 60 fills/drawing, flood-filled identically on every client).
- [x] Uploaded-image characters supported (`IMG(...)` in `characters.mjs`, files in `public/characters/`), documented in ARCADE_ICON_GUIDE.md. No custom icons have been added yet.

## Packs (rebalanced, cheaper)
- [x] Four packs: Starter 40 (78/18/3.5/0.5/0 %), Classic 100 (60/26/10.5/3/0.5), Super 250 (no commons: 0/55/33/10/2), Legend 600 (rare+: 0/0/55/37/8). Odds per rarity and per character are shown per pack; shop has a pack picker; the free demo has the same picker. Old 150-coin pack replaced (existing `basic` id kept, now "Classic" at 100).

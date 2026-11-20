# Retro Gridiron

A 2D top-down pixel-art football game in the arcade (`/arcade/gridiron`, Solo hub card "RETRO GRIDIRON"). Single player vs the computer, desktop + mobile browsers, landscape-first (portrait works too). No new backend, no accounts: it is a pure client game built on a unit-tested engine.

## How it plays
1. **The coordinator calls the play** (8-play book, picked for down & distance: no bombs on 3rd-and-short, no screens on 3rd-and-18). The route overlay and A B C D labels are shown pre-snap; tap **AUDIBLE** (or X) to switch to one of two other situational calls. No menu to browse.
2. **Snap.** Receivers run their routes in real time; the defence (man, zone or a blitz, chosen per snap) reacts; the pass rush breaks free after a few seconds. A red pulse means a rusher is closing on the QB.
3. **Throw:** tap A / B / C / D (or press A B C D / 1-4). The ball leaves after a short wind-up and is *led* to where the receiver will be (route-projection solver). Accuracy depends on QB rating, pressure, a rushed throw and flight time. The A-D buttons carry a faint separation bar that is deliberately noisy and slow (it hints, it does not tell).
4. **Carry:** after the catch only lateral steering is yours (hold ◀ ▶, arrow keys, A/D, or touch the left/right half of the field). The receiver runs upfield by his speed rating; cutting hard costs a little forward speed. Defenders take pursuit angles and tackle (tackle / broken tackle / missed tackle, gang bonus); non-target receivers (and linemen on a screen) block.
5. Dead ball on tackle, out of bounds, touchdown. Normal football rules apply (below).

Keys: Space/Enter = snap / kick / continue, Esc or P = pause, A B C D or 1-4 = throw (A and D steer instead once the catch is made).

## Feel (second pass, after play feedback "not fun, drops the ball too much")
- **Skill decides catches.** A receiver with daylight (>2.2 yd from the nearest defender) catches the ball; no hidden dice. Dice only apply when a defender is on the throw, scaled by how close he is (break-up, small drop chance, interception only when he is nearly on top of the receiver). QB accuracy error was cut by about half.
- **Tight camera:** 46 x 30 yards visible (was 53 x 48), players drawn at 2x, receivers who run off-screen get a lettered edge arrow. Quick pocket (0.7 s drop, 6.5 s max hold) and game speed x1.2.
- **Juice:** hit-stop on catches/tackles/picks/sacks/TDs, screen shake, dust / pop / confetti particles, ball trail in flight, bouncing ball on an incompletion, touchdown flash + crowd cheer, shorter result banners, skippable CPU drive log.

## Retro-Bowl-style pass (third pass, "doesn't feel like a good football game")
Original game, not a copy of any commercial title. Changes aimed at the arcade feel of games in that style:
- **Run game:** two handoff plays (Dive, Sweep). The RB takes the handoff, linemen hold the defensive line for a beat (`SIM.RUN_DL_BLOCK`, `RUN_LB_BLOCK`), receivers block downfield.
- **You drive the runner:** after a catch or handoff you steer left/right, **BOOST** (hold; Shift/Up/W; drains a stamina bar), brake (Down/S) and **JUKE** (button or Space): a sideways burst with a short window where close tacklers whiff, then a 1.15 s cooldown.
- Play suggestions now mix runs and passes by down and distance.

- **Quick Play:** four 4:00 quarters vs the CPU. You get the opening kickoff, the CPU gets the second-half kickoff.
- **Two-Minute Drill:** you trail 0-7 with 2:00 left, ball at your own 25.
- Difficulty (Rookie / Pro / Legend) shifts the CPU defence rating in the live plays and the CPU offence in simulated drives.

## Rules implemented (`arcade-server/gridiron/rules.mjs`)
4 downs, 10 yards, first-down line, goal-to-go, TD (6) + automatic extra point (94%), field goals (timing meter; 56-yard range), punts (touchback to the 20), interceptions (CPU ball at the spot), sacks, safeties, incompletions/drops/deflections, out of bounds, turnover on downs, game clock (runs during the play and between snaps; stops on incompletions, out of bounds, touchdowns and turnovers), quarters, halftime kickoff, final result (win/loss/tie), pause/restart/exit.

## Architecture (all tunables in `arcade-server/gridiron/config.mjs`)
- `sim.mjs` PlaySim: one snap. 30 Hz fixed step, no DOM/time/random globals. Contains route runner, QB drop, OL/DL blocking and rush timers, man/zone/blitz defender AI (states ALIGN, COVER_MAN, COVER_ZONE, RUSH, BLOCKED, INTERCEPT, PURSUE, TACKLE), throw system with lead solver, catch/INT/deflection/drop resolution, carry movement, collision/tackle system, blockers, TD/OOB/dead-ball.
- `rules.mjs` Game: score, clock, down & distance, possession, 4th-down choices, FG/punt, halftime, final.
- `opponent.mjs`: CPU possessions simulated from ratings with short play-by-play (the player never plays defence).
- `playbook.mjs`: the eight plays (formation + waypoint routes), zone anchors.
- `components/arcade/gridiron/render.ts` (field/camera/sprites/ball, 3x5 bitmap font), `Gridiron.tsx` (menus, HUD, input, flow), `gridiron.css`.
- Rendering is separated from logic: the canvas is a 176x144 logical pixel buffer scaled with `image-rendering: pixelated`; the vertical camera follows the QB, the ball or the carrier. All art is generated in code (original).

Ratings (1-100) really change play: QB accuracy/arm/throw speed, receiver speed/accel/catching/route/agility/blocking, defender speed/coverage/awareness/tackling/rush. Each defender gets a slightly different rating sheet per snap.

## Honest limits
- Not built (by design, per the brief; the carry is now fully steerable, which supersedes the original lateral-only brief): multiplayer, defence control, trading, accounts. (Season mode was added later as Coach Career, see below.)
- Interceptions end at the catch spot (no return). No penalties, fumbles, kickoff returns, two-point tries (extra points are automatic).
- CPU drives are simulated from ratings, not played out on the field.
- Whether it is actually fun still needs human playtesting; tuning lives in `config.mjs` (e.g. `SIM.GAME_SPEED`, `CONTEST_RADIUS`, `PASS_ERR_*`).
- Balance was tuned with a bot over a few hundred plays per play-type (see ARCADE_TESTS.md); deep routes are somewhat generous. It still needs real play time to tune the feel. Every number is in `config.mjs`.
- Verified in headless Chromium (desktop, tablet, phone portrait/landscape, touch emulation) but not on physical devices; audio is the shared WebAudio synth and was not listened to.

## Student plays, hotkeys and Coach Career (added after the first release)
- **Student playbook:** nine plays from a student's paper playbook, names kept exactly as written: `smash`, `bb`, `turtle`, `chicken`, `turky`, `dagoat`, `idk`, `cutter`, `turky2` (flagged `student: true` in `playbook.mjs`). The routes are an interpretation of a hand drawing; if a route is wrong, edit its `W(...)` list. They are mixed into the situational suggestions in `Game.suggestPlays()`.
- **Hotkeys:** Shift (play-call screen) toggles PASS/RUN; R audibles (X/Tab still work); A, W, S, D throw to receivers A, B, C, D in that order (also 1-4). During a run the controls are unchanged: A/D or arrows steer, W/S/Shift boost/brake, Space jukes. Buttons show their key on non-touch devices.
- **Coach Career** (`arcade-server/gridiron/career.mjs`, UI `components/arcade/gridiron/Career.tsx`, tests `arcade-server/tests/career.test.mjs`, browser smoke `scripts/gridiron-career-e2e.mjs`): 8-team league, 7-game round-robin season, top 4 make a semifinal/final playoff, champions, then offseason (players age, rookies replace retirees, new schedule). Earn credits (win 3 / tie 2 / loss 1, playoff wins, title) to sign free agents (pool refreshes weekly, costs by rating) into your 8 starter slots (QB, WR A-D, RB, OL, DEF) or train a starter (+2 rating, 2 credits, twice a season). Your roster ratings feed the real play engine (`PlaySim` `roster`, `Game` `roster`/`opp`); the opponent's rating sets how its drives and its defence perform. SIM WEEK plays the game for you.
- Career is saved in this browser only (`localStorage` key `gridiron:career:v1`); it is not tied to the student account and is lost if site data is cleared.
- Limits: a game abandoned mid-way is not recorded (replay it); ties in playoffs are a coin flip (no overtime in the engine); other teams are rated numbers, not rosters; no injuries/trades/contracts; balance (credit economy, rating weights) is tuned by simulation, not by human play.

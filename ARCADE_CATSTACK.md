# Cat Stack (`/arcade/catstack`)

A tube-sorting puzzle (the "water sort" family) with cats. Tap a tube and its top cats hop up; tap another tube to drop them. Cats fit in an empty tube or on a cat of the same colour. Finish when every tube holds one colour. Cats hiding in "?" cardboard boxes pop out once they reach the top. A finished tube turns golden and its cats look happy. Original name and art (the genre is generic; do not copy another game's name or assets).

## Why this theme (and why the first version was replaced)
The first version was nuts on bolts drawn as pre-rendered "3D" sprites. It read as flat because a static sprite cannot rotate, and a bolt tip showing behind the top nut looked wrong. Nuts and poles are inherently 3D, so the skin was changed to something that is natural side-on: cats in glass tubes, in the same chunky pixel style as Meowdoku. The engine did not change.

## Why it is not laggy
- No WebGL, no three.js, no per-frame JavaScript. Every cat is a tiny pixel sprite drawn ONCE on a canvas (`sprites.ts`), cached, and scaled with `image-rendering: pixelated`.
- A cat is an `<img>` placed with `transform: translate3d(...)`. A move is one Web Animations arc (hop up, slide, drop) per cat; React re-renders only when game state changes. Cats live in one flat list keyed by id, so a cat keeps its element while it moves between tubes.
- The layout (`computeLay`) picks the number of rows that makes cats biggest and fits 2 to 14 tubes of height 4 to 9 on any screen from 320x568 up. The page never scrolls.
- Calm mode and reduced motion skip the arcs. `scripts/catstack-e2e.mjs` measures frame gaps and long tasks while moves play (headless Chromium: p95 about 17ms even on the 84-cat level 40) and fails if that regresses. Not measured on a physical low-end phone.

## Engine (`arcade-server/stack/engine.mjs`, pure ESM, no Date.now/Math.random)
- Containers are called `bolts` in the engine (a leftover from the first theme); the screen calls them tubes. Items are `{id, c (colour), q (still hidden in a box)}`.
- `specFor(level)`: 3 colours on level 1 rising to 12 (one more every 3 levels), tube height 4 rising to 9, always 2 empty tubes (max 14), hidden cats from level 8 (10% rising to 60%). Levels are endless and deterministic.
- `generate(level)`: a seeded random deal, checked by the solver; a reverse-scramble fallback guarantees solvability. `par` is the solver's move count. `solve()` (weighted best-first) powers par, hints and tests; `hint(st)` returns the next move of a real solution.
- `move`, `undo` (free, re-hides a revealed cat), `addBolt` (max 2 per level), `canMove`, `isSolved`, `hasMoves`.
- Stars: 3 within 125% of par, 2 within 160%, else 1. First clears earn a hint every 2nd level and an extra tube every 4th. Profile and game live in localStorage `catstack:v1`; nothing is stored on a server.

## Art and accessibility
- 12 cat colours that also differ by pattern (plain, striped, spotted), plus a settings switch that draws a symbol on every cat. Every tube is a real button labelled like "Tube 3, 4 of 5 cats, top cat red".

## Tests
- `node --test arcade-server/tests/stack.test.mjs` (rules, hidden-cat reveal and undo, every level 1-120 solvable and fully dealt, hints finish levels, stars/profile).
- `node scripts/catstack-e2e.mjs [--only iphone-p,laptop]` (6 sizes): fit, tap rules, undo, hint, extra tubes, a real solve with frame timing, a 14-tube level 40, symbols switch, save/reload.

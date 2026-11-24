# Bolt Sort (`/arcade/nuts`)

A nut-and-bolt sorting puzzle (the "water sort" family). Tap a bolt to lift its top nuts, tap another bolt to move them. Nuts land on an empty bolt or on a nut of the same colour. Finish when every bolt holds one colour. Dark "?" nuts show their colour once they reach the top. Original name, art and levels (the genre is generic; do not copy another game's name or assets).

## Why it is not laggy (the design goal)
- **No WebGL, no three.js, no per-frame JavaScript.** Every nut is a hex prism drawn ONCE on a canvas in `components/arcade/nuts/sprites.ts` (shaded top face, three lit side faces, a hole, a glint), cached as an image per colour/mystery/symbol, then reused.
- A nut is an `<img>` positioned with `transform: translate3d(...)` (GPU compositing). A move is one Web Animations arc (lift, slide, drop) per nut; React re-renders only when the game state changes (a tap or a move).
- Nuts live in one flat list keyed by id, so a nut keeps its element while it flies between bolts.
- The layout (`computeLay`) is computed once per size: it picks the number of rows that makes nuts biggest and fits 2 to 14 bolts of height 4 to 9 on any screen from 320x568 up. The page never scrolls.
- Calm mode and reduced motion skip the arcs. `scripts/nuts-e2e.mjs` measures frame gaps and long tasks while moves play (headless Chromium: p95 about 17ms even on the 84-nut level 40) and fails if that regresses. Not measured on a physical low-end phone.

## Engine (`arcade-server/nuts/engine.mjs`, pure ESM, no Date.now/Math.random)
- `specFor(level)`: 3 colours on level 1 rising to 12 (one more every 3 levels), bolt height 4 rising to 9, always 2 empty bolts (max 14 bolts), mystery nuts from level 8 (10% rising to 60%). Levels are endless and deterministic.
- `generate(level)`: a seeded random deal, checked by the solver; a reverse-scramble fallback guarantees solvability. `par` is the solver's move count.
- `solve()` is a weighted best-first search used for par, hints and tests. `hint(st)` returns the next move of a real solution from the current board.
- State is JSON: bolts of nuts `{id, c, q}`; `move`, `undo` (free, restores a re-hidden mystery nut), `addBolt` (max 2 per level), `canMove`, `isSolved`, `hasMoves`.
- Stars: 3 within 125% of par, 2 within 160%, else 1. Rewards on first clear: a hint every 2nd level, an extra bolt every 4th. Profile in localStorage `boltsort:v1`; nothing is stored on a server.

## Accessibility
- Every bolt is a real button with a label ("Bolt 3, 4 of 5 nuts, top nut red"). A settings switch draws a symbol on each colour for colour-blind players.

## Tests
- `node --test arcade-server/tests/nuts.test.mjs` (rules, mystery reveal and undo, every level 1-120 solvable and fully dealt, hints finish levels, stars/profile).
- `node scripts/nuts-e2e.mjs [--only iphone-p,laptop]` (6 sizes): fit, tap rules, undo, hint, extra bolts, a real solve with frame timing, a 14-bolt level 40, symbols switch, save/reload.

# Meowdoku (logic puzzle)

Route `/arcade/meowdoku` (`/arcade/catgrid`, the first name, redirects). Engine `arcade-server/meowdoku/` (`engine.mjs`, pre-built `levels.mjs`), client `components/arcade/meowdoku/` (`Meowdoku.tsx`, `sprites.ts`, `meowdoku.css`), logo `public/arcade/meowdoku-logo.png` (made by `scripts/meowdoku-logo.mjs`), tests `arcade-server/tests/meowdoku.test.mjs`, browser check `scripts/meowdoku-e2e.mjs`, level builder `scripts/meowdoku-build-levels.mjs`. Hub entry: Brain shelf.

## The game
Place **one cat in every row, every column and every colour area**, and **no two cats may touch, corners included**. A cat that breaks a rule costs a **fish** (3 per level); out of fish = try the level again.
- **Gestures (explicit, so they never disagree):** by default a **tap** puts/removes an **X** (a note) and a **double-tap** puts/removes a **cat**. A **TAP switch** under the board flips that (tap = cat, double-tap = X). A double-tap cancels its first tap (refunding a fish that tap cost) and then applies the other mark, so it always gives the same result whatever the square held before. (The first version used a tap-to-cycle, which made double-taps unpredictable. That was a bug.)
- **Coach:** levels 1-3 open with a free "Start here!" tip that highlights the obvious first cat. **How to play** card (with the logo and three mini boards) shows on first visit and from the **?** button.
- **Hint** (teaches, costs one): finds a forced cat or a group of spots to cross out and says why in words. It trusts your X notes and catches a wrong X. A button applies it. **Cat Helper** removes a wrong cat, else places a right one. **Undo** (keeps lost fish) and **Clear** are free.
- Score: bigger boards, speed, fish left score more; helps cost a little. Finishing a level earns a hint (every third level a Cat Helper); power-ups cap at 9. No punishing timers, no ads, no purchases.
- Settings: show ruled-out spots as dots, show a shape on each colour (colour-blind friendly), reduce motion (shared arcade setting). Keyboard: arrows move, Space/Enter taps, X and C set a mark.
- Feel: board animates in as a wave, cats bounce in with a puff, X marks draw in, fish bounce away when lost, cats hop and confetti falls on a win, hint squares pulse. All of it respects reduce-motion. The clock is its own component so it never re-renders the board.

## Difficulty (the fix after real play showed level 1 was far too hard)
Puzzles are graded by the **lowest hint technique tier that solves them**: tier 0 = "a row/column/colour has only one spot left", 1 = a colour confined to one line, 2 = pairs, 3 = bigger groups and look-ahead. The ramp (`tierFor`/`minTierFor`/`sizeFor`):
- Levels 1-2: 4x4, tier 0, and a one-square colour that gives away the first cat. Levels 3-4: 5x5, tier 0. Levels 5-10: tier 1. Levels 11-20: up to tier 2. Beyond: tier 2 to 3. Boards go 4x4, 5x5 (3-6), 6x6 (7-12), 7x7 (13-20), 8x8 (21-30), 9x9 (31+).
- Every level has **exactly one solution** and is solvable with the techniques up to its tier, so a hint can always explain the next move and nobody has to guess. Tests assert this for the shipped table.
- 200 levels are pre-built into `levels.mjs` (`node scripts/meowdoku-build-levels.mjs`, about a minute; rebuild if the generator, hint techniques or ramp change). Past level 200 the 9x9 levels recycle with a random rotation/mirror and new colours (still unique, tested).
- Pure engine: no Date.now/Math.random; time is passed in. State is plain JSON in `localStorage` (`meowdoku:v1`; the old `catgrid:v1` save is read once), per device.

## Name and logo: please read
"Meowdoku" is also the name of another developer's commercial mobile game, and the logo here is a pixel-art take on the same idea as their app icon (cat sticker on a purple/orange grid with X marks). The cats, art, hints and code are original, and the puzzle itself (one per row, column and colour, no touching) is a well-known genre. But if this site is public or promoted outside your classes, a different name and logo are safer: the name lives in `GAME_NAME` (`Meowdoku.tsx`), the hub entry (`arcade-server/hub.mjs`), the route folder and the docs, and `scripts/meowdoku-logo.mjs` redraws the logo from `makeLogo` in `sprites.ts`.

## Honest limits
- Within a tier, levels are random rather than ranked by how many steps they take.
- Verified in headless Chromium at six viewports (a 9x9 board on a 320px phone, real double-taps); not on physical devices. The double-tap window is 380 ms.

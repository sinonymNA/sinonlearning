# Cat Grid (logic puzzle)

Route `/arcade/catgrid`. Engine `arcade-server/catgrid/` (`engine.mjs`, pre-built `levels.mjs`), client `components/arcade/catgrid/` (`CatGrid.tsx`, `sprites.ts`, `catgrid.css`), tests `arcade-server/tests/catgrid.test.mjs`, browser check `scripts/catgrid-e2e.mjs`, level builder `scripts/catgrid-build-levels.mjs`. Hub entry: Brain shelf.

## The game
Place **one cat in every row, every column and every colour area**, and **no two cats may touch, corners included**. Boards grow from 5x5 (levels 1-4) to 9x9 (level 25+). Tap once for an X note, twice for a cat, three times to clear. A cat that breaks a rule costs a **fish** (3 per level); out of fish = try the level again.
- **Hint** (teaches): finds a forced cat or a group of spots that can be crossed out and says why in words ("Row 3 has only one spot left", "The pink and blue areas can only use rows 2 and 5", "A cat here would leave the purple area with no spot"). It trusts your X notes and catches a wrong X. A button applies it. Costs one hint.
- **Cat Helper**: removes a wrong cat, else places one right cat. **Undo** and **Clear** are free.
- Score: bigger boards, speed, fish left score more; helps cost a little. Finishing a level earns a hint (and every third level a Cat Helper). Power-ups cap at 9. No timers that punish, no ads, no purchases.
- Settings: show ruled-out spots as dots, show a shape on each colour (colour-blind friendly). Keyboard: arrows move, Space/Enter taps, X and C set a mark, Backspace clears.

## How puzzles are made (and why they are fair)
- Every level is generated from its number (`generate`): random legal cat layout, grow connected colour areas around the cats, then **repair** any extra solutions by recolouring cells until there is **exactly one solution**. Levels must also be **solvable by the four teachable ideas the hint uses** (`logicSolvable`), so nobody ever has to guess.
- 200 levels are pre-built into `levels.mjs` (18 KB) by `node scripts/catgrid-build-levels.mjs` (about a minute). Past level 200 the 9x9 levels are recycled with a random rotation/mirror and new colours (still unique, tested).
- Pure engine: no Date.now/Math.random; time is passed in by the client. State is plain JSON in `localStorage` (`catgrid:v1`), per device.

## Honest limits
- Difficulty ramps by board size only; within a size, levels are random and not ranked by how hard the deductions are. Measuring that would be the next improvement.
- The genre (one queen per row/column/colour, no touching) is a well-known puzzle; the cats, pixel art, hints and code are original.
- Verified in headless Chromium at six viewports including a 9x9 board on a 320px phone; not on physical devices.

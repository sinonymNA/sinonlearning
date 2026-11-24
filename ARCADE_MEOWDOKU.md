# Meowdoku (logic puzzle)

Route `/arcade/meowdoku` (`/arcade/catgrid`, the first name, redirects). Engine `arcade-server/meowdoku/` (`engine.mjs`, pre-built `levels.mjs`), client `components/arcade/meowdoku/` (`Meowdoku.tsx`, `sprites.ts`, `meowdoku.css`), logo `public/arcade/meowdoku-logo.png` (made by `scripts/meowdoku-logo.mjs`), tests `arcade-server/tests/meowdoku.test.mjs`, browser check `scripts/meowdoku-e2e.mjs`, level builder `scripts/meowdoku-build-levels.mjs`. Hub entry: Brain shelf.

## The map and the worlds
The game opens on a candy-style **world map**: 100 levels in 10 cat-themed worlds of 10 levels (`arcade-server/meowdoku/areas.mjs`), world 1 at the bottom and the map scrolling up as you climb. Each world has its own pixel-art scenery (`mapArt.ts`: props drawn in code), colours and a sign with its story:
1 Whisker Village, 2 Yarn Meadows, 3 Milkshake Falls, 4 Catnip Forest, 5 Biscuit Bakery, 6 Sardine Shores, 7 Cardboard Canyon, 8 Purrmafrost Peaks, 9 Midnight Rooftops, 10 The Royal Catdom. Every 10th level is a **finale** (bigger gold node with a crown). Levels unlock one at a time; a cat stands on your next level; cleared levels show **1 to 3 stars** (3 = no wrong cat and no help, each of those costs a star, never below 1). Replaying a level can only raise its stars; points and rewards are first-clear only. The play screen takes on the colours of the world you are in, and clearing level 10, 20... announces the new world. Level 100 ends the campaign.

## The game
Place **one cat in every row, every column and every colour area**, and **no two cats may touch, corners included**. A cat that breaks a rule costs a **fish** (3 per level); out of fish = try the level again.
- **Swipe to draw:** hold and drag across the board to draw a line of X's on every empty square you pass (the path is sampled so a fast swipe skips nothing). Start the drag on an X and it erases a line of X's instead. Swipes never touch cats, and one Undo takes back a whole swipe (`beginStroke`/`endStroke`).
- **Gestures (explicit, so they never disagree):** by default a **tap** puts/removes an **X** (a note) and a **double-tap** puts/removes a **cat**. A **TAP switch** under the board flips that (tap = cat, double-tap = X). A double-tap cancels its first tap (refunding a fish that tap cost) and then applies the other mark, so it always gives the same result whatever the square held before. (The first version used a tap-to-cycle, which made double-taps unpredictable. That was a bug.)
- **Coach:** levels 1-3 open with a free "Start here!" tip that highlights the obvious first cat. **How to play** card (with the logo and three mini boards) shows on first visit and from the **?** button.
- **Hint** (teaches, costs one): finds a forced cat or a group of spots to cross out and says why in words. It trusts your X notes and catches a wrong X. A button applies it. **Cat Helper** removes a wrong cat, else places a right one. **Undo** (keeps lost fish) and **Clear** are free.
- Score: bigger boards, speed, fish left score more; helps cost a little. Finishing a level earns a hint (every third level a Cat Helper); power-ups cap at 9. No punishing timers, no ads, no purchases.
- Settings: show ruled-out spots as dots, show a shape on each colour (colour-blind friendly), reduce motion (shared arcade setting). Keyboard: arrows move, Space/Enter taps, X and C set a mark.
- Feel: board animates in as a wave, cats bounce in with a puff, X marks draw in, fish bounce away when lost, cats hop and confetti falls on a win, hint squares pulse. All of it respects reduce-motion. The clock is its own component so it never re-renders the board.

## Difficulty (the fix after real play showed level 1 was far too hard)
Puzzles are graded by the **lowest hint technique tier that solves them**: tier 0 = "a row/column/colour has only one spot left", 1 = a colour confined to one line, 2 = pairs, 3 = bigger groups and look-ahead. The ramp over the 100 levels (`sizeFor`/`tierFor`/`minTierFor` in `engine.mjs`):
- Levels 1-2: 4x4, tier 0, with a one-square colour that gives away the first cat. Levels 3-8: 5x5 (3-6 tier 0, then tier 1). 9-20: 6x6, tier 1. 21-40: 7x7, tier 1 to 2. 41-65: 8x8, tier 2. 66-100: 9x9, tier 2 to 3. So the first world is gentle and the last worlds are real puzzles.
- Every level has **exactly one solution** and is solvable with the techniques up to its tier, so a hint can always explain the next move and nobody has to guess. Tests assert this for the shipped table.
- The 100 levels are pre-built into `levels.mjs` (`node scripts/meowdoku-build-levels.mjs`, about 30 seconds; rebuild if the generator, hint techniques or ramp change).
- Pure engine: no Date.now/Math.random; time is passed in. State is plain JSON in `localStorage` (`meowdoku:v1`; the old `catgrid:v1` save is read once; older saves without stars get one star per cleared level), per device.

## Name and logo: please read
"Meowdoku" is also the name of another developer's commercial mobile game, and the logo here is a pixel-art take on the same idea as their app icon (cat sticker on a purple/orange grid with X marks). The cats, art, hints and code are original, and the puzzle itself (one per row, column and colour, no touching) is a well-known genre. But if this site is public or promoted outside your classes, a different name and logo are safer: the name lives in `GAME_NAME` (`Meowdoku.tsx`), the hub entry (`arcade-server/hub.mjs`), the route folder and the docs, and `scripts/meowdoku-logo.mjs` redraws the logo from `makeLogo` in `sprites.ts`.

## Honest limits
- Within a tier, levels are random rather than ranked by how many steps they take.
- Verified in headless Chromium at six viewports (a 9x9 board on a 320px phone, real double-taps and swipes, the whole map); not on physical devices. The double-tap window is 380 ms.
- The scenery is simple procedural pixel art (a few props per world), not hand-drawn; real art could replace it later like the Pack Rush sprite sheets.

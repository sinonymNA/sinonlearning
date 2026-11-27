# Shelf Stocker (`/arcade/shelf`)

You are the new stock clerk. Every level is a delivery that arrived mis-shelved; tap a shelf to lift its top items, tap another shelf to move them. Items stack on a matching item or onto an empty spot. Undo is free. Replaces the earlier Cat Stack (which replaced the first 3D-looking nuts-and-bolts version, rejected because static sprites cannot look 3D). Original name and art (the genre is generic; do not copy another game's name or assets).

## Nine departments, one rule each (10 levels each, repeating every 90 levels with more items)
| Department | Items | Rule |
|---|---|---|
| Clothing Corner | folded shirts | sort so every stack is one colour (any empty shelf will do) |
| Book Nook | books with subjects | every shelf has a sign: a book may only go on its own subject's shelf. The delivery starts mixed up; one shelf starts bare and the cart arrives loaded |
| Boutique | shirts and books together | racks take only shirts, book shelves take only books; sort both. The bin is just for moving things around |
| Toy Aisle | stacking rings (sizes 1 to 5) | **size order**: a bigger toy can never sit on a smaller one, runs must nest, a set is finished only when sorted biggest at the bottom |
| Pantry | glass jars and tins | **fragile jars**: the dots on a lid are the moves a jar has left; at zero it cracks and cannot be moved again. Tins never wear out. Undo gives the move back |
| Shoe Wall | sneakers, left and right | **pairs**: a stack must alternate left, right, left, right (a run is a stretch of alternating shoes; two of the same side can't touch) |
| Gift Corner | wrapped presents | **padlocks**: some shelves are locked (nothing can be taken from or put on them) until enough other shelves are finished (full, one colour). Finishing a shelf pops the lock; undo closes it again |
| Customer Orders | shirts and books | **orders**: a ticket lists items ("2 red shirts + 1 science book"); dig them out and pack exactly that into the bag. Only ordered items fit, never more than asked, and packed items cannot be unpacked. Finished when the ticket is ticked off |
| Mixed Day | toys + padlocks (1-3), jar/tin shelves + fragile jars (4-6), shoe pairs + padlocks (7-10) | two rules at once |

Every 5th level of a department is a **breather** (smaller, no wrapped items) and every 10th is a **Stock Take** boss (bigger, special banner, bonus hint, cart and coins on the first clear).

## The engine (`arcade-server/shelf/engine.mjs`, pure ESM, no Date.now/Math.random)
- `specFor(level)` builds a level from its department and position (2 to 10 kinds of item, 3 to 8 high, wrapped items from the 7th level of a department, breather at position 5, boss at 10). `rules` lists the special rules in force (`size`, `fragile`, `pairs`, `locks`, `orders`); older saves stored one `mode`, still understood by `rulesOf`. A bay rule is `a`: `"any"`, `"shirt"`, `"book"` or a number (that one kind only), plus `s` (cart). Items are `{id, k, q, x}`: `x` is the toy size, the shoe side (1 left, 2 right) or the jar's moves left (7 = a tin that never wears out). A bay may carry `lock: n` (padlocked until n shelves are finished) or `bag: true` (the order bag).
- `generate(level)` deals a mess (random, filling bays) and proves it solvable with the solver; `par` = solver move count. Tests assert levels 1-120 are all solvable and fully dealt.
- `solve()` is a weighted best-first search that understands bay rules (used for par, hints, tests). `hint(st)` returns the next move of a real solution.
- `whyNot(st, a, b)` is the single source of truth for legality and for the message shown. `move`, `undo` (free; re-hides a revealed item), `addCart` (max 2 per level), `isSolved`, `bayDone`, `hasMoves`.
- **The difficulty curve is measured, not guessed.** `targetPar(level)` is the solution length a level should need (it climbs through a department, dips on a breather, peaks on a boss). `scripts/shelf-build-levels.mjs` deals 10 candidate boards for each of the first 100 levels, keeps the one closest to the target and records a near-optimal par from a slower search; the result is `arcade-server/shelf/levels.mjs` (`PICKS[level-1] = [seed bump, par]`). Rebuild it whenever the generator, a rule or the curve changes (about 20 seconds). A test checks that at least 80 of the 100 levels land near the curve.
- Stars: 3 within 10% of the best known solution, 2 within 40%, else 1. **Perfect** means you matched it (a gold line on the result card and a count on the home screen). First clears earn a hint every 2nd level and a cart every 4th. Profile + game live in localStorage `shelfstocker:v1`; nothing is stored on a server.

## Daily Delivery, coins and the decor shop
- **Daily Delivery** (`newDailyGame(day)`): one board per calendar day, the same for everyone (seeded from the date; the department rotates daily and the size follows the weekday: gentle Monday, big Sunday). Pays once per day (coins, a hint every 2nd streak day, a cart every 3rd); consecutive days build a streak (shown on Home). Replays earn nothing. A saved daily from an earlier day is dropped.
- **Coins**: levels pay coins on the first clear (4 + 3 per star, a bonus for a first perfect, 25 for a boss); the Daily pays 15 + stars + streak. Coins are fake and only buy cosmetics.
- **Shop & Closet** (`decor.mjs`, `Closet.tsx`, `closetArt.ts`, `Room.tsx`, `Lights.tsx`): **129 things to collect in 11 tabs**, bought with coins or earned. Tap any card to see it on a live preview of YOUR shop (try before you buy); nothing is spent until BUY. Earned items state exactly what to do ("Clear all ten Book Nook levels", "Collect 120 stars (72/120)"), the home button shows a NEW badge, and the result card lists what you just unlocked. No loot boxes, no odds, no timers, no real money.
  - **Rooms (23)**: the walls and floor behind your shelves (Cozy Boutique, Candy Shop, Retro Diner, Midnight Mall, Neon Arcade, Space Station...), 14 bought plus one earned by clearing each of the nine departments (Old Library, Sneaker Court...). `auto` keeps the department's own animated scene. Rooms are data (`THEME_LOOK`) turned into CSS by `Room.tsx`.
  - **Shelves (15)** (oak, steel, glass, marble, neon, rainbow, pixel blocks, chrome, solid gold...), **item looks (8)** (sticker outline, pastel, old film, pixel goods, glow edge, golden goods; post-processed once on the cached sprite, never per frame), **labels (8)**, **pets (13)** (cat, dog, bunny, hamster, bear, fox, panda, penguin, owl, stock bot, unicorn, baby dragon; they sit in the play room and hop when a shelf is finished), **corner pieces (14)** (cactus, palm, vending machine, globe, golden trophy...), **lights (9)**, **signs (11)**, **awnings (9)**, **rugs (9)** and **finishing pops (10)** (hearts, confetti, fireworks, golden rain...).
  - **Earning**: departments cleared, stars, deliveries stocked, perfect levels and a 7-day Daily streak (`grantUnlocks`, run after every win). Levels pay `6 + 4 per star` coins (+40 on a Stock Take, +8 for a first perfect); the Daily pays `20 + 4 per star + streak`.
  - Ids are `slot:value` and never change, so old saves keep working (`normalizeDecor` drops unknown ids and refuses to wear anything you do not own).
- **Seasons**: winter, spring and autumn change the drifting dust motes into snow, petals or leaves (a settings switch turns it off).

## Guided first move
The first three levels of every department show a pointing hand that taps the source shelf and then the target, with one line of advice for that department's rule, taken from the solver's first move (free, not a hint). It disappears after the first move and never comes back for that level (`profile.coached`).

## Drag, hints and sound
- **Drag to move**: press a shelf and drag; its top items follow your finger (tilting as you go) and the shelf under them glows green (a legal drop) or red (refused). Release to drop (with the usual arc) or spring back. Tapping still works exactly as before.
- **Ghost hint**: a hint sends a translucent copy of the items flying along the suggested move, twice, and lights both shelves.
- **Dead-end nudge**: after a few moves the solver quietly checks whether the board can still be finished; if not it suggests Undo and pulses the button (it only ever suggests, since a very hard board can rarely look stuck to a quick check).
- **Sound** (`audio.ts`): a synthesized set with envelopes (pick, drop, a thud that grows with the run, refusal buzz, unwrap pop, a stamp chime that rises with each finished shelf, unlock, glass crack, win fanfare, coin) and an optional very quiet music loop; both have switches and honour the arcade mute.

## Feel (the point of this version)
- Flat vector art (shirts, books with subject emblems, wrapped items, shelf signs) drawn once on canvases at 2x and reused as images. No WebGL, no per-frame React state.
- Select: items lift with an overshoot spring and the shelf glows. Move: one Web Animations arc per item (lift, tilt, glide, drop) with a squash on landing, a thud and a puff of dust, a little shelf wobble, light haptics, and a stagger between items. Mystery items stay wrapped until the item above has left, then pop with sparkles. A finished shelf stamps a gold check, hops its items and sparkles. A refused move shakes the shelf and the lifted items. Levels open with items dropping onto shelves one after another. Level clear sends a wave of hops and confetti before the result card.
- All animation is skipped in Calm mode and with reduced motion. `scripts/shelf-e2e.mjs` measures frame gaps and long tasks while items move (headless Chromium: p95 about 17ms on every size, including an 11-shelf 40-item level) and fails if that regresses. Not measured on a physical low-end phone.
- The page never scrolls; the layout (`computeLay`) picks the number of rows that makes items biggest, from 320x568 up.

## Accessibility
- Every shelf is a real button labelled like "Shelf 3, shelf for Science books, 4 of 5, top: blue shirt". A settings switch draws a symbol on each shirt; shirts also differ by pattern, and books by emblem.

## Home screen and living backgrounds
- **Home** (`Home.tsx`): a swinging wooden shop sign, a display stack you can tap (items hop with a thud, and one hops by itself now and then), PLAY / CONTINUE (shows the level and moves in progress), LEVELS, HOW TO PLAY, three department cards with star progress bars, and stats. It never scrolls (320x568 up to desktop; landscape uses two columns). The back arrow in a game returns here; the arrow on Home returns to the arcade.
- **Scenes** (`Scene.tsx`): one animated shop per department behind the game and the home screen. Clothing Corner: pastel polka-dot wall, swaying bunting, sunlight rays, a few hangers. Book Nook: wallpaper, faint bookcases down both sides, a swinging pendant lamp with a glowing light cone. Boutique: lavender wall, twinkling string lights, spotlights, swaying plants. All have drifting dust motes. Only transform/opacity animate (cheap) and everything is off in Calm mode and with reduced motion. Decorations hang just below the header while playing so they are not hidden.
- Extra motion: shelves that can take the lifted items glow softly green; lifted items bob; the level sign drops in; screens fade/slide in; unwrapping uses flecks of paper and sparkles.

## Mystery items (the rule)
- A wrapped item (shirts: a purple gift box with a gold ribbon, a bow and a big "?"; books: kraft paper with twine and a "?") shows nothing about what is inside. **A wrapped item never moves with a run**: `topRun` stops at the first wrapped item, so it can never give its colour away by moving along with the items above it. It is unwrapped only when it becomes the top item, or when its shelf is finished (a finished shelf unwraps everything on it). Undo wraps it again. The solver and the level generator use the same rule (wrapped items are `key + 32`), and tests plus the browser check assert it.

## Not built yet (deliberately)
Teacher class decks (sort by the teacher's own categories), which needs a teacher-facing editor, and anything that would use real money.

## Tests
- `node --test arcade-server/tests/shelf.test.mjs` (rules and refusals, win rule, mystery reveal and undo, carts, every level 1-120 solvable, hints finish levels in every department, stars/profile).
- `node scripts/shelf-e2e.mjs [--only iphone-p,laptop]` (six sizes): how-to cards, fit, tap rules, refusal messages, undo, hint, carts, real solves of Clothing Corner / Book Nook / Boutique with frame timing, an 11-shelf level 30, symbols switch, save/reload, level picker.

## App icon
`public/arcade/shelf-icon.png` (512x512) is pixel art drawn in code on a 64x64 grid by `node scripts/shelf-icon.mjs` (no browser needed): three stacked cable-knit sweaters, two books, a wooden shelf and a sparkle on a peach tile. It is the hub card icon. The in-game art is smooth vector on purpose (feel and smoothness); only the icon is pixel, like the other hub icons.

## Roadmap (all of it is now built except class decks)
**Where it is weak today.** Levels are generated and only three rules exist, so levels past 30 repeat the same three ideas with more items. Par comes from a heuristic solver, so 3 stars is not always meaningful. There is no authored teaching, no variety inside a department, and no reason to come back tomorrow.

**Phase 1: a better difficulty curve and a real tutorial (do first).**
- Measure difficulty instead of guessing: a harder-working solver reports optimal-ish par plus a difficulty score (search size, forced moves, how many dead ends). Generate several candidates per level and keep the one closest to a target curve; log the curve in a test.
- Authored first 3 levels of every department with a guided first move (a pointing hand and a one-line reason), so nobody needs the how-to card.
- Every 5th level a breather (easier, quick win); every 10th a "Stock Take" boss (bigger, with a unique look and a bigger reward).
- Meaningful stars: 3 stars = within 10% of the best known solution; add a gold "perfect" shelf-sparkle for optimal.
**Phase 2: more departments, one new rule each (the real expansion).**
- Toy Aisle: size order (a smaller item can only sit on a bigger one).
- Pantry: fragile and heavy (glass jars cannot go under heavy tins; cracks the item if you try).
- Shoe Wall: pairs (items come in left/right pairs that must end up side by side).
- Gift Corner: locked shelves (open with a key item you have to sort first).
- Customer Orders: a ticket asks for "2 red shirts + 1 science book"; pull exactly those items.
- "Mixed Day" levels combine two earlier rules; the world then repeats on a harder loop. Target 8 departments, 80 authored-curve levels before looping.
**Phase 3: feel and teaching polish.**
- Drag-to-move as well as tap-tap; a hint that animates a ghost item along the path instead of only lighting two shelves; a "why am I stuck" nudge (dead-end detection via the solver) with a one-tap undo to the last good state.
- A sound pass (real sfx set, a soft music loop, mute per type) and a stronger haptic pattern.
- Seasonal scene variants for the three existing scenes (holiday lights, autumn leaves).
**Phase 4: reasons to come back (only after the levels feel good).**
- Daily Delivery (same board for the class), a stock-room streak, shop decorating with the coins levels pay. No timers, no real money, no gambling-style rewards.
**Later and separate:** teacher class decks (sort by the teacher's own categories), which needs a teacher-facing editor.
**Quality gates for every phase:** `npm run arcade:test` and `node scripts/shelf-e2e.mjs` at six sizes stay green; every level is solver-proven; a bot playthrough of all levels records moves versus par; the page still never scrolls and frame times stay at 60fps in the browser check.

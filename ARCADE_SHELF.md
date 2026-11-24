# Shelf Stocker (`/arcade/shelf`)

You are the new stock clerk. Every level is a delivery that arrived mis-shelved; tap a shelf to lift its top items, tap another shelf to move them. Items stack on a matching item or onto an empty spot. Undo is free. Replaces the earlier Cat Stack (which replaced the first 3D-looking nuts-and-bolts version, rejected because static sprites cannot look 3D). Original name and art (the genre is generic; do not copy another game's name or assets).

## Three departments, one new rule each (10 levels each, repeating with more items)
| Department | Items | Rule |
|---|---|---|
| Clothing Corner | folded shirts | sort so every stack is one colour (any empty shelf will do) |
| Book Nook | books with subjects (Science, History, Fiction, Math, Art, Music, Nature, Space) | every shelf has a sign: a book may only go on its own subject's shelf. The delivery starts mixed up; one shelf starts bare and the cart arrives loaded |
| Boutique | shirts and books together | racks take only shirts, book shelves take only books; sort both. The bin is just for moving things around |

Carts/bins accept anything but must be empty when you finish. Wrapped mystery items (a shirt in a plastic bag, a book in kraft paper) show their contents once they reach the top. Refused moves always say why ("That shelf is for Science books.", "Only shirts go on a rack.").

## The engine (`arcade-server/shelf/engine.mjs`, pure ESM, no Date.now/Math.random)
- `specFor(level)` builds a level from its department and position (3 to 8 kinds of item, 4 to 8 high, wrapped items from the 7th level of a department). A bay rule is `a`: `"any"`, `"shirt"`, `"book"` or a number (that one kind only), plus `s` (cart).
- `generate(level)` deals a mess (random, filling bays) and proves it solvable with the solver; `par` = solver move count. Tests assert levels 1-120 are all solvable and fully dealt.
- `solve()` is a weighted best-first search that understands bay rules (used for par, hints, tests). `hint(st)` returns the next move of a real solution.
- `whyNot(st, a, b)` is the single source of truth for legality and for the message shown. `move`, `undo` (free; re-hides a revealed item), `addCart` (max 2 per level), `isSolved`, `bayDone`, `hasMoves`.
- Stars: 3 within 125% of par, 2 within 160%, else 1. First clears earn a hint every 2nd level and a cart every 4th. Profile + game live in localStorage `shelfstocker:v1`; nothing is stored on a server.

## Feel (the point of this version)
- Flat vector art (shirts, books with subject emblems, wrapped items, shelf signs) drawn once on canvases at 2x and reused as images. No WebGL, no per-frame React state.
- Select: items lift with an overshoot spring and the shelf glows. Move: one Web Animations arc per item (lift, tilt, glide, drop) with a squash on landing, a thud and a puff of dust, a little shelf wobble, light haptics, and a stagger between items. Mystery items stay wrapped until the item above has left, then pop with sparkles. A finished shelf stamps a gold check, hops its items and sparkles. A refused move shakes the shelf and the lifted items. Levels open with items dropping onto shelves one after another. Level clear sends a wave of hops and confetti before the result card.
- All animation is skipped in Calm mode and with reduced motion. `scripts/shelf-e2e.mjs` measures frame gaps and long tasks while items move (headless Chromium: p95 about 17ms on every size, including an 11-shelf 40-item level) and fails if that regresses. Not measured on a physical low-end phone.
- The page never scrolls; the layout (`computeLay`) picks the number of rows that makes items biggest, from 320x568 up.

## Accessibility
- Every shelf is a real button labelled like "Shelf 3, shelf for Science books, 4 of 5, top: blue shirt". A settings switch draws a symbol on each shirt; shirts also differ by pattern, and books by emblem.

## Not built yet (deliberately)
Daily delivery, home screen, shop decorating, teacher class decks, size-order and customer-order levels. Add them only after the levels feel good.

## Tests
- `node --test arcade-server/tests/shelf.test.mjs` (rules and refusals, win rule, mystery reveal and undo, carts, every level 1-120 solvable, hints finish levels in every department, stars/profile).
- `node scripts/shelf-e2e.mjs [--only iphone-p,laptop]` (six sizes): how-to cards, fit, tap rules, refusal messages, undo, hint, carts, real solves of Clothing Corner / Book Nook / Boutique with frame timing, an 11-shelf level 30, symbols switch, save/reload, level picker.

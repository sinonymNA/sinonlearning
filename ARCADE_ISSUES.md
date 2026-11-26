# Back Issues

Crates of old newspapers. Each level is one paper; solve every puzzle on it before the clock runs out. Route `/arcade/backissues`, hub id `backissues` (Brain shelf).

## Ramp
- Papers 1-3: crossword only. Paper 4: sudoku joins. Paper 7: word search. Paper 11: cryptogram (`UNLOCK` in `engine.mjs`). New types are introduced one at a time, with a how-to card.
- Later papers mix more puzzles (2 to 4, +1 on the last paper of a crate, the "special edition") and bigger/harder ones (`buildPuzzle` ramps in `engine.mjs`).
- Ten crates of ten papers; the crate's theme picks the word bank (`issues/words.mjs`: 10 themes x 24 original words with original clues, plus 40 sayings for cryptograms). Past crate 10 the themes repeat with later years.

## Time and fairness
- Each paper has a limit (`timeLimitFor`: sum of per-puzzle budgets x 1.15). The clock freezes behind any card and when the tab is hidden.
- Out of time: TRY AGAIN (fresh paper) or KEEP GOING with no timer (1 star). The menu can also switch the timer off.
- Stars: 3 with at least 45% of the time left, 2 with 20%, else 1; four or more hints cost a star. Hints are earned (+2 on a first clear, +5 on a special edition, cap 20).
- CHECK on a crossword is free; letter/word/square/word-find/cipher-letter reveals cost one hint.

## Files
- `arcade-server/issues/` pure ESM: `words.mjs`, `puzzles.mjs` (generators: free-form crossword, unique-solution sudoku 4/6/9, word search, cryptogram), `engine.mjs` (papers, actions, clock, stars, profile), tests in `arcade-server/tests/issues.test.mjs`.
- Client: `components/arcade/issues/{BackIssues,Puzzles}.tsx`, `issues.css`, `audio.ts`. Save: `backissues:v1` (profile + current paper). On-screen keyboard shows on touch devices; physical keyboard always works.
- Browser check: `node scripts/backissues-e2e.mjs` (six viewports; plays real papers 1, 4, 7, 11, the timeout card, relaxed mode).

## Look and feel (v2)
- Type: Fraktur mastheads, Playfair headlines, Old Standard body, Special Elite typewriter entries (self-hosted woff2 in `public/fonts/arcade/issues-*`, OFL). Paper grain is an inline SVG noise image. No emoji; icons are `Icons.tsx`.
- Motion (transforms/opacity, off in Calm and reduced-motion): letters pop as typed; a finished word/row/column/box ripples; word-search finds draw a highlighter stroke and strike the word; solving a puzzle slams a SOLVED stamp with a screen shake and paper scraps; papers unfold open; the home attic has a swinging bulb, dust and a crate that opens; the result card is a spinning front page with stars that stamp in one by one; the last 30s add a red vignette and the last 10s tick.
- Touch: typewriter-key keyboard, haptic buzz on keys and completions (not in Calm).
- A finished paper stays on screen behind its result card (saved papers with `done` are ignored on load).

## Ideas not built yet
Crossword with real black-square grids, class-made papers (teacher clue sets), a daily paper, a rival "editor" ghost time, more puzzle types (nonogram, logic grid, spot-the-difference).

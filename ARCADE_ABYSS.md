# Abyss (second arcade mode)

Abyss is a daily rarity-trivia game: type a *correct* answer to an open question; the less common the answer, the more points, and points become depth (10 m per point). The arcade now has two modes, switched from the top bar: **Party** (everything built before: the six class games, solo, Mastery Peak, Daily Puzzle, shop, characters) and **Abyss**.

Inspired by the mechanic of a rarity-scored daily trivia game. Names, tiers, fish, art, prompts and answer lists here are original.

## What exists
- **Daily Dive**: 7 prompts (same for everyone per UTC date, never two of one category), 25 s each, typed answers, 6 tiers: Bubble 10, Show-off 15, Shoal 30, Reef 60, Trench 85, Abyss Pearl 100 (max 700 = 7,000 m). Wrong/late = 0. Server starts and enforces the clock (25 s + 3 s grace); a page refresh keeps the same question and clock.
- **Guessing rule**: a guess that isn't on the list does NOT end the prompt. Keep guessing until one scores, the clock runs out (miss), or you've used 12 guesses (miss; the cap stops people brute-forcing the answer list). Unlisted guesses are remembered for the prompt and can be reported afterwards.
- **Unlimited**: endless prompts, 3 air tanks (a 0-point answer costs one), or "surface" to cash out.
- **Archive**: replay the last 14 days (no streak, no pearls).
- **Answer engine** (`arcade-server/abyss.mjs`): normalisation (accents, "the", punctuation), aliases, typo tolerance (1 edit for 5-8 letters, 2 for 9+, swapped letters count as one), ambiguous typos score nothing. If an answer is listed in two tiers the lower tier wins.
- **After each answer**: tier stamp, what it was counted as, a few deeper answers from higher tiers.
- **Progress** (signed-in): streak, best streak, dives, best score/depth, Unlimited best; streak milestones (5/14/30/60/100 days) unlock special fish.
- **Fish collection**: 24 droppable fish + 5 streak-only fish, procedural art (`FishArt.tsx`), 3 packs (Shallows 40, Reef 100, Deep 250 pearls). Pearls and fish live under a namespaced id (`abyss:<user>`), completely separate from Party coins/characters. Pearls: Daily Dive points/5, Unlimited points/10, capped 200/day. Pick an owned fish as your diver icon.
- **Guests** can play Daily/Unlimited; their run lives in localStorage; no pearls/streak.
- **Share**: copyable emoji result.
- "Report a valid answer" stores the report (per account, last 50).

## Honest limits
- **Content is the whole game and there is little of it yet**: 23 prompts, ~1,900 answers, tiers assigned by one editor's judgement (me). Daily dives repeat prompts across weeks. Valid answers I did not list score 0 until added. There is no review UI for reports and no bulk-import tool yet.
- Rarity here is editorial, not measured from players. Tier assignments will feel wrong sometimes; the report path exists to find those.
- Not built: Friends, themed packs, ads/premium unlocks, merch, cross-device accounts beyond the existing arcade accounts.
- Fish packs have no daily deals/spotlight (Party shop only).

## Next steps that matter most
1. Grow the prompt bank (target 200+): an admin tool that drafts prompts + tiered answers with the AI (needs `ANTHROPIC_API_KEY`) and a review screen.
2. Review queue for reported answers.
3. Calibrate tiers against real play data once players exist (answer frequencies).

## Files
`arcade-server/abyss.mjs` (engine), `arcade-server/data/abyssPrompts.mjs` (prompt bank), `handleAbyss` in `arcade-server/api.mjs` (`/api/arcade/abyss`), `components/arcade/AbyssClient.tsx` + `FishArt.tsx`, pages under `app/arcade/abyss/`, tests in `arcade-server/tests/abyss.test.mjs`.

## v2 look (animations + centred fish)
Full-screen underwater scene (`Scene` in `AbyssClient.tsx`): water darkens with depth, light rays fade, plankton drifts (and rushes past when you dive), glowing creatures appear in the deep, seaweed sways. Your selected fish sits in the centre of the screen with a timer ring around it and reacts (head-shake on an unlisted guess, hop on a score, spin + shockwave on Trench/Pearl, sinks on a miss). Depth counts up with a rolling number and zone names (Sunlight, Twilight, Midnight, Abyssal, Hadal). Home is a title screen with the fish, a big Daily Dive button and a dock (Unlimited, Archive, Fish, How to play). Written from a verbal description of the reference game's look; I could not see the reference screenshot.

## v3 look: retro pixel art (reference screenshots)
After seeing screenshots of the reference game's look, Abyss was rebuilt as a retro pixel-art game with original art, drawn procedurally: `components/arcade/PixelOcean.tsx` renders on a 150-px-wide logical canvas scaled up with `image-rendering: pixelated`. Sky, sun, drifting clouds and a boat with a flag at the surface; banded water that darkens with depth; light shafts; fish silhouettes; kelp; bubbles; glowing deep-sea specks; a depth ruler; tier markers (BUBBLE 10, SHOW-OFF 15 ...) placed at current depth + points x 10 m so you see where each tier would take you; flavour text at set depths; CRT scanline overlay. Your selected fish is rasterised to a 30-px sprite and used as the diver. Pixel fonts (VT323, Press Start 2P, both SIL OFL) are self-hosted in `public/fonts/arcade/`.
- A prompt first shows "descending - the clock starts in N" (server `LEAD_MS` = 2.5 s), then the 25 s clock; answering sinks the diver to the new depth with the camera following, then the tier banner.
- Abyss home/play screens are full-bleed (no app bars); a pixel menu button opens the menu; sound toggle uses the shared prefs.
- Desktop shows the game as a centred phone-width column (mobile-first design).
Not done: the reference's puffer-party/themed-pack/merch menus; hand-drawn sprites (the diver is the procedural fish, pixelated).

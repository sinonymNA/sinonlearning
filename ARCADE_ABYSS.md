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
- **Content is the whole game and there is still not much of it**: 58 prompts, ~5,500 answers (was 23 / ~1,900), tiers assigned by one editor's judgement (me). A full-time trivia game would want several hundred. Check any batch with `npm run abyss:audit`. Daily dives repeat prompts across weeks. Valid answers I did not list score 0 until added. There is no review UI for reports and no bulk-import tool yet.
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

## Growing the bank
- Hand-written banks live in `arcade-server/data/abyssPrompts.mjs`, `abyssPrompts2.mjs`, `abyssPrompts3.mjs`. `npm run abyss:audit` and the test-suite check ids, all six tiers, repeats, answers in two tiers and "starts/ends with" rules.
- `npm run abyss:draft -- "Name a type of knot"` asks the model for a DRAFT prompt in the same format (needs `ANTHROPIC_API_KEY`; never run in this build environment). Review every answer and tier by hand before pasting it in. Model output is a draft, not truth.
- I removed answers I wasn't confident were real before shipping, but the deepest tiers (trench/pearl) of the large lists are the most likely to contain mistakes. Use the in-game "report" button on misses to find the gaps.

## v4: fills any screen, 242 prompts, Puffer Party
- **Any screen size**: the pixel scene now fills the whole screen (iPad, laptop) with bigger pixels on tall screens; the HUD, prompt and input stay in a centred 620 px column (`.px-col`). Canvas width is computed from the screen (`PixelOcean.resize`).
- **Content**: Abyss bank 58 -> 242 prompts (~17,700 answers, 30 categories). The 58 hand-tiered prompts are unchanged; 184 more are *auto-tiered by position* from flat lists in `arcade-server/data/categories{A,B,C}.mjs` (answers written most-obvious first; first ~6 = Bubble, next ~3 = Show-off, then ~30% Shoal, ~28% Reef, ~17% Trench, ~7% Pearl). Auto-tiering is much cruder than hand tiering: expect some tier calls to feel off. Lists with 12-29 answers are only used by Puffer Party. `npm run abyss:audit` also reports answers dropped for breaking a "starts with" rule.
- **Puffer Party** (multiplayer, `arcade-server/games/pufferParty.mjs`, client `components/arcade/games/PufferParty.tsx`): tables of 3-6; a category from the same bank (250 categories); the puffer sits on a player who must say something on the list before their turn timer ends (starts 14 s, 0.6 s shorter per pass, floor 7 s); a valid answer passes the puffer to the next seat; an unlisted guess keeps the turn; a repeated answer is rejected; running out of time pops it: -1 life (3 lives), new category, next player is up; last one standing wins. Points: 10 + rarity bonus (0/2/5/10/15/25); +4 to everyone else on a pop; survivors +15/life, winner +30. Answers are validated server-side; only SAID answers ever appear in a view. Bots, solo practice, projector view, quick-chat phrases and the how-to card are included. Lives/turn time are constants (not host settings yet).

## Themed dives (movies, sports, music, TV, games)
- **What:** seven prompts from ONE theme, each theme with its own animated pixel world (`components/arcade/ThemeScene.tsx`): Movie Night (neon boulevard, marquee theatre, searchlights), Sports Arena (hardwood, stands, scoreboard, LED board), Music Hall (equaliser wall, speaker stacks, light beams, disco ball), Screen Time (a wall of channel-surfing CRTs), Game On (a pixel kingdom of castles, floating islands, gem blocks and coins). The player's fish rides an original glass bowl on wheels; every answer rolls the world forward (distance = points x 10, shown in FRAMES / YARDS / BEATS / EPISODES / LEVELS). Reactions: hop + confetti on great answers, shake on misses.
- **Questions:** `arcade-server/data/themePrompts.mjs` = 58 flat, most-famous-first lists (name/alias=alias|...), auto-tiered by position exactly like categories (`fromCategory`). They also join the general Abyss pool (daily/unlimited), which is now 300 prompts. Theme presentation metadata lives in the tiny `themeMeta.mjs` (the client imports only that, never the banks).
- **Engine/API:** run mode `theme` (`AB.newRun("theme", {id, theme})`, `themeIds`, `recordTheme`, `pearlsForTheme` = points/8, per-theme best in `profile.themeBest`), `handleAbyss` start/answer accept `mode: "theme", theme: <id>`, store key `abyss:theme:<id>`; a finished themed run starts a fresh one. Guests keep a client-held run like Unlimited. Tests: `arcade-server/tests/abyssThemes.test.mjs`; browser: `node scripts/abyss-theme-e2e.mjs`.
- **Ocean polish:** big creatures cross the water column (whales, manta rays, jellyfish), reaction bursts (bubbles / golden shockwave / ink cloud) and speed lines while diving.
- **Limits:** lists were written from general knowledge and are not human-reviewed; rarity is the list order, not measured data. Use the existing report button (and `npm run abyss:audit`) to find bad entries. Scene art is original but the pixel look was not tuned on real phones.


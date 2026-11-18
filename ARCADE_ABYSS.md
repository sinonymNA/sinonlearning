# Abyss (second arcade mode)

Abyss is a daily rarity-trivia game: type a *correct* answer to an open question; the less common the answer, the more points, and points become depth (10 m per point). The arcade now has two modes, switched from the top bar: **Party** (everything built before: the six class games, solo, Mastery Peak, Daily Puzzle, shop, characters) and **Abyss**.

Inspired by the mechanic of a rarity-scored daily trivia game. Names, tiers, fish, art, prompts and answer lists here are original.

## What exists
- **Daily Dive**: 7 prompts (same for everyone per UTC date, never two of one category), 25 s each, typed answers, 6 tiers: Bubble 10, Show-off 15, Shoal 30, Reef 60, Trench 85, Abyss Pearl 100 (max 700 = 7,000 m). Wrong/late = 0. Server starts and enforces the clock (25 s + 3 s grace); a page refresh keeps the same question and clock.
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

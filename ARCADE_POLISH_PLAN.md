# Arcade "make it actually fun" plan

Principle: fun = (a) everyone has something to DO every few seconds, (b) tension you can see and hear, (c) big readable moments, (d) a reason to say "again!". We have the rules right; this plan adds depth, juice and identity.

## Diagnosis (honest)
1. Spectators are idle: Hot Potato = 1 active player of 6; Quick Draw guessers type alone; LOS is one tap per 20 s.
2. Visual sameness: one navy bg, white "paper" cards, emoji as art. No signature character, no per-game identity, no hierarchy (everything is a card).
3. Weak feedback: no shake/flash/stamps, thin sound, no rewards screen that celebrates *people* ("Fastest finger", "Wordsmith").
4. Few decisions: artists get a word; Hot Potato has no scoring tension beyond hearts.

## Phase 1 - mechanics + identity  (DONE - shipped, unit + browser tested)
Mechanics (all server-authoritative, unit-tested)
- Hot Potato: LIVE TYPING preview (spectators watch letters appear), "Boom guess" mini-game for everyone not holding (tap when you think it blows; closest scores), quick-pass speed bonus, Wordsmith (longest word) award.
- Quick Draw: artist CHOOSES 1 of 3 words (skribbl-style), guessers see "choosing…".
- Last One Standing: streak points, "Fastest finger" award.
- All games: end-of-game AWARDS shown on the results screen (people, not just scores).
Visual
- Original SVG potato character (face reacts to heat, sweats, steams, bursts), replacing the emoji.
- Per-game themes (own background, accent, type treatment) instead of one dark card theme.
- Juice: screen shake + flash + stamped "BOOM!"/"ELIMINATED!", accelerating tick sound with heat.
- Home page: bold, asymmetric game tiles with custom art.

## Phase 2 - depth
- Hot Potato: alphabet bonus (collect letters -> extra heart), "double fuse" hot-hands streaks, spicy sequences late.
- Last One Standing: power-ups for the consolation round (e.g. "revive" lottery), risk answers (double or nothing).
- Quick Draw: guesser emoji reactions that pay the artist, hint purchase; Telephone: sticker/stamp tools, per-step audience reactions in the reveal.
- Imposter: accusation emotes, "alibi" one-tap quick answers for fast pacing, per-seat speech bubbles with typing animation.

## Phase 3 - retention & feel
- Session recap ("your night"), streaks, cosmetic unlocks tied to awards, sound/music pack (loops per game), haptics on phones.
- Real playtest protocol: 1 class, observe: where do kids look away? Measure idle time per phase from server logs (add "idle seconds" metric to lab).

## Playtest checklist (do with real humans)
- Does anyone ask "can I play again?" Does anyone stop looking at the screen > 10 s? Which game do they request next?

## Status
- Phase 1 shipped: Hot Potato live typing / boom guess / quick-pass bonus; Quick Draw word choice; LOS streaks; awards on results for all games; SVG potato; per-game themes; BOOM stamp/shake/flash; accelerating tick; new home page.
- Still honest: nobody has playtested this with real kids yet. Phase 2 should be driven by what a real class does, not by guesses.

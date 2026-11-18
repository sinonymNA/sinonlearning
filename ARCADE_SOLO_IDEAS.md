# Solo game mode brainstorm

What exists now: **Solo practice** = the real multiplayer engine with bot opponents (any of the 5 games, 3 difficulties, capped coins). It is useful but it is "multiplayer with the people removed" - the weakest kind of solo. Real solo modes are built around a personal best, a clock, and "one more try".

Design rules for every solo mode: (1) a run is 90-150 s, (2) there is a number to beat (personal best + streak), (3) coins come from *improving*, not from time spent (farm-proof), (4) no student data: scores live on the anonymous account only.

## Candidates (ranked by fun-per-effort)

1. **Potato Rush (Hot Potato survival)** - one potato, one fuse. Every valid word passes it to an NPC and *adds* 2 s to the fuse, but the fuse starts at 12 s and shrinks each pass; sequences get nastier. Combo multiplier for fast passes, letters-used bonus for hearts. Score = words passed. Fully server-authoritative with the existing dictionary. *Effort: small. This is the best first build.*
2. **Streak Climb (Last One Standing)** - endless questions, 3 lives, speed multiplier, a ladder of tiers (Bronze→Diamond) every 5 correct. Wrong = lose a life. Uses the question bank and teacher sets, so it doubles as real study time. *Effort: small.*
3. **Daily Challenge** - one shared seed per day (same questions / sequences / draw word for everyone), one attempt, streak counter, bonus pack at 7-day streak. Brings kids back tomorrow. *Effort: medium (seeded content + per-day attempt table).*
4. **Case Files (Imposter detective)** - read a short transcript of 5 bot answers to a hidden word, ask up to 3 follow-up questions, accuse the bluffer. Bots use `related` words vs vague answers, so the puzzle is generated from the existing content sets. Pure deduction, no typing pressure. *Effort: medium.*
5. **Boss Battle (Hot Potato / words)** - a boss with HP; each valid word deals damage = word length; boss throws "curse letters" (must avoid a letter for 10 s). Weekly bosses with cosmetic drops. *Effort: medium.*
6. **Doodle Decoder (Telephone)** - look at a deliberately mangled chain (stored from real play, anonymised, moderated) and guess the original prompt from 4 options. Great for the reveal laughs. *Effort: medium; needs an opt-in/anonymised chain library, so privacy review first.*
7. **Sketch Sprint (Quick Draw)** - draw the word; "judges" are NOT AI - they are the fixed rules: coverage, colours used, time left. Probably unsatisfying without real guessers, so skip unless we add async guessing by other kids (a privacy question). *Not recommended now.*

## Recommendation
Build **Potato Rush** and **Streak Climb** next (both reuse validated engine code and are ~1 day each), then **Daily Challenge** on top of them for retention. Postpone Sketch Sprint.

## Economy guardrails
- Practice vs bots: 150 coins/day cap (shipped).
- Solo modes: pay on *personal best improvements* and daily first-run bonus, never per minute played.
- Packs now cost 40 / 100 / 250 / 600 coins; target a Classic pack every 1-2 days of casual solo play, a Legend pack roughly weekly.

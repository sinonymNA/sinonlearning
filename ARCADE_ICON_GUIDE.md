# Adding your own character icons (AI-generated or hand-drawn)

## How the game uses an icon
- One transparent PNG per character at `public/characters/<id>.png`, id = `i-` + lowercase name (e.g. `i-blorp.png`).
- Register it with ONE line in `arcade-server/characters.mjs` (the `IMG(...)` helper):
  `IMG("i-blorp", "Blorp", "rare", "Tagline shown on the card.")`
- It then appears everywhere automatically: packs, collection, avatar picker, game screens, podium, projector.

## Image spec
- 1024x1024 PNG, transparent background, character centred filling ~80% of the square, front-facing, nothing cropped.
- Under ~300 KB each (run them through squoosh.app or tinypng.com) - up to 40 players load these at once.
- No text, no frame, no drop-shadow, no background scene.
- If your AI tool can't make a transparent background, ask for a flat solid colour (pure green #00FF00) and tell me the colour - I can key it out.

## Style (to match the existing characters)
Flat colours, thick dark-navy outline (#14163a), simple rounded shapes, big expressive eyes, a small white highlight top-left, cute and kid-friendly, completely original (no existing cartoon/game characters).

## ChatGPT prompt - step 1 (lock the style, do this once per chat)
> I'm making collectible mascot icons for a kids' classroom game. I'll attach 3 reference images of the existing style. Study them. For every image I ask for, match: flat colours, one thick dark navy (#14163a) outline of equal weight everywhere, simple rounded body, big expressive eyes with a small white shine, tiny cheek blush, small white highlight blob top-left of the body, no gradients, no texture, no shadow. Front-facing, centred, filling about 80% of a square 1024x1024 canvas, TRANSPARENT background (PNG), no text, no border, no scene. Everything must be an original character, family-friendly. Reply "ready" and wait for my first character.

(Attach 3 screenshots from `/arcade/shop/demo` -> "Peek at everyone" so it sees the real style.)

## ChatGPT prompt - step 2 (repeat per character; fill the [BRACKETS])
> Character: [NAME]. Description: [BODY SHAPE + 2-3 DISTINCT FEATURES + COLOUR PALETTE, e.g. "a round purple jelly blob with tiny bat wings, one oversized eye and a gap-toothed grin, purple with yellow accents"]. Personality: [e.g. mischievous]. Rarity: [common = very simple, 1 colour + 1 feature | uncommon = + one accessory | rare = + distinctive accessory & 3 colours | epic = more detailed, glowing or magical element | legendary = most elaborate, crown/aura/sparkles]. Follow the style rules from before exactly. One character only, transparent PNG, 1024x1024.

## ChatGPT prompt - step 3 (names + taglines + rarities so I can register them)
> Invent [20] original kid-friendly collectible mascots for a classroom party game. Output ONLY a table with columns: id (i- + lowercase single word, e.g. i-blorp), name, rarity (common/uncommon/rare/epic/legendary; use roughly 40% common, 28% uncommon, 18% rare, 10% epic, 4% legendary), tagline (one funny sentence under 70 characters), image description (one sentence I can paste into an image generator). No existing characters, no brands.

## Giving them to me
1. Easiest: GitHub -> your repo -> branch `claude/classroom-arcade-build-pfy4tb` -> open `public/characters/` -> Add file -> Upload files -> commit to that branch.
2. Then tell me "icons uploaded" and paste the table from step 3. I'll register them, check they look right at every size, and add tests.
3. (If you can attach images straight into this chat and I receive them as files, that works too.)

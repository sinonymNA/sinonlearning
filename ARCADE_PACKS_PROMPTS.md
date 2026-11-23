# ChatGPT prompts for the Pack Rush card sheets

One sheet per pack set = **12 creatures in a 4 columns x 3 rows grid** (4x3, not 4x2, because 4x2 only fits 8). Six sheets = all 72 cards. Each prompt below is ready to paste into ChatGPT (use a chat that can generate images).

## How to use
1. Start a new chat and paste the **Meadow** prompt. Take the best of 2 or 3 tries. Landscape (1536x1024) is fine.
2. For the other sets, attach your favourite Meadow sheet and add this line at the end of the prompt: *"Match the pixel size, outline and shading style of the attached sheet exactly."* That keeps all 72 creatures looking like one game.
3. Save the results as `art-src/meadow.png`, `cave.png`, `reef.png`, `sky.png`, `void.png`, `neon.png`.
4. Run `node scripts/packs-art-build.mjs`. It cuts each sheet into 12 cells, deletes the flat background colour (the colour of the top-left pixel), shrinks each creature into a 64px pixel cell, limits the colours so it reads as real pixel art, and writes `public/arcade/packs/cards.png` and `art.json`. Sets you skip keep the generated art, so you can do one sheet at a time.
5. Commit and deploy.

## Honest tips
- ChatGPT draws *pixel-art-looking* pictures, not true pixel grids. The build script cleans that up, but it works best when every creature stays inside its own cell and the background is perfectly flat. If a creature crosses into the next cell or the background has shading, re-roll the sheet.
- Each set has its own background colour (magenta or green) chosen so it does not clash with that set's creatures. If parts of a creature vanish, lower the tolerance: `node scripts/packs-art-build.mjs --tol 45`.
- If you get fewer or more than 12 creatures, say: *"Redo it with exactly 12 creatures in 4 columns and 3 rows, each in its own equal cell."*
- Check your school's rules about AI-generated images, and do not ask it to copy an existing game's creatures.
- For an even crisper result, clean a sheet up by hand in Piskel or Aseprite, or let a student redraw the favourites.

---

## Meadow sheet (background: pure magenta #FF00FF)

```
Create ONE image: a sprite sheet of 12 original collectible-card creatures arranged in a perfect grid of 4 columns by 3 rows (4 across, 3 down), read left to right then top to bottom. Every cell is exactly the same size.

BACKGROUND: perfectly flat, solid pure magenta (#FF00FF) everywhere behind the creatures. No gradients, no shadows, no ground, no scenery, no glow, no borders, no grid lines, no labels, no text, no numbers. Only the creatures on the flat colour. Do not use magenta or hot pink on any creature.

STYLE: chunky retro pixel art like a 16-bit game sprite. It should look as if each creature was drawn on a tiny 48x48 pixel canvas and enlarged with nearest-neighbor scaling: big, clearly visible square pixels, hard edges, NO anti-aliasing, NO blur, NO smooth gradients. Limited palette of about 12 to 16 colours per creature. A 1-pixel dark outline around every creature. Simple 3-tone shading with light from the top-left. Cute chunky mascot proportions, big expressive eyes with one white highlight pixel. Full body visible, front-facing or slight three-quarter view, standing, centred in its cell with about 12% empty margin on every side so nothing touches the cell edges. Exactly the same pixel size and the same style for all 12.

THEME: Meadow, a sunny grassland: bunnies, caterpillars, bees, sprouts, flower-and-leaf creatures. Colours lean towards greens, yellows, soft pinks and sky blues.

THE 12 CREATURES, in this exact order (cell 1 is top-left, cell 4 is top-right, cell 12 is bottom-right):
1. Wobzard (common)
2. Tambble (common)
3. Blobun (common)
4. Pipzard (common)
5. Grubble (common)
6. Flinix (uncommon)
7. Blomoth (uncommon)
8. Wobbble (uncommon)
9. Zorling (rare)
10. Flibun (rare)
11. Zorbble (epic)
12. Fliling (legendary)

RARITY GUIDE: common = simple and friendly, basic shape. uncommon = one extra feature (ears, tail, spots). rare = a distinctive feature (horns, big ears, glowing marks). epic = more elaborate, with wings or a crest. legendary = the most majestic, with a crown or golden accents, still the same pixel size.

Name hints (each name is a made-up mashup, use it for the idea). Beginnings: Wob = wobbly, Tam = round and cuddly, Blo = puffy, Pip = tiny, Gru = grumpy, Fli = flighty and light, Mo = mossy and soft, Kru = crunchy and armoured, Zor = zappy. Endings: -zard = lizard, -bun = bunny, -moth = moth, -kin = little gremlin, -ling = small baby critter, -nix = sprite or fox-like spirit, -tuff = fluffy ball, -bble = bubbly blob.

ORIGINALITY: every design must be completely original. Do not copy or imitate Pokemon, Digimon or any other existing game or franchise.
```

---

## Cave sheet (background: pure magenta #FF00FF)

```
Create ONE image: a sprite sheet of 12 original collectible-card creatures arranged in a perfect grid of 4 columns by 3 rows (4 across, 3 down), read left to right then top to bottom. Every cell is exactly the same size.

BACKGROUND: perfectly flat, solid pure magenta (#FF00FF) everywhere behind the creatures. No gradients, no shadows, no ground, no scenery, no glow, no borders, no grid lines, no labels, no text, no numbers. Only the creatures on the flat colour. Do not use magenta or hot pink on any creature.

STYLE: chunky retro pixel art like a 16-bit game sprite. It should look as if each creature was drawn on a tiny 48x48 pixel canvas and enlarged with nearest-neighbor scaling: big, clearly visible square pixels, hard edges, NO anti-aliasing, NO blur, NO smooth gradients. Limited palette of about 12 to 16 colours per creature. A 1-pixel dark outline around every creature. Simple 3-tone shading with light from the top-left. Cute chunky mascot proportions, big expressive eyes with one white highlight pixel. Full body visible, front-facing or slight three-quarter view, standing, centred in its cell with about 12% empty margin on every side so nothing touches the cell edges. Exactly the same pixel size and the same style for all 12.

THEME: Cave, a glowing crystal cave: rock critters, bats, moles, lizards, gem-backed creatures. Colours lean towards warm oranges, browns, amber and a few teal crystal accents.

THE 12 CREATURES, in this exact order (cell 1 is top-left, cell 4 is top-right, cell 12 is bottom-right):
1. Pipkin (common)
2. Pipling (common)
3. Tamnix (common)
4. Tammoth (common)
5. Blozard (common)
6. Pipbble (uncommon)
7. Moling (uncommon)
8. Pipbun (uncommon)
9. Mokin (rare)
10. Krumoth (rare)
11. Zortuff (epic)
12. Zorkin (legendary)

RARITY GUIDE: common = simple and friendly, basic shape. uncommon = one extra feature (ears, tail, spots). rare = a distinctive feature (horns, big ears, glowing marks). epic = more elaborate, with wings or a crest. legendary = the most majestic, with a crown or golden accents, still the same pixel size.

Name hints (each name is a made-up mashup, use it for the idea). Beginnings: Wob = wobbly, Tam = round and cuddly, Blo = puffy, Pip = tiny, Gru = grumpy, Fli = flighty and light, Mo = mossy and soft, Kru = crunchy and armoured, Zor = zappy. Endings: -zard = lizard, -bun = bunny, -moth = moth, -kin = little gremlin, -ling = small baby critter, -nix = sprite or fox-like spirit, -tuff = fluffy ball, -bble = bubbly blob.

ORIGINALITY: every design must be completely original. Do not copy or imitate Pokemon, Digimon or any other existing game or franchise.
```

---

## Reef sheet (background: pure magenta #FF00FF)

```
Create ONE image: a sprite sheet of 12 original collectible-card creatures arranged in a perfect grid of 4 columns by 3 rows (4 across, 3 down), read left to right then top to bottom. Every cell is exactly the same size.

BACKGROUND: perfectly flat, solid pure magenta (#FF00FF) everywhere behind the creatures. No gradients, no shadows, no ground, no scenery, no glow, no borders, no grid lines, no labels, no text, no numbers. Only the creatures on the flat colour. Do not use magenta or hot pink on any creature.

STYLE: chunky retro pixel art like a 16-bit game sprite. It should look as if each creature was drawn on a tiny 48x48 pixel canvas and enlarged with nearest-neighbor scaling: big, clearly visible square pixels, hard edges, NO anti-aliasing, NO blur, NO smooth gradients. Limited palette of about 12 to 16 colours per creature. A 1-pixel dark outline around every creature. Simple 3-tone shading with light from the top-left. Cute chunky mascot proportions, big expressive eyes with one white highlight pixel. Full body visible, front-facing or slight three-quarter view, standing, centred in its cell with about 12% empty margin on every side so nothing touches the cell edges. Exactly the same pixel size and the same style for all 12.

THEME: Reef, a coral reef: fish, crabs, shells, jellyfish, sea bunnies, bubbly sea creatures. Colours lean towards teals, aqua blues, coral orange and sandy yellow.

THE 12 CREATURES, in this exact order (cell 1 is top-left, cell 4 is top-right, cell 12 is bottom-right):
1. Wobmoth (common)
2. Grukin (common)
3. Pipnix (common)
4. Grunix (common)
5. Flizard (common)
6. Tamkin (uncommon)
7. Grumoth (uncommon)
8. Krubble (uncommon)
9. Tamtuff (rare)
10. Bloling (rare)
11. Flimoth (epic)
12. Krutuff (legendary)

RARITY GUIDE: common = simple and friendly, basic shape. uncommon = one extra feature (ears, tail, spots). rare = a distinctive feature (horns, big ears, glowing marks). epic = more elaborate, with wings or a crest. legendary = the most majestic, with a crown or golden accents, still the same pixel size.

Name hints (each name is a made-up mashup, use it for the idea). Beginnings: Wob = wobbly, Tam = round and cuddly, Blo = puffy, Pip = tiny, Gru = grumpy, Fli = flighty and light, Mo = mossy and soft, Kru = crunchy and armoured, Zor = zappy. Endings: -zard = lizard, -bun = bunny, -moth = moth, -kin = little gremlin, -ling = small baby critter, -nix = sprite or fox-like spirit, -tuff = fluffy ball, -bble = bubbly blob.

ORIGINALITY: every design must be completely original. Do not copy or imitate Pokemon, Digimon or any other existing game or franchise.
```

---

## Sky sheet (background: pure magenta #FF00FF)

```
Create ONE image: a sprite sheet of 12 original collectible-card creatures arranged in a perfect grid of 4 columns by 3 rows (4 across, 3 down), read left to right then top to bottom. Every cell is exactly the same size.

BACKGROUND: perfectly flat, solid pure magenta (#FF00FF) everywhere behind the creatures. No gradients, no shadows, no ground, no scenery, no glow, no borders, no grid lines, no labels, no text, no numbers. Only the creatures on the flat colour. Do not use magenta or hot pink on any creature.

STYLE: chunky retro pixel art like a 16-bit game sprite. It should look as if each creature was drawn on a tiny 48x48 pixel canvas and enlarged with nearest-neighbor scaling: big, clearly visible square pixels, hard edges, NO anti-aliasing, NO blur, NO smooth gradients. Limited palette of about 12 to 16 colours per creature. A 1-pixel dark outline around every creature. Simple 3-tone shading with light from the top-left. Cute chunky mascot proportions, big expressive eyes with one white highlight pixel. Full body visible, front-facing or slight three-quarter view, standing, centred in its cell with about 12% empty margin on every side so nothing touches the cell edges. Exactly the same pixel size and the same style for all 12.

THEME: Sky, high among the clouds: cloud puffs, birds, wind spirits, star-and-lightning creatures. Colours lean towards whites, light blues and pale yellows with gold accents.

THE 12 CREATURES, in this exact order (cell 1 is top-left, cell 4 is top-right, cell 12 is bottom-right):
1. Wobtuff (common)
2. Wobkin (common)
3. Mobun (common)
4. Zorzard (common)
5. Flibble (common)
6. Krubun (uncommon)
7. Blotuff (uncommon)
8. Motuff (uncommon)
9. Tambun (rare)
10. Grubun (rare)
11. Flituff (epic)
12. Kruzard (legendary)

RARITY GUIDE: common = simple and friendly, basic shape. uncommon = one extra feature (ears, tail, spots). rare = a distinctive feature (horns, big ears, glowing marks). epic = more elaborate, with wings or a crest. legendary = the most majestic, with a crown or golden accents, still the same pixel size.

Name hints (each name is a made-up mashup, use it for the idea). Beginnings: Wob = wobbly, Tam = round and cuddly, Blo = puffy, Pip = tiny, Gru = grumpy, Fli = flighty and light, Mo = mossy and soft, Kru = crunchy and armoured, Zor = zappy. Endings: -zard = lizard, -bun = bunny, -moth = moth, -kin = little gremlin, -ling = small baby critter, -nix = sprite or fox-like spirit, -tuff = fluffy ball, -bble = bubbly blob.

ORIGINALITY: every design must be completely original. Do not copy or imitate Pokemon, Digimon or any other existing game or franchise.
```

---

## Void sheet (background: pure bright green #00FF00)

```
Create ONE image: a sprite sheet of 12 original collectible-card creatures arranged in a perfect grid of 4 columns by 3 rows (4 across, 3 down), read left to right then top to bottom. Every cell is exactly the same size.

BACKGROUND: perfectly flat, solid pure bright green (#00FF00) everywhere behind the creatures. No gradients, no shadows, no ground, no scenery, no glow, no borders, no grid lines, no labels, no text, no numbers. Only the creatures on the flat colour. Do not use green on any creature.

STYLE: chunky retro pixel art like a 16-bit game sprite. It should look as if each creature was drawn on a tiny 48x48 pixel canvas and enlarged with nearest-neighbor scaling: big, clearly visible square pixels, hard edges, NO anti-aliasing, NO blur, NO smooth gradients. Limited palette of about 12 to 16 colours per creature. A 1-pixel dark outline around every creature. Simple 3-tone shading with light from the top-left. Cute chunky mascot proportions, big expressive eyes with one white highlight pixel. Full body visible, front-facing or slight three-quarter view, standing, centred in its cell with about 12% empty margin on every side so nothing touches the cell edges. Exactly the same pixel size and the same style for all 12.

THEME: Void, deep space: star critters, moons, comet tails, shadow creatures, creatures with extra eyes. Colours lean towards deep purples, indigo and black-blue, with glowing star-white and violet highlights.

THE 12 CREATURES, in this exact order (cell 1 is top-left, cell 4 is top-right, cell 12 is bottom-right):
1. Mobble (common)
2. Gruzard (common)
3. Krukin (common)
4. Wobnix (common)
5. Wobbun (common)
6. Blokin (uncommon)
7. Krunix (uncommon)
8. Grutuff (uncommon)
9. Tamzard (rare)
10. Blonix (rare)
11. Piptuff (epic)
12. Zormoth (legendary)

RARITY GUIDE: common = simple and friendly, basic shape. uncommon = one extra feature (ears, tail, spots). rare = a distinctive feature (horns, big ears, glowing marks). epic = more elaborate, with wings or a crest. legendary = the most majestic, with a crown or golden accents, still the same pixel size.

Name hints (each name is a made-up mashup, use it for the idea). Beginnings: Wob = wobbly, Tam = round and cuddly, Blo = puffy, Pip = tiny, Gru = grumpy, Fli = flighty and light, Mo = mossy and soft, Kru = crunchy and armoured, Zor = zappy. Endings: -zard = lizard, -bun = bunny, -moth = moth, -kin = little gremlin, -ling = small baby critter, -nix = sprite or fox-like spirit, -tuff = fluffy ball, -bble = bubbly blob.

ORIGINALITY: every design must be completely original. Do not copy or imitate Pokemon, Digimon or any other existing game or franchise.
```

---

## Neon sheet (background: pure bright green #00FF00)

```
Create ONE image: a sprite sheet of 12 original collectible-card creatures arranged in a perfect grid of 4 columns by 3 rows (4 across, 3 down), read left to right then top to bottom. Every cell is exactly the same size.

BACKGROUND: perfectly flat, solid pure bright green (#00FF00) everywhere behind the creatures. No gradients, no shadows, no ground, no scenery, no glow, no borders, no grid lines, no labels, no text, no numbers. Only the creatures on the flat colour. Do not use green on any creature.

STYLE: chunky retro pixel art like a 16-bit game sprite. It should look as if each creature was drawn on a tiny 48x48 pixel canvas and enlarged with nearest-neighbor scaling: big, clearly visible square pixels, hard edges, NO anti-aliasing, NO blur, NO smooth gradients. Limited palette of about 12 to 16 colours per creature. A 1-pixel dark outline around every creature. Simple 3-tone shading with light from the top-left. Cute chunky mascot proportions, big expressive eyes with one white highlight pixel. Full body visible, front-facing or slight three-quarter view, standing, centred in its cell with about 12% empty margin on every side so nothing touches the cell edges. Exactly the same pixel size and the same style for all 12.

THEME: Neon, a neon cyber city at night: glowing circuit-pattern creatures, robot animals, light-up critters. Colours lean towards hot pinks, electric cyan, violet and dark navy.

THE 12 CREATURES, in this exact order (cell 1 is top-left, cell 4 is top-right, cell 12 is bottom-right):
1. Flikin (common)
2. Kruling (common)
3. Monix (common)
4. Gruling (common)
5. Blobble (common)
6. Zorbun (uncommon)
7. Momoth (uncommon)
8. Zornix (uncommon)
9. Pipmoth (rare)
10. Mozard (rare)
11. Wobling (epic)
12. Tamling (legendary)

RARITY GUIDE: common = simple and friendly, basic shape. uncommon = one extra feature (ears, tail, spots). rare = a distinctive feature (horns, big ears, glowing marks). epic = more elaborate, with wings or a crest. legendary = the most majestic, with a crown or golden accents, still the same pixel size.

Name hints (each name is a made-up mashup, use it for the idea). Beginnings: Wob = wobbly, Tam = round and cuddly, Blo = puffy, Pip = tiny, Gru = grumpy, Fli = flighty and light, Mo = mossy and soft, Kru = crunchy and armoured, Zor = zappy. Endings: -zard = lizard, -bun = bunny, -moth = moth, -kin = little gremlin, -ling = small baby critter, -nix = sprite or fox-like spirit, -tuff = fluffy ball, -bble = bubbly blob.

ORIGINALITY: every design must be completely original. Do not copy or imitate Pokemon, Digimon or any other existing game or franchise.
```

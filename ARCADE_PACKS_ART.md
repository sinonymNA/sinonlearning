# Pack Rush: adding your own art (sprite sheets)

Short answer: **yes, sprite sheets make the game look much better**, and the game already loads them. Drop PNGs in `public/arcade/packs/`, edit `art.json`, redeploy. No code changes. Anything you do not supply keeps the generated art, so you can replace the art a little at a time.

## Only use art you have the rights to
Use art that you (or a student) drew, that someone gave you permission to use, or that is public-domain/CC0 or licensed for this use. **Do not use art ripped from other games** (Crack the Pack, Balatro, Pokemon...). It would put a school site at legal risk and it is not what we want to ship.

## Get a template
Open `/arcade/packs?art=1`, go to the ODDS tab, tap MAKE SHEETS. Or use the ready-made copies in `public/arcade/packs/template/` (`cards.png`, `packs.png`). Paint over them in Aseprite, Piskel, LibreSprite, Photoshop, anything that saves PNG.

## Card art: `cards.png`
- A grid, **12 columns**, cells in the order of the table below (left to right, then next row). 72 cells = 6 rows.
- Every cell is the **same square size**. The template uses 40x40; 48 or 64 is better if you want more detail. Pixel art scales up crisply, so use whole-pixel art, no blur or anti-aliasing.
- Two styles, set in `art.json` with `"transparent"`:
  - `false`: each cell is the finished picture, scene and creature together (full control).
  - `true`: each cell is just the creature on a **transparent** background; the game paints the set's background behind it.
- The frame, name banner, rarity gem, finishes (chrome, holo, gold, negative, glitch) and sell value are drawn by the game around your picture, so do not draw those.

## Pack art: `packs.png`
- One row, **6 packs** side by side in set order (Meadow, Cave, Reef, Sky, Void, Neon). Template cell: 48x64.
- Draw the pack **whole**, crimped top and bottom. The game tears the top ~23% off as you tap (a jagged cut around row 15 of 64), so keep important details out of that strip's lower edge. Leave the middle band (rows ~40-52) fairly plain: the set name is printed there by the game.

## `art.json`
```json
{
  "cards": { "sheet": "cards.png", "cell": 64, "cols": 12, "transparent": true },
  "packs": { "sheet": "packs.png", "w": 48, "h": 64, "cols": 6 }
}
```
Leave out `"cards"` or `"packs"` to keep the generated version of that part. The shipped `art.json` is `{}` (all generated). Use the file names exactly as written, in `public/arcade/packs/`.

## Card order
| # | Card | Set | Rarity | Cell (col,row) |
|---|---|---|---|---|
| 1 | Wobzard | Meadow | common | 0,0 |
| 2 | Tambble | Meadow | common | 1,0 |
| 3 | Blobun | Meadow | common | 2,0 |
| 4 | Pipzard | Meadow | common | 3,0 |
| 5 | Grubble | Meadow | common | 4,0 |
| 6 | Flinix | Meadow | uncommon | 5,0 |
| 7 | Blomoth | Meadow | uncommon | 6,0 |
| 8 | Wobbble | Meadow | uncommon | 7,0 |
| 9 | Zorling | Meadow | rare | 8,0 |
| 10 | Flibun | Meadow | rare | 9,0 |
| 11 | Zorbble | Meadow | epic | 10,0 |
| 12 | Fliling | Meadow | legendary | 11,0 |
| 13 | Pipkin | Cave | common | 0,1 |
| 14 | Pipling | Cave | common | 1,1 |
| 15 | Tamnix | Cave | common | 2,1 |
| 16 | Tammoth | Cave | common | 3,1 |
| 17 | Blozard | Cave | common | 4,1 |
| 18 | Pipbble | Cave | uncommon | 5,1 |
| 19 | Moling | Cave | uncommon | 6,1 |
| 20 | Pipbun | Cave | uncommon | 7,1 |
| 21 | Mokin | Cave | rare | 8,1 |
| 22 | Krumoth | Cave | rare | 9,1 |
| 23 | Zortuff | Cave | epic | 10,1 |
| 24 | Zorkin | Cave | legendary | 11,1 |
| 25 | Wobmoth | Reef | common | 0,2 |
| 26 | Grukin | Reef | common | 1,2 |
| 27 | Pipnix | Reef | common | 2,2 |
| 28 | Grunix | Reef | common | 3,2 |
| 29 | Flizard | Reef | common | 4,2 |
| 30 | Tamkin | Reef | uncommon | 5,2 |
| 31 | Grumoth | Reef | uncommon | 6,2 |
| 32 | Krubble | Reef | uncommon | 7,2 |
| 33 | Tamtuff | Reef | rare | 8,2 |
| 34 | Bloling | Reef | rare | 9,2 |
| 35 | Flimoth | Reef | epic | 10,2 |
| 36 | Krutuff | Reef | legendary | 11,2 |
| 37 | Wobtuff | Sky | common | 0,3 |
| 38 | Wobkin | Sky | common | 1,3 |
| 39 | Mobun | Sky | common | 2,3 |
| 40 | Zorzard | Sky | common | 3,3 |
| 41 | Flibble | Sky | common | 4,3 |
| 42 | Krubun | Sky | uncommon | 5,3 |
| 43 | Blotuff | Sky | uncommon | 6,3 |
| 44 | Motuff | Sky | uncommon | 7,3 |
| 45 | Tambun | Sky | rare | 8,3 |
| 46 | Grubun | Sky | rare | 9,3 |
| 47 | Flituff | Sky | epic | 10,3 |
| 48 | Kruzard | Sky | legendary | 11,3 |
| 49 | Mobble | Void | common | 0,4 |
| 50 | Gruzard | Void | common | 1,4 |
| 51 | Krukin | Void | common | 2,4 |
| 52 | Wobnix | Void | common | 3,4 |
| 53 | Wobbun | Void | common | 4,4 |
| 54 | Blokin | Void | uncommon | 5,4 |
| 55 | Krunix | Void | uncommon | 6,4 |
| 56 | Grutuff | Void | uncommon | 7,4 |
| 57 | Tamzard | Void | rare | 8,4 |
| 58 | Blonix | Void | rare | 9,4 |
| 59 | Piptuff | Void | epic | 10,4 |
| 60 | Zormoth | Void | legendary | 11,4 |
| 61 | Flikin | Neon | common | 0,5 |
| 62 | Kruling | Neon | common | 1,5 |
| 63 | Monix | Neon | common | 2,5 |
| 64 | Gruling | Neon | common | 3,5 |
| 65 | Blobble | Neon | common | 4,5 |
| 66 | Zorbun | Neon | uncommon | 5,5 |
| 67 | Momoth | Neon | uncommon | 6,5 |
| 68 | Zornix | Neon | uncommon | 7,5 |
| 69 | Pipmoth | Neon | rare | 8,5 |
| 70 | Mozard | Neon | rare | 9,5 |
| 71 | Wobling | Neon | epic | 10,5 |
| 72 | Tamling | Neon | legendary | 11,5 |

(Names are fixed by the game and appear on the card. If a student draws a creature, tell me what it is called and I will rename the card.)

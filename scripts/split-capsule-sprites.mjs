/**
 * Splits capsule-sprites.png into individual asset files.
 *
 * Input:  public/assets/capsule/capsule-sprites.png
 * Output: public/assets/capsule/{name}.png  (and caps/cap-fox.png)
 *
 * Run with:  node scripts/split-capsule-sprites.mjs
 */

import sharp from "sharp";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public/assets/capsule/capsule-sprites.png");
const OUT = join(ROOT, "public/assets/capsule");

// Cell grid: 512×512 per cell, 3 columns × 4 rows
const CELL = 512;

function cell(col, row) {
  return { left: col * CELL, top: row * CELL, width: CELL, height: CELL };
}

const SPRITES = [
  // ── Row 0 ──────────────────────────────────────────────────────────────────
  { name: "mascot",           ...cell(0, 0), outDir: OUT },
  { name: "coin",             ...cell(1, 0), outDir: OUT },
  { name: "cap-fox",          ...cell(2, 0), outDir: join(OUT, "caps") },

  // ── Row 1 — Capsule pod ────────────────────────────────────────────────────
  { name: "pod-closed",       ...cell(0, 1), outDir: OUT },
  { name: "pod-top",          ...cell(1, 1), outDir: OUT },
  { name: "pod-bottom",       ...cell(2, 1), outDir: OUT },

  // ── Row 2 — Treasure chest ─────────────────────────────────────────────────
  { name: "chest-closed",     ...cell(0, 2), outDir: OUT },
  { name: "chest-open",       ...cell(1, 2), outDir: OUT },
  // cell(2,2) reserved — skip
];

async function main() {
  if (!existsSync(SRC)) {
    console.error(`\n  ERROR: sprite sheet not found at\n  ${SRC}\n`);
    console.error("  Place capsule-sprites.png there and re-run.\n");
    process.exit(1);
  }

  const meta = await sharp(SRC).metadata();
  console.log(`\n  Sprite sheet: ${meta.width} × ${meta.height} px`);

  const expectedW = CELL * 3;  // 1536
  const expectedH = CELL * 4;  // 2048
  if (meta.width !== expectedW || meta.height !== expectedH) {
    console.warn(
      `\n  WARNING: expected ${expectedW}×${expectedH} but got ${meta.width}×${meta.height}.` +
      `\n  Cropping will still run — verify output visually.\n`
    );
  }

  for (const sprite of SPRITES) {
    const { name, outDir, left, top, width, height } = sprite;
    await mkdir(outDir, { recursive: true });
    const dest = join(outDir, `${name}.png`);

    await sharp(SRC)
      .extract({ left, top, width, height })
      .png()
      .toFile(dest);

    const rel = dest.replace(ROOT, "");
    console.log(`  ✓  ${rel}`);
  }

  console.log("\n  Done. All sprites extracted.\n");
}

main().catch(err => { console.error(err); process.exit(1); });

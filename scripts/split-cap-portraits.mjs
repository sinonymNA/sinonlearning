/**
 * Splits a cap portrait sprite sheet into individual circle PNGs.
 *
 * Input:  public/assets/capsule/cap-portraits-{tier}.png
 * Output: public/assets/capsule/caps/{cap-id}.png
 *
 * Run:  node scripts/split-cap-portraits.mjs [tier]
 *   tier defaults to "common"
 */

import sharp from "sharp";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = join(__dirname, "..");
const CAPS_OUT = join(ROOT, "public/assets/capsule/caps");

const BG_TOLERANCE = 30;
const PAD = 4;

// Names per tier in reading order (top→bottom, left→right)
const TIER_NAMES = {
  common: ["cap-cat", "cap-dog", "cap-frog", "cap-fish", "cap-duck", "cap-owl", "cap-bunny", "cap-bear", "cap-hamster"],
  rare:   ["cap-lion", "cap-shark", "cap-penguin", "cap-butterfly", "cap-flamingo", "cap-koala", "cap-panda", "cap-turtle"],
  epic:   ["cap-dragon", "cap-wolf", "cap-eagle", "cap-crystal", "cap-phoenix"],
  mythic: ["cap-crown", "cap-galaxy", "cap-ghost"],
};

const tier = process.argv[2] ?? "common";
const NAMES = TIER_NAMES[tier];
if (!NAMES) { console.error(`Unknown tier "${tier}". Valid: ${Object.keys(TIER_NAMES).join(", ")}`); process.exit(1); }

const SRC = join(ROOT, `public/assets/capsule/cap-portraits-${tier}.png`);

// ── Flood-fill background removal from corners ────────────────────────────────
// Uses "near-white" test (all channels > 190) so it handles backgrounds
// that vary from 235–255 without eating the colored circle interiors.
function removeBackground(data, width, height, channels) {
  const result = new Uint8Array(data);
  const isBg = idx => {
    if (result[idx + 3] < 10) return true;
    return result[idx] > 190 && result[idx+1] > 190 && result[idx+2] > 190;
  };
  const visited = new Uint8Array(width * height);
  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x; if (visited[i]) return;
    if (!isBg(i * channels)) return;
    visited[i] = 1; result[i * channels + 3] = 0; queue.push(x, y);
  };
  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }
  let qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++], y = queue[qi++];
    enqueue(x+1,y); enqueue(x-1,y); enqueue(x,y+1); enqueue(x,y-1);
  }
  return result;
}

function findBands(proj, minGap = 15, minSize = 30) {
  const bands = []; let inBand = false, start = 0;
  for (let i = 0; i < proj.length; i++) {
    if (!inBand && proj[i] > 0) { inBand = true; start = i; }
    if (inBand && proj[i] === 0) { inBand = false; if (i - start >= minSize) bands.push([start, i-1]); }
  }
  if (inBand && proj.length - start >= minSize) bands.push([start, proj.length-1]);
  const merged = [];
  for (const b of bands) {
    if (merged.length && b[0] - merged[merged.length-1][1] <= minGap) merged[merged.length-1][1] = b[1];
    else merged.push([...b]);
  }
  return merged;
}

function findCols(data, width, rowStart, rowEnd, channels) {
  const col = new Array(width).fill(0);
  for (let y = rowStart; y <= rowEnd; y++)
    for (let x = 0; x < width; x++)
      col[x] += data[(y * width + x) * channels + 3] > 10 ? 1 : 0;
  return findBands(col, 15, 30);
}

function tightRows(data, width, c0, c1, r0, r1, channels) {
  let minY = r1, maxY = r0;
  for (let y = r0; y <= r1; y++)
    for (let x = c0; x <= c1; x++)
      if (data[(y * width + x) * channels + 3] > 10) { minY = Math.min(minY,y); maxY = Math.max(maxY,y); }
  return [minY, maxY];
}

async function main() {
  if (!existsSync(SRC)) { console.error(`\n  Not found: ${SRC}\n`); process.exit(1); }

  const { data: raw, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`\n  Source: ${width}×${height}  tier=${tier}`);

  const data = removeBackground(raw, width, height, channels);

  const rowAlpha = new Array(height).fill(0);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      rowAlpha[y] += data[(y * width + x) * channels + 3] > 10 ? 1 : 0;

  const rows = findBands(rowAlpha, 20, 40);
  console.log(`  Row bands: ${rows.map(r => r.join("–")).join(", ")}`);

  const regions = [];
  for (const [r0, r1] of rows) {
    for (const [c0, c1] of findCols(data, width, r0, r1, channels)) {
      const [tTop, tBot] = tightRows(data, width, c0, c1, r0, r1, channels);
      regions.push({ left: c0, top: tTop, right: c1, bottom: tBot });
    }
  }
  regions.sort((a, b) => {
    const d = (a.top + a.bottom)/2 - (b.top + b.bottom)/2;
    return Math.abs(d) > 40 ? d : a.left - b.left;
  });
  console.log(`  Detected ${regions.length} region(s) — expected ${NAMES.length}`);
  if (regions.length !== NAMES.length) console.warn(`  WARNING: count mismatch`);

  await mkdir(CAPS_OUT, { recursive: true });

  const buf = await sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toBuffer();

  for (let i = 0; i < Math.min(regions.length, NAMES.length); i++) {
    const { left, top, right, bottom } = regions[i];
    const cL = Math.max(0, left - PAD), cT = Math.max(0, top - PAD);
    const cW = Math.min(width, right + PAD + 1) - cL;
    const cH = Math.min(height, bottom + PAD + 1) - cT;
    const dest = join(CAPS_OUT, `${NAMES[i]}.png`);
    await sharp(buf).extract({ left: cL, top: cT, width: cW, height: cH }).png().toFile(dest);
    console.log(`  ✓  caps/${NAMES[i]}.png  (${cW}×${cH})`);
  }
  console.log("\n  Done.\n");
}

main().catch(err => { console.error(err); process.exit(1); });

/**
 * Auto-detects and crops individual assets from capsule-sprites.png.
 *
 * Works even when the sprite sheet has a solid white/near-white background —
 * flood-fills from all four corners to mark background pixels transparent
 * before running the projection-based region detector.
 *
 * Input:  public/assets/capsule/capsule-sprites.png
 * Output: public/assets/capsule/{name}.png  +  caps/cap-fox.png
 *
 * Run:  node scripts/split-capsule-sprites.mjs
 */

import sharp from "sharp";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, "..");
const SRC       = join(ROOT, "public/assets/capsule/capsule-sprites.png");
const OUT       = join(ROOT, "public/assets/capsule");
const CAPS_OUT  = join(OUT, "caps");

// Padding added around each detected bounding box (px)
const PAD = 12;

// Tolerance for background-color matching (Euclidean distance in RGB space)
const BG_TOLERANCE = 30;

// ── Names assigned to detected assets in reading order (top→bottom, left→right)
const NAMES = [
  { name: "mascot",       dir: OUT },       // row 1, col 1
  { name: "coin",         dir: OUT },       // row 1, col 2
  { name: "cap-fox",      dir: CAPS_OUT },  // row 1, col 3
  { name: "pod-closed",   dir: OUT },       // row 2, col 1
  { name: "pod-top",      dir: OUT },       // row 2, col 2
  { name: "pod-bottom",   dir: OUT },       // row 2, col 3
  { name: "chest-closed", dir: OUT },       // row 3, col 1
  { name: "chest-open",   dir: OUT },       // row 3, col 2
];

// ── Background removal: flood-fill from all four corners ─────────────────────
// Returns a new Uint8Array with background pixels set to alpha=0.
function removeBackground(data, width, height, channels, tolerance) {
  const result = new Uint8Array(data);

  // Sample background color from the top-left corner
  const bgR = data[0], bgG = data[1], bgB = data[2];
  console.log(`  Background color sampled: rgb(${bgR},${bgG},${bgB})`);

  function isBg(idx) {
    if (result[idx + 3] === 0) return true; // already transparent
    const dr = result[idx]   - bgR;
    const dg = result[idx+1] - bgG;
    const db = result[idx+2] - bgB;
    return Math.sqrt(dr*dr + dg*dg + db*db) <= tolerance;
  }

  const visited = new Uint8Array(width * height);
  const queue = [];

  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const pIdx = idx * channels;
    if (!isBg(pIdx)) return;
    visited[idx] = 1;
    result[pIdx + 3] = 0; // make transparent
    queue.push(x, y);
  }

  // Seed from all four edges
  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  // BFS
  let qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++];
    const y = queue[qi++];
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  const removed = visited.reduce((s, v) => s + v, 0);
  console.log(`  Flood-fill removed ${removed.toLocaleString()} background pixels`);
  return result;
}

// ── Step 1: find row bands by projecting alpha onto the y-axis ────────────────
function findBands(projection, minGap = 20, minSize = 40) {
  const bands = [];
  let inBand = false, start = 0;
  for (let i = 0; i < projection.length; i++) {
    if (!inBand && projection[i] > 0) { inBand = true; start = i; }
    if (inBand && projection[i] === 0) {
      inBand = false;
      if (i - start >= minSize) bands.push([start, i - 1]);
    }
  }
  if (inBand && projection.length - start >= minSize) bands.push([start, projection.length - 1]);

  // Merge bands whose gap is less than minGap
  const merged = [];
  for (const b of bands) {
    if (merged.length && b[0] - merged[merged.length - 1][1] <= minGap)
      merged[merged.length - 1][1] = b[1];
    else
      merged.push([...b]);
  }
  return merged;
}

// ── Step 2: within a band, find column extents ────────────────────────────────
function findColsInBand(data, width, rowStart, rowEnd, channels, minGap = 20, minSize = 20) {
  const colAlpha = new Array(width).fill(0);
  for (let y = rowStart; y <= rowEnd; y++)
    for (let x = 0; x < width; x++)
      colAlpha[x] += data[(y * width + x) * channels + 3] > 10 ? 1 : 0;
  return findBands(colAlpha, minGap, minSize);
}

// ── Step 3: find tight vertical bounds within a column slice ──────────────────
function tightRowBounds(data, width, colStart, colEnd, rowStart, rowEnd, channels) {
  let minY = rowEnd, maxY = rowStart;
  for (let y = rowStart; y <= rowEnd; y++)
    for (let x = colStart; x <= colEnd; x++)
      if (data[(y * width + x) * channels + 3] > 10) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  return [minY, maxY];
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(SRC)) {
    console.error(`\n  ERROR: sprite sheet not found:\n  ${SRC}\n`);
    process.exit(1);
  }

  const img = sharp(SRC).ensureAlpha();
  const { data: rawData, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`\n  Source: ${width} × ${height} px  (${channels}ch)`);

  // Remove white/near-white background via flood-fill from corners
  const data = removeBackground(rawData, width, height, channels, BG_TOLERANCE);

  // Build row-alpha projection on the background-removed image
  const rowAlpha = new Array(height).fill(0);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      rowAlpha[y] += data[(y * width + x) * channels + 3] > 10 ? 1 : 0;

  const rows = findBands(rowAlpha, 30, 60);
  console.log(`  Detected ${rows.length} row band(s): ${rows.map(r => r.join("–")).join(", ")}`);

  // Within each row, find columns
  const regions = [];
  for (const [rowStart, rowEnd] of rows) {
    const cols = findColsInBand(data, width, rowStart, rowEnd, channels, 30, 40);
    for (const [colStart, colEnd] of cols) {
      const [tTop, tBot] = tightRowBounds(data, width, colStart, colEnd, rowStart, rowEnd, channels);
      regions.push({ left: colStart, top: tTop, right: colEnd, bottom: tBot });
    }
  }

  // Sort top→bottom, left→right
  regions.sort((a, b) => {
    const rowDiff = (a.top + a.bottom) / 2 - (b.top + b.bottom) / 2;
    if (Math.abs(rowDiff) > 60) return rowDiff;
    return a.left - b.left;
  });

  console.log(`  Detected ${regions.length} asset region(s)`);

  if (regions.length !== NAMES.length) {
    console.warn(
      `\n  WARNING: expected ${NAMES.length} assets but found ${regions.length}.` +
      `\n  Check the sprite sheet layout or adjust NAMES in this script.\n`
    );
  }

  await mkdir(CAPS_OUT, { recursive: true });

  // Write the background-removed raw data to a temp buffer for sharp to extract from
  const bgRemovedBuf = await sharp(Buffer.from(data), {
    raw: { width, height, channels },
  }).png().toBuffer();

  for (let i = 0; i < Math.min(regions.length, NAMES.length); i++) {
    const { left, top, right, bottom } = regions[i];
    const { name, dir } = NAMES[i];

    const cropLeft   = Math.max(0, left  - PAD);
    const cropTop    = Math.max(0, top   - PAD);
    const cropWidth  = Math.min(width,  right  + PAD + 1) - cropLeft;
    const cropHeight = Math.min(height, bottom + PAD + 1) - cropTop;

    const dest = join(dir, `${name}.png`);
    await sharp(bgRemovedBuf)
      .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
      .png()
      .toFile(dest);

    const rel = dest.replace(ROOT, "");
    console.log(`  ✓  ${rel}  (${cropWidth}×${cropHeight} px)`);
  }

  console.log("\n  Done.\n");
}

main().catch(err => { console.error(err); process.exit(1); });

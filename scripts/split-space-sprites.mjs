import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "../public/assets/capsule/space-sprites.png");
const CAPS_DIR = path.join(__dirname, "../public/assets/capsule/caps");
const BALL_DIR = path.join(__dirname, "../public/assets/capsule");

fs.mkdirSync(CAPS_DIR, { recursive: true });

// Row 1 caps, Row 2 caps, Row 3 ball sprites — in order left→right, top→bottom
const NAMES = [
  // row 1
  { out: CAPS_DIR,  name: "cap-astropup" },
  { out: CAPS_DIR,  name: "cap-moonbunny" },
  { out: CAPS_DIR,  name: "cap-robowl" },
  { out: CAPS_DIR,  name: "cap-zorp" },
  // row 2
  { out: CAPS_DIR,  name: "cap-cometfox" },
  { out: CAPS_DIR,  name: "cap-nebulacat" },
  { out: CAPS_DIR,  name: "cap-orbitdrake" },
  { out: CAPS_DIR,  name: "cap-voidknight" },
  // row 3 — ball sprites
  { out: BALL_DIR,  name: "space-ball-closed" },
  { out: BALL_DIR,  name: "space-ball-top" },
  { out: BALL_DIR,  name: "space-ball-bottom" },
];

// ── Background removal (near-white flood-fill) ──────────────────────────────
function removeBackground(data, width, height, channels) {
  const buf = new Uint8Array(data);
  const isBg = idx => {
    if (buf[idx + 3] < 10) return true;
    return buf[idx] > 200 && buf[idx + 1] > 200 && buf[idx + 2] > 200;
  };
  const visited = new Uint8Array(width * height);
  const queue = [];
  const enq = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = y * width + x;
    if (visited[i]) return;
    if (!isBg(i * channels)) return;
    visited[i] = 1;
    queue.push(i);
  };
  for (let x = 0; x < width; x++) { enq(x, 0); enq(x, height - 1); }
  for (let y = 0; y < height; y++) { enq(0, y); enq(width - 1, y); }
  let head = 0;
  while (head < queue.length) {
    const i = queue[head++];
    buf[i * channels + 3] = 0;
    const x = i % width, y = Math.floor(i / width);
    enq(x - 1, y); enq(x + 1, y); enq(x, y - 1); enq(x, y + 1);
  }
  return buf;
}

// ── Region detection via connected components ───────────────────────────────
function findRegions(alpha, width, height) {
  const label = new Int32Array(width * height).fill(-1);
  let nextLabel = 0;
  const bboxes = [];

  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      const si = sy * width + sx;
      if (alpha[si] <= 10 || label[si] !== -1) continue;
      // BFS flood fill
      const id = nextLabel++;
      bboxes.push({ minX: sx, minY: sy, maxX: sx, maxY: sy });
      const q = [si];
      label[si] = id;
      let head = 0;
      while (head < q.length) {
        const idx = q[head++];
        const x = idx % width, y = Math.floor(idx / width);
        if (x < bboxes[id].minX) bboxes[id].minX = x;
        if (x > bboxes[id].maxX) bboxes[id].maxX = x;
        if (y < bboxes[id].minY) bboxes[id].minY = y;
        if (y > bboxes[id].maxY) bboxes[id].maxY = y;
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const ni = ny * width + nx;
          if (alpha[ni] <= 10 || label[ni] !== -1) continue;
          label[ni] = id;
          q.push(ni);
        }
      }
    }
  }

  // Filter out tiny noise, merge overlapping boxes, sort top→bottom left→right
  const MIN_AREA = 5000;
  const large = bboxes.filter(b => (b.maxX - b.minX) * (b.maxY - b.minY) > MIN_AREA);

  // Sort by top-center: group into rows (within 60px vertically), then left→right within row
  large.sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2, by = (b.minY + b.maxY) / 2;
    if (Math.abs(ay - by) > 60) return ay - by;
    return (a.minX + a.maxX) / 2 - (b.minX + b.maxX) / 2;
  });

  return large.map(b => ({
    left: b.minX, top: b.minY,
    width: b.maxX - b.minX + 1,
    height: b.maxY - b.minY + 1,
  }));
}

// ── Main ────────────────────────────────────────────────────────────────────
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
console.log(`Sheet: ${width}×${height}`);

const cleaned = removeBackground(data, width, height, channels);

// extract alpha channel for region detection
const alpha = new Uint8Array(width * height);
for (let i = 0; i < width * height; i++) alpha[i] = cleaned[i * channels + 3];

const regions = findRegions(alpha, width, height);
console.log(`Detected ${regions.length} regions`);

if (regions.length !== NAMES.length) {
  console.error(`Expected ${NAMES.length}, got ${regions.length}. Aborting.`);
  process.exit(1);
}

const cleanBuf = Buffer.from(cleaned);
for (let i = 0; i < regions.length; i++) {
  const r = regions[i];
  const { out, name } = NAMES[i];
  const dest = path.join(out, `${name}.png`);
  await sharp(cleanBuf, { raw: { width, height, channels } })
    .extract({ left: r.left, top: r.top, width: r.width, height: r.height })
    .png()
    .toFile(dest);
  console.log(`  [${i + 1}] ${name}.png  (${r.width}×${r.height})`);
}
console.log("Done.");

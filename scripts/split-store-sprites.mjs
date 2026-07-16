import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSET_DIR = path.join(__dirname, "../public/assets/capsule");
const STORE_DIR = path.join(ASSET_DIR, "store");
fs.mkdirSync(STORE_DIR, { recursive: true });

// ── Connected-component region finder ───────────────────────────────────────
function findRegions(alpha, width, height) {
  const label = new Int32Array(width * height).fill(-1);
  let nextLabel = 0;
  const bboxes = [];

  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      const si = sy * width + sx;
      if (alpha[si] <= 10 || label[si] !== -1) continue;
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

  const MIN_AREA = 3000;
  const large = bboxes.filter(b => (b.maxX - b.minX) * (b.maxY - b.minY) > MIN_AREA);
  large.sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2, by2 = (b.minY + b.maxY) / 2;
    if (Math.abs(ay - by2) > 80) return ay - by2;
    return (a.minX + a.maxX) / 2 - (b.minX + b.maxX) / 2;
  });
  return large.map(b => ({ left: b.minX, top: b.minY, width: b.maxX - b.minX + 1, height: b.maxY - b.minY + 1 }));
}

// ── Flood-fill background removal (for white-bg sheets) ─────────────────────
function removeWhiteBg(data, width, height, channels) {
  const buf = new Uint8Array(data);
  const isBg = idx => buf[idx + 3] < 10 || (buf[idx] > 200 && buf[idx+1] > 200 && buf[idx+2] > 200);
  const visited = new Uint8Array(width * height);
  const q = [];
  const enq = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = y * width + x;
    if (visited[i] || !isBg(i * channels)) return;
    visited[i] = 1; q.push(i);
  };
  for (let x = 0; x < width; x++) { enq(x, 0); enq(x, height - 1); }
  for (let y = 0; y < height; y++) { enq(0, y); enq(width - 1, y); }
  let head = 0;
  while (head < q.length) {
    const i = q[head++];
    buf[i * channels + 3] = 0;
    const x = i % width, y = Math.floor(i / width);
    enq(x-1,y); enq(x+1,y); enq(x,y-1); enq(x,y+1);
  }
  return buf;
}

async function splitSheet({ src, names, whiteBg = false, label }) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`\n${label}: ${width}×${height}`);

  let buf = new Uint8Array(data);
  if (whiteBg) buf = removeWhiteBg(data, width, height, channels);

  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = buf[i * channels + 3];

  const regions = findRegions(alpha, width, height);
  console.log(`  Detected ${regions.length} regions (expected ${names.length})`);
  if (regions.length !== names.length) {
    console.error(`  !! Mismatch — aborting this sheet`);
    return;
  }

  const rawBuf = Buffer.from(buf);
  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    const { dir, name } = names[i];
    const dest = path.join(dir, `${name}.png`);
    await sharp(rawBuf, { raw: { width, height, channels } })
      .extract({ left: r.left, top: r.top, width: r.width, height: r.height })
      .png()
      .toFile(dest);
    console.log(`  [${i+1}] ${name}.png  (${r.width}×${r.height})`);
  }
}

// ── Classic ball (white background, 3 sprites) ───────────────────────────────
await splitSheet({
  src: path.join(ASSET_DIR, "classic-ball-sprites.png"),
  whiteBg: true,
  label: "Classic ball",
  names: [
    { dir: ASSET_DIR, name: "classic-ball-closed" },
    { dir: ASSET_DIR, name: "classic-ball-top" },
    { dir: ASSET_DIR, name: "classic-ball-bottom" },
  ],
});

// ── Store UI sheet (near-white background, 12 sprites) ───────────────────────
await splitSheet({
  src: path.join(ASSET_DIR, "store-sprites.png"),
  whiteBg: true,
  label: "Store sprites",
  names: [
    // Row 1
    { dir: STORE_DIR, name: "icon-shop-sign" },
    { dir: STORE_DIR, name: "icon-coin-stack" },
    { dir: STORE_DIR, name: "icon-coin-pile" },
    { dir: STORE_DIR, name: "icon-gem-tokens" },
    // Row 2
    { dir: STORE_DIR, name: "ball-classic-icon" },
    { dir: STORE_DIR, name: "ball-premium-icon" },
    { dir: STORE_DIR, name: "ball-legendary-icon" },
    { dir: STORE_DIR, name: "icon-cube-box" },
    // Row 3
    { dir: STORE_DIR, name: "icon-chest" },
    { dir: STORE_DIR, name: "icon-sale-tag" },
    { dir: STORE_DIR, name: "icon-capsule-base" },
    { dir: STORE_DIR, name: "icon-basket" },
  ],
});

console.log("\nAll done.");

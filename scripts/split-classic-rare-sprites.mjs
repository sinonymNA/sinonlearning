import sharp from "sharp";
import { mkdirSync } from "fs";

const SRC = "/root/.claude/uploads/a398c014-39a1-5db5-b729-a435bfe0d250/73bd0eb4-ABF19EFDD682469E963DACF6CC7274ED.png";

mkdirSync("public/assets/capsule/caps", { recursive: true });

// Row 1: lion, shark, penguin, butterfly
// Row 2: flamingo, koala, panda, turtle
// Row 3: dragon, wolf, eagle, crystal
// Row 4: phoenix, crown, galaxy, ghost
const ITEMS = [
  "cap-lion", "cap-shark", "cap-penguin", "cap-butterfly",
  "cap-flamingo", "cap-koala", "cap-panda", "cap-turtle",
  "cap-dragon", "cap-wolf", "cap-eagle", "cap-crystal",
  "cap-phoenix", "cap-crown", "cap-galaxy", "cap-ghost",
];

// Remove checkerboard background (same technique as brainrot script)
function removeCheckerboardBg(data, width, height) {
  function isBg(i) {
    const r = data[i*4], g = data[i*4+1], b = data[i*4+2], a = data[i*4+3];
    return a > 10 && r > 130 && g > 130 && b > 130
      && Math.abs(r-g) < 22 && Math.abs(g-b) < 22 && Math.abs(r-b) < 22;
  }
  const visited = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const i = y * width + x;
      if (!visited[i] && isBg(i)) { visited[i] = 1; queue.push(i); }
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of [0, width - 1]) {
      const i = y * width + x;
      if (!visited[i] && isBg(i)) { visited[i] = 1; queue.push(i); }
    }
  }
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    data[cur * 4 + 3] = 0;
    const cy = Math.floor(cur / width), cx = cur % width;
    for (const [ny, nx] of [[cy-1,cx],[cy+1,cx],[cy,cx-1],[cy,cx+1]]) {
      if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
      const ni = ny * width + nx;
      if (!visited[ni] && isBg(ni)) { visited[ni] = 1; queue.push(ni); }
    }
  }
}

function findRegions(data, width, height) {
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = data[i * 4 + 3];

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
        const cur = q[head++];
        const cy = Math.floor(cur / width), cx = cur % width;
        const b = bboxes[id];
        if (cx < b.minX) b.minX = cx;
        if (cx > b.maxX) b.maxX = cx;
        if (cy < b.minY) b.minY = cy;
        if (cy > b.maxY) b.maxY = cy;
        for (const [ny, nx] of [[cy-1,cx],[cy+1,cx],[cy,cx-1],[cy,cx+1]]) {
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
          const ni = ny * width + nx;
          if (alpha[ni] > 10 && label[ni] === -1) { label[ni] = id; q.push(ni); }
        }
      }
    }
  }

  const MIN_AREA = 15000;
  const large = bboxes.filter(b => (b.maxX - b.minX + 1) * (b.maxY - b.minY + 1) > MIN_AREA);
  large.sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2, by2 = (b.minY + b.maxY) / 2;
    if (Math.abs(ay - by2) > 80) return ay - by2;
    return (a.minX + a.maxX) / 2 - (b.minX + b.maxX) / 2;
  });
  return large;
}

async function main() {
  const { data: rawData, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const data = new Uint8Array(rawData);
  console.log(`Image: ${width}×${height}`);

  const corner = (x, y) => {
    const i = y * width + x;
    return `R=${data[i*4]} G=${data[i*4+1]} B=${data[i*4+2]} A=${data[i*4+3]}`;
  };
  console.log(`TL: ${corner(0,0)}  TR: ${corner(width-1,0)}`);

  removeCheckerboardBg(data, width, height);

  const regions = findRegions(data, width, height);
  console.log(`\nFound ${regions.length} regions:`);
  regions.forEach((r, i) => {
    const w = r.maxX - r.minX + 1, h = r.maxY - r.minY + 1;
    const cx = Math.round((r.minX + r.maxX) / 2), cy = Math.round((r.minY + r.maxY) / 2);
    console.log(`  [${i}] ${ITEMS[i] ?? "??"}: center=(${cx},${cy}) ${w}×${h}`);
  });

  if (regions.length !== ITEMS.length) {
    console.error(`\nERROR: Expected ${ITEMS.length} regions, got ${regions.length}`);
    process.exit(1);
  }

  const buf = Buffer.from(data.buffer);
  const PAD = 4;

  for (let i = 0; i < regions.length; i++) {
    const r = regions[i];
    const left   = Math.max(0, r.minX - PAD);
    const top    = Math.max(0, r.minY - PAD);
    const right  = Math.min(width - 1, r.maxX + PAD);
    const bottom = Math.min(height - 1, r.maxY + PAD);

    const outPath = `public/assets/capsule/caps/${ITEMS[i]}.png`;
    await sharp(buf, { raw: { width, height, channels: 4 } })
      .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
      .png()
      .toFile(outPath);

    console.log(`✓ ${outPath} (${right-left+1}×${bottom-top+1})`);
  }
  console.log("\nDone!");
}

main().catch(err => { console.error(err); process.exit(1); });

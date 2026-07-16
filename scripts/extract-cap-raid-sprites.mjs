import sharp from "sharp";
import { mkdirSync } from "fs";

const OUT = "public/assets/capsule/game";
mkdirSync(OUT, { recursive: true });

const BASE = "/root/.claude/uploads/a398c014-39a1-5db5-b729-a435bfe0d250/";

// BFS flood-fill from all 4 edges — removes white, light-gray, and checkerboard backgrounds
function removeBgFromCorners(data, width, height) {
  function isBg(i) {
    const r = data[i*4], g = data[i*4+1], b = data[i*4+2], a = data[i*4+3];
    if (a <= 10) return true;
    if (r > 235 && g > 235 && b > 235) return true; // white
    if (r > 130 && g > 130 && b > 130 &&
        Math.abs(r-g) < 22 && Math.abs(g-b) < 22 && Math.abs(r-b) < 22) return true; // gray/checkerboard
    return false;
  }
  const vis = new Uint8Array(width * height);
  const q = [];
  for (let x = 0; x < width; x++) {
    for (const y of [0, height-1]) {
      const i = y*width+x; if (!vis[i] && isBg(i)) { vis[i]=1; q.push(i); }
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of [0, width-1]) {
      const i = y*width+x; if (!vis[i] && isBg(i)) { vis[i]=1; q.push(i); }
    }
  }
  let head = 0;
  while (head < q.length) {
    const cur = q[head++]; data[cur*4+3] = 0;
    const cy = Math.floor(cur/width), cx = cur%width;
    for (const [ny,nx] of [[cy-1,cx],[cy+1,cx],[cy,cx-1],[cy,cx+1]]) {
      if (ny<0||ny>=height||nx<0||nx>=width) continue;
      const ni = ny*width+nx;
      if (!vis[ni] && isBg(ni)) { vis[ni]=1; q.push(ni); }
    }
  }
}

// Find all non-transparent connected components above minArea threshold
function findRegions(data, width, height, minArea, yTolerance = 80) {
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = data[i*4+3];
  const label = new Int32Array(width * height).fill(-1);
  let nl = 0; const bboxes = [];
  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      const si = sy*width+sx;
      if (alpha[si] <= 10 || label[si] !== -1) continue;
      const id = nl++; bboxes.push({ minX:sx, minY:sy, maxX:sx, maxY:sy });
      const q = [si]; label[si] = id; let head = 0;
      while (head < q.length) {
        const cur = q[head++]; const cy = Math.floor(cur/width), cx = cur%width;
        const b = bboxes[id];
        if (cx<b.minX) b.minX=cx; if (cx>b.maxX) b.maxX=cx;
        if (cy<b.minY) b.minY=cy; if (cy>b.maxY) b.maxY=cy;
        for (const [ny,nx] of [[cy-1,cx],[cy+1,cx],[cy,cx-1],[cy,cx+1]]) {
          if (ny<0||ny>=height||nx<0||nx>=width) continue;
          const ni = ny*width+nx;
          if (alpha[ni]>10 && label[ni]===-1) { label[ni]=id; q.push(ni); }
        }
      }
    }
  }
  return bboxes
    .filter(b => (b.maxX-b.minX+1)*(b.maxY-b.minY+1) > minArea)
    .sort((a, b) => {
      const ay = (a.minY+a.maxY)/2, by2 = (b.minY+b.maxY)/2;
      if (Math.abs(ay-by2) > yTolerance) return ay-by2;
      return (a.minX+a.maxX)/2-(b.minX+b.maxX)/2;
    });
}

// Merge regions whose X ranges overlap AND Y centres are within yTol of each other.
// Handles sprites split into disconnected components (e.g. steal claw + silhouettes).
function mergeNearby(regions, xTol = 30, yTol = 300) {
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < regions.length; i++) {
      for (let j = i+1; j < regions.length; j++) {
        const a = regions[i], b = regions[j];
        const xOverlap = a.minX <= b.maxX + xTol && b.minX <= a.maxX + xTol;
        const yClose = Math.abs((a.minY+a.maxY)/2 - (b.minY+b.maxY)/2) < yTol;
        if (xOverlap && yClose) {
          a.minX = Math.min(a.minX, b.minX); a.minY = Math.min(a.minY, b.minY);
          a.maxX = Math.max(a.maxX, b.maxX); a.maxY = Math.max(a.maxY, b.maxY);
          regions.splice(j, 1);
          merged = true; break outer;
        }
      }
    }
  }
  return regions;
}

async function extract(src, names, { minArea = 8000, pad = 12, yTol = 80, merge = false, mergeTol = 30 } = {}) {
  const { data: raw, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const data = new Uint8Array(raw);

  // Always remove background (handles transparent, white, and checkerboard)
  removeBgFromCorners(data, width, height);

  let regions = findRegions(data, width, height, minArea, yTol);
  if (merge) regions = mergeNearby(regions, mergeTol);

  // Re-sort after potential merge
  regions.sort((a, b) => {
    const ay = (a.minY+a.maxY)/2, by2 = (b.minY+b.maxY)/2;
    if (Math.abs(ay-by2) > yTol) return ay-by2;
    return (a.minX+a.maxX)/2-(b.minX+b.maxX)/2;
  });

  const file = src.split("/").pop();
  console.log(`\n${file} (${width}×${height}): ${regions.length} regions`);
  regions.forEach((r, i) => {
    const w = r.maxX-r.minX+1, h = r.maxY-r.minY+1;
    const midX = Math.round((r.minX+r.maxX)/2), midY = Math.round((r.minY+r.maxY)/2);
    console.log(`  [${i}] ${names[i]??"??"}: midX=${midX} midY=${midY}  ${w}×${h}`);
  });

  const buf = Buffer.from(data.buffer);
  for (let i = 0; i < Math.min(regions.length, names.length); i++) {
    const r = regions[i];
    const l = Math.max(0, r.minX-pad), t = Math.max(0, r.minY-pad);
    const rr = Math.min(width-1, r.maxX+pad), b2 = Math.min(height-1, r.maxY+pad);
    const outPath = `${OUT}/${names[i]}.png`;
    await sharp(buf, { raw: { width, height, channels: 4 } })
      .extract({ left:l, top:t, width:rr-l+1, height:b2-t+1 })
      .png().toFile(outPath);
    console.log(`  ✓ ${names[i]}.png  (${rr-l+1}×${b2-t+1})`);
  }
}

async function main() {
  // ── Sheet 1: Factory background — full scene, copy as-is ─────────────────────
  await sharp(BASE + "3d01ff4f-8223B37A5BD34320A2239D0392DD99B0.png")
    .png().toFile(`${OUT}/factory-bg.png`);
  console.log("✓ factory-bg.png");

  // ── Sheet 2: Factory animated elements ───────────────────────────────────────
  // Row 1: conveyor | pulley | robot-arm | beacon
  // Row 2: cable | steam | capsule-travel
  await extract(
    BASE + "469cf334-8024B3319798475FACD3843ED8FB53C5.png",
    [
      "factory-conveyor",
      "factory-pulley",
      "factory-robot-arm",
      "factory-beacon",
      "factory-cable",
      "factory-steam",
    ],
    { minArea: 3000, pad: 12 }
  );

  // ── Sheet 3: Machine components ───────────────────────────────────────────────
  // Row 1: machine bodies (blue, gold, red)  — largest elements
  // Row 2: trays (blue, gold) + gear windows (blue, gold, red)
  // Row 3: light panels (blue, gold, red) + levers (blue, gold, red)
  await extract(
    BASE + "6aaee459-728C31F275D443219AF0CE57C0D7E241.png",
    [
      "machine-blue", "machine-gold", "machine-red",
      "machine-tray-blue", "machine-tray-gold",
      "machine-window-blue", "machine-window-gold", "machine-window-red",
      "machine-lights-blue", "machine-lights-gold", "machine-lights-red",
      "machine-lever-blue", "machine-lever-gold", "machine-lever-red",
    ],
    { minArea: 2500, pad: 8, yTol: 100 }
  );

  // ── Sheet 4: Animation components ─────────────────────────────────────────────
  // Row 1: gear-large | gear-small | capsule-closed | capsule-open-top
  // Row 2: capsule-bottom | dust-puff | flash-burst  (machine-chute not in this sheet)
  // minArea=4000 filters the tiny artifact between dust-puff and flash-burst
  await extract(
    BASE + "fe09ad23-19DE80A9C32C4FC78C4D364A981BEE5E.png",
    [
      "gear-large", "gear-small", "capsule-closed", "capsule-open-top",
      "capsule-bottom", "dust-puff", "flash-burst",
    ],
    { minArea: 4000, pad: 10 }
  );

  // ── Sheet 5: Rewards ──────────────────────────────────────────────────────────
  // Row 1: reward-gold | reward-gold-big | reward-steal | reward-lose
  // Row 2: reward-double | reward-shield | reward-grand-prize
  // steal claw + silhouettes are disconnected but share X range → merge with xTol=0 merges them
  // shield and grand-prize have a gap between them → xTol=0 keeps them separate
  // minArea=12000 filters tiny decorative artifacts (80×95, 78×96) that otherwise contaminate ordering
  await extract(
    BASE + "d8e82ac4-C86D327DF22D402DB43E74A142A9F250.png",
    [
      "reward-gold", "reward-gold-big", "reward-steal", "reward-lose",
      "reward-double", "reward-shield", "reward-grand-prize",
    ],
    { minArea: 12000, pad: 16, yTol: 150, merge: true, mergeTol: 0 }
  );

  console.log("\n✓ All done!");
}

main().catch(e => { console.error(e); process.exit(1); });

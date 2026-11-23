// Builds public/arcade/packs/cards.png (+ art.json) from AI/hand-made sheets: one 4x3 sheet (12 cards) per pack set.
// Put the sheets in art-src/ named meadow.png cave.png reef.png sky.png void.png neon.png (any you skip keep the generated art).
// Each sheet: 4 columns x 3 rows, creatures on one flat background colour (the colour of the top-left pixel is removed).
// Usage: node scripts/packs-art-build.mjs [--in art-src] [--cell 64] [--tol 70] [--colours 64]
import sharp from "sharp"; import fs from "node:fs"; import path from "node:path";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const IN = arg("in", "art-src"), CELL = +arg("cell", 64), TOL = +arg("tol", 70), COLOURS = +arg("colours", 64), OUT = "public/arcade/packs";
const SETS = ["meadow", "cave", "reef", "sky", "void", "neon"], COLS = 4, ROWS = 3, PAD = Math.max(2, Math.round(CELL * 0.06));
const sheet = await sharp({ create: { width: 12 * CELL, height: 6 * CELL, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).raw().toBuffer({ resolveWithObject: true });
const out = Buffer.from(sheet.data); let made = 0;
for (let s = 0; s < SETS.length; s++) {
  const file = path.join(IN, SETS[s] + ".png"); if (!fs.existsSync(file)) { console.log(`skip ${SETS[s]} (no ${file})`); continue; }
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), W = info.width, H = info.height;
  const key = [data[0], data[1], data[2]], isKey = (i) => Math.hypot(data[i] - key[0], data[i + 1] - key[1], data[i + 2] - key[2]) < TOL || data[i + 3] < 8;
  for (let n = 0; n < COLS * ROWS; n++) {
    const cx0 = Math.floor((n % COLS) * W / COLS), cx1 = Math.floor(((n % COLS) + 1) * W / COLS), cy0 = Math.floor(Math.floor(n / COLS) * H / ROWS), cy1 = Math.floor((Math.floor(n / COLS) + 1) * H / ROWS);
    const cw = cx1 - cx0, ch = cy1 - cy0, buf = Buffer.alloc(cw * ch * 4); let x0 = cw, y0 = ch, x1 = -1, y1 = -1;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const si = ((cy0 + y) * W + cx0 + x) * 4, di = (y * cw + x) * 4; if (isKey(si)) continue; buf[di] = data[si]; buf[di + 1] = data[si + 1]; buf[di + 2] = data[si + 2]; buf[di + 3] = 255; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { console.log(`  ${SETS[s]} card ${n + 1}: empty cell`); continue; }
    const crop = await sharp(buf, { raw: { width: cw, height: ch, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).resize(CELL - PAD * 2, CELL - PAD * 2, { fit: "inside", kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
    const ox = Math.floor((CELL - crop.info.width) / 2), oy = CELL - PAD - crop.info.height, idx = s * 12 + n, gx = (idx % 12) * CELL, gy = Math.floor(idx / 12) * CELL;   // centred, standing on the bottom edge
    for (let y = 0; y < crop.info.height; y++) for (let x = 0; x < crop.info.width; x++) { const si = (y * crop.info.width + x) * 4, di = ((gy + oy + y) * 12 * CELL + gx + ox + x) * 4, a = crop.data[si + 3] > 127 ? 255 : 0; if (!a) continue; out[di] = crop.data[si]; out[di + 1] = crop.data[si + 1]; out[di + 2] = crop.data[si + 2]; out[di + 3] = 255; }
    made++;
  }
  console.log(`built ${SETS[s]} from ${file} (${W}x${H})`);
}
fs.mkdirSync(OUT, { recursive: true });
await sharp(out, { raw: { width: 12 * CELL, height: 6 * CELL, channels: 4 } }).png({ palette: true, colours: COLOURS, dither: 0 }).toFile(path.join(OUT, "cards.png"));
const mf = path.join(OUT, "art.json"), cur = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : {};
cur.cards = { sheet: "cards.png", cell: CELL, cols: 12, transparent: true }; fs.writeFileSync(mf, JSON.stringify(cur, null, 2) + "\n");
console.log(`wrote ${OUT}/cards.png (${12 * CELL}x${6 * CELL}, ${made} cards) and updated art.json`);

// Writes the Shelf Stocker app icon (pixel art drawn in code on a 64x64 grid, scaled 8x with no smoothing) to public/arcade/shelf-icon.png. No browser needed.
// Usage: node scripts/shelf-icon.mjs
import fs from "node:fs"; import zlib from "node:zlib";
const N = 64, S = 8, px = Array.from({ length: N * N }, () => null);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) px[y * N + x] = c ? hex(c) : null; };
const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
const get = (x, y) => px[y * N + x];

// ---- the rounded-square tile: peach, lighter on top, darker at the bottom, with a soft rim
const R = 13, inside = (x, y) => { const dx = Math.min(x - 1, 62 - x), dy = Math.min(y - 1, 62 - y); return x >= 1 && x <= 62 && y >= 1 && y <= 62 && (dx >= R || dy >= R || (R - dx) ** 2 + (R - dy) ** 2 <= R * R); };
const TONES = ["#ffd199", "#fdc481", "#fabb74", "#f7b068", "#f3a65f", "#ee9c56"], BAYER = [[0, 2], [3, 1]];
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inside(x, y)) { const t = (y / 62) * (TONES.length - 1) + (BAYER[y & 1][x & 1] - 1.5) * 0.22; put(x, y, TONES[Math.max(0, Math.min(TONES.length - 1, Math.round(t)))]); }   // a smooth peach gradient, dithered
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inside(x, y) && !(inside(x - 1, y) && inside(x + 1, y) && inside(x, y - 1) && inside(x, y + 1))) put(x, y, y < 34 ? "#ffe0b0" : y < 50 ? "#f9c488" : "#d98a48");   // 1px rim: light at the top, shadow at the bottom
// a faint highlight blob behind the sparkle
for (let y = 4; y < 20; y++) for (let x = 40; x < 60; x++) if (get(x, y) && (x - 50) ** 2 / 100 + (y - 11) ** 2 / 56 < 1) put(x, y, "#fcc98a");

// ---- the wooden shelf
rect(5, 47, 54, 7, "#d77f3d"); rect(5, 47, 54, 1, "#f0a05e"); rect(5, 53, 54, 1, "#9a4f22"); rect(5, 54, 54, 2, "#e9a066"); rect(7, 56, 50, 1, "#e09a60");
for (const [x, y, w] of [[9, 49, 12], [26, 50, 14], [44, 49, 10], [14, 51, 9], [35, 51, 12], [50, 51, 6]]) rect(x, y, w, 1, "#c06a30");   // wood grain


// ---- a folded cable-knit sweater: base, light top, dark bottom, braids, a rolled end
function sweater(x, y, w, h, base, light, dark) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const edge = (j === 0 && (i < 2 || i >= w - 2)) || (j === h - 1 && (i < 2 || i >= w - 2)); if (!edge) put(x + i, y + j, j === 0 ? light : j === h - 1 ? dark : base); }
  for (let i = 0; i < w; i++) { put(x + i, y + 1, i % 2 ? light : base); put(x + i, y + h - 2, i % 2 ? dark : base); }                              // ribbed top and bottom edges
  const TILE = ["dbllbbbd", "dbbllbbd", "dbbbllbd", "dbbllbbd", "dbllbbbd"];
  for (let i = 2; i < w - 6; i++) for (let k = 0; k < Math.min(5, h - 4); k++) { const ch = TILE[k][(i - 2) % 8]; put(x + i, y + 2 + k, ch === "l" ? light : ch === "d" ? dark : base); }                              // cable-knit chevrons
  for (let j = 1; j < h - 1; j++) { put(x + w - 5, y + j, dark); put(x + w - 4, y + j, base); put(x + w - 3, y + j, j < 3 ? light : base); put(x + w - 2, y + j, dark); }     // the rolled end
}
sweater(8, 38, 31, 9, "#9fd68c", "#c9f0b4", "#6aab62");   // green
sweater(8, 29, 31, 9, "#f7c52c", "#ffe582", "#d49b17");   // yellow
sweater(8, 20, 31, 9, "#f58aa3", "#ffb8c8", "#d4607e");   // pink

// ---- two upright books
function book(x, y, w, h, base, light, dark, bands) {
  rect(x, y, w, h, base); rect(x, y, w, 1, light); rect(x, y, 1, h, light); rect(x + w - 1, y, 1, h, dark); rect(x, y + h - 1, w, 1, dark); 
  rect(x + 1, y + 1, w - 2, 1, light);
  for (const [by, bh] of bands) { rect(x + 1, y + by, w - 2, bh, "#fbe3b0"); rect(x + 1, y + by + bh - 1, w - 2, 1, "#e6c88a"); }
}
book(40, 15, 8, 32, "#5f8ccf", "#8fb0e6", "#3f67a8", [[4, 2], [8, 2], [24, 2], [28, 2]]);   // blue
book(49, 21, 8, 26, "#e9686a", "#ff9a95", "#bd4547", [[4, 2], [8, 2], [20, 2]]);              // red
rect(41, 12, 6, 3, "#3f67a8"); rect(41, 12, 6, 1, "#86a8de");                                  // a hint of the blue book's top edge
for (let x = 8; x < 57; x++) if (get(x, 47) && !(x >= 40 && x < 48) && !(x >= 49 && x < 57)) { /* shelf top shows under the sweaters */ }

// ---- the sparkle: a four-pointed star
const star = [[0, -6, 1], [0, -5, 1], [0, -4, 3], [0, -3, 3], [0, -2, 5], [0, -1, 5], [0, 0, 7], [0, 1, 5], [0, 2, 5], [0, 3, 3], [0, 4, 3], [0, 5, 1], [0, 6, 1]];
const sx = 51, sy = 8; for (const [dx, dy, wd] of star) for (let i = -(wd >> 1); i <= wd >> 1; i++) put(sx + dx + i, sy + dy, "#ffe66d");
for (let i = -7; i <= 7; i++) { const wd = Math.max(1, 5 - Math.abs(i) * 0.7 | 0); for (let j = 0; j < wd; j++) put(sx + i, sy - (wd >> 1) + j, "#ffe66d"); }
put(sx, sy, "#fffbe0"); put(sx - 1, sy, "#fff3a8"); put(sx + 1, sy, "#fff3a8"); put(sx, sy - 1, "#fff3a8"); put(sx, sy + 1, "#fff3a8"); put(sx - 3, sy - 3, "#fffbe0"); put(sx, sy + 5, "#f2c844"); put(sx + 6, sy, "#f2c844");

// ---- write the PNG: scale each art pixel to SxS (no smoothing)
const W = N * S, raw = Buffer.alloc((W * 4 + 1) * W);
for (let y = 0; y < W; y++) { raw[y * (W * 4 + 1)] = 0; for (let x = 0; x < W; x++) { const c = px[Math.floor(y / S) * N + Math.floor(x / S)], o = y * (W * 4 + 1) + 1 + x * 4; if (c) { raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255; } } }
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4); ihdr[8] = 8; ihdr[9] = 6;
fs.writeFileSync(new URL("../public/arcade/shelf-icon.png", import.meta.url), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
console.log("wrote public/arcade/shelf-icon.png (" + W + "x" + W + ")");

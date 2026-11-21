// Procedural pixel art for Pack Rush. Each card is a 40x40 scene (set-themed background) with a creature assembled from parts
// (body, head, ears, horns, wings, tail, feet, arms, pattern, eyes, mouth) chosen from the card's seed. No image files: every picture is drawn on a
// tiny canvas, cached as a data URL, and scaled up with pixelated rendering.
import { makeRng } from "../../../arcade-server/gridiron/rng.mjs";

const S = 40;
const cache = new Map<string, string>();
type G = CanvasRenderingContext2D;
type Pal = { main: string; shade: string; light: string; acc: string; belly: string; dark: string };
const hsl = (h: number, s: number, l: number, a = 1) => `hsl(${((Math.round(h) % 360) + 360) % 360} ${s}% ${l}% / ${a})`;
const cv = (w = S, h = S) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const px = (g: G, x: number, y: number, c: string, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.floor(x), Math.floor(y), w, h); };

function vgrad(g: G, w: number, h: number, a: [number, number, number], b: [number, number, number]) {
  for (let y = 0; y < h; y++) { const t = y / (h - 1); px(g, 0, y, hsl(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t), w, 1); }
}
/** A shaded ellipse: the one primitive every body part is built from. */
function blob(g: G, cx: number, cy: number, rx: number, ry: number, p: { main: string; shade: string; light: string }) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy > 1) continue;
    const l = -(dx * 0.55 + dy * 0.8); px(g, x, y, l > 0.5 ? p.light : l < -0.42 ? p.shade : p.main);
  }
}
function tri(g: G, a: [number, number], b: [number, number], c: [number, number], col: string) {
  const minX = Math.floor(Math.min(a[0], b[0], c[0])), maxX = Math.ceil(Math.max(a[0], b[0], c[0])), minY = Math.floor(Math.min(a[1], b[1], c[1])), maxY = Math.ceil(Math.max(a[1], b[1], c[1]));
  const s = (p: number[], q: number[], r: number[]) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) { const p = [x + 0.5, y + 0.5], d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) px(g, x, y, col); }
}

// ---------------------------------------------------------------- backgrounds (one per pack set)
function background(g: G, set: number, rng: () => number) {
  const star = (x: number, y: number, c: string) => { px(g, x, y, c); };
  if (set === 0) { // meadow: sky, sun, rolling hills, flowers
    vgrad(g, S, S, [200, 70, 78], [190, 60, 90]); for (let i = 0; i < 3; i++) blob(g, 6 + i * 13 + rng() * 5, 8 + rng() * 6, 5, 2, { main: "#fff", shade: "#dfeaf5", light: "#fff" });
    blob(g, 32, 7, 4, 4, { main: "#ffd23f", shade: "#f2b01e", light: "#fff0a0" });
    blob(g, 10, 40, 22, 10, { main: "#6cc04a", shade: "#4a9a35", light: "#8fdc6a" }); blob(g, 33, 41, 20, 9, { main: "#58b03d", shade: "#3f8a2e", light: "#7ccf5a" });
    for (let i = 0; i < 7; i++) { const x = 2 + rng() * 36, y = 32 + rng() * 6; px(g, x, y, ["#ff6b81", "#ffd23f", "#fff", "#c77dff"][i % 4]); }
  } else if (set === 1) { // cave: dark rock, stalactites, crystals
    vgrad(g, S, S, [25, 35, 14], [20, 30, 24]);
    for (let i = 0; i < 6; i++) { const x = i * 7 + rng() * 3, w = 3 + rng() * 3; tri(g, [x, 0], [x + w, 0], [x + w / 2, 6 + rng() * 8], hsl(25, 25, 26)); }
    for (let i = 0; i < 4; i++) { const x = 4 + i * 10 + rng() * 4, h = 5 + rng() * 6; tri(g, [x, 40], [x + 4, 40], [x + 2, 40 - h], hsl(185, 70, 55)); tri(g, [x + 2, 40], [x + 4, 40], [x + 2.5, 40 - h], hsl(185, 70, 72)); }
    for (let i = 0; i < 10; i++) px(g, rng() * 40, rng() * 40, hsl(30, 40, 38));
  } else if (set === 2) { // reef: water, bubbles, weed, sand
    vgrad(g, S, S, [195, 75, 55], [215, 70, 28]);
    for (let i = 0; i < 6; i++) { const x = 4 + rng() * 32, y = 4 + rng() * 26; px(g, x, y, "#bfeaff"); px(g, x + 1, y, "#8fd4f5"); px(g, x, y + 1, "#8fd4f5"); }
    for (let i = 0; i < 4; i++) { const x = 3 + i * 11 + rng() * 3; for (let y = 40; y > 26 + rng() * 6; y--) px(g, x + Math.round(Math.sin(y * 0.6 + i) * 1.4), y, hsl(140, 55, 34 + (40 - y))); }
    px(g, 0, 36, hsl(45, 55, 62), S, 4); for (let i = 0; i < 8; i++) px(g, rng() * 40, 36 + rng() * 4, hsl(45, 45, 50));
  } else if (set === 3) { // sky: gradient and clouds
    vgrad(g, S, S, [215, 85, 52], [200, 80, 80]);
    for (let i = 0; i < 5; i++) { const x = rng() * 40, y = 6 + rng() * 30; blob(g, x, y, 6, 2.5, { main: "#fff", shade: "#d6e6f7", light: "#fff" }); blob(g, x + 4, y - 2, 4, 2.5, { main: "#fff", shade: "#d6e6f7", light: "#fff" }); }
  } else if (set === 4) { // void: stars and rings
    vgrad(g, S, S, [270, 55, 10], [285, 60, 20]);
    for (let i = 0; i < 26; i++) star(rng() * 40, rng() * 40, rng() < 0.3 ? "#ffd7ff" : "#8b7bd8");
    for (let r = 6; r < 22; r += 5) for (let a = 0; a < 6.28; a += 0.12) px(g, 20 + Math.cos(a) * r * 1.4, 22 + Math.sin(a) * r * 0.6, hsl(280, 60, 28 + r));
  } else { // neon: dark with a grid and a striped sun
    vgrad(g, S, S, [250, 60, 10], [300, 70, 18]);
    blob(g, 20, 15, 9, 9, { main: "#ff4fd8", shade: "#ff4fd8", light: "#ffb0ee" }); for (let y = 16; y < 25; y += 3) px(g, 8, y, "#190a33", 24, 1);
    for (let y = 26; y < 40; y += 3 + (y - 26) / 6) px(g, 0, y, hsl(185, 90, 55), S, 1); for (let x = -40; x < 80; x += 8) { g.strokeStyle = hsl(185, 90, 55); g.lineWidth = 1; g.beginPath(); g.moveTo(20, 25); g.lineTo(20 + x, 40); g.stroke(); }
  }
}

// ---------------------------------------------------------------- creature
function creature(card: { seed: number; rarity: string }, hue: number): HTMLCanvasElement {
  const rng = makeRng(card.seed * 131 + 17), c = cv(), g = c.getContext("2d")!;
  const h = hue + rng.range(-35, 35);
  const pal: Pal = { main: hsl(h, 58, 52), shade: hsl(h + 8, 56, 36), light: hsl(h - 6, 68, 70), acc: hsl(h + 150, 66, 56), belly: hsl(h + 18, 62, 82), dark: hsl(h, 40, 14) };
  const accP = { main: pal.acc, shade: hsl(h + 150, 60, 38), light: hsl(h + 150, 75, 74) }, bellyP = { main: pal.belly, shade: hsl(h + 18, 45, 68), light: hsl(h + 18, 80, 92) };
  const cx = 20, rare = card.rarity === "rare" || card.rarity === "epic" || card.rarity === "legendary", big = card.rarity === "epic" || card.rarity === "legendary";
  const type = rng.int(4), biped = type === 3;
  const rx = [11, 8.5, 13, 8.5][type] + rng.range(-1, 1), ry = [10, 12.5, 8.5, 8][type] + rng.range(-1, 1), by = biped ? 29 : 25;
  const hrx = biped ? 8.5 : rx, hry = biped ? 7.5 : ry, hy = biped ? 15 : by - ry * 0.35;
  const top = hy - hry;
  // back layer: wings and tail
  if (big) { for (const s of [-1, 1]) { tri(g, [cx + s * 5, by - 6], [cx + s * 19, by - 17], [cx + s * 14, by + 1], pal.acc); tri(g, [cx + s * 5, by - 6], [cx + s * 15, by - 13], [cx + s * 12, by - 3], accP.light); } }
  const tail = rng.int(3);
  if (tail) for (let i = 0; i < 5; i++) blob(g, cx + rx - 1 + i * 1.7, by + ry - 3 - i * (tail === 1 ? 1.6 : 0.6), 2.4 - i * 0.25, 2.4 - i * 0.25, i === 4 && tail === 1 ? accP : pal);
  for (const s of [-1, 1]) blob(g, cx + s * (rx * 0.45), by + ry - 1.5, 3.6, 2.2, pal);
  blob(g, cx, by, rx, ry, pal);
  blob(g, cx, by + ry * 0.28, rx * 0.55, ry * 0.58, bellyP);
  // pattern
  const pat = rng.int(3);
  if (pat === 1) for (let i = 0; i < 5; i++) { const a = rng() * 6.28, d = rng() * 0.7; blob(g, cx + Math.cos(a) * rx * d, by + Math.sin(a) * ry * d - ry * 0.15, 1.4 + rng() * 1.2, 1.4 + rng(), { main: pal.shade, shade: pal.shade, light: pal.shade }); }
  if (pat === 2) for (let y = Math.floor(by - ry); y < by + ry * 0.5; y += 4) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 1 - by) / ry; if (dx * dx + dy * dy < 0.92) px(g, x, y, pal.shade, 1, 1); }
  for (const s of [-1, 1]) blob(g, cx + s * (rx - 0.5), by + 1, 2.6, 3.6, pal);
  if (biped) { blob(g, cx, hy, hrx, hry, pal); }
  // ears
  const ear = rng.int(4);
  for (const s of [-1, 1]) {
    const ex = cx + s * (hrx - 2.5);
    if (ear === 1) { tri(g, [ex - s * 3, top + 3], [ex + s * 2, top - 7], [ex + s * 4, top + 2], pal.main); tri(g, [ex - s * 1, top + 2], [ex + s * 1.5, top - 4], [ex + s * 3, top + 1.5], accP.light); }
    if (ear === 2) { blob(g, ex + s, top + 1, 3.6, 3.6, pal); blob(g, ex + s, top + 1.5, 1.9, 1.9, bellyP); }
    if (ear === 3) { blob(g, ex, top - 5, 2.4, 6.5, pal); blob(g, ex, top - 4, 1.2, 4, bellyP); }
  }
  if (rare) for (const s of [-1, 1]) tri(g, [cx + s * 3, top + 1], [cx + s * 6, top - 7 - (big ? 2 : 0)], [cx + s * 6.5, top + 2], big ? "#ffd23f" : "#e8e2c8");
  if (card.rarity === "legendary") { tri(g, [cx - 3, top + 1], [cx, top - 6], [cx + 3, top + 1], "#ffd23f"); px(g, cx - 0.5, top - 3, "#fff", 1, 1); }
  // face
  const fy = biped ? hy + 1 : by - ry * 0.28, eyes = rng() < 0.14 ? 1 : rng() < 0.12 ? 3 : 2, es = 2.7 + rng() * 0.8, ex = hrx * 0.42;
  const eyeAt = (x: number, y: number) => { blob(g, x, y, es, es, { main: "#fff", shade: "#dfe6f5", light: "#fff" }); blob(g, x + 0.3, y + 0.4, es * 0.55, es * 0.6, { main: pal.dark, shade: pal.dark, light: pal.dark }); px(g, x - 0.7, y - 0.8, "#fff", 1, 1); };
  if (eyes === 1) eyeAt(cx, fy - 0.5); else { eyeAt(cx - ex, fy); eyeAt(cx + ex, fy); if (eyes === 3) eyeAt(cx, fy - es * 1.7); }
  const mouth = rng.int(3), my = fy + es + 2;
  if (mouth === 0) { px(g, cx - 2, my, pal.dark, 5, 1); px(g, cx - 3, my - 1, pal.dark, 1, 1); px(g, cx + 3, my - 1, pal.dark, 1, 1); }
  if (mouth === 1) { px(g, cx - 2, my - 1, pal.dark, 5, 3); px(g, cx - 1, my, "#ff6b81", 3, 1); }
  if (mouth === 2) { px(g, cx - 2, my, pal.dark, 5, 1); px(g, cx - 2, my + 1, "#fff", 1, 2); px(g, cx + 2, my + 1, "#fff", 1, 2); }
  px(g, cx - ex - 3, fy + es, hsl(h + 330, 80, 70, 0.55), 2, 1); px(g, cx + ex + 2, fy + es, hsl(h + 330, 80, 70, 0.55), 2, 1);
  // 1px dark outline around everything
  const d = g.getImageData(0, 0, S, S), a = d.data, o = new Uint8ClampedArray(a), [or, og, ob] = (() => { const t = cv(1, 1).getContext("2d")!; t.fillStyle = pal.dark; t.fillRect(0, 0, 1, 1); const p = t.getImageData(0, 0, 1, 1).data; return [p[0], p[1], p[2]]; })();
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4; if (a[i + 3] > 0) continue; const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => { const xx = x + u, yy = y + v; return xx >= 0 && yy >= 0 && xx < S && yy < S && a[(yy * S + xx) * 4 + 3] > 0; }); if (n) { o[i] = or; o[i + 1] = og; o[i + 2] = ob; o[i + 3] = 255; } }
  d.data.set(o); g.putImageData(d, 0, 0);
  return c;
}

/** The finished 40x40 card picture. */
export function artUrl(card: { seed: number; set: number; rarity: string }, hue: number): string {
  const key = `a${card.seed}`; const hit = cache.get(key); if (hit) return hit;
  const c = cv(), g = c.getContext("2d")!, rng = makeRng(card.seed * 7 + 3);
  background(g, card.set, rng);
  g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(20, 37, 11, 2.2, 0, 0, 6.3); g.fill();
  g.drawImage(creature(card, hue), 0, 0);
  const sp = card.rarity === "legendary" ? 12 : card.rarity === "epic" ? 6 : 0, col = card.rarity === "legendary" ? "#fff6b0" : "#ead0ff";
  for (let i = 0; i < sp; i++) { const x = 2 + Math.floor(rng() * 36), y = 2 + Math.floor(rng() * 28); px(g, x, y, col); px(g, x - 1, y, col); px(g, x + 1, y, col); px(g, x, y - 1, col); px(g, x, y + 1, col); }
  const url = c.toDataURL(); cache.set(key, url); return url;
}

/** Pack wrapper art, 36x48: crimped foil, bands, a gem. The set name is drawn by the page so it stays crisp. */
export function packUrl(set: number, hue: number): string {
  const key = `p${set}`; const hit = cache.get(key); if (hit) return hit;
  const W = 36, H = 48, c = cv(W, H), g = c.getContext("2d")!;
  px(g, 0, 0, hsl(hue, 35, 12), W, H);
  for (let y = 2; y < H - 2; y++) { const t = (y % 12) / 12; px(g, 2, y, hsl(hue + t * 14, 68, 46 + (1 - t) * 14), W - 4, 1); }
  for (let y = 4; y < H - 4; y += 12) px(g, 2, y, hsl(hue, 80, 78), W - 4, 1);
  for (let x = 1; x < W - 1; x += 2) { px(g, x, 1, hsl(hue, 55, 30), 1, 3); px(g, x, H - 4, hsl(hue, 55, 30), 1, 3); px(g, x, 4, hsl(hue, 80, 74), 1, 1); px(g, x, H - 5, hsl(hue, 45, 30), 1, 1); }
  tri(g, [18, 14], [27, 24], [18, 34], "#fff"); tri(g, [18, 14], [9, 24], [18, 34], "#e6efff"); tri(g, [18, 16], [24, 24], [18, 31], hsl(hue + 20, 80, 55)); tri(g, [18, 16], [12, 24], [18, 31], hsl(hue + 20, 80, 42)); px(g, 16, 19, "#fff", 2, 2);
  for (let i = 0; i < 6; i++) { const x = 3 + ((i * 7) % 30), y = 6 + ((i * 11) % 36); px(g, x, y, "#ffffffaa"); }
  g.globalCompositeOperation = "destination-out"; for (const [x, y] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]]) px(g, x, y, "#000");
  const url = c.toDataURL(); cache.set(key, url); return url;
}

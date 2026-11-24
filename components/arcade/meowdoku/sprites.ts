// Pixel art for Meowdoku, drawn in code on tiny canvases (no image files). The cat is a tuxedo cat made of a few shapes; fish are the lives.
const cache = new Map<string, string>();
export type G = CanvasRenderingContext2D;
export const cv = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
export const px = (g: G, x: number, y: number, c: string, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.floor(x), Math.floor(y), w, h); };
export function ell(g: G, cx: number, cy: number, rx: number, ry: number, c: string, c2?: string) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) px(g, x, y, c2 && dx * 0.5 + dy * 0.85 > 0.55 ? c2 : c);
  }
}
export function tri(g: G, a: number[], b: number[], c: number[], col: string) {
  const s = (p: number[], q: number[], r: number[]) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  for (let y = Math.floor(Math.min(a[1], b[1], c[1])); y <= Math.ceil(Math.max(a[1], b[1], c[1])); y++) for (let x = Math.floor(Math.min(a[0], b[0], c[0])); x <= Math.ceil(Math.max(a[0], b[0], c[0])); x++) {
    const p = [x + 0.5, y + 0.5], d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) px(g, x, y, col);
  }
}
function outline(c: HTMLCanvasElement, col: [number, number, number]) {
  const g = c.getContext("2d")!, w = c.width, h = c.height, d = g.getImageData(0, 0, w, h), a = d.data, o = new Uint8ClampedArray(a);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (a[i + 3]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => { const xx = x + u, yy = y + v; return xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3] > 0; })) { o[i] = col[0]; o[i + 1] = col[1]; o[i + 2] = col[2]; o[i + 3] = 255; }
  }
  d.data.set(o); g.putImageData(d, 0, 0);
}

export type Mood = "normal" | "oops" | "happy";
/** The tuxedo cat, 26x24, as a canvas (catUrl caches it as an image). */
export function catCanvas(mood: Mood = "normal"): HTMLCanvasElement {
  const W = 26, H = 24, c = cv(W, H), g = c.getContext("2d")!, fur = "#25253a", fur2 = "#3b3b58", white = "#fff8f0", white2 = "#e8dccf", pink = "#ff9fb5", dark = "#12121c", cx = 13;
  tri(g, [4, 11], [6, 1], [12, 6], fur); tri(g, [22, 11], [20, 1], [14, 6], fur);                 // ears
  tri(g, [6, 9], [7, 3.5], [10, 6.5], pink); tri(g, [20, 9], [19, 3.5], [16, 6.5], pink);
  ell(g, cx, 14, 10.5, 8, fur, fur2);                                                              // head
  tri(g, [cx, 6], [cx - 2.5, 14], [cx + 2.5, 14], white);                                         // white blaze
  ell(g, cx, 18.5, 6, 4, white, white2);                                                          // muzzle
  const eye = (x: number) => {
    if (mood === "happy") { px(g, x - 2, 13, dark, 1, 1); px(g, x - 1, 12, dark, 3, 1); px(g, x + 2, 13, dark, 1, 1); return; }   // ^ ^ eyes
    ell(g, x, 12.6, 3.3, mood === "oops" ? 3.9 : 3.6, white, white2); ell(g, x + (mood === "oops" ? 0 : 0.4), 12.9, mood === "oops" ? 1.7 : 2.1, mood === "oops" ? 1.9 : 2.5, dark); px(g, x - 1.2, 11.2, "#fff", 2, 2); px(g, x + 0.8, 14, "#ffffffaa", 1, 1);   // big round eyes with two glints
  };
  eye(8.5); eye(17.5);
  if (mood === "oops") { px(g, 6, 8, dark, 5, 1); px(g, 15, 8, dark, 5, 1); px(g, 22, 17, "#7ec8ff", 1, 2); px(g, 22, 19, "#bfe5ff", 1, 1); }   // worried brows + a sweat drop
  px(g, cx - 1, 16, pink, 3, 1); px(g, cx, 17, pink, 1, 1);                                        // nose
  if (mood === "happy") { px(g, cx - 3, 19, dark, 7, 1); px(g, cx - 2, 20, dark, 5, 1); px(g, cx - 1, 20, pink, 3, 1); px(g, cx - 3, 18, dark, 1, 1); px(g, cx + 3, 18, dark, 1, 1); }
  else if (mood === "oops") { px(g, cx - 2, 20, dark, 5, 1); px(g, cx - 3, 21, dark, 1, 1); px(g, cx + 3, 21, dark, 1, 1); }
  else { px(g, cx, 18, dark, 1, 1); px(g, cx - 2, 19, dark, 2, 1); px(g, cx + 1, 19, dark, 2, 1); }
  for (const s of [-1, 1]) for (const dy of [0, 2]) px(g, s < 0 ? 0 : 20, 17 + dy, white, 6, 1);   // whiskers
  px(g, 4, 17, "#ff9fb533", 3, 2); px(g, 19, 17, "#ff9fb533", 3, 2);                               // blush
  outline(c, [18, 18, 28]); return c;
}
export function catUrl(mood: Mood = "normal"): string { const key = `cat:${mood}`, hit = cache.get(key); if (hit) return hit; const url = catCanvas(mood).toDataURL(); cache.set(key, url); return url; }
/** A little fish for the lives counter, 16x10. `lost` makes it a grey outline. */
export function fishUrl(lost = false): string {
  const key = `fish:${lost}`, hit = cache.get(key); if (hit) return hit;
  const c = cv(16, 10), g = c.getContext("2d")!, body = lost ? "#3a3a50" : "#ffb02e", body2 = lost ? "#2c2c40" : "#e0881a", light = lost ? "#4a4a62" : "#ffd27a";
  tri(g, [11, 5], [15.5, 0.5], [15.5, 9.5], body2); ell(g, 6.5, 5, 6, 3.8, body, body2); px(g, 3, 3, light, 4, 1); px(g, 3, 4, light, 2, 1);
  px(g, 3, 4, lost ? "#8a8aa8" : "#2a1a05", 1, 1); px(g, 8, 3, body2, 1, 4);                       // eye and a gill line
  outline(c, [18, 18, 28]); const url = c.toDataURL(); cache.set(key, url); return url;
}

/** The Meowdoku logo: a rounded tile (purple and orange, white grid lines and X marks) with a sticker-outlined tuxedo cat. Drawn at 48x48 then scaled up crisply. */
export function makeLogo(scale = 8): string {
  const S = 48, c = cv(S, S), g = c.getContext("2d")!, inside = (x: number, y: number) => { const dx = Math.min(x - 2, 45 - x), dy = Math.min(y - 2, 45 - y); return x >= 2 && x <= 45 && y >= 2 && y <= 45 && (dx >= 5 || dy >= 5 || (5 - dx) ** 2 + (5 - dy) ** 2 <= 25); };
  for (let y = 2; y <= 45; y++) for (let x = 2; x <= 45; x++) {
    if (!inside(x, y)) continue; const split = 28 + Math.round(((y - 2) / 43) * 6), t = (y - 2) / 43, purple = x < split;
    const col = purple ? `hsl(${268 - t * 8} ${72 - t * 6}% ${60 - t * 14}%)` : `hsl(${34 - t * 4} 100% ${58 - t * 10}%)`; px(g, x, y, col);
  }
  for (const k of [14, 26, 38]) for (let i = 2; i <= 45; i++) { if (inside(k, i)) px(g, k, i, "rgba(255,255,255,.85)"); if (inside(i, k)) px(g, i, k, "rgba(255,255,255,.85)"); }
  const X = (cx: number, cy: number) => { for (let i = -4; i <= 4; i++) for (const [a, b] of [[i, i], [i, -i], [i + 1, i], [i + 1, -i]]) px(g, cx + a, cy + b, "#fff"); };
  X(32, 8); X(9, 38); X(40, 32);
  const cat = catCanvas("normal"), sil = cv(26, 24), sg = sil.getContext("2d")!; sg.drawImage(cat, 0, 0); sg.globalCompositeOperation = "source-in"; sg.fillStyle = "#fff"; sg.fillRect(0, 0, 26, 24);
  const dark = cv(26, 24), dg = dark.getContext("2d")!; dg.drawImage(cat, 0, 0); dg.globalCompositeOperation = "source-in"; dg.fillStyle = "rgba(20,10,50,.45)"; dg.fillRect(0, 0, 26, 24);
  const ox = 10, oy = 15; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (Math.abs(a) + Math.abs(b) <= 3) g.drawImage(dark, ox + a + 1, oy + b + 2);
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (Math.abs(a) + Math.abs(b) <= 3) g.drawImage(sil, ox + a, oy + b);
  g.drawImage(cat, ox, oy);
  for (let y = 1; y <= 46; y++) for (let x = 1; x <= 46; x++) if (!inside(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inside(x + a, y + b))) px(g, x, y, "#1a1038");
  for (let x = 4; x <= 43; x++) if (inside(x, 3)) px(g, x, 3, "rgba(255,255,255,.35)");   // gloss
  const out = cv(S * scale, S * scale), og = out.getContext("2d")!; og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, S * scale, S * scale); return out.toDataURL();
}

/** The same cat in another coat (0 tuxedo, 1 orange tabby, 2 grey, 3 cream, 4 brown) for the cats you meet on the map. */
const COATS: [string, string][] = [["#25253a", "#3b3b58"], ["#e8903a", "#f4b86a"], ["#7c8196", "#a4a9bd"], ["#e8d3a8", "#f6e8c8"], ["#8a5a3a", "#aa7a56"]];
export function npcCatUrl(coat: number, mood: Mood = "normal"): string {
  const key = `npc:${coat}:${mood}`, hit = cache.get(key); if (hit) return hit; const c = catCanvas(mood), g = c.getContext("2d")!, d = g.getImageData(0, 0, c.width, c.height), a = d.data, hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), [d1, d2] = [hex(COATS[0][0]), hex(COATS[0][1])], [n1, n2] = [hex(COATS[coat % 5][0]), hex(COATS[coat % 5][1])];
  for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const m = (t: number[]) => a[i] === t[0] && a[i + 1] === t[1] && a[i + 2] === t[2]; if (m(d1)) { a[i] = n1[0]; a[i + 1] = n1[1]; a[i + 2] = n1[2]; } else if (m(d2)) { a[i] = n2[0]; a[i + 1] = n2[1]; a[i + 2] = n2[2]; } }
  g.putImageData(d, 0, 0); const url = c.toDataURL(); cache.set(key, url); return url;
}

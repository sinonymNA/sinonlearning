// Pixel art for Cat Grid, drawn in code on tiny canvases (no image files). The cat is a tuxedo cat made of a few shapes; fish are the lives.
const cache = new Map<string, string>();
type G = CanvasRenderingContext2D;
const cv = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const px = (g: G, x: number, y: number, c: string, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.floor(x), Math.floor(y), w, h); };
function ell(g: G, cx: number, cy: number, rx: number, ry: number, c: string, c2?: string) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) px(g, x, y, c2 && dx * 0.5 + dy * 0.85 > 0.55 ? c2 : c);
  }
}
function tri(g: G, a: number[], b: number[], c: number[], col: string) {
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
/** The tuxedo cat, 26x24. */
export function catUrl(mood: Mood = "normal"): string {
  const key = `cat:${mood}`, hit = cache.get(key); if (hit) return hit;
  const W = 26, H = 24, c = cv(W, H), g = c.getContext("2d")!, fur = "#25253a", fur2 = "#3b3b58", white = "#fff8f0", white2 = "#e8dccf", pink = "#ff9fb5", dark = "#12121c", cx = 13;
  tri(g, [4, 11], [6, 1], [12, 6], fur); tri(g, [22, 11], [20, 1], [14, 6], fur);                 // ears
  tri(g, [6, 9], [7, 3.5], [10, 6.5], pink); tri(g, [20, 9], [19, 3.5], [16, 6.5], pink);
  ell(g, cx, 14, 10.5, 8, fur, fur2);                                                              // head
  tri(g, [cx, 6], [cx - 2.5, 14], [cx + 2.5, 14], white);                                         // white blaze
  ell(g, cx, 18.5, 6, 4, white, white2);                                                          // muzzle
  const eye = (x: number) => {
    if (mood === "happy") { px(g, x - 2, 13, dark, 1, 1); px(g, x - 1, 12, dark, 3, 1); px(g, x + 2, 13, dark, 1, 1); return; }   // ^ ^ eyes
    ell(g, x, 13, 3, mood === "oops" ? 3.6 : 3.2, white, white2); ell(g, x + (mood === "oops" ? 0 : 0.5), 13.5, 1.6, mood === "oops" ? 1.6 : 2, dark); px(g, x - 0.5, 12.2, "#fff", 1, 1);
  };
  eye(8.5); eye(17.5);
  if (mood === "oops") { px(g, 6, 8, dark, 5, 1); px(g, 15, 8, dark, 5, 1); px(g, 22, 17, "#7ec8ff", 1, 2); px(g, 22, 19, "#bfe5ff", 1, 1); }   // worried brows + a sweat drop
  px(g, cx - 1, 16, pink, 3, 1); px(g, cx, 17, pink, 1, 1);                                        // nose
  if (mood === "happy") { px(g, cx - 3, 19, dark, 7, 1); px(g, cx - 2, 20, dark, 5, 1); px(g, cx - 1, 20, pink, 3, 1); px(g, cx - 3, 18, dark, 1, 1); px(g, cx + 3, 18, dark, 1, 1); }
  else if (mood === "oops") { px(g, cx - 2, 20, dark, 5, 1); px(g, cx - 3, 21, dark, 1, 1); px(g, cx + 3, 21, dark, 1, 1); }
  else { px(g, cx, 18, dark, 1, 1); px(g, cx - 2, 19, dark, 2, 1); px(g, cx + 1, 19, dark, 2, 1); }
  for (const s of [-1, 1]) for (const dy of [0, 2]) px(g, s < 0 ? 0 : 20, 17 + dy, white, 6, 1);   // whiskers
  px(g, 4, 17, "#ff9fb533", 3, 2); px(g, 19, 17, "#ff9fb533", 3, 2);                               // blush
  outline(c, [18, 18, 28]); const url = c.toDataURL(); cache.set(key, url); return url;
}
/** A little fish for the lives counter, 16x10. `lost` makes it a grey outline. */
export function fishUrl(lost = false): string {
  const key = `fish:${lost}`, hit = cache.get(key); if (hit) return hit;
  const c = cv(16, 10), g = c.getContext("2d")!, body = lost ? "#3a3a50" : "#ffb02e", body2 = lost ? "#2c2c40" : "#e0881a", light = lost ? "#4a4a62" : "#ffd27a";
  tri(g, [11, 5], [15.5, 0.5], [15.5, 9.5], body2); ell(g, 6.5, 5, 6, 3.8, body, body2); px(g, 3, 3, light, 4, 1); px(g, 3, 4, light, 2, 1);
  px(g, 3, 4, lost ? "#8a8aa8" : "#2a1a05", 1, 1); px(g, 8, 3, body2, 1, 4);                       // eye and a gill line
  outline(c, [18, 18, 28]); const url = c.toDataURL(); cache.set(key, url); return url;
}

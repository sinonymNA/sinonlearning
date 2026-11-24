// Cat Stack art: chunky pixel-art cat "loaves" (drawn in code on tiny canvases, scaled up crisply) and the mystery cardboard box. Everything is flat and side-on on purpose:
// the sorting mechanic stacks things in tubes, which is natural in 2D (unlike nuts on bolts, which only look right in true 3D).
const cache = new Map<string, string>();
export const CAT_W = 26, CAT_H = 17;          // sprite size in art pixels (1px outline included)
export const CAT_STEP = 10;                   // how many art pixels each cat sits above the one below (the ears tuck under the next cat)

export const PALETTE = ["#e5484d", "#f28c28", "#f6c21a", "#8cc63f", "#1f9d55", "#14a9b8", "#4d86ff", "#9b5de5", "#f48fb8", "#9a5b2f", "#eef0f7", "#c42b8a"];
export const NAMES = ["red", "orange", "yellow", "lime", "green", "teal", "blue", "purple", "pink", "brown", "white", "magenta"];
export const GLYPHS = ["●", "▲", "■", "◆", "★", "♥", "✚", "⬟", "▼", "✦", "◐", "✖"];
const DARK = "#1c1630";

const cv = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (h: string, t: string, k: number) => { const a = rgb(h), b = rgb(t); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`; };
const px = (g: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x + 1, y + 1, w, h); };   // +1: room for the outline
function outline(c: HTMLCanvasElement, col: string) {
  const g = c.getContext("2d")!, w = c.width, h = c.height, d = g.getImageData(0, 0, w, h), a = d.data, o = new Uint8ClampedArray(a), [r, gg, b] = rgb(col);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (a[i + 3]) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => { const xx = x + u, yy = y + v; return xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3] > 40; })) { o[i] = r; o[i + 1] = gg; o[i + 2] = b; o[i + 3] = 255; } }
  d.data.set(o); g.putImageData(d, 0, 0);
}
const QMARK = ["01110", "10001", "00001", "00110", "00100", "00000", "00100"];

/** One cat loaf: body colour from the palette, plain / striped / spotted by colour number (so colours also differ by pattern), `happy` for a finished tube, `hidden` for the mystery box. */
export function catUrl(colour: number, hidden = false, glyph = false, happy = false): string {
  const key = `c:${colour}:${hidden}:${glyph}:${happy}`, hit = cache.get(key); if (hit) return hit;
  const c = cv(CAT_W, CAT_H), g = c.getContext("2d")!;
  if (hidden) {   // a taped cardboard box with a "?"
    px(g, 1, 3, "#c9975a", 22, 12); px(g, 1, 1, "#e3b878", 22, 3); px(g, 1, 13, "#a8743c", 22, 2); px(g, 0, 2, "#e3b878", 1, 1); px(g, 23, 2, "#e3b878", 1, 1);
    px(g, 9, 1, "#f3e3b8", 6, 3); px(g, 9, 1, "#fff6d8", 6, 1);   // tape over the lid
    QMARK.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "1") { px(g, 10 + x, 6 + y + 1, "#5b3a1e"); px(g, 10 + x, 6 + y, "#fff"); } }));
    outline(c, DARK); const url = c.toDataURL(); cache.set(key, url); return url;
  }
  const base = PALETTE[colour % PALETTE.length], light = mix(base, "#ffffff", 0.38), dark = mix(base, "#000000", 0.28), pink = "#ff9fb5", pat = Math.floor((colour % 12) / 4);   // 0 plain, 1 striped, 2 spotted
  // ears (with pink insides)
  for (const [x, y] of [[4, 0], [3, 1], [4, 1], [5, 1], [3, 2], [4, 2], [5, 2], [6, 2]]) { px(g, x, y, base); px(g, 23 - x, y, base); }
  px(g, 4, 1, pink); px(g, 19, 1, pink); px(g, 4, 2, pink); px(g, 19, 2, pink);
  // head and body: a rounded block
  px(g, 1, 3, base, 22, 12); for (const [x, y] of [[1, 3], [22, 3], [1, 14], [22, 14]]) g.clearRect(x + 1, y + 1, 1, 1);
  px(g, 2, 3, light, 20, 1); px(g, 7, 12, light, 10, 3);                     // top highlight and a lighter belly
  px(g, 1, 11, dark, 1, 3); px(g, 22, 11, dark, 1, 3);                        // shaded sides
  if (pat === 1) { for (const x of [9, 11, 13, 15]) px(g, x, 3, dark, 1, 3); px(g, 1, 7, dark, 2, 1); px(g, 1, 9, dark, 2, 1); px(g, 21, 7, dark, 2, 1); px(g, 21, 9, dark, 2, 1); }
  if (pat === 2) { for (const [x, y] of [[3, 11], [4, 11], [3, 12], [18, 11], [19, 11], [19, 12], [10, 4], [11, 4], [14, 4]]) px(g, x, y, dark); }
  // the face
  if (happy) { for (const x of [5, 16]) { px(g, x, 8, DARK); px(g, x + 1, 7, DARK); px(g, x + 2, 8, DARK); } px(g, 10, 10, DARK, 4, 1); px(g, 11, 11, pink, 2, 1); }
  else { for (const x of [6, 16]) { px(g, x, 7, DARK, 2, 2); px(g, x, 7, "#fff", 1, 1); } px(g, 11, 9, pink, 2, 1); px(g, 10, 10, DARK, 1, 1); px(g, 13, 10, DARK, 1, 1); px(g, 11, 11, DARK, 2, 1); }
  px(g, 4, 9, pink, 2, 1); px(g, 18, 9, pink, 2, 1);                          // blush
  outline(c, DARK);
  if (glyph) { g.font = "bold 8px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 2; g.strokeStyle = "rgba(28,22,48,.8)"; g.strokeText(GLYPHS[colour % GLYPHS.length], 13, 13.5); g.fillStyle = "#fff"; g.fillText(GLYPHS[colour % GLYPHS.length], 13, 13.5); }
  const url = c.toDataURL(); cache.set(key, url); return url;
}
/** A pixel heart badge that pops over a finished tube, 11x10. */
export function heartUrl(): string {
  const hit = cache.get("heart"); if (hit) return hit; const c = cv(13, 12), g = c.getContext("2d")!;
  for (const [x, y, w] of [[1, 1, 3], [6, 1, 3], [0, 2, 5], [5, 2, 5], [0, 3, 9], [0, 4, 9], [1, 5, 7], [2, 6, 5], [3, 7, 3], [4, 8, 1]] as [number, number, number][]) px(g, x, y, "#ff4d6d", w, 1);
  px(g, 1, 2, "#ffb3c1", 2, 1); px(g, 1, 3, "#ffb3c1", 1, 1); outline(c, DARK); const url = c.toDataURL(); cache.set("heart", url); return url;
}

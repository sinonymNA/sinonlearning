// Bolt Sort art. Nothing here is 3D at runtime: each nut is a hex prism drawn ONCE on a canvas (top face, three lit side faces, a hole, a glint) and reused as a plain image.
// The page then only moves cached images with GPU transforms, which is why it stays smooth on old phones.
const cache = new Map<string, string>();
export const SPR_W = 160;                    // sprite width in px (drawn once, scaled down by CSS)
const RX = 78, RY = 31, CY = RY + 3, SIDE = 38;   // hexagon half-width, half-height (the tilt), centre y, height of the side band
export const SPR_H = Math.ceil(CY + RY * 0.866 + SIDE + 3);
export const STEP = SIDE / SPR_W;            // how far each nut sits above the one below, as a fraction of the nut width
export const HS = SPR_H / SPR_W;             // sprite height as a fraction of its width

export const PALETTE = ["#e5322d", "#f28c28", "#f6c21a", "#8cc63f", "#1f9d55", "#14a9b8", "#2f6df0", "#8b3fd0", "#f48fb8", "#9a5b2f", "#e9eaf2", "#c42b8a"];
export const NAMES = ["red", "orange", "yellow", "lime", "green", "teal", "blue", "purple", "pink", "brown", "white", "magenta"];
export const GLYPHS = ["●", "▲", "■", "◆", "★", "♥", "✚", "⬟", "▼", "✦", "◐", "✖"];

const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shade = (h: string, k: number) => { const [r, g, b] = hexToRgb(h); const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const cv = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const hexPt = (i: number, dy = 0): [number, number] => [SPR_W / 2 + RX * Math.cos((i * Math.PI) / 3), CY + RY * Math.sin((i * Math.PI) / 3) + dy];

function poly(g: CanvasRenderingContext2D, pts: [number, number][], fill: string | CanvasGradient, stroke?: string) {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.lineJoin = "round"; g.stroke(); }
}
/** One nut sprite. `hidden` draws the dark "?" mystery nut; `glyph` adds a symbol for colour-blind players. */
export function nutUrl(colour: number, hidden = false, glyph = false): string {
  const key = `n:${colour}:${hidden}:${glyph}`, hit = cache.get(key); if (hit) return hit;
  const base = hidden ? "#3a3d4c" : PALETTE[colour % PALETTE.length], c = cv(SPR_W, SPR_H), g = c.getContext("2d")!, edge = shade(base, 0.45);
  // side faces: right (index 0-1), front (1-2), left (2-3), each a vertical gradient so the band looks rounded
  const faces: [number, number, number, number][] = [[0, 1, 0.9, 0.7], [1, 2, 0.78, 0.6], [2, 3, 0.62, 0.48]];
  for (const [a, b, lo, hi] of faces) { const [x1, y1] = hexPt(a), [x2, y2] = hexPt(b), gr = g.createLinearGradient(0, Math.min(y1, y2), 0, Math.max(y1, y2) + SIDE); gr.addColorStop(0, shade(base, lo + 0.14)); gr.addColorStop(0.55, shade(base, lo)); gr.addColorStop(1, shade(base, hi * 0.8)); poly(g, [[x1, y1], [x2, y2], [x2, y2 + SIDE], [x1, y1 + SIDE]], gr, edge); }
  // top face with a soft light from the upper left
  const pts = [0, 1, 2, 3, 4, 5].map((i) => hexPt(i)), tg = g.createLinearGradient(SPR_W * 0.2, CY - RY, SPR_W * 0.8, CY + RY); tg.addColorStop(0, shade(base, 1.45)); tg.addColorStop(1, shade(base, 1.05));
  poly(g, pts, tg, edge);
  // the hole, with the grey bolt visible inside
  const hole = g.createRadialGradient(SPR_W / 2 - 6, CY - 4, 2, SPR_W / 2, CY, RX * 0.4); hole.addColorStop(0, "#f4f6fb"); hole.addColorStop(1, "#8c93a8");
  g.beginPath(); g.ellipse(SPR_W / 2, CY, RX * 0.4, RY * 0.4, 0, 0, Math.PI * 2); g.fillStyle = hole; g.fill(); g.lineWidth = 3; g.strokeStyle = shade(base, 0.4); g.stroke();
  g.beginPath(); g.ellipse(SPR_W / 2 - 2, CY - 2, RX * 0.27, RY * 0.22, 0, 0, Math.PI * 2); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; g.stroke();
  // glint along the top-left edge and a faint rim light on the right
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); const [lx, ly] = hexPt(3), [tx, ty] = hexPt(4); g.moveTo(lx + 8, ly - 1); g.lineTo(tx + 2, ty + 3); g.stroke();
  // the mystery question mark, or the colour-blind symbol, on the front band
  const mark = hidden ? "?" : glyph ? GLYPHS[colour % GLYPHS.length] : "";
  if (mark) { g.font = `bold ${SIDE - 6}px system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; const fy = CY + RY * 0.866 + SIDE / 2 - 1; g.lineWidth = 4; g.strokeStyle = "rgba(0,0,0,.45)"; g.strokeText(mark, SPR_W / 2, fy); g.fillStyle = hidden ? "#fff" : "rgba(255,255,255,.92)"; g.fillText(mark, SPR_W / 2, fy); }
  const url = c.toDataURL(); cache.set(key, url); return url;
}
/** The round base plate every bolt stands on. */
export function plateUrl(): string {
  const hit = cache.get("plate"); if (hit) return hit; const w = Math.round(SPR_W * 1.12), h = 52, c = cv(w, h), g = c.getContext("2d")!;
  g.beginPath(); g.ellipse(w / 2, 22 + 14, w / 2 - 2, 15, 0, 0, Math.PI * 2); g.fillStyle = "#6c7389"; g.fill();                 // side
  g.fillStyle = "#6c7389"; g.fillRect(2, 22, w - 4, 14);
  g.beginPath(); g.ellipse(w / 2, 36, w / 2 - 2, 15, 0, 0, Math.PI); g.fillStyle = "#59607a"; g.fill();
  const gr = g.createLinearGradient(0, 8, 0, 36); gr.addColorStop(0, "#f2f5fb"); gr.addColorStop(1, "#b9c1d6");
  g.beginPath(); g.ellipse(w / 2, 22, w / 2 - 2, 15, 0, 0, Math.PI * 2); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = "#4c536b"; g.stroke();
  const url = c.toDataURL(); cache.set("plate", url); return url;
}
export const PLATE_W = Math.round(SPR_W * 1.12) / SPR_W;   // plate width as a fraction of the nut width
/** A bolt rod: grey cylinder with threads, drawn once and stretched by CSS (the sprite is tiny so it stays crisp). */
export function rodUrl(): string {
  const hit = cache.get("rod"); if (hit) return hit; const c = cv(40, 24), g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 40, 0); gr.addColorStop(0, "#8a92a8"); gr.addColorStop(0.35, "#f3f6fc"); gr.addColorStop(0.7, "#b9c1d6"); gr.addColorStop(1, "#7a8298"); g.fillStyle = gr; g.fillRect(0, 0, 40, 24);
  for (let y = 2; y < 24; y += 5) { g.fillStyle = "rgba(60,68,92,.35)"; g.fillRect(0, y, 40, 2); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0, y + 2, 40, 1); }
  const url = c.toDataURL(); cache.set("rod", url); return url;
}
/** A shiny cap that appears on a finished bolt. */
export function capUrl(): string {
  const hit = cache.get("cap"); if (hit) return hit; const c = cv(64, 44), g = c.getContext("2d")!;
  g.beginPath(); g.ellipse(32, 26, 28, 12, 0, 0, Math.PI * 2); g.fillStyle = "#b8860b"; g.fill();
  const gr = g.createLinearGradient(0, 8, 0, 30); gr.addColorStop(0, "#fff3a8"); gr.addColorStop(1, "#f0b429"); g.beginPath(); g.ellipse(32, 20, 28, 12, 0, 0, Math.PI * 2); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = "#8a6508"; g.stroke();
  g.strokeStyle = "#8a6508"; g.lineWidth = 5; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(22, 20); g.lineTo(29, 26); g.lineTo(43, 12); g.stroke(); g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 18); g.lineTo(29, 24); g.lineTo(43, 10); g.stroke();
  const url = c.toDataURL(); cache.set("cap", url); return url;
}
/** Where the bottom of a nut sits inside its sprite (px from the top) and how tall one side band is: the board uses these to stack nuts exactly. */
export const NUT_BASE = CY + SIDE;
export const NUT_SIDE = SIDE;

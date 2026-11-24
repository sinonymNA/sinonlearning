// Shelf Stocker art: flat, smooth vector-style illustrations drawn ONCE on canvases at 2x and reused as images (shirts, books, mystery wrapping, sign icons).
// Flat and side-on on purpose: a stack of folded shirts or lying books is naturally 2D, so nothing needs perspective, and the page stays fast (no WebGL, no per-frame drawing).
const cache = new Map<string, string>();
export const SPR_W = 200, SPR_H = 74;            // sprite size in design units (the canvas is drawn at 2x)
export const STEP = 68 / SPR_W;                  // how far each item sits above the one below, as a fraction of the item width
export const HS = SPR_H / SPR_W;

export const SHIRT_PAL = ["#e5484d", "#f28c28", "#f6c21a", "#7cc243", "#1f9d73", "#14a9b8", "#3b7cff", "#8b5cf6", "#f472b6", "#8d5a3b"];
export const SHIRT_NAMES = ["red", "orange", "yellow", "green", "teal", "cyan", "blue", "purple", "pink", "brown"];
export const BOOK_PAL = ["#14a9b8", "#b4532a", "#8b5cf6", "#3b7cff", "#f28c28", "#ec4899", "#3f9b3f", "#2d3a8c"];
export const SUBJECT_NAMES = ["Science", "History", "Fiction", "Math", "Art", "Music", "Nature", "Space"];
export const GLYPHS = ["●", "▲", "■", "◆", "★", "♥", "✚", "⬟", "▼", "✦"];

const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2; const g = c.getContext("2d")!; g.scale(2, 2); return { c, g }; };
type G = CanvasRenderingContext2D;
function rr(g: G, x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (h: string, t: string, k: number) => { const a = rgb(h), b = rgb(t); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`; };
const INK = "#2b2342";
const vgrad = (g: G, y0: number, y1: number, top: string, bot: string) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, top); gr.addColorStop(1, bot); return gr; };

/** A little emblem for each book subject (and its sign), centred on (cx, cy), about `s` units wide. */
function emblem(g: G, idx: number, cx: number, cy: number, s: number, col: string) {
  g.save(); g.translate(cx, cy); g.scale(s / 20, s / 20); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 2.2; g.lineCap = "round"; g.lineJoin = "round";
  switch (idx % 8) {
    case 0: g.beginPath(); g.moveTo(-3, -9); g.lineTo(-3, -2); g.lineTo(-9, 8); g.arcTo(-10, 10, -7, 10, 2); g.lineTo(7, 10); g.arcTo(10, 10, 9, 8, 2); g.lineTo(3, -2); g.lineTo(3, -9); g.closePath(); g.fill(); g.clearRect(-4, -11, 8, 2); break;   // flask
    case 1: g.fillRect(-8, -9, 16, 3); g.fillRect(-6, -5, 3, 12); g.fillRect(-1.5, -5, 3, 12); g.fillRect(3, -5, 3, 12); g.fillRect(-9, 8, 18, 3); break;                                                                         // column
    case 2: { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (-Math.PI / 2) + (i * Math.PI) / 5, r = i % 2 ? 4.2 : 10; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); break; }                      // star
    case 3: g.font = "bold 22px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("π", 0, 1); break;                                                                                             // pi
    case 4: g.beginPath(); g.moveTo(0, -10); g.bezierCurveTo(9, 0, 9, 9, 0, 9); g.bezierCurveTo(-9, 9, -9, 0, 0, -10); g.fill(); break;                                                                                      // paint drop
    case 5: g.beginPath(); g.ellipse(-3, 7, 5, 3.6, -0.4, 0, Math.PI * 2); g.fill(); g.fillRect(1.2, -9, 2.4, 16); g.beginPath(); g.moveTo(3.6, -9); g.quadraticCurveTo(10, -6, 8, 0); g.lineTo(3.6, -4); g.fill(); break;     // note
    case 6: g.beginPath(); g.moveTo(-9, 8); g.bezierCurveTo(-9, -8, 3, -10, 9, -9); g.bezierCurveTo(10, 0, 4, 9, -9, 8); g.fill(); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-8, 7); g.lineTo(5, -5); g.stroke(); break; // leaf
    default: g.beginPath(); g.arc(0, 0, 6.5, 0, Math.PI * 2); g.fill(); g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 11, 3.6, -0.5, 0, Math.PI * 2); g.stroke(); break;                                                        // planet
  }
  g.restore();
}
function shirtBody(g: G, base: string, variant: number) {
  const top = mix(base, "#ffffff", 0.22), bot = mix(base, "#000000", 0.14), dark = mix(base, "#000000", 0.26);
  g.fillStyle = "rgba(43,35,66,.22)"; rr(g, 12, 9, 176, 62, 15); g.fill();                                       // soft shadow under the shirt
  g.fillStyle = vgrad(g, 4, 66, dark, mix(base, "#000000", 0.38)); rr(g, 1, 12, 24, 40, 10); g.fill(); rr(g, 175, 12, 24, 40, 10); g.fill();   // sleeves
  g.fillStyle = vgrad(g, 4, 66, top, bot); rr(g, 13, 4, 174, 62, 15); g.fill();                                   // body
  g.save(); rr(g, 13, 4, 174, 62, 15); g.clip();
  if (variant % 3 === 1) { g.fillStyle = "rgba(255,255,255,.22)"; for (let x = 30; x < 190; x += 24) g.fillRect(x, 0, 9, 74); }                      // stripes
  if (variant % 3 === 2) { g.fillStyle = "rgba(255,255,255,.26)"; for (let y = 16; y < 66; y += 17) for (let x = 24 + ((y / 17) % 2) * 12; x < 190; x += 24) { g.beginPath(); g.arc(x, y, 3.6, 0, Math.PI * 2); g.fill(); } }   // dots
  g.fillStyle = "rgba(0,0,0,.1)"; g.fillRect(13, 38, 174, 2.5); g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(13, 6, 174, 3);               // fold crease and top highlight
  g.restore();
  g.fillStyle = "#fff8ee"; g.beginPath(); g.ellipse(100, 6, 21, 11, 0, 0, Math.PI); g.fill(); g.fillStyle = dark; g.beginPath(); g.ellipse(100, 6, 14, 6.5, 0, 0, Math.PI); g.fill();   // the collar
}
/** One item sprite. kind "shirt" (v = colour 0-9) or "book" (v = subject 0-7). `hidden` draws the mystery wrapping (no hint of what is inside); `glyph` adds a symbol on shirts. */
export function itemUrl(kind: "shirt" | "book", v: number, hidden = false, glyph = false): string {
  const key = `i:${kind}:${v}:${hidden}:${glyph}`, hit = cache.get(key); if (hit) return hit;
  const { c, g } = mk(SPR_W, SPR_H);
  if (hidden) {
    if (kind === "shirt") {   // clear plastic bag, knotted on top, with a "?" sticker
      g.fillStyle = "rgba(43,35,66,.2)"; rr(g, 12, 9, 176, 62, 17); g.fill();
      g.fillStyle = vgrad(g, 4, 66, "#f4f8fd", "#cdd8e8"); rr(g, 8, 4, 184, 62, 17); g.fill(); g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 3; rr(g, 12, 8, 176, 54, 13); g.stroke();
      g.fillStyle = "#b9c6da"; g.beginPath(); g.moveTo(92, 6); g.lineTo(100, -1); g.lineTo(108, 6); g.closePath(); g.fill();
    } else {                  // kraft paper wrap tied with twine
      g.fillStyle = "rgba(43,35,66,.22)"; rr(g, 8, 9, 184, 62, 10); g.fill();
      g.fillStyle = vgrad(g, 4, 66, "#d9b27a", "#b98c52"); rr(g, 4, 4, 192, 62, 10); g.fill(); g.strokeStyle = "#8a6636"; g.lineWidth = 3; g.beginPath(); g.moveTo(52, 4); g.lineTo(52, 66); g.moveTo(148, 4); g.lineTo(148, 66); g.stroke();
    }
    g.fillStyle = "#3b7cff"; g.beginPath(); g.arc(100, 35, 21, 0, Math.PI * 2); g.fill(); g.lineWidth = 3; g.strokeStyle = "#fff"; g.stroke();
    g.fillStyle = "#fff"; g.font = "bold 30px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 100, 37);
  } else if (kind === "shirt") {
    shirtBody(g, SHIRT_PAL[v % SHIRT_PAL.length], v);
    if (glyph) { g.font = "bold 30px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 5; g.strokeStyle = "rgba(43,35,66,.5)"; g.strokeText(GLYPHS[v % GLYPHS.length], 100, 43); g.fillStyle = "#fff"; g.fillText(GLYPHS[v % GLYPHS.length], 100, 43); }
  } else {
    const base = BOOK_PAL[v % BOOK_PAL.length], dark = mix(base, "#000000", 0.3), light = mix(base, "#ffffff", 0.25);
    g.fillStyle = "rgba(43,35,66,.22)"; rr(g, 6, 11, 188, 59, 8); g.fill();
    g.fillStyle = "#fff4dc"; rr(g, 168, 9, 28, 53, 5); g.fill(); g.strokeStyle = "rgba(160,130,80,.5)"; g.lineWidth = 1.2; for (let y = 16; y < 58; y += 6) { g.beginPath(); g.moveTo(171, y); g.lineTo(194, y); g.stroke(); }   // the pages
    g.fillStyle = vgrad(g, 6, 64, light, dark); rr(g, 4, 6, 172, 58, 8); g.fill();                                   // the spine
    g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(4, 6, 172, 5); g.fillRect(4, 59, 172, 5);                            // cover edges
    g.fillStyle = "#f6d46a"; g.fillRect(24, 11, 5, 48); g.fillRect(150, 11, 5, 48);                                  // gold bands
    g.fillStyle = "#fff8ee"; rr(g, 52, 16, 74, 38, 7); g.fill(); g.strokeStyle = "#f6d46a"; g.lineWidth = 2; rr(g, 52, 16, 74, 38, 7); g.stroke();
    emblem(g, v, 89, 35, 22, base); g.fillStyle = "#e5484d"; g.fillRect(132, 58, 7, 13);                              // plate with the subject emblem, and a ribbon bookmark
  }
  const url = c.toDataURL(); cache.set(key, url); return url;
}
/** Small icons for shelf signs: "hanger", "books", "cart", or a subject emblem ("s0".."s7"). Dark ink on transparent. */
export function iconUrl(name: string, col = INK): string {
  const key = `ic:${name}:${col}`, hit = cache.get(key); if (hit) return hit; const { c, g } = mk(40, 40);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round";
  if (name === "hanger") { g.beginPath(); g.arc(20, 11, 4, Math.PI * 0.2, Math.PI * 1.65); g.stroke(); g.beginPath(); g.moveTo(20, 15); g.lineTo(20, 20); g.lineTo(4, 31); g.lineTo(36, 31); g.lineTo(20, 20); g.stroke(); }
  else if (name === "books") { g.fillRect(5, 8, 7, 26); g.fillRect(14, 4, 7, 30); g.save(); g.translate(28, 33); g.rotate(-0.28); g.fillRect(-3, -27, 7, 28); g.restore(); g.fillRect(2, 34, 36, 3); }
  else if (name === "cart") { g.beginPath(); g.moveTo(3, 6); g.lineTo(9, 6); g.lineTo(13, 24); g.lineTo(31, 24); g.lineTo(34, 11); g.lineTo(10, 11); g.stroke(); g.beginPath(); g.arc(15, 32, 3, 0, 7); g.arc(29, 32, 3, 0, 7); g.fill(); }
  else if (name.startsWith("s")) emblem(g, Number(name.slice(1)), 20, 20, 30, col);
  const url = c.toDataURL(); cache.set(key, url); return url;
}
/** A gold "stocked!" stamp for a finished shelf, 36x36. */
export function stampUrl(): string {
  const hit = cache.get("stamp"); if (hit) return hit; const { c, g } = mk(36, 36);
  g.fillStyle = "#ffd23f"; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? 15 : 17.5; g.lineTo(18 + Math.cos(a) * r, 18 + Math.sin(a) * r); } g.closePath(); g.fill(); g.lineWidth = 2; g.strokeStyle = "#c98a00"; g.stroke();
  g.strokeStyle = "#7a4d00"; g.lineWidth = 4.2; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(10, 18.5); g.lineTo(16, 24); g.lineTo(26.5, 12); g.stroke();
  const url = c.toDataURL(); cache.set("stamp", url); return url;
}

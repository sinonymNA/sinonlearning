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
    if (kind === "shirt") {   // a boxed product: a purple gift box with a gold ribbon, a bow and a big "?"
      g.fillStyle = "rgba(43,35,66,.24)"; rr(g, 12, 10, 176, 62, 12); g.fill();
      g.fillStyle = vgrad(g, 14, 66, "#6a5cf0", "#3d30b8"); rr(g, 14, 16, 172, 50, 9); g.fill();                 // the box
      g.fillStyle = vgrad(g, 4, 26, "#9486ff", "#6252e0"); rr(g, 7, 4, 186, 24, 9); g.fill();                    // the lid
      g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(14, 28, 172, 4); g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(14, 7, 172, 3);
      g.fillStyle = vgrad(g, 4, 66, "#ffe08a", "#f0b429"); g.fillRect(87, 4, 26, 62);                            // the ribbon
      g.fillStyle = "#f0b429"; g.beginPath(); g.ellipse(80, 8, 15, 7, -0.25, 0, Math.PI * 2); g.ellipse(120, 8, 15, 7, 0.25, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#c98a00"; g.lineWidth = 1.5; g.stroke();   // the bow
      g.fillStyle = "#ffd36a"; g.beginPath(); g.arc(100, 9, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(255,255,255,.75)"; for (const [x, y] of [[30, 44], [160, 52], [48, 58], [146, 40]]) { g.fillRect(x - 1, y - 4, 2, 8); g.fillRect(x - 4, y - 1, 8, 2); }   // sparkles
    } else {                  // kraft paper wrap tied with twine
      g.fillStyle = "rgba(43,35,66,.22)"; rr(g, 8, 9, 184, 62, 10); g.fill();
      g.fillStyle = vgrad(g, 4, 66, "#d9b27a", "#b98c52"); rr(g, 4, 4, 192, 62, 10); g.fill(); g.strokeStyle = "#8a6636"; g.lineWidth = 3; g.beginPath(); g.moveTo(52, 4); g.lineTo(52, 66); g.moveTo(148, 4); g.lineTo(148, 66); g.stroke();
    }
    const box = kind === "shirt"; g.fillStyle = box ? "#fff8ee" : "#3b7cff"; g.beginPath(); g.arc(100, 40, 21, 0, Math.PI * 2); g.fill(); g.lineWidth = 3; g.strokeStyle = box ? "#f0b429" : "#fff"; g.stroke();
    g.fillStyle = box ? "#4638c4" : "#fff"; g.font = "bold 31px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 100, 42);
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

// ---- scene art for the backgrounds and the home screen (each drawn once, animated with transforms only)
const grad = (g: G, x0: number, y0: number, x1: number, y1: number, a: string, b: string) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
/** A string of bunting, a 120x56 tile that repeats sideways. */
export function buntingUrl(): string {
  const hit = cache.get("bunting"); if (hit) return hit; const { c, g } = mk(120, 56), cols = ["#ff8fab", "#ffd166", "#7bdff2", "#b9f3c9", "#c3a6ff"], sag = (x: number) => 6 + 12 * Math.sin((Math.PI * x) / 120);
  g.strokeStyle = "#8a6a4a"; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 120; x += 4) (x ? g.lineTo(x, sag(x)) : g.moveTo(0, sag(0))); g.stroke();
  [12, 42, 72, 102].forEach((x, i) => { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(x - 12, sag(x - 12)); g.lineTo(x + 12, sag(x + 12)); g.lineTo(x, sag(x) + 30); g.closePath(); g.fill(); g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(x - 12, sag(x - 12)); g.lineTo(x - 2, sag(x - 2)); g.lineTo(x - 4, sag(x) + 14); g.closePath(); g.fill(); });
  const url = c.toDataURL(); cache.set("bunting", url); return url;
}
/** A hanger with a little tee on it, 46x72. */
export function hangerUrl(col: string): string {
  const key = `hanger:${col}`, hit = cache.get(key); if (hit) return hit; const { c, g } = mk(46, 72);
  g.strokeStyle = "#7d8aa0"; g.lineWidth = 2.4; g.lineCap = "round"; g.beginPath(); g.arc(23, 9, 4.5, Math.PI * 0.15, Math.PI * 1.6); g.stroke(); g.beginPath(); g.moveTo(23, 14); g.lineTo(23, 19); g.lineTo(4, 27); g.lineTo(42, 27); g.lineTo(23, 19); g.stroke();
  g.fillStyle = col; g.beginPath(); g.moveTo(10, 28); g.lineTo(17, 28); g.quadraticCurveTo(23, 36, 29, 28); g.lineTo(36, 28); g.lineTo(44, 38); g.lineTo(38, 44); g.lineTo(34, 40); g.lineTo(34, 68); g.lineTo(12, 68); g.lineTo(12, 40); g.lineTo(8, 44); g.lineTo(2, 38); g.closePath(); g.fill(); g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(12, 56, 22, 2);
  const url = c.toDataURL(); cache.set(key, url); return url;
}
/** A pendant lamp, 64x112: cord, amber shade, glowing bulb. */
export function lampUrl(): string {
  const hit = cache.get("lamp"); if (hit) return hit; const { c, g } = mk(64, 112);
  g.strokeStyle = "#5b4630"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 34); g.stroke();
  g.fillStyle = grad(g, 0, 34, 0, 84, "#ffcf6b", "#e08a1e"); g.beginPath(); g.moveTo(24, 34); g.lineTo(40, 34); g.quadraticCurveTo(58, 56, 60, 84); g.lineTo(4, 84); g.quadraticCurveTo(6, 56, 24, 34); g.closePath(); g.fill(); g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(22, 40); g.quadraticCurveTo(12, 56, 12, 72); g.lineTo(18, 72); g.quadraticCurveTo(18, 56, 26, 42); g.closePath(); g.fill();
  const bulb = g.createRadialGradient(32, 90, 2, 32, 90, 14); bulb.addColorStop(0, "#fffbe0"); bulb.addColorStop(1, "#ffd86b"); g.fillStyle = bulb; g.beginPath(); g.ellipse(32, 90, 12, 11, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#8a6636"; g.fillRect(4, 82, 56, 4);
  const url = c.toDataURL(); cache.set("lamp", url); return url;
}
/** A string of party lights, a 120x44 tile; `lit` 0 or 1 chooses which bulbs glow (two layers alternate to twinkle). */
export function lightsUrl(lit: 0 | 1): string {
  const key = `lights:${lit}`, hit = cache.get(key); if (hit) return hit; const { c, g } = mk(120, 44), cols = ["#ff6b9d", "#ffd23f", "#4cc3ff", "#7cd992"], sag = (x: number) => 5 + 9 * Math.sin((Math.PI * x) / 120);
  g.strokeStyle = "#3b3354"; g.lineWidth = 1.8; g.beginPath(); for (let x = 0; x <= 120; x += 4) (x ? g.lineTo(x, sag(x)) : g.moveTo(0, sag(0))); g.stroke();
  [15, 45, 75, 105].forEach((x, i) => { const y = sag(x) + 7, on = i % 2 === lit; if (on) { const gl = g.createRadialGradient(x, y, 1, x, y, 15); gl.addColorStop(0, cols[i] + "cc"); gl.addColorStop(1, cols[i] + "00"); g.fillStyle = gl; g.fillRect(x - 16, y - 16, 32, 32); } g.fillStyle = on ? cols[i] : "#6b6586"; g.beginPath(); g.ellipse(x, y, 4.2, 5.4, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#3b3354"; g.fillRect(x - 2, y - 8, 4, 3); });
  const url = c.toDataURL(); cache.set(key, url); return url;
}
/** A potted plant, 84x132. */
export function plantUrl(): string {
  const hit = cache.get("plant"); if (hit) return hit; const { c, g } = mk(84, 132);
  const leaf = (x: number, y: number, rx: number, ry: number, rot: number, col: string) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-rx * 0.8, 0); g.lineTo(rx * 0.8, 0); g.stroke(); g.restore(); };
  leaf(42, 44, 10, 38, 0, "#3f9b5b"); leaf(26, 58, 9, 32, -0.7, "#4fb06a"); leaf(58, 58, 9, 32, 0.7, "#4fb06a"); leaf(16, 82, 8, 26, -1.15, "#3f9b5b"); leaf(68, 82, 8, 26, 1.15, "#3f9b5b");
  g.fillStyle = grad(g, 0, 92, 0, 130, "#e0875a", "#b9623a"); g.beginPath(); g.moveTo(20, 92); g.lineTo(64, 92); g.lineTo(58, 130); g.lineTo(26, 130); g.closePath(); g.fill(); g.fillStyle = "#f0a070"; g.fillRect(16, 88, 52, 8);
  const url = c.toDataURL(); cache.set("plant", url); return url;
}
/** A faint backdrop bookcase tile, 160x132, for the Book Nook walls. */
export function bookcaseUrl(): string {
  const hit = cache.get("bookcase"); if (hit) return hit; const { c, g } = mk(160, 132), pal = ["#b4532a", "#14a9b8", "#8b5cf6", "#3b7cff", "#f28c28", "#ec4899", "#3f9b3f", "#2d3a8c"];
  g.fillStyle = "#6b4528"; g.fillRect(0, 0, 160, 132); for (let r = 0; r < 3; r++) { const y = r * 44; g.fillStyle = "#4c301a"; g.fillRect(0, y + 38, 160, 6); let x = 4; let i = r * 3; while (x < 150) { const w = 9 + ((i * 7) % 8), h = 26 + ((i * 11) % 12); g.fillStyle = pal[i % pal.length]; g.fillRect(x, y + 38 - h, w, h); g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(x + 1, y + 38 - h, 2, h); g.fillStyle = "#f6d46a"; g.fillRect(x, y + 38 - h + 5, w, 2); x += w + 1; i++; } }
  const url = c.toDataURL(); cache.set("bookcase", url); return url;
}

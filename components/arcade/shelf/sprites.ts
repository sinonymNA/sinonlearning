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
let SKIN = "classic";
/** The equipped item look (closet). Changing it changes every item image from then on (images are cached per skin). */
export const setItemSkin = (s: string) => { SKIN = s || "classic"; };
/** Post-process a finished item sprite for the equipped look. All drawn once and cached, never per frame. */
function skinned(src: HTMLCanvasElement, skin: string): HTMLCanvasElement {
  if (skin === "classic") return src;
  const W = src.width, H = src.height, out = document.createElement("canvas"); out.width = W; out.height = H; const g = out.getContext("2d")!;
  if (skin === "pastel") { g.filter = "saturate(.62) brightness(1.18) contrast(.92)"; g.drawImage(src, 0, 0); }
  else if (skin === "film") { g.filter = "sepia(.5) saturate(1.15) contrast(1.05)"; g.drawImage(src, 0, 0); }
  else if (skin === "midnight") { g.filter = "saturate(1.15) brightness(.78) hue-rotate(-14deg)"; g.drawImage(src, 0, 0); g.filter = "none"; g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(40,50,140,.2)"; g.fillRect(0, 0, W, H); }
  else if (skin === "gold") { g.filter = "sepia(1) saturate(2.4) hue-rotate(-14deg) brightness(1.12) contrast(1.05)"; g.drawImage(src, 0, 0); g.filter = "none"; g.globalCompositeOperation = "source-atop"; const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "rgba(255,255,255,.28)"); gr.addColorStop(.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(120,70,0,.2)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  else if (skin === "pixel") {
    const px = 7, sw = Math.round(W / px), sh = Math.round(H / px), t = document.createElement("canvas"); t.width = sw; t.height = sh; const tg = t.getContext("2d")!; tg.drawImage(src, 0, 0, sw, sh);
    const d = tg.getImageData(0, 0, sw, sh), a = d.data; for (let i = 0; i < a.length; i += 4) { a[i + 3] = a[i + 3] > 110 ? 255 : 0; for (let k = 0; k < 3; k++) a[i + k] = Math.round(a[i + k] / 42) * 42; } tg.putImageData(d, 0, 0);
    g.imageSmoothingEnabled = false; g.drawImage(t, 0, 0, W, H);
  } else if (skin === "sticker") {
    const sil = document.createElement("canvas"); sil.width = W; sil.height = H; const sg = sil.getContext("2d")!; sg.drawImage(src, 0, 0); sg.globalCompositeOperation = "source-in"; sg.fillStyle = "#fff"; sg.fillRect(0, 0, W, H);
    const k = 0.95, ox = (W - W * k) / 2, oy = (H - H * k) / 2; g.shadowColor = "rgba(43,35,66,.3)"; g.shadowBlur = 4; for (let a = 0; a < 16; a++) g.drawImage(sil, ox + Math.cos((a * Math.PI) / 8) * 5, oy + Math.sin((a * Math.PI) / 8) * 5, W * k, H * k); g.shadowBlur = 0; g.drawImage(src, ox, oy, W * k, H * k);
  } else if (skin === "glow") { const k = 0.96, ox = (W - W * k) / 2, oy = (H - H * k) / 2; g.shadowColor = "rgba(255,255,255,.95)"; g.shadowBlur = 16; g.drawImage(src, ox, oy, W * k, H * k); g.shadowBlur = 0; g.drawImage(src, ox, oy, W * k, H * k); }
  else g.drawImage(src, 0, 0);
  return out;
}
/** An item picture in a given skin without changing the equipped one (for shop previews). */
export function itemUrlIn(skin: string, kind: Kind, v: number, x = 0, cap = 0): string { const prev = SKIN; SKIN = skin; try { return itemUrl(kind, v, false, false, x, cap); } finally { SKIN = prev; } }
export type Kind = "shirt" | "book" | "toy" | "jar" | "tin" | "shoe" | "gift";
export function itemUrl(kind: Kind, v: number, hidden = false, glyph = false, x = 0, cap = 0): string {
  const key = `i:${SKIN}:${kind}:${v}:${hidden}:${glyph}:${hidden ? 0 : x}:${hidden ? 0 : cap}`, hit = cache.get(key); if (hit) return hit;
  const { c, g } = mk(SPR_W, SPR_H);
  if (hidden) {
    if (kind !== "book") {   // a boxed product: a purple gift box with a gold ribbon, a bow and a big "?"
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
    const box = kind !== "book"; g.fillStyle = box ? "#fff8ee" : "#3b7cff"; g.beginPath(); g.arc(100, 40, 21, 0, Math.PI * 2); g.fill(); g.lineWidth = 3; g.strokeStyle = box ? "#f0b429" : "#fff"; g.stroke();
    g.fillStyle = box ? "#4638c4" : "#fff"; g.font = "bold 31px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 100, 42);
  } else if (kind === "shoe") {   // a sneaker in profile: a right shoe faces right, a left shoe faces left (x = 1 left, 2 right); the sole carries an L or R
    const base = SHIRT_PAL[v % SHIRT_PAL.length], top = mix(base, "#ffffff", 0.28), dark = mix(base, "#000000", 0.24);
    g.save(); if (x === 1) { g.translate(200, 0); g.scale(-1, 1); }
    g.fillStyle = "rgba(43,35,66,.22)"; rr(g, 22, 40, 164, 30, 12); g.fill();
    g.fillStyle = vgrad(g, 6, 50, top, dark); g.beginPath(); g.moveTo(24, 52); g.lineTo(24, 22); g.quadraticCurveTo(24, 8, 44, 8); g.lineTo(74, 8); g.quadraticCurveTo(86, 8, 92, 20); g.quadraticCurveTo(104, 34, 150, 34); g.quadraticCurveTo(184, 36, 184, 52); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.4)"; for (const lx of [84, 100, 116]) rr(g, lx, 24, 12, 5, 2.5), g.fill();                           // laces
    g.fillStyle = "#fff8ee"; rr(g, 18, 50, 172, 16, 8); g.fill(); g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(22, 60, 164, 4);                     // the sole
    g.fillStyle = dark; g.beginPath(); g.ellipse(176, 44, 10, 8, 0, 0, Math.PI * 2); g.fill();                                                     // toe cap shading
    g.restore();
    g.font = "bold 13px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#4638c4"; g.fillText(x === 1 ? "L" : "R", 100, 59);
  } else if (kind === "gift") {   // a wrapped present with a ribbon and a bow
    const base = SHIRT_PAL[v % SHIRT_PAL.length], top = mix(base, "#ffffff", 0.25), dark = mix(base, "#000000", 0.26), rib = "#fff8ee";
    g.fillStyle = "rgba(43,35,66,.24)"; rr(g, 12, 11, 176, 60, 10); g.fill(); g.fillStyle = vgrad(g, 10, 66, top, dark); rr(g, 10, 14, 180, 52, 9); g.fill();
    g.fillStyle = vgrad(g, 4, 28, mix(base, "#ffffff", 0.35), top); rr(g, 6, 4, 188, 22, 8); g.fill(); g.fillStyle = "rgba(0,0,0,.16)"; g.fillRect(10, 26, 180, 3);
    g.fillStyle = rib; g.fillRect(88, 4, 24, 62); g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(88, 4, 3, 62);
    g.fillStyle = rib; g.beginPath(); g.ellipse(80, 8, 15, 7, -0.25, 0, Math.PI * 2); g.ellipse(120, 8, 15, 7, 0.25, 0, Math.PI * 2); g.fill(); g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 1.5; g.stroke(); g.fillStyle = "#ffe9c4"; g.beginPath(); g.arc(100, 9, 6, 0, Math.PI * 2); g.fill();
  } else if (kind === "toy") {   // a stacking ring: a pill whose width shows its size, with its number on it
    const f = cap > 1 ? 0.4 + 0.6 * ((x - 1) / (cap - 1)) : 1, w = 184 * f, x0 = 100 - w / 2, base = SHIRT_PAL[v % SHIRT_PAL.length], top = mix(base, "#ffffff", 0.3), dark = mix(base, "#000000", 0.25);
    g.fillStyle = "rgba(43,35,66,.22)"; rr(g, x0 + 3, 12, w, 58, 28); g.fill(); g.fillStyle = vgrad(g, 6, 64, top, dark); rr(g, x0, 7, w, 58, 28); g.fill(); g.fillStyle = "rgba(255,255,255,.4)"; rr(g, x0 + 12, 12, Math.max(10, w - 24), 9, 4.5); g.fill(); g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = 2; rr(g, x0 + 1, 8, w - 2, 56, 27); g.stroke();
    g.font = "bold 30px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 5; g.strokeStyle = "rgba(43,35,66,.45)"; g.strokeText(String(x), 100, 38); g.fillStyle = "#fff"; g.fillText(String(x), 100, 38);
  } else if (kind === "jar") {   // a glass jar of jam, its lid showing how many moves it has left (dots); cracked at zero
    const base = SHIRT_PAL[v % SHIRT_PAL.length], top = mix(base, "#ffffff", 0.25), dark = mix(base, "#000000", 0.2), cracked = x <= 0;
    g.fillStyle = "rgba(43,35,66,.22)"; rr(g, 30, 13, 148, 58, 16); g.fill();
    g.fillStyle = "rgba(235,246,255,.9)"; rr(g, 24, 10, 152, 58, 16); g.fill(); g.fillStyle = vgrad(g, 20, 66, top, dark); rr(g, 30, 22, 140, 42, 12); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; rr(g, 38, 26, 16, 34, 6); g.fill(); g.fillStyle = "#fff8ee"; rr(g, 70, 30, 60, 26, 5); g.fill(); g.fillStyle = base; g.fillRect(78, 36, 44, 4); g.fillRect(78, 45, 30, 4);
    g.strokeStyle = "#9fb4c8"; g.lineWidth = 2.5; rr(g, 24, 10, 152, 58, 16); g.stroke();
    g.fillStyle = cracked ? "#c9453f" : "#aab2c0"; rr(g, 52, 2, 96, 13, 4); g.fill(); g.fillStyle = "rgba(0,0,0,.14)"; for (let lx = 60; lx < 144; lx += 8) g.fillRect(lx, 4, 2, 9);
    if (!cracked) { g.fillStyle = "#ffd23f"; for (let i = 0; i < x && i < 5; i++) { g.beginPath(); g.arc(100 + (i - (Math.min(x, 5) - 1) / 2) * 14, 8.5, 3.2, 0, Math.PI * 2); g.fill(); } }
    else { g.strokeStyle = "#2b2342"; g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(112, 12); g.lineTo(104, 30); g.lineTo(118, 40); g.lineTo(108, 54); g.lineTo(116, 66); g.stroke(); }
  } else if (kind === "tin") {   // a tin can with a coloured label and metal rims (its colours are offset from the jars so a red tin never looks like a red jar)
    const base = SHIRT_PAL[(v + 5) % SHIRT_PAL.length], top = mix(base, "#ffffff", 0.22), dark = mix(base, "#000000", 0.22);
    g.fillStyle = "rgba(43,35,66,.24)"; rr(g, 16, 13, 172, 58, 12); g.fill(); g.fillStyle = vgrad(g, 6, 66, "#eef2f8", "#9aa5b8"); rr(g, 12, 7, 176, 58, 12); g.fill();
    g.fillStyle = vgrad(g, 10, 62, top, dark); g.fillRect(34, 12, 132, 48); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(34, 14, 132, 5); g.fillStyle = "#fff8ee"; rr(g, 62, 25, 76, 24, 5); g.fill(); g.fillStyle = base; g.fillRect(70, 31, 60, 4); g.fillRect(70, 39, 40, 4);
    g.strokeStyle = "rgba(60,70,90,.5)"; g.lineWidth = 2; for (const lx of [24, 30, 170, 176]) { g.beginPath(); g.moveTo(lx, 10); g.lineTo(lx, 62); g.stroke(); }
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
  const url = skinned(c, SKIN).toDataURL(); cache.set(key, url); return url;
}
/** Small icons for shelf signs: "hanger", "books", "cart", or a subject emblem ("s0".."s7"). Dark ink on transparent. */
export function iconUrl(name: string, col = INK): string {
  const key = `ic:${name}:${col}`, hit = cache.get(key); if (hit) return hit; const { c, g } = mk(40, 40);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round";
  if (name === "hanger") { g.beginPath(); g.arc(20, 11, 4, Math.PI * 0.2, Math.PI * 1.65); g.stroke(); g.beginPath(); g.moveTo(20, 15); g.lineTo(20, 20); g.lineTo(4, 31); g.lineTo(36, 31); g.lineTo(20, 20); g.stroke(); }
  else if (name === "books") { g.fillRect(5, 8, 7, 26); g.fillRect(14, 4, 7, 30); g.save(); g.translate(28, 33); g.rotate(-0.28); g.fillRect(-3, -27, 7, 28); g.restore(); g.fillRect(2, 34, 36, 3); }
  else if (name === "cart") { g.beginPath(); g.moveTo(3, 6); g.lineTo(9, 6); g.lineTo(13, 24); g.lineTo(31, 24); g.lineTo(34, 11); g.lineTo(10, 11); g.stroke(); g.beginPath(); g.arc(15, 32, 3, 0, 7); g.arc(29, 32, 3, 0, 7); g.fill(); }
  else if (name === "shoe") { g.beginPath(); g.moveTo(4, 30); g.lineTo(4, 16); g.quadraticCurveTo(4, 8, 12, 8); g.lineTo(18, 8); g.quadraticCurveTo(22, 20, 36, 22); g.quadraticCurveTo(38, 30, 36, 30); g.closePath(); g.fill(); }
  else if (name === "gift") { g.strokeRect(6, 16, 28, 18); g.strokeRect(4, 10, 32, 6); g.beginPath(); g.moveTo(20, 10); g.lineTo(20, 34); g.stroke(); g.beginPath(); g.moveTo(20, 10); g.quadraticCurveTo(10, 0, 12, 8); g.moveTo(20, 10); g.quadraticCurveTo(30, 0, 28, 8); g.stroke(); }
  else if (name === "tin") { g.strokeRect(8, 10, 24, 22); g.beginPath(); g.moveTo(8, 16); g.lineTo(32, 16); g.moveTo(8, 26); g.lineTo(32, 26); g.stroke(); }
  else if (name === "bag") { g.strokeRect(8, 14, 24, 22); g.beginPath(); g.moveTo(14, 14); g.quadraticCurveTo(14, 4, 20, 4); g.quadraticCurveTo(26, 4, 26, 14); g.stroke(); }
  else if (name === "lock") { g.fillRect(8, 18, 24, 18); g.beginPath(); g.arc(20, 18, 8, Math.PI, 0); g.stroke(); }
  else if (name === "toy") { for (const [w, y] of [[30, 28], [22, 18], [14, 8]] as [number, number][]) { g.beginPath(); g.roundRect(20 - w / 2, y, w, 9, 4.5); g.fill(); } }
  else if (name === "jar") { g.beginPath(); g.roundRect(8, 12, 24, 24, 6); g.stroke(); g.fillRect(11, 6, 18, 6); g.beginPath(); g.moveTo(14, 22); g.lineTo(26, 22); g.stroke(); }
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

/** A party balloon on a string, 44x96 (Toy Aisle scene). */
export function balloonUrl(col: string): string {
  const key = `balloon:${col}`, hit = cache.get(key); if (hit) return hit; const { c, g } = mk(44, 96);
  g.strokeStyle = "rgba(43,35,66,.45)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(22, 56); g.bezierCurveTo(14, 66, 30, 76, 22, 94); g.stroke();
  g.fillStyle = col; g.beginPath(); g.ellipse(22, 28, 19, 25, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(22, 52); g.lineTo(17, 59); g.lineTo(27, 59); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.45)"; g.beginPath(); g.ellipse(14, 17, 4.5, 8, -0.5, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(0,0,0,.1)"; g.beginPath(); g.ellipse(28, 38, 9, 14, 0.2, 0, Math.PI * 2); g.fill();
  const url = c.toDataURL(); cache.set(key, url); return url;
}
/** A hanging bundle of herbs tied with twine, 40x104 (Pantry scene). */
export function herbsUrl(): string {
  const hit = cache.get("herbs"); if (hit) return hit; const { c, g } = mk(40, 104);
  g.strokeStyle = "#8a6636"; g.lineWidth = 2; g.beginPath(); g.moveTo(20, 0); g.lineTo(20, 30); g.stroke(); g.fillStyle = "#8a6636"; g.fillRect(14, 28, 12, 5);
  for (const [dx, h, col] of [[-12, 58, "#4fa05b"], [-5, 66, "#3f8c4c"], [3, 70, "#5db36a"], [11, 60, "#3f8c4c"], [0, 52, "#6bbf74"]] as [number, number, string][]) { g.fillStyle = col; g.beginPath(); g.moveTo(20, 32); g.quadraticCurveTo(20 + dx * 1.6, 32 + h * 0.5, 20 + dx, 32 + h); g.quadraticCurveTo(20 + dx * 0.4 + 4, 32 + h * 0.5, 20, 32); g.fill(); }
  const url = c.toDataURL(); cache.set("herbs", url); return url;
}

/** A coin, 24x24 (Daily rewards and the decor shop). */
export function coinUrl(): string {
  const hit = cache.get("coin"); if (hit) return hit; const { c, g } = mk(24, 24);
  g.fillStyle = "#c98a00"; g.beginPath(); g.arc(12, 13, 10, 0, Math.PI * 2); g.fill(); g.fillStyle = grad(g, 0, 2, 0, 22, "#ffe27a", "#f0b429"); g.beginPath(); g.arc(12, 11.5, 10, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#c98a00"; g.lineWidth = 1.6; g.stroke();
  g.fillStyle = "#c98a00"; g.font = "bold 13px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("S", 12, 12);
  const url = c.toDataURL(); cache.set("coin", url); return url;
}
/** A padlock for locked shelves, 40x44. */
export function padlockUrl(): string {
  const hit = cache.get("padlock"); if (hit) return hit; const { c, g } = mk(40, 44);
  g.strokeStyle = "#8d99ae"; g.lineWidth = 5; g.beginPath(); g.arc(20, 17, 9, Math.PI, 0); g.lineTo(29, 22); g.moveTo(11, 17); g.lineTo(11, 22); g.stroke();
  g.fillStyle = grad(g, 0, 18, 0, 42, "#ffd86b", "#e0a21c"); rr(g, 5, 20, 30, 21, 6); g.fill(); g.strokeStyle = "#a8740f"; g.lineWidth = 2; g.stroke(); g.fillStyle = "#6b4a10"; g.beginPath(); g.arc(20, 29, 3.6, 0, Math.PI * 2); g.fill(); g.fillRect(18.6, 30, 2.8, 7);
  const url = c.toDataURL(); cache.set("padlock", url); return url;
}
/** A shop pet to sit beside the display stack, 80x72: "cat" or "dog". */
export function petUrl(kind: "cat" | "dog"): string {
  const key = `pet:${kind}`, hit = cache.get(key); if (hit) return hit; const { c, g } = mk(80, 72), fur = kind === "cat" ? "#f0a35e" : "#c9a27a", dark = kind === "cat" ? "#d4843c" : "#8d6a46";
  g.fillStyle = "rgba(43,35,66,.18)"; g.beginPath(); g.ellipse(40, 68, 26, 5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = fur; g.beginPath(); g.ellipse(40, 50, 24, 20, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(40, 26, 19, 17, 0, 0, Math.PI * 2); g.fill();
  if (kind === "cat") { g.beginPath(); g.moveTo(24, 18); g.lineTo(22, 2); g.lineTo(36, 11); g.closePath(); g.moveTo(56, 18); g.lineTo(58, 2); g.lineTo(44, 11); g.closePath(); g.fill(); g.fillStyle = "#ffb3c1"; g.beginPath(); g.moveTo(26, 14); g.lineTo(25, 7); g.lineTo(32, 11); g.closePath(); g.moveTo(54, 14); g.lineTo(55, 7); g.lineTo(48, 11); g.closePath(); g.fill(); g.strokeStyle = dark; g.lineWidth = 3; g.lineCap = "round"; g.beginPath(); g.moveTo(62, 60); g.quadraticCurveTo(78, 56, 72, 40); g.stroke(); }
  else { g.fillStyle = dark; g.beginPath(); g.ellipse(22, 26, 7, 14, 0.3, 0, Math.PI * 2); g.ellipse(58, 26, 7, 14, -0.3, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fff8ee"; g.beginPath(); g.ellipse(40, 34, 10, 8, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#2b2342"; g.beginPath(); g.arc(32, 25, 2.6, 0, Math.PI * 2); g.arc(48, 25, 2.6, 0, Math.PI * 2); g.fill(); g.fillStyle = "#ff8fa8"; g.beginPath(); g.ellipse(40, 31, 3, 2.2, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.ellipse(34, 14, 6, 3, -0.4, 0, Math.PI * 2); g.fill();
  const url = c.toDataURL(); cache.set(key, url); return url;
}

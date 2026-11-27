/* eslint-disable @typescript-eslint/no-explicit-any */
// Pixel art for the Meowdoku closet, drawn in code: every breed, hat, pair of glasses, fish skin and X mark. Same 26x24 cat as sprites.ts, so the board layout never changes.
import { cv, px, ell, tri, type G, type Mood } from "./sprites";
import { itemOf, DEFAULTS } from "../../../arcade-server/meowdoku/index.mjs";

const cache = new Map<string, string>();
type Look = { fur: string; fur2: string; white: string; white2: string; ear: string; eye: string; pattern: string; stripe?: string; point?: string; patch1?: string; patch2?: string; neon?: string; eyeGlow?: boolean; whiteless?: boolean };
export type Equip = Partial<Record<"breed" | "hat" | "glasses" | "fish" | "mark", string>>;
const lum = (hex: string) => { const n = parseInt(hex.slice(1, 7), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const ring = (g: G, cx: number, cy: number, r: number, col: string, w = 0.95) => { for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d <= r + 0.35 && d >= r - w) px(g, x, y, col); } };
function outline(c: HTMLCanvasElement, col: [number, number, number]) {
  const g = c.getContext("2d")!, w = c.width, h = c.height, d = g.getImageData(0, 0, w, h), a = d.data, o = new Uint8ClampedArray(a);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (a[i + 3]) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => { const xx = x + u, yy = y + v; return xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3] > 0; })) { o[i] = col[0]; o[i + 1] = col[1]; o[i + 2] = col[2]; o[i + 3] = 255; } }
  d.data.set(o); g.putImageData(d, 0, 0);
}

// ------------------------------------------------------------------ hats (drawn in the headroom between the ears, y 0-9) and glasses (around the eyes at x 8.5 and 17.5, y about 12.5)
function hat(g: G, id: string, cx = 13) {
  switch (id) {
    case "bow": ell(g, 6, 4, 2.6, 2.1, "#ff6fa5"); ell(g, 11, 4, 2.6, 2.1, "#ff6fa5"); px(g, 8, 3, "#d94f90", 2, 3); px(g, 5, 3, "#ffa3c8", 2, 1); break;
    case "party": tri(g, [cx - 4.5, 7.5], [cx, -0.5], [cx + 4.5, 7.5], "#ff6fa5"); for (const [x, y] of [[cx - 1, 4], [cx + 1, 2], [cx - 3, 6], [cx + 2, 6]]) px(g, x, y, "#ffe66d", 1, 1); px(g, cx - 1, 0, "#4cc3ff", 2, 1); break;
    case "bandana": px(g, 5, 6, "#e5484d", 16, 3); px(g, 6, 9, "#e5484d", 14, 1); for (const x of [7, 10, 13, 16, 19]) px(g, x, 7, "#fff", 1, 1); tri(g, [20, 7], [25, 5], [24, 10], "#e5484d"); break;
    case "flowers": for (const [x, c] of [[6, "#ff8fb3"], [9.5, "#ffe66d"], [13, "#ff6fa5"], [16.5, "#fff"], [20, "#b57bff"]] as [number, string][]) { ell(g, x, 5.5, 2, 2, c); px(g, x - 0.5, 5, "#ffe66d", 1, 1); } px(g, 4, 7, "#3f9b3f", 18, 1); break;
    case "beanie": ell(g, cx, 7, 8.5, 5.2, "#e8483a", "#b82e22"); px(g, 5, 5, "#fff", 16, 2); px(g, 6, 4, "#e8483a", 14, 1); ell(g, cx, 1.5, 2.2, 2, "#fff"); break;
    case "santa": tri(g, [5, 8], [cx - 2, 0], [cx + 6, 8], "#e5352f"); px(g, 4, 6, "#fff", 18, 3); ell(g, cx - 2, 1, 2, 2, "#fff"); break;
    case "chef": ell(g, cx - 4, 3.5, 3.2, 3, "#fff", "#e8e8f0"); ell(g, cx + 4, 3.5, 3.2, 3, "#fff", "#e8e8f0"); ell(g, cx, 2.5, 3.6, 3.2, "#fff", "#e8e8f0"); px(g, 7, 5, "#fff", 12, 4); px(g, 7, 8, "#d8d8e4", 12, 1); break;
    case "propeller": ell(g, cx, 6.5, 7.5, 4.2, "#4cc3ff", "#2a8ad0"); px(g, 5, 7, "#ffd23f", 16, 1); px(g, cx - 5, 1, "#ff4d6d", 10, 1); px(g, cx - 1, 1, "#ffd23f", 2, 3); px(g, cx - 3, 0, "#4cc3ff", 6, 1); break;
    case "top": px(g, 8, 0, "#1c1630", 10, 7); px(g, 8, 4, "#e5484d", 10, 2); px(g, 4, 7, "#1c1630", 18, 2); px(g, 9, 1, "#4a4468", 1, 3); break;
    case "shroom": ell(g, cx, 6, 9, 5, "#e5484d", "#b3282d"); for (const [x, y] of [[8, 4], [13, 2.5], [18, 4.5], [11, 6.5], [16, 7]]) ell(g, x, y, 1.4, 1.2, "#fff"); break;
    case "pirate": tri(g, [3, 8], [cx, 0], [23, 8], "#1c1630"); px(g, 3, 7, "#1c1630", 20, 2); px(g, cx - 2, 3, "#fff", 4, 2); px(g, cx - 1, 5, "#fff", 2, 1); px(g, cx - 2, 3, "#1c1630", 1, 1); px(g, cx + 1, 3, "#1c1630", 1, 1); break;
    case "cowboy": ell(g, cx, 7.5, 12.5, 2.6, "#9a6a3a", "#7a4a1e"); px(g, 8, 1, "#b07a44", 10, 6); px(g, 8, 5, "#5a3410", 10, 1); px(g, 8, 1, "#c08a54", 10, 1); break;
    case "phones": ring(g, cx, 11, 9.6, "#3a3a50", 1.6); px(g, 1, 10, "#e5484d", 4, 6); px(g, 21, 10, "#e5484d", 4, 6); px(g, 1, 10, "#ff7a7e", 1, 6); px(g, 21, 10, "#ff7a7e", 1, 6); break;
    case "wizard": tri(g, [cx - 6.5, 8], [cx + 1, -0.5], [cx + 6.5, 8], "#6a3fd0"); ell(g, cx, 8, 10, 1.7, "#4a2aa0"); for (const [x, y] of [[cx - 1, 5], [cx + 2, 3], [cx - 3, 7]]) px(g, x, y, "#ffe66d", 1, 1); px(g, cx - 6, 6, "#ffd23f", 12, 1); break;
    case "viking": ell(g, cx, 6.5, 7.5, 4.2, "#9aa4b8", "#6a7488"); px(g, 5, 7, "#6a7488", 16, 1); tri(g, [5, 6], [0, 0], [3, 7], "#f5e6c8"); tri(g, [21, 6], [26, 0], [23, 7], "#f5e6c8"); break;
    case "grad": px(g, 4, 3, "#1c1630", 18, 2); tri(g, [cx, 0], [3, 3.5], [cx, 6.5], "#2a2450"); tri(g, [cx, 0], [23, 3.5], [cx, 6.5], "#1c1630"); px(g, 8, 6, "#1c1630", 10, 3); px(g, 22, 4, "#ffd23f", 1, 6); px(g, 21, 9, "#ffd23f", 3, 2); break;
    case "halo": ring(g, cx, 3, 6.5, "#ffe66d", 1.1); px(g, cx - 5, 3, "#fffbd0", 3, 1); break;
    case "crown": px(g, 6, 5, "#ffd23f", 14, 4); for (const x of [6, 11, 16]) tri(g, [x, 5], [x + 2, -0.5], [x + 4, 5], "#ffd23f"); px(g, 8, 7, "#e5484d", 2, 2); px(g, 12, 7, "#4cc3ff", 2, 2); px(g, 16, 7, "#5fe08a", 2, 2); px(g, 6, 5, "#fff3a0", 14, 1); break;
    case "helmet": ell(g, cx, 12.5, 12.3, 11.8, "#bfe3ff44"); ring(g, cx, 12.5, 12.3, "#ffffffcc", 0.9); px(g, 5, 4, "#ffffffcc", 4, 1); px(g, 4, 5, "#ffffffcc", 1, 3); break;
  }
}
function glasses(g: G, id: string, y = 12.5) {
  const L = 8.5, Rr = 17.5;
  switch (id) {
    case "round": for (const x of [L, Rr]) ring(g, x, y, 3.8, "#2a2450", 1); px(g, 12, y - 1, "#2a2450", 2, 1); break;
    case "shades": for (const x of [L, Rr]) { ell(g, x, y, 4.4, 3.4, "#14102a"); px(g, x - 3, y - 2, "#6a6a98", 2, 1); } px(g, 12, y - 1, "#14102a", 2, 1); px(g, 3, y - 1, "#14102a", 2, 1); px(g, 21, y - 1, "#14102a", 2, 1); break;
    case "3d": px(g, L - 4, y - 3, "#e5484d", 8, 6); px(g, Rr - 4, y - 3, "#4cc3ff", 8, 6); px(g, 12, y - 2, "#1c1630", 2, 1); px(g, L - 4, y - 3, "#1c1630", 8, 1); px(g, Rr - 4, y - 3, "#1c1630", 8, 1); break;
    case "heart": for (const x of [L, Rr]) { ell(g, x - 1.8, y - 0.8, 2.3, 2.3, "#ff4d8d"); ell(g, x + 1.8, y - 0.8, 2.3, 2.3, "#ff4d8d"); tri(g, [x - 4, y - 0.2], [x + 4, y - 0.2], [x, y + 4], "#ff4d8d"); px(g, x - 2, y - 2, "#ffb3d0", 1, 1); } break;
    case "monocle": ring(g, Rr, y, 4.2, "#ffd23f", 1.1); for (let i = 0; i < 6; i++) px(g, Rr + 3 + (i % 2), y + 4 + i, "#ffd23f"); break;
    case "goggles": for (const x of [L, Rr]) { ell(g, x, y, 4.3, 4.1, "#ff9f1c"); ring(g, x, y, 4.3, "#3a3a50", 1.2); px(g, x - 2, y - 2, "#ffe0a0", 1, 1); } px(g, 12, y - 1, "#3a3a50", 2, 1); px(g, 2, y - 1, "#3a3a50", 2, 1); px(g, 22, y - 1, "#3a3a50", 2, 1); break;
    case "star": for (const x of [L, Rr]) { tri(g, [x, y - 4.5], [x - 3, y + 0.5], [x + 3, y + 0.5], "#ffd23f"); tri(g, [x - 4.6, y - 1.6], [x + 4.6, y - 1.6], [x, y + 3.4], "#ffd23f"); px(g, x - 0.5, y - 1, "#14102a", 1.5, 1.5); } break;
  }
}

// ------------------------------------------------------------------ the cat
/** One cat: breed look + mood + hat + glasses, 26x24. */
export function drawCat(mood: Mood, look: Look, hatId = "none", glassId = "none"): HTMLCanvasElement {
  const W = 26, H = 24, c = cv(W, H), g = c.getContext("2d")!, cx = 13, { fur, fur2, white, white2, pattern } = look, pt = look.point || fur, dark = "#12121c", noEarOuter = pattern === "points" || pattern === "mask";
  const earCol = noEarOuter ? pt : fur, glow = look.eyeGlow, ink = lum(fur) < 0.22 ? "#ffffff" : dark, mouthInk = lum(white) < 0.3 ? "#ffb3c8" : dark, nose = lum(white) < 0.3 ? "#ffb3c8" : "#ff9fb5";
  const bigEars = pattern === "sphynx", fold = pattern === "fold";
  if (fold) { tri(g, [4, 11], [5, 5], [11, 8], earCol); tri(g, [22, 11], [21, 5], [15, 8], earCol); px(g, 5, 6, look.ear, 2, 2); px(g, 19, 6, look.ear, 2, 2); }
  else if (bigEars) { tri(g, [2, 12], [5, -0.5], [13, 6], earCol); tri(g, [24, 12], [21, -0.5], [13, 6], earCol); tri(g, [5, 10], [6, 3], [10, 7], look.ear); tri(g, [21, 10], [20, 3], [16, 7], look.ear); }
  else { tri(g, [4, 11], [6, 1], [12, 6], earCol); tri(g, [22, 11], [20, 1], [14, 6], earCol); tri(g, [6, 9], [7, 3.5], [10, 6.5], look.ear); tri(g, [20, 9], [19, 3.5], [16, 6.5], look.ear); }
  if (pattern === "coon" || pattern === "royal") { px(g, 5, 0, earCol, 1, 3); px(g, 20, 0, earCol, 1, 3); px(g, 6, 0, look.stripe || "#fff", 1, 2); px(g, 19, 0, look.stripe || "#fff", 1, 2); ell(g, 4, 19, 4, 4, white2); ell(g, 22, 19, 4, 4, white2); }
  ell(g, cx, 14, 10.5, 8, fur, fur2);                                                                               // head
  if (pattern === "tuxedo") tri(g, [cx, 6], [cx - 2.5, 14], [cx + 2.5, 14], white);
  if (pattern === "mask") { tri(g, [cx, 6], [cx - 5.5, 15], [cx + 5.5, 15], pt); tri(g, [cx, 8], [cx - 2.5, 14], [cx + 2.5, 14], white); }
  if (pattern === "points") { ell(g, cx, 15.5, 6.5, 5.2, pt); }
  if (pattern === "calico") { ell(g, 6.5, 9.5, 4.6, 3.6, look.patch1!); ell(g, 20, 10.5, 4.2, 3.4, look.patch2!); ell(g, 18, 18, 2.6, 2, look.patch1!); if (!look.whiteless) tri(g, [cx, 6], [cx - 2, 13], [cx + 2, 13], white); else { ell(g, 9, 17, 3, 2.4, look.patch2!); ell(g, cx, 8, 3, 2.4, look.patch1!); } }
  if (pattern === "galaxy") { for (const [x, y, k] of [[6, 10], [20, 9], [9, 16], [17, 17], [13, 8], [22, 14], [4, 14]] as [number, number, number?][]) px(g, x, y, k ? "#fff" : (look.neon || "#ffe08a"), 1, 1); px(g, 11, 11, "#ffffffaa", 1, 1); px(g, 16, 14, "#ffffffaa", 1, 1); tri(g, [cx, 6], [cx - 1.8, 12], [cx + 1.8, 12], "#ffffff22"); }
  ell(g, cx, 18.5, 6, 4, white, white2);                                                                             // muzzle
  if (pattern === "tabby" || pattern === "coon" || pattern === "royal") { const s = look.stripe || "#8a4a10"; for (const x of [cx - 3, cx, cx + 3]) px(g, x, 6, s, 1, 4); px(g, cx, 10, s, 1, 1); for (const dy of [0, 2]) { px(g, 1 + dy * 0.5, 14 + dy, s, 4, 1); px(g, 21 - dy * 0.5, 14 + dy, s, 4, 1); } }
  if (pattern === "spots") { const s = look.stripe || "#5a3410"; for (const [x, y] of [[5, 11], [8, 8], [18, 8], [21, 11], [4, 16], [22, 16], [13, 7]]) px(g, x, y, s, 2, 2); for (const x of [cx - 2, cx + 1]) px(g, x, 6, s, 1, 3); }
  if (pattern === "sphynx") { for (const [x, y, w] of [[8, 7, 4], [14, 7, 4], [9, 9, 3], [14, 9, 3]] as [number, number, number][]) px(g, x, y, "#d89888", w, 1); px(g, 3, 15, "#d89888", 3, 1); px(g, 20, 15, "#d89888", 3, 1); }
  if (pattern === "cyber") { const n = look.neon || "#00e5ff"; px(g, cx, 6, n, 1, 4); px(g, cx - 4, 8, n, 3, 1); px(g, cx + 2, 8, n, 3, 1); px(g, 3, 15, n, 4, 1); px(g, 19, 15, n, 4, 1); px(g, 6, 15, n, 1, 3); px(g, 19, 15, n, 1, 3); px(g, 5, 12, n, 1, 1); px(g, 20, 12, n, 1, 1); }
  if (pattern === "royal") { px(g, 6, 8, look.neon || "#ffd23f", 14, 1); }
  if (pattern === "ghost") { g.globalCompositeOperation = "destination-out"; for (let x = 4; x < 22; x += 5) px(g, x, 21, "#000", 2, 3); g.globalCompositeOperation = "source-over"; }
  // eyes
  const colored = look.eye.toLowerCase() !== "#fff8f0";
  const eye = (x: number) => {
    if (mood === "happy") { px(g, x - 2, 13, ink, 1, 1); px(g, x - 1, 12, ink, 3, 1); px(g, x + 2, 13, ink, 1, 1); return; }
    const big = mood === "oops";
    if (glow) ell(g, x, 12.8, 4.4, 4.4, look.eye + "55");
    if (colored) { ell(g, x, 12.6, 3.3, big ? 3.9 : 3.6, look.eye, "#00000022"); ell(g, x + (big ? 0 : 0.2), 12.9, big ? 1.1 : 1.3, big ? 2.3 : 2.9, dark); px(g, x - 1.2, 11.2, "#fff", 2, 2); px(g, x + 0.8, 14, "#ffffffaa", 1, 1); }
    else { ell(g, x, 12.6, 3.3, big ? 3.9 : 3.6, white, white2); ell(g, x + (big ? 0 : 0.4), 12.9, big ? 1.7 : 2.1, big ? 1.9 : 2.5, dark); px(g, x - 1.2, 11.2, "#fff", 2, 2); px(g, x + 0.8, 14, "#ffffffaa", 1, 1); }
  };
  eye(8.5); eye(17.5);
  if (mood === "oops") { px(g, 6, 8, ink, 5, 1); px(g, 15, 8, ink, 5, 1); px(g, 22, 17, "#7ec8ff", 1, 2); px(g, 22, 19, "#bfe5ff", 1, 1); }
  px(g, cx - 1, 16, nose, 3, 1); px(g, cx, 17, nose, 1, 1);
  if (mood === "happy") { px(g, cx - 3, 19, mouthInk, 7, 1); px(g, cx - 2, 20, mouthInk, 5, 1); px(g, cx - 1, 20, "#ff9fb5", 3, 1); px(g, cx - 3, 18, mouthInk, 1, 1); px(g, cx + 3, 18, mouthInk, 1, 1); }
  else if (mood === "oops") { px(g, cx - 2, 20, mouthInk, 5, 1); px(g, cx - 3, 21, mouthInk, 1, 1); px(g, cx + 3, 21, mouthInk, 1, 1); }
  else { px(g, cx, 18, mouthInk, 1, 1); px(g, cx - 2, 19, mouthInk, 2, 1); px(g, cx + 1, 19, mouthInk, 2, 1); }
  if (pattern !== "sphynx") for (const s of [-1, 1]) for (const dy of [0, 2]) px(g, s < 0 ? 0 : 20, 17 + dy, white, 6, 1);
  px(g, 4, 17, "#ff9fb533", 3, 2); px(g, 19, 17, "#ff9fb533", 3, 2);
  glasses(g, glassId); hat(g, hatId);
  outline(c, pattern === "cyber" ? [0, 60, 90] : [18, 18, 28]);
  if (pattern === "ghost") { const d = g.getImageData(0, 0, W, H), a = d.data; for (let i = 3; i < a.length; i += 4) if (a[i] && a[i] < 255) a[i] = 0; for (let i = 3; i < a.length; i += 4) if (a[i]) a[i] = Math.round(a[i] * 0.82); g.putImageData(d, 0, 0); }
  return c;
}
const lookOf = (id?: string): Look => ((itemOf("breed", id || DEFAULTS.breed) || itemOf("breed", DEFAULTS.breed)) as any).look as Look;
/** The equipped cat as an image (cached). Pass an Equip (from the profile's closet) or partial overrides for previews. */
export function catUrlFor(e: Equip, mood: Mood = "normal"): string {
  const key = `${e.breed || ""}|${e.hat || ""}|${e.glasses || ""}|${mood}`, hit = cache.get(key); if (hit) return hit;
  const url = drawCat(mood, lookOf(e.breed), e.hat || "none", e.glasses || "none").toDataURL(); cache.set(key, url); return url;
}

// ------------------------------------------------------------------ fish (the lives): 16x10, each skin its own shape or colours; a lost fish is the same picture drained to grey
type FishSpec = (g: G) => void;
const body = (g: G, c1: string, c2: string, tail = c2) => { tri(g, [11, 5], [15.5, 0.5], [15.5, 9.5], tail); ell(g, 6.5, 5, 6, 3.8, c1, c2); };
const eyeAt = (g: G, x = 3, y = 4, c = "#2a1a05") => px(g, x, y, c, 1, 1);
const FISH_ART: Record<string, FishSpec> = {
  gold: (g) => { body(g, "#ffb02e", "#e0881a"); px(g, 3, 3, "#ffd27a", 4, 1); px(g, 3, 4, "#ffd27a", 2, 1); eyeAt(g); px(g, 8, 3, "#e0881a", 1, 4); },
  koi: (g) => { body(g, "#fff6ee", "#ff7a2e", "#ff7a2e"); ell(g, 7, 3.4, 2.6, 1.8, "#ff7a2e"); ell(g, 9.5, 6.4, 1.8, 1.4, "#e5352f"); eyeAt(g, 2.5, 4); },
  tang: (g) => { body(g, "#2f7bff", "#ffd23f", "#ffd23f"); px(g, 4, 2, "#14102a", 1, 6); px(g, 9, 3, "#14102a", 3, 1); px(g, 3, 3, "#7fb2ff", 3, 1); eyeAt(g, 2.5, 4, "#fff"); px(g, 3, 4, "#14102a"); },
  tetra: (g) => { body(g, "#c4d8ee", "#e5484d", "#e5484d"); px(g, 2, 4, "#00e5ff", 9, 1); px(g, 3, 5, "#2a7ae0", 8, 1); eyeAt(g, 2.5, 3, "#14102a"); },
  sardine: (g) => { tri(g, [12, 5], [15.5, 1.5], [15.5, 8.5], "#6a7a90"); ell(g, 6.5, 5, 6.4, 2.8, "#c4d0e0", "#8a9ab0"); px(g, 2, 3, "#f4f8ff", 8, 1); px(g, 3, 6, "#6a7a90", 8, 1); eyeAt(g, 2.5, 4, "#14102a"); },
  puffer: (g) => { ell(g, 7, 5, 5.6, 4.4, "#ffd96a", "#e8b030"); for (const [x, y] of [[4, 0], [7, 0], [10, 1], [3, 9], [7, 9], [10, 8]]) px(g, x, y, "#8a6a1a", 1, 1); tri(g, [11.5, 5], [15.5, 2], [15.5, 8], "#e8b030"); px(g, 3, 3, "#14102a", 2, 2); px(g, 3, 7, "#fff6d0", 4, 1); px(g, 2, 5, "#e5484d", 2, 1); },
  nigiri: (g) => { px(g, 1, 5, "#fffaf0", 14, 4); px(g, 1, 8, "#e0d8c8", 14, 1); ell(g, 8, 4.5, 7, 3.2, "#ff8a6a", "#e5604a"); px(g, 3, 3, "#ffc0a8", 6, 1); px(g, 5, 5, "#fff", 8, 1); px(g, 1, 4, "#1f6a3a", 14, 1); },
  trout: (g) => { body(g, "#9ad8ff", "#5ab0e8"); for (const [y, c] of [[3, "#ff6fa5"], [4, "#ffd23f"], [5, "#5fe08a"], [6, "#b57bff"]] as [number, string][]) px(g, 2, y, c, 9, 1); eyeAt(g, 2.5, 3, "#14102a"); },
  jelly: (g) => { ell(g, 7, 3.6, 5.6, 3.4, "#d8a0ff", "#a86ae0"); px(g, 1, 4, "#a86ae0", 13, 2); for (const x of [3, 6, 9, 12]) { px(g, x, 6, "#c88cf0", 1, 4); px(g, x + 1, 8, "#c88cf0", 1, 2); } px(g, 4, 2, "#f0d4ff", 3, 1); px(g, 5, 4, "#14102a", 1, 1); px(g, 9, 4, "#14102a", 1, 1); },
  angler: (g) => { body(g, "#2a3a5a", "#1a2440"); px(g, 2, 6, "#e8f0ff", 1, 2); px(g, 4, 6, "#e8f0ff", 1, 1); px(g, 3, 3, "#ffe66d", 2, 2); for (let i = 0; i < 4; i++) px(g, 4 + i, 1 - Math.min(1, i), "#6a7a98"); ell(g, 8, 0.6, 1.4, 1.2, "#7cf0ff"); },
  heart: (g) => { ell(g, 4.5, 3.8, 3.4, 3.2, "#ff4d8d", "#d92d6e"); ell(g, 9.5, 3.8, 3.4, 3.2, "#ff4d8d", "#d92d6e"); tri(g, [1, 5], [13, 5], [7, 10], "#ff4d8d"); tri(g, [11, 5], [15.5, 1.5], [15.5, 8.5], "#d92d6e"); px(g, 3, 3, "#ffc0d8", 2, 1); eyeAt(g, 4, 5, "#fff"); },
  goldkoi: (g) => { body(g, "#ffe27a", "#f0a800", "#ffd23f"); ell(g, 7, 3.4, 2.4, 1.6, "#fff6c0"); px(g, 3, 6, "#fff6c0", 5, 1); px(g, 9, 4, "#ffffffaa", 1, 1); px(g, 12, 3, "#ffffffaa", 1, 1); eyeAt(g, 2.5, 4); },
};
/** A fish skin as an image; `lost` drains it to a grey outline. */
export function fishSkinUrl(skin = "gold", lost = false): string {
  const key = `fish:${skin}:${lost}`, hit = cache.get(key); if (hit) return hit;
  const c = cv(16, 10), g = c.getContext("2d")!; (FISH_ART[skin] || FISH_ART.gold)(g);
  if (lost) { const d = g.getImageData(0, 0, 16, 10), a = d.data; for (let i = 0; i < a.length; i += 4) if (a[i + 3]) { const l = (a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11) / 255, v = Math.round(48 + l * 32); a[i] = v; a[i + 1] = v; a[i + 2] = v + 14; } g.putImageData(d, 0, 0); }
  outline(c, [18, 18, 28]); const url = c.toDataURL(); cache.set(key, url); return url;
}

// ------------------------------------------------------------------ X mark styles (9x9; the classic X is plain CSS)
export function markUrl(id: string): string {
  const key = `mark:${id}`, hit = cache.get(key); if (hit) return hit; const c = cv(9, 9), g = c.getContext("2d")!;
  if (id === "paw") { ell(g, 4.5, 6, 2.6, 2.2, "#4a2f1a"); for (const [x, y] of [[1.5, 3], [3.5, 1.6], [5.5, 1.6], [7.5, 3]]) ell(g, x, y, 1, 1.2, "#4a2f1a"); }
  else if (id === "goldpaw") { ell(g, 4.5, 6, 2.6, 2.2, "#e8a800", "#b87800"); for (const [x, y] of [[1.5, 3], [3.5, 1.6], [5.5, 1.6], [7.5, 3]]) ell(g, x, y, 1, 1.2, "#ffd23f"); }
  else if (id === "heart") { ell(g, 2.8, 3, 2, 2, "#c0304e"); ell(g, 6.2, 3, 2, 2, "#c0304e"); tri(g, [0.8, 4], [8.2, 4], [4.5, 8.2], "#c0304e"); px(g, 2, 2, "#ff8aa0", 1, 1); }
  else if (id === "star") { tri(g, [4.5, 0.5], [3, 3.5], [6, 3.5], "#e8a800"); tri(g, [0.5, 3], [8.5, 3], [4.5, 6], "#e8a800"); tri(g, [2, 8.5], [4.5, 5], [7, 8.5], "#e8a800"); }
  else if (id === "bone") { px(g, 1, 4, "#5a4a3a", 7, 1); for (const [x, h] of [[2, 3], [3, 5], [4, 7], [5, 5], [6, 3]] as [number, number][]) { px(g, x, 4 - Math.floor(h / 2), "#5a4a3a", 1, 1); px(g, x, 4 + Math.floor(h / 2), "#5a4a3a", 1, 1); } px(g, 0, 3, "#5a4a3a", 1, 3); px(g, 8, 3, "#5a4a3a", 1, 3); }
  else if (id === "stitch") { for (let i = 0; i < 9; i += 2) { px(g, i, i, "#7a3a2a"); px(g, 8 - i, i, "#7a3a2a"); } px(g, 4, 4, "#7a3a2a"); }
  else { for (let i = 1; i < 8; i++) { px(g, i, i, "#3a2410"); px(g, 8 - i, i, "#3a2410"); } }
  const url = c.toDataURL(); cache.set(key, url); return url;
}

// Pixel-art scenery for the Meowdoku map: a few props per world plus the star, lock and crown icons, all drawn in code on tiny canvases.
import { cv, px, ell, tri, type G } from "./sprites";

const cache = new Map<string, string>();
type Prop = { w: number; h: number; draw: (g: G) => void };
const R = (g: G, x: number, y: number, w: number, h: number, c: string) => px(g, x, y, c, w, h);
const dark = "#1c1630";
const outline = (c: HTMLCanvasElement) => {
  const g = c.getContext("2d")!, w = c.width, h = c.height, d = g.getImageData(0, 0, w, h), a = d.data, o = new Uint8ClampedArray(a);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (a[i + 3]) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => { const xx = x + u, yy = y + v; return xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3] > 40; })) { o[i] = 28; o[i + 1] = 22; o[i + 2] = 48; o[i + 3] = 255; } }
  d.data.set(o); g.putImageData(d, 0, 0);
};
const flower = (petal: string): Prop => ({ w: 14, h: 18, draw: (g) => { R(g, 6, 8, 2, 10, "#3f9b3f"); R(g, 3, 13, 4, 2, "#3f9b3f"); for (const [x, y] of [[7, 3], [3, 7], [11, 7], [7, 11]]) ell(g, x, y, 2.6, 2.6, petal); ell(g, 7, 7, 2, 2, "#ffd23f"); } });
const pine = (snow: boolean): Prop => ({ w: 24, h: 38, draw: (g) => { R(g, 10, 30, 4, 8, "#6b4423"); for (const [y, hw] of [[2, 6], [10, 9], [18, 11]]) { tri(g, [12, y], [12 - hw, y + 14], [12 + hw, y + 14], "#2f7d52"); if (snow) tri(g, [12, y], [12 - hw * 0.55, y + 7], [12 + hw * 0.55, y + 7], "#fff"); } } });
const cloud = (): Prop => ({ w: 36, h: 18, draw: (g) => { for (const [x, y, r] of [[10, 11, 7], [18, 7, 8], [27, 11, 7], [18, 12, 9]]) ell(g, x, y, r, r * 0.8, "#fff", "#e9e6f7"); } });
const cottage = (): Prop => ({ w: 36, h: 34, draw: (g) => { R(g, 4, 16, 28, 16, "#f5e6c8"); R(g, 4, 28, 28, 4, "#e2cfa6"); tri(g, [1, 17], [18, 3], [35, 17], "#d9534f"); R(g, 26, 5, 4, 9, "#a0522d"); R(g, 15, 21, 7, 11, "#8a5a2b"); R(g, 7, 20, 6, 6, "#9fd8ff"); R(g, 7, 23, 6, 1, "#fff"); R(g, 24, 20, 5, 5, "#9fd8ff"); } });
const yarn = (c: string): Prop => ({ w: 28, h: 28, draw: (g) => { ell(g, 14, 14, 12, 12, c, "#00000033"); for (let i = -9; i <= 9; i++) { px(g, 14 + i, 14 + Math.round(Math.sin(i * 0.5) * 4), "#ffffff88"); px(g, 14 + Math.round(Math.sin(i * 0.5 + 1) * 4), 14 + i, "#ffffff66"); } R(g, 22, 22, 6, 2, c); R(g, 26, 24, 2, 3, c); } });
const mushroom = (): Prop => ({ w: 24, h: 26, draw: (g) => { ell(g, 12, 13, 12, 12, "#c4a2ff44"); R(g, 9, 14, 6, 10, "#f3e9d2"); ell(g, 12, 12, 10, 8, "#7c3aed", "#5b21b6"); for (const [x, y] of [[8, 10], [14, 8], [16, 13]]) px(g, x, y, "#e9d5ff", 2, 2); } });
const house = (): Prop => ({ w: 38, h: 34, draw: (g) => { R(g, 4, 14, 30, 19, "#b5733a"); R(g, 4, 28, 30, 5, "#8f5a2b"); tri(g, [1, 15], [19, 2], [37, 15], "#fff3e0"); tri(g, [5, 15], [19, 5], [33, 15], "#a0642d"); R(g, 15, 21, 8, 12, "#6b3f1d"); R(g, 7, 19, 6, 6, "#fff3e0"); R(g, 25, 19, 6, 6, "#fff3e0"); for (const x of [8, 14, 20, 26]) px(g, x, 14, "#ff6b81", 2, 2); } });
const cupcake = (): Prop => ({ w: 24, h: 30, draw: (g) => { tri(g, [4, 18], [20, 18], [17, 29], "#ff8fb3"); tri(g, [4, 18], [7, 29], [17, 29], "#ff8fb3"); ell(g, 12, 15, 9, 6, "#fff"); ell(g, 12, 10, 6, 5, "#ffc4d9"); px(g, 11, 3, "#e53935", 3, 3); } });
const cookie = (): Prop => ({ w: 22, h: 22, draw: (g) => { ell(g, 11, 11, 10, 10, "#e0a85c", "#b9803f"); for (const [x, y] of [[7, 8], [13, 7], [10, 13], [15, 14], [6, 14]]) px(g, x, y, "#5b3a1e", 2, 2); } });
const boat = (): Prop => ({ w: 36, h: 30, draw: (g) => { R(g, 17, 3, 2, 17, "#6b4423"); tri(g, [19, 3], [19, 18], [32, 18], "#fff"); tri(g, [17, 6], [17, 18], [6, 18], "#ffd7ea"); R(g, 3, 20, 30, 4, "#c0392b"); tri(g, [3, 24], [33, 24], [28, 29], "#a93226"); tri(g, [3, 24], [8, 29], [28, 29], "#a93226"); } });
const palm = (): Prop => ({ w: 28, h: 38, draw: (g) => { for (let i = 0; i < 8; i++) R(g, 12 + Math.round(Math.sin(i * 0.4) * 2), 36 - i * 4, 4, 4, "#8a5a2b"); for (const [dx, dy] of [[-10, 2], [-6, -3], [6, -3], [10, 2], [0, -5]]) tri(g, [14, 6], [14 + dx, 6 + dy - 2], [14 + dx * 0.6, 6 + dy + 7], "#2fa84f"); } });
const fishIsland = (): Prop => ({ w: 40, h: 22, draw: (g) => { ell(g, 18, 12, 16, 8, "#ffe6a8", "#e8c878"); tri(g, [30, 12], [40, 2], [40, 22], "#ffe6a8"); px(g, 8, 9, "#1c1630", 2, 2); ell(g, 14, 5, 4, 3, "#4caf50"); } });
const boxes = (): Prop => ({ w: 34, h: 34, draw: (g) => { for (const [x, y, w, h] of [[2, 20, 20, 14], [16, 8, 16, 12], [8, 8, 12, 12]]) { R(g, x, y, w, h, "#c9975a"); R(g, x, y, w, 2, "#e3b878"); R(g, x + Math.floor(w / 2) - 1, y, 3, h, "#e8d9b0"); } } });
const post = (): Prop => ({ w: 22, h: 38, draw: (g) => { R(g, 2, 32, 18, 6, "#8a5a2b"); R(g, 8, 8, 6, 24, "#d8b27a"); for (let y = 10; y < 32; y += 3) R(g, 8, y, 6, 1, "#a8844f"); R(g, 1, 4, 20, 5, "#c9975a"); } });
const rock = (): Prop => ({ w: 36, h: 30, draw: (g) => { tri(g, [0, 29], [12, 4], [22, 29], "#c9975a"); tri(g, [14, 29], [26, 10], [35, 29], "#b88246"); for (let y = 8; y < 29; y += 4) R(g, 8, y, 24, 1, "#00000022"); } });
const cabin = (): Prop => ({ w: 36, h: 30, draw: (g) => { R(g, 4, 14, 28, 15, "#a0642d"); for (let y = 16; y < 29; y += 4) R(g, 4, y, 28, 1, "#7a4a1e"); tri(g, [1, 15], [18, 3], [35, 15], "#fff"); R(g, 15, 20, 7, 9, "#5b3a1e"); R(g, 24, 18, 5, 5, "#ffd23f"); R(g, 26, 4, 4, 8, "#7a4a1e"); } });
const snowman = (): Prop => ({ w: 20, h: 28, draw: (g) => { ell(g, 10, 21, 8, 7, "#fff", "#dfeaff"); ell(g, 10, 11, 6, 6, "#fff", "#dfeaff"); R(g, 6, 15, 8, 2, "#e53935"); px(g, 10, 11, "#ff8a00", 4, 2); px(g, 7, 9, dark, 2, 2); px(g, 12, 9, dark, 2, 2); } });
const tower = (): Prop => ({ w: 28, h: 44, draw: (g) => { R(g, 2, 2, 24, 42, "#1b1b4a"); for (let y = 6; y < 40; y += 8) for (let x = 5; x < 24; x += 8) R(g, x, y, 4, 5, ((x + y) % 3 ? "#ffd23f" : "#3a3a7a")); } });
const lantern = (): Prop => ({ w: 14, h: 26, draw: (g) => { R(g, 6, 0, 2, 8, "#8a8aa8"); R(g, 3, 8, 8, 12, "#ff9f1c"); R(g, 4, 9, 6, 10, "#ffe08a"); R(g, 2, 7, 10, 2, "#6b4423"); R(g, 2, 20, 10, 2, "#6b4423"); } });
const moon = (): Prop => ({ w: 26, h: 26, draw: (g) => { ell(g, 13, 13, 11, 11, "#fff3b0"); ell(g, 18, 11, 9, 9, "#0b1038"); } });
const castle = (): Prop => ({ w: 42, h: 44, draw: (g) => { R(g, 3, 20, 36, 24, "#e8c14a"); R(g, 3, 38, 36, 6, "#c9a02e"); for (const x of [0, 14, 28]) { R(g, x + 2, 6, 11, 30, "#f5d36a"); for (let i = 0; i < 3; i++) R(g, x + 2 + i * 4, 3, 3, 4, "#f5d36a"); tri(g, [x + 7, 0], [x + 7, 6], [x + 14, 3], "#d9534f"); } R(g, 17, 28, 8, 16, "#6b3f1d"); R(g, 6, 14, 3, 5, "#7a3fd0"); R(g, 33, 14, 3, 5, "#7a3fd0"); } });
const fountain = (): Prop => ({ w: 30, h: 28, draw: (g) => { ell(g, 15, 22, 14, 5, "#9fd8ff", "#6bb8e8"); R(g, 13, 10, 4, 12, "#d8d8e8"); ell(g, 15, 10, 7, 3, "#d8d8e8"); for (const [x, y] of [[8, 5], [22, 5], [15, 2]]) px(g, x, y, "#bfe9ff", 2, 4); } });
const crown = (): Prop => ({ w: 22, h: 16, draw: (g) => { R(g, 2, 8, 18, 6, "#ffd23f"); for (const x of [2, 9, 16]) tri(g, [x, 8], [x + 3, 0], [x + 6, 8], "#ffd23f"); px(g, 4, 10, "#e53935", 2, 2); px(g, 10, 10, "#2fa4ff", 2, 2); px(g, 16, 10, "#7cf0a0", 2, 2); } });
const cliff = (): Prop => ({ w: 30, h: 30, draw: (g) => { tri(g, [0, 29], [6, 4], [30, 29], "#ff9ec4"); for (const [x, y] of [[8, 14], [14, 20], [20, 24], [12, 26], [18, 14]]) px(g, x, y, "#ffe08a", 2, 2); } });
const waterfall = (): Prop => ({ w: 22, h: 40, draw: (g) => { R(g, 0, 0, 22, 10, "#ff9ec4"); R(g, 5, 10, 12, 26, "#ffffff"); for (let y = 12; y < 36; y += 5) R(g, 8, y, 2, 3, "#ffe3f1"); ell(g, 11, 37, 10, 3, "#ffffffcc"); } });
const catnip = (): Prop => ({ w: 22, h: 30, draw: (g) => { R(g, 10, 12, 2, 18, "#2f9e4f"); for (const [x, y, w] of [[2, 18, 8], [12, 15, 8], [3, 24, 7], [12, 22, 8]]) ell(g, x + w / 2, y, w / 2, 3, "#4cc36a"); for (const [x, y] of [[8, 6], [12, 4], [10, 9]]) ell(g, x + 1, y, 2.5, 2.5, "#b57bff"); } });
const hollow = (): Prop => ({ w: 34, h: 40, draw: (g) => { R(g, 9, 16, 16, 24, "#6b4423"); ell(g, 17, 14, 16, 13, "#1f5a3a"); ell(g, 17, 30, 4, 6, "#1c1630"); ell(g, 10, 12, 5, 4, "#2f7d52"); } });

const PROPS: Prop[][] = [
  [cottage(), flower("#ff8fb3"), flower("#ffd23f"), pine(false)],
  [yarn("#ff7ab5"), yarn("#7ab8ff"), yarn("#ffd23f"), flower("#ffffff")],
  [waterfall(), cloud(), cliff(), cloud()],
  [mushroom(), catnip(), hollow(), mushroom()],
  [house(), cupcake(), cookie(), cupcake()],
  [boat(), palm(), fishIsland(), boat()],
  [boxes(), post(), rock(), boxes()],
  [pine(true), cabin(), snowman(), pine(true)],
  [tower(), lantern(), moon(), lantern()],
  [castle(), fountain(), crown(), fountain()],
];
export const PROP_COUNT = 4;
/** One prop image for an area (data URL) plus its size. */
export function propUrl(area: number, i: number): { src: string; w: number; h: number } {
  const key = `p${area}:${i % PROPS[area].length}`, p = PROPS[area][i % PROPS[area].length], hit = cache.get(key);
  if (hit) return { src: hit, w: p.w, h: p.h };
  const c = cv(p.w, p.h), g = c.getContext("2d")!; p.draw(g); outline(c); const src = c.toDataURL(); cache.set(key, src); return { src, w: p.w, h: p.h };
}

function icon(key: string, w: number, h: number, draw: (g: G) => void): string { const hit = cache.get(key); if (hit) return hit; const c = cv(w, h), g = c.getContext("2d")!; draw(g); outline(c); const u = c.toDataURL(); cache.set(key, u); return u; }
/** A 12x12 pixel star (filled or an empty slot). */
export const starUrl = (on: boolean) => icon(`star:${on}`, 13, 13, (g) => { const c = on ? "#ffd23f" : "#4a4468"; tri(g, [6.5, 1], [4, 5.5], [9, 5.5], c); tri(g, [1.5, 5], [11.5, 5], [6.5, 9.5], c); tri(g, [6.5, 8], [3, 12], [6.5, 10], c); tri(g, [6.5, 8], [10, 12], [6.5, 10], c); if (on) px(g, 5, 4, "#fff6b0", 2, 2); });
export const lockUrl = () => icon("lock", 14, 16, (g) => { px(g, 4, 1, "#c9c4e8", 6, 2); px(g, 3, 3, "#c9c4e8", 2, 5); px(g, 9, 3, "#c9c4e8", 2, 5); R(g, 2, 7, 10, 8, "#8d86b8"); px(g, 6, 10, dark, 2, 3); });
export const crownUrl = () => icon("crown", 18, 13, (g) => { R(g, 2, 7, 14, 5, "#ffd23f"); for (const x of [2, 7, 12]) tri(g, [x, 7], [x + 2, 1], [x + 4, 7], "#ffd23f"); px(g, 4, 9, "#e53935", 2, 2); px(g, 8, 9, "#2fa4ff", 2, 2); px(g, 12, 9, "#7cf0a0", 2, 2); });

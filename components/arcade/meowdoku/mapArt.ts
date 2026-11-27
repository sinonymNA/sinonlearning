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


// ---- the Beyond worlds (11-20)
const pumpkin = (): Prop => ({ w: 28, h: 26, draw: (g) => { ell(g, 14, 15, 12, 10, "#ff8a1a", "#d96a0a"); ell(g, 8, 15, 5, 9, "#ff9a2a"); ell(g, 20, 15, 5, 9, "#ff9a2a"); R(g, 12, 3, 4, 5, "#3f7a2a"); px(g, 16, 5, "#3f7a2a", 3, 2); px(g, 8, 13, "#2a1606", 3, 3); px(g, 17, 13, "#2a1606", 3, 3); R(g, 10, 19, 9, 2, "#2a1606"); px(g, 12, 18, "#2a1606", 1, 1); px(g, 16, 18, "#2a1606", 1, 1); } });
const hay = (): Prop => ({ w: 30, h: 24, draw: (g) => { ell(g, 15, 13, 14, 10, "#e8c050", "#c89a30"); for (let i = 0; i < 8; i++) px(g, 4 + i * 3, 6 + (i % 3) * 4, "#b88a20", 2, 1); R(g, 2, 12, 26, 2, "#8a5a1a"); } });
const scarecrow = (): Prop => ({ w: 26, h: 40, draw: (g) => { R(g, 12, 12, 3, 28, "#6b4423"); R(g, 2, 17, 22, 3, "#6b4423"); ell(g, 13, 9, 6, 6, "#f5d38a"); tri(g, [5, 6], [13, 0], [21, 6], "#5a3410"); R(g, 4, 6, 18, 2, "#5a3410"); px(g, 10, 9, "#1c1630", 2, 2); px(g, 15, 9, "#1c1630", 2, 2); R(g, 8, 20, 11, 10, "#e5484d"); px(g, 0, 17, "#e8c050", 3, 2); px(g, 23, 17, "#e8c050", 3, 2); } });
const cloudIsland = (): Prop => ({ w: 40, h: 28, draw: (g) => { tri(g, [6, 14], [34, 14], [20, 27], "#c89a6a"); ell(g, 20, 12, 17, 7, "#7ad07a", "#4f9a3a"); ell(g, 9, 17, 8, 4, "#fff"); ell(g, 30, 17, 8, 4, "#fff"); ell(g, 20, 19, 9, 4, "#fff", "#e0e8ff"); } });
const rainbow = (): Prop => ({ w: 36, h: 20, draw: (g) => { ["#ff595e", "#ffca3a", "#8ac926", "#4cc3ff", "#9b7fdc"].forEach((c, k) => { for (let a = 0; a <= 180; a += 4) { const r = 17 - k * 2.4, x = 18 - Math.cos((a * Math.PI) / 180) * r, y = 19 - Math.sin((a * Math.PI) / 180) * r; px(g, x, y, c, 2, 2); } }); } });
const mouseHouse = (): Prop => ({ w: 30, h: 30, draw: (g) => { R(g, 3, 12, 24, 17, "#b58a5a"); tri(g, [0, 13], [15, 1], [30, 13], "#8a4a2a"); ell(g, 15, 25, 4, 4.5, "#3a2410"); R(g, 11, 25, 8, 4, "#3a2410"); px(g, 6, 16, "#ffe08a", 4, 4); px(g, 20, 16, "#ffe08a", 4, 4); px(g, 14, 7, "#fff3b0", 2, 2); } });
const cheese = (): Prop => ({ w: 26, h: 20, draw: (g) => { tri(g, [1, 18], [25, 18], [25, 4], "#ffd23f"); R(g, 1, 14, 24, 5, "#f0b800"); for (const [x, y] of [[16, 10], [20, 14], [10, 15], [21, 7]]) ell(g, x, y, 1.8, 1.8, "#c98a00"); } });
const sakuraTree = (): Prop => ({ w: 36, h: 42, draw: (g) => { R(g, 16, 18, 4, 24, "#6b4423"); R(g, 12, 26, 5, 2, "#6b4423"); for (const [x, y, r] of [[10, 13, 9], [26, 13, 9], [18, 8, 10], [18, 17, 9]]) ell(g, x, y, r, r * 0.85, "#ffb3d0", "#ff8fb3"); for (const [x, y] of [[8, 11], [22, 7], [28, 15], [14, 18], [19, 12]]) px(g, x, y, "#fff", 2, 2); } });
const torii = (): Prop => ({ w: 36, h: 32, draw: (g) => { R(g, 5, 8, 4, 24, "#d9342b"); R(g, 27, 8, 4, 24, "#d9342b"); R(g, 1, 4, 34, 4, "#d9342b"); R(g, 0, 2, 36, 3, "#1c1630"); R(g, 5, 12, 26, 3, "#d9342b"); } });
const stall = (c: string): Prop => ({ w: 34, h: 32, draw: (g) => { for (let i = 0; i < 6; i++) R(g, 2 + i * 5, 4, 5, 8, i % 2 ? "#fff" : c); for (let i = 0; i < 6; i++) ell(g, 4.5 + i * 5, 12, 2.5, 1.8, i % 2 ? "#fff" : c); R(g, 4, 12, 2, 18, "#6b4423"); R(g, 28, 12, 2, 18, "#6b4423"); R(g, 3, 22, 28, 4, "#a0642d"); for (const [x, col] of [[8, "#9ad8ff"], [13, "#c4d0e0"], [18, "#ff8a6a"], [23, "#9ad8ff"]] as [number, string][]) ell(g, x, 20, 2.6, 1.6, col); } });
const barrel = (): Prop => ({ w: 20, h: 24, draw: (g) => { ell(g, 10, 12, 9, 11, "#a0642d", "#7a4a1e"); R(g, 2, 6, 16, 2, "#4a3a2a"); R(g, 1, 16, 18, 2, "#4a3a2a"); } });
const manor = (): Prop => ({ w: 40, h: 46, draw: (g) => { R(g, 4, 20, 32, 26, "#4a3a6a"); tri(g, [1, 21], [20, 4], [39, 21], "#2a1a4a"); R(g, 27, 6, 5, 14, "#2a1a4a"); for (const [x, y] of [[8, 26], [26, 26], [8, 35], [26, 35]]) px(g, x, y, "#ffe08a", 5, 5); ell(g, 20, 41, 3.5, 4.5, "#1c1630"); R(g, 16, 41, 8, 5, "#1c1630"); px(g, 13, 10, "#1c1630", 6, 1); } });
const ghost = (): Prop => ({ w: 20, h: 26, draw: (g) => { ell(g, 10, 10, 8, 9, "#f4f8ff", "#cfd8f0"); R(g, 2, 10, 16, 12, "#f4f8ff"); for (const x of [2, 7, 12]) tri(g, [x, 21], [x + 3, 25], [x + 6, 21], "#f4f8ff"); px(g, 6, 9, "#1c1630", 2, 3); px(g, 12, 9, "#1c1630", 2, 3); px(g, 8, 14, "#1c1630", 4, 2); } });
const tomb = (): Prop => ({ w: 18, h: 26, draw: (g) => { R(g, 2, 8, 14, 18, "#a8b0c0"); ell(g, 9, 9, 7, 7, "#a8b0c0"); R(g, 8, 10, 2, 9, "#6a7488"); R(g, 5, 13, 8, 2, "#6a7488"); R(g, 0, 24, 18, 2, "#5a4a3a"); } });
const candyCane = (): Prop => ({ w: 16, h: 36, draw: (g) => { for (let y = 8; y < 36; y++) R(g, 3, y, 5, 1, Math.floor(y / 3) % 2 ? "#fff" : "#e5352f"); for (let a = 180; a <= 360; a += 15) { const x = 8 + Math.cos((a * Math.PI) / 180) * 5, y = 8 + Math.sin((a * Math.PI) / 180) * 5; px(g, x, y, Math.floor(a / 30) % 2 ? "#fff" : "#e5352f", 3, 3); } } });
const lollipop = (): Prop => ({ w: 22, h: 36, draw: (g) => { R(g, 10, 16, 2, 20, "#f5e6c8"); ell(g, 11, 10, 10, 10, "#ff6fa5"); ell(g, 11, 10, 7, 7, "#ffd23f"); ell(g, 11, 10, 4, 4, "#ff6fa5"); ell(g, 11, 10, 1.6, 1.6, "#fff"); } });
const gumdrop = (): Prop => ({ w: 22, h: 20, draw: (g) => { ell(g, 11, 12, 10, 8, "#5fe0b0", "#34b888"); R(g, 1, 12, 20, 6, "#5fe0b0"); for (const [x, y] of [[6, 9], [11, 6], [15, 10], [9, 14], [16, 15]]) px(g, x, y, "#fff", 1, 1); } });
const cabinet = (): Prop => ({ w: 24, h: 38, draw: (g) => { R(g, 2, 2, 20, 36, "#2a1a5a"); R(g, 4, 5, 16, 12, "#0a0a1a"); R(g, 5, 6, 14, 10, "#00e5ff"); for (const [x, y] of [[8, 9], [14, 9], [8, 12], [14, 12], [11, 10]]) px(g, x, y, "#0a0a1a", 2, 2); R(g, 6, 22, 12, 4, "#ff2fd4"); px(g, 8, 28, "#ffd23f", 3, 3); px(g, 14, 28, "#4cc3ff", 3, 3); R(g, 2, 36, 20, 2, "#ff2fd4"); } });
const neonSign = (): Prop => ({ w: 34, h: 20, draw: (g) => { R(g, 1, 1, 32, 2, "#ff2fd4"); R(g, 1, 17, 32, 2, "#ff2fd4"); R(g, 1, 1, 2, 18, "#ff2fd4"); R(g, 31, 1, 2, 18, "#ff2fd4"); for (let x = 6; x < 28; x += 5) R(g, x, 6, 3, 8, x % 2 ? "#00e5ff" : "#ffe94a"); } });
const fern = (): Prop => ({ w: 32, h: 36, draw: (g) => { for (let k = -3; k <= 3; k++) for (let i = 0; i < 12; i++) { const x = 16 + k * (i * 1.1) + (k * i * 0.2), y = 34 - i * 2.6 + Math.abs(k) * i * 0.35; px(g, x, y, i % 2 ? "#2f9e4f" : "#4cc36a", 2, 2); } R(g, 15, 24, 2, 12, "#6b4423"); } });
const bones = (): Prop => ({ w: 38, h: 22, draw: (g) => { R(g, 2, 17, 34, 3, "#f5e6c8"); for (let i = 0; i < 5; i++) for (let a = 0; a <= 180; a += 20) { const x = 5 + i * 7 + Math.cos((a * Math.PI) / 180) * 3, y = 17 - Math.sin((a * Math.PI) / 180) * 12; px(g, x, y, "#f5e6c8", 2, 2); } ell(g, 3, 17, 3, 3, "#f5e6c8"); ell(g, 35, 17, 3, 3, "#f5e6c8"); } });
const egg = (): Prop => ({ w: 20, h: 24, draw: (g) => { ell(g, 10, 14, 8, 10, "#f4ecd0", "#d8c898"); for (const [x, y] of [[7, 11], [13, 15], [9, 18], [12, 8]]) ell(g, x, y, 1.8, 1.8, "#5fae4a"); } });
const planet = (c: string): Prop => ({ w: 32, h: 24, draw: (g) => { ell(g, 16, 12, 9, 9, c, "#00000044"); for (let a = 0; a < 360; a += 6) { const x = 16 + Math.cos((a * Math.PI) / 180) * 15, y = 12 + Math.sin((a * Math.PI) / 180) * 4; if (a > 180 || Math.hypot(x - 16, (y - 12) * 2.2) > 9) px(g, x, y, "#fff3b0", 2, 1); } px(g, 12, 8, "#ffffff88", 3, 2); } });
const ufo = (): Prop => ({ w: 36, h: 24, draw: (g) => { ell(g, 18, 9, 7, 6, "#9ad8ff", "#5ab0e8"); ell(g, 18, 15, 16, 5, "#c4cce0", "#8a93ae"); for (const x of [8, 14, 20, 26]) px(g, x, 16, "#ffd23f", 2, 2); tri(g, [10, 20], [26, 20], [18, 24], "#ffe94a55"); } });

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
  [pumpkin(), hay(), scarecrow(), pumpkin()],
  [cloudIsland(), rainbow(), cloud(), cloudIsland()],
  [mouseHouse(), cheese(), lantern(), mouseHouse()],
  [sakuraTree(), torii(), lantern(), sakuraTree()],
  [stall("#e5484d"), stall("#4cc3ff"), barrel(), stall("#ffd23f")],
  [manor(), ghost(), tomb(), ghost()],
  [candyCane(), lollipop(), gumdrop(), candyCane()],
  [cabinet(), neonSign(), tower(), cabinet()],
  [fern(), bones(), egg(), fern()],
  [planet("#ff9fd0"), ufo(), moon(), planet("#7ab8ff")],
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

// ---- icons for the power-ups, the shop and the home screen
/** A ball of yarn (the shop money), 14x14. */
export const yarnUrl = () => icon("yarn", 14, 14, (g) => { ell(g, 7, 7, 6, 6, "#ff7ab5", "#d94f90"); px(g, 3, 5, "#ffb3d6", 5, 1); px(g, 2, 8, "#ffb3d6", 7, 1); px(g, 4, 11, "#ffb3d6", 6, 1); px(g, 5, 3, "#ffb3d6", 4, 1); px(g, 10, 9, "#d94f90", 3, 1); R(g, 11, 11, 3, 1, "#ff7ab5"); });
/** A broom (Sweep), 14x14. */
export const broomUrl = () => icon("broom", 14, 14, (g) => { for (let i = 0; i < 8; i++) px(g, 11 - i, 1 + i, "#a0693a", 2, 1); tri(g, [1, 13], [3, 7], [8, 9], "#ffd23f"); tri(g, [1, 13], [8, 9], [7, 13], "#e8a317"); px(g, 4, 11, "#a37410", 1, 2); px(g, 6, 11, "#a37410", 1, 2); });
/** A light bulb (Hint), 14x14. */
export const bulbUrl = () => icon("bulb", 14, 14, (g) => { ell(g, 7, 5.5, 4.5, 4.8, "#ffe66d", "#f5b800"); px(g, 4, 4, "#fffbd0", 2, 2); R(g, 5, 10, 4, 2, "#9a96b8"); R(g, 6, 12, 2, 1, "#6f6a92"); });
/** A calendar page (Daily Puzzle), 14x14. */
export const calendarUrl = () => icon("calendar", 14, 14, (g) => { R(g, 1, 2, 12, 11, "#fffaf0"); R(g, 1, 2, 12, 3, "#e5484d"); R(g, 3, 0, 2, 3, "#c9c4e8"); R(g, 9, 0, 2, 3, "#c9c4e8"); for (const [x, y] of [[3, 7], [6, 7], [9, 7], [3, 10], [6, 10]]) R(g, x, y, 2, 2, "#4a4468"); px(g, 9, 10, "#e5484d", 2, 2); });
/** A flame (streaks), 11x14. */
export const flameUrl = () => icon("flame", 11, 14, (g) => { ell(g, 5.5, 9, 4.6, 4.8, "#ff7a00", "#e5484d"); tri(g, [5.5, 0], [2.5, 8], [8.5, 8], "#ff9f1c"); ell(g, 5.5, 10, 2.4, 2.8, "#ffd23f"); });
/** An infinity loop (Endless), 16x9. */
export const loopUrl = () => icon("loop", 16, 9, (g) => { for (const cx of [4.5, 11.5]) { ell(g, cx, 4.5, 3.6, 3.4, "#4cc3ff"); ell(g, cx, 4.5, 1.6, 1.6, "#0e1b44"); } R(g, 6, 3, 4, 3, "#4cc3ff"); });
/** A soft pixel cloud for the home screen, 32x12. */
export const cloudUrl = () => icon("cloud", 32, 12, (g) => { ell(g, 9, 8, 7, 3.6, "#ffffff"); ell(g, 17, 6, 8, 4.8, "#ffffff"); ell(g, 25, 8, 6, 3.4, "#ffffff"); R(g, 6, 8, 20, 3, "#ffffff"); });
/** A sparkle, 9x9 (twinkles on the home screen and result cards). */
export const sparkUrl = () => icon("spark", 9, 9, (g) => { R(g, 4, 0, 1, 9, "#fff6b8"); R(g, 0, 4, 9, 1, "#fff6b8"); R(g, 3, 3, 3, 3, "#ffffff"); });
/** A lightning bolt (the speed badge), 9x13. */
export const boltUrl = () => icon("bolt", 9, 13, (g) => { tri(g, [5.5, 0], [0.5, 7], [4.5, 7], "#ffe66d"); tri(g, [4.5, 5.5], [8.5, 5.5], [3, 13], "#ffd23f"); });

// ---- extra map scenery: small decor in each world's palette, a repeating ground tile, a checkpoint flag
type Pal = { g1: string; g2: string; f1: string; f2: string; r: string };
const PAL: Pal[] = [
  { g1: "#4f9a3a", g2: "#78c25a", f1: "#ff8fb3", f2: "#ffd23f", r: "#b8b8c8" }, { g1: "#3f9b3f", g2: "#5fbb4f", f1: "#ffffff", f2: "#ff7ab5", r: "#b8c0d8" },
  { g1: "#ff9ec4", g2: "#ffe3f1", f1: "#ffffff", f2: "#ff6fa5", r: "#ffb3cf" }, { g1: "#1f6a3a", g2: "#3fbf6a", f1: "#b57bff", f2: "#7cf0c0", r: "#2f5a4a" },
  { g1: "#c4743a", g2: "#e8b373", f1: "#ff8fb3", f2: "#ffffff", r: "#a0642d" }, { g1: "#e8c878", g2: "#ffe6a8", f1: "#ff8fb3", f2: "#ffffff", r: "#8fe0ff" },
  { g1: "#b88246", g2: "#d8b27a", f1: "#ffd23f", f2: "#e8703a", r: "#8a5a2b" }, { g1: "#cfe0ff", g2: "#ffffff", f1: "#8fd0ff", f2: "#ffffff", r: "#9fb4d8" },
  { g1: "#3a3a7a", g2: "#5a5aa0", f1: "#ffd23f", f2: "#ff9f1c", r: "#4a4a7a" }, { g1: "#e8c14a", g2: "#f5d36a", f1: "#ff4d6d", f2: "#ffffff", r: "#d8d8e8" },
  { g1: "#c4742a", g2: "#e8a050", f1: "#ff8a1a", f2: "#3f7a2a", r: "#8a5a2b" }, { g1: "#cfe8ff", g2: "#ffffff", f1: "#ff9ec4", f2: "#7ab8ff", r: "#bfd0e8" },
  { g1: "#c4a468", g2: "#e0c48a", f1: "#ffd23f", f2: "#e8a020", r: "#a08258" }, { g1: "#7ac07a", g2: "#a8e0a0", f1: "#ffb3d0", f2: "#ffffff", r: "#c8c8d8" },
  { g1: "#d8b88a", g2: "#f0d4a8", f1: "#e5484d", f2: "#4cc3ff", r: "#b89868" }, { g1: "#4a3a6a", g2: "#6a5a8a", f1: "#9aff7a", f2: "#ffe08a", r: "#5a4a7a" },
  { g1: "#ffe0e8", g2: "#ffffff", f1: "#e5352f", f2: "#5fe0b0", r: "#ffc0d0" }, { g1: "#2a1a5a", g2: "#3a2a7a", f1: "#00e5ff", f2: "#ff2fd4", r: "#4a3a8a" },
  { g1: "#c8a860", g2: "#e0c888", f1: "#4a9a3a", f2: "#f5e6c8", r: "#9a7a48" }, { g1: "#2a1a6a", g2: "#4a3a9a", f1: "#ff9fd0", f2: "#ffe08a", r: "#5a4a9a" },
];
const tuft = (p: Pal): Prop => ({ w: 11, h: 9, draw: (g) => { for (const [x, h, c] of [[1, 5, p.g1], [4, 8, p.g2], [7, 6, p.g1], [9, 4, p.g2]] as [number, number, string][]) R(g, x, 9 - h, 2, h, c); } });
const bloom = (p: Pal): Prop => ({ w: 11, h: 11, draw: (g) => { for (const [x, y] of [[5, 1], [1, 5], [9, 5], [5, 9]]) ell(g, x, y, 1.9, 1.9, p.f1); ell(g, 5, 5, 2, 2, p.f2); R(g, 5, 7, 1, 4, p.g1); } });
const pebble = (p: Pal): Prop => ({ w: 12, h: 8, draw: (g) => { ell(g, 6, 5, 5.5, 3, p.r, "#00000033"); px(g, 3, 3, "#ffffff66", 3, 1); } });
const bush = (p: Pal): Prop => ({ w: 20, h: 13, draw: (g) => { ell(g, 6, 8, 5.5, 4.5, p.g1, "#00000022"); ell(g, 14, 8, 5.5, 4.5, p.g1, "#00000022"); ell(g, 10, 6, 6.5, 5.5, p.g2, p.g1); px(g, 7, 4, p.f1, 2, 2); px(g, 13, 6, p.f2, 2, 2); } });
const gem = (p: Pal): Prop => ({ w: 10, h: 10, draw: (g) => { tri(g, [5, 0], [0, 5], [10, 5], p.f2); tri(g, [0, 5], [10, 5], [5, 10], p.f1); } });
/** Small decor sprites for a world (tufts, blooms, pebbles, bushes, gems). */
export function decorUrl(area: number, i: number): { src: string; w: number; h: number } {
  const p = PAL[area % PAL.length], list = [tuft(p), bloom(p), pebble(p), bush(p), tuft(p), gem(p)], k = i % list.length, key = `d${area}:${k}`, d = list[k], hit = cache.get(key);
  if (hit) return { src: hit, w: d.w, h: d.h };
  const c = cv(d.w, d.h), g = c.getContext("2d")!; d.draw(g); outline(c); const src = c.toDataURL(); cache.set(key, src); return { src, w: d.w, h: d.h };
}
/** A 24x24 repeating ground texture for a world: a few specks in the world's colours (the CSS tiles it). */
export function tileUrl(area: number): string {
  const key = `tile${area}`, hit = cache.get(key); if (hit) return hit;
  const p = PAL[area % PAL.length], c = cv(24, 24), g = c.getContext("2d")!; let s = 1234 + area * 77; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 16; i++) { const x = Math.floor(rnd() * 22), y = Math.floor(rnd() * 22), k = i % 3; g.globalAlpha = 0.5; px(g, x, y, k === 0 ? p.g2 : k === 1 ? p.g1 : "#ffffff", k === 1 ? 2 : 1, k === 2 ? 1 : 2); }
  if (area === 5) { g.globalAlpha = 0.35; for (let x = 0; x < 24; x += 6) px(g, x, 8 + (x % 12 ? 0 : 2), "#ffffff", 4, 1); }   // wave ripples on the shores
  if (area === 6) { g.globalAlpha = 0.25; for (let y = 0; y < 24; y += 4) px(g, 0, y, "#5a3d1d", 24, 1); }                               // cardboard corrugation
  if (area === 9) { g.globalAlpha = 0.18; for (let i = 0; i < 24; i += 12) for (let j = 0; j < 24; j += 12) px(g, i, j, "#ffffff", 6, 6); }  // checker tiles
  g.globalAlpha = 1; const url = c.toDataURL(); cache.set(key, url); return url;
}
/** A little checkpoint flag, 12x16. */
export const flagUrl = () => icon("flag", 12, 16, (g) => { R(g, 1, 0, 2, 16, "#8a5a2b"); tri(g, [3, 1], [3, 8], [11, 4.5], "#ff4d6d"); });

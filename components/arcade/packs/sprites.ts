// Procedural pixel art for Pack Rush: every creature and pack is drawn from a seed on a tiny canvas, so there are no image files to store or load.
import { makeRng } from "../../../arcade-server/gridiron/rng.mjs";

const cache = new Map<string, string>();
const N = 16;

function canvas(w: number, h: number) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h) % 360} ${s}% ${l}%)`;

/** A 16x16 mirrored creature. variant adds a shimmer tint; rarity changes the crest. */
export function creatureUrl(card: { seed: number; set: number; rarity: string }, hue: number, variant: "normal" | "foil" | "holo" = "normal"): string {
  const key = `c${card.seed}:${variant}`; const hit = cache.get(key); if (hit) return hit;
  const rng = makeRng(card.seed * 31 + 7), c = canvas(N, N), g = c.getContext("2d")!;
  const half = N / 2, mask: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
  for (let y = 2; y < N - 1; y++) for (let x = 0; x < half; x++) {
    const dx = half - 1 - x, dy = Math.abs(y - 8.5), p = 0.98 - dx * 0.115 - dy * 0.07 + (y > 5 && y < 12 ? 0.1 : 0);
    if (rng() < p) { mask[y][x] = true; mask[y][N - 1 - x] = true; }
  }
  for (let y = 7; y < 11; y++) { mask[y][half - 1] = true; mask[y][half] = true; }   // always a solid core
  const body = hsl(hue + rng.range(-45, 45), 62, 54), light = hsl(hue + rng.range(-45, 45), 70, 70), dark = hsl(hue, 45, 22), belly = hsl(hue + 40, 70, 82);
  const edge = (x: number, y: number) => x < 0 || y < 0 || x >= N || y >= N || !mask[y][x];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (mask[y][x]) { g.fillStyle = edge(x, y - 1) ? light : y > 10 && x > 4 && x < 11 ? belly : body; g.fillRect(x, y, 1, 1); }
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!mask[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !edge(x + a, y + b))) { g.fillStyle = dark; g.fillRect(x, y, 1, 1); }
  const ey = 6 + (rng() < 0.4 ? 1 : 0), ex = 4 + rng.int(2);
  for (const x of [ex, N - 1 - ex]) { g.fillStyle = "#fff"; g.fillRect(x, ey, 2, 2); g.fillStyle = "#111"; g.fillRect(x + (x < half ? 1 : 0), ey + 1, 1, 1); }
  g.fillStyle = dark; g.fillRect(half - 1, ey + 3 + (rng() < 0.5 ? 1 : 0), 2, 1);
  if (card.rarity === "epic" || card.rarity === "legendary") { g.fillStyle = card.rarity === "legendary" ? "#ffd23f" : "#c77dff"; for (const x of [half - 2, half + 1]) { g.fillRect(x, 1, 1, 2); } g.fillRect(half - 1, 0, 2, 1); }
  if (variant !== "normal") {
    g.globalCompositeOperation = "source-atop"; g.fillStyle = variant === "holo" ? "rgba(120,255,255,.28)" : "rgba(255,230,120,.22)";
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x + y) % (variant === "holo" ? 3 : 4) === 0) g.fillRect(x, y, 1, 1);
  }
  const url = c.toDataURL(); cache.set(key, url); return url;
}

/** A foil pack wrapper, 24x32. */
export function packUrl(set: number, hue: number): string {
  const key = `p${set}`; const hit = cache.get(key); if (hit) return hit;
  const W = 24, H = 32, c = canvas(W, H), g = c.getContext("2d")!;
  g.fillStyle = hsl(hue, 30, 14); g.fillRect(1, 1, W - 2, H - 2);
  g.fillStyle = hsl(hue, 70, 52); g.fillRect(2, 3, W - 4, H - 6);
  g.fillStyle = hsl(hue, 75, 66); for (let y = 3; y < H - 3; y += 4) g.fillRect(2, y, W - 4, 1);
  g.fillStyle = hsl(hue, 60, 36); for (let x = 2; x < W - 2; x += 2) { g.fillRect(x, 1, 1, 2); g.fillRect(x, H - 3, 1, 2); }
  g.fillStyle = "#fff"; g.fillRect(8, 11, 8, 8); g.fillStyle = hsl(hue, 70, 40); g.fillRect(9, 12, 6, 6);
  g.fillStyle = "#ffd23f"; g.fillRect(11, 13, 2, 4); g.fillRect(10, 14, 4, 2);
  const url = c.toDataURL(); cache.set(key, url); return url;
}

"use client";

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef } from "react";
import { makeSprite } from "./PixelOcean";
import { glyphs, centred, textW } from "./pixelFont";

/**
 * Themed Abyss scenes: five original, procedurally drawn pixel worlds on a low-res canvas scaled up with image-rendering: pixelated.
 * The player's fish rides a little glass bowl on wheels; every correct answer rolls the world forward (distance = points x 10),
 * and the scene keeps drifting while you think. All art is generated in code.
 */
export type ThemeId = "movies" | "sports" | "music" | "tv" | "games";
export type SceneMood = "idle" | "nope" | "good" | "great" | "miss";
type Props = { theme: ThemeId; dist: number; fishId?: string | null; mood?: SceneMood; onDist?: (n: number) => void; onArrive?: () => void; arriveKey?: number };

const PX_PER_UNIT = 0.9;
const rnd = (i: number, salt = 0) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; };
type G = CanvasRenderingContext2D;
type C = { g: G; W: number; H: number; gy: number; sc: number; t: number; mood: SceneMood; calm: boolean };
const R = (g: G, color: string, x: number, y: number, w: number, h: number) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
/** Call fn for every tile of a parallax layer that is on screen. */
function layer(W: number, sc: number, p: number, spacing: number, fn: (i: number, x: number) => void) {
  const off = sc * p, i0 = Math.floor((off - 80) / spacing), i1 = Math.ceil((off + W + 80) / spacing);
  for (let i = i0; i <= i1; i++) fn(i, Math.round(i * spacing - off));
}
function bands(g: G, W: number, y0: number, y1: number, top: string, bot: string, n = 14, pow = 1) {
  const h = (y1 - y0) / n; for (let i = 0; i < n; i++) R(g, mix(top, bot, Math.pow(i / (n - 1), pow)), 0, y0 + i * h, W, h + 1);
}
function beam(g: G, x: number, y: number, ang: number, len: number, wid: number, color: string) {
  g.fillStyle = color; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(ang - wid) * len, y - Math.cos(ang - wid) * len); g.lineTo(x + Math.sin(ang + wid) * len, y - Math.cos(ang + wid) * len); g.closePath(); g.fill();
}
const star5 = (g: G, x: number, y: number, color: string) => { R(g, color, x, y - 3, 1, 7); R(g, color, x - 3, y, 7, 1); R(g, color, x - 2, y - 2, 5, 1); R(g, color, x - 1, y + 2, 3, 1); R(g, color, x - 2, y + 2, 1, 1); R(g, color, x + 2, y + 2, 1, 1); };

// ================================================================================================ MOVIES: Neon Boulevard
function movies(c: C) {
  const { g, W, gy, sc, t } = c;
  bands(g, W, 0, gy, "#140a3a", "#ff6fa8", 16, 1.7);
  for (let i = 0; i < 46; i++) { const a = (Math.sin(t * 2 + i * 1.9) + 1) / 2; g.globalAlpha = 0.35 + a * 0.65; R(g, "#fff", rnd(i, 1) * W, rnd(i, 2) * gy * 0.5, 1, 1); } g.globalAlpha = 1;
  // moon
  const mx = W * 0.78, my = gy * 0.2; for (let yy = -11; yy <= 11; yy++) { const w = Math.floor(Math.sqrt(121 - yy * yy)); R(g, "#fff3c4", mx - w, my + yy, w * 2, 1); } R(g, "#e6d6a0", mx - 4, my - 3, 3, 3); R(g, "#e6d6a0", mx + 3, my + 3, 4, 3); R(g, "#e6d6a0", mx - 6, my + 4, 2, 2);
  // searchlights
  for (let k = 0; k < 3; k++) beam(g, W * (0.18 + k * 0.32), gy - 6, Math.sin(t * 0.55 + k * 2.1) * 0.55, gy * 1.1, 0.045, "rgba(255,255,255,.10)");
  // far skyline
  layer(W, sc, 0.12, 34, (i, x) => { const h = 26 + rnd(i, 3) * 46; R(g, "#2a1260", x, gy - h, 24, h); for (let w = 0; w < 6; w++) if (rnd(i * 9 + w, 4) > 0.55) R(g, "#ffd27a", x + 3 + (w % 3) * 7, gy - h + 5 + Math.floor(w / 3) * 8, 3, 3); });
  // hill sign
  layer(W, sc, 0.1, 520, (i, x) => { R(g, "#1c0c46", x - 10, gy - 26, 200, 26); for (let k = 0; k < 14; k++) R(g, "#1c0c46", x - 10 + k * 14, gy - 26 - Math.round(Math.sin(k * 0.9 + i) * 3 + 4), 14, 8); glyphs(g, "STARLIGHT", x + 4, gy - 42, "#ffe9b8", 3); });
  // mid skyline
  layer(W, sc, 0.3, 58, (i, x) => { const h = 40 + rnd(i, 5) * 40, w = 30 + rnd(i, 6) * 12; R(g, "#1a0b40", x, gy - h, w, h); R(g, rnd(i, 7) > 0.5 ? "#ff5d9e" : "#4cc3ff", x, gy - h, w, 1); for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) if (rnd(i * 20 + r * 3 + q, 8) > 0.4) R(g, "#ffcf6a", x + 4 + q * 9, gy - h + 6 + r * 9, 4, 4); });
  // theatre with a blinking marquee
  layer(W, sc, 0.62, 430, (i, x) => {
    const bw = 150; R(g, "#20083e", x, gy - 74, bw, 74); R(g, "#341060", x, gy - 74, bw, 4); R(g, "#ff5d9e", x + 6, gy - 66, 3, 52); glyphs(g, "CINEMA", x + 14, gy - 68, "#ff7ab5", 2);
    R(g, "#0b0420", x + 18, gy - 50, bw - 36, 22); R(g, "#ffd23f", x + 17, gy - 51, bw - 34, 1); R(g, "#ffd23f", x + 17, gy - 28, bw - 34, 1);
    for (let b = 0; b < 15; b++) R(g, (Math.floor(t * 4) + b) % 2 ? "#fff7c2" : "#ff9a3c", x + 18 + b * 8, gy - 52, 3, 2);
    const msg = " NOW SHOWING * TRIVIA NIGHT * "; const off = Math.floor(t * 14) % (msg.length * 8); g.save(); g.beginPath(); g.rect(x + 18, gy - 50, bw - 36, 22); g.clip(); for (let r = 0; r < 3; r++) glyphs(g, msg, x + 20 - off + r * msg.length * 8, gy - 44, "#ffe9a8", 2); g.restore();
    R(g, "#20083e", x + 14, gy - 51, 4, 24); R(g, "#20083e", x + bw - 18, gy - 51, 4, 24);
    for (let p = 0; p < 3; p++) { R(g, ["#4cc3ff", "#ff5d9e", "#ffd23f"][p], x + 20 + p * 40, gy - 22, 28, 18); R(g, "#0b0420", x + 22 + p * 40, gy - 20, 24, 14); glyphs(g, "NEW", x + 26 + p * 40, gy - 17, "#fff", 1); }
  });
  // palms
  layer(W, sc, 0.8, 140, (i, x) => { if (rnd(i, 9) > 0.7) return; const h = 46 + rnd(i, 10) * 14; R(g, "#0a0522", x, gy - h, 3, h); for (let f = 0; f < 6; f++) { const a = -2.6 + f * 0.62, sw = Math.sin(t * 1.4 + i) * 1.2; for (let s = 1; s < 11; s++) R(g, "#0a0522", x + 1 + Math.cos(a) * s * 1.8 + sw * s * 0.1, gy - h + Math.sin(a) * s * 0.9 + s * s * 0.07, 2, 2); } });
  // lamps
  layer(W, sc, 1, 96, (i, x) => { R(g, "#241a40", x, gy - 36, 2, 36); R(g, "#241a40", x - 4, gy - 38, 7, 2); R(g, "#ffe9a8", x - 3, gy - 36, 5, 2); g.globalAlpha = 0.14; for (let r = 14; r > 2; r -= 4) { g.fillStyle = "#ffd27a"; g.beginPath(); g.arc(x, gy - 34, r, 0, 7); g.fill(); } g.globalAlpha = 1; });
  // sidewalk + road
  const sw = Math.round(c.H * 0.07); R(g, "#3a2a5e", 0, gy, W, sw); R(g, "#2a1d48", 0, gy + sw - 2, W, 2); layer(W, sc, 1, 64, (i, x) => star5(g, x + 20, gy + 8, i % 2 ? "#ffd23f" : "#ff8ac0"));
  R(g, "#120a22", 0, gy + sw, W, c.H - gy - sw); layer(W, sc, 1, 44, (i, x) => R(g, "#e9b84a", x, gy + sw + (c.H - gy - sw) * 0.52, 22, 2));
  R(g, "rgba(255,93,158,.28)", 0, gy + sw, W, 1);
}

// ================================================================================================ SPORTS: Hardwood Arena
function sports(c: C) {
  const { g, W, H, gy, sc, t, mood } = c;
  bands(g, W, 0, gy, "#070b1f", "#1b2a5c", 14, 1.2);
  // spotlight cones
  for (let k = 0; k < 5; k++) beam(g, W * (0.1 + k * 0.2), 0, Math.sin(t * 0.4 + k) * 0.18, gy * 1.0, 0.07, "rgba(255,236,190,.07)");
  // stands: rows of fans
  layer(W, sc, 0.2, 5, (i, x) => { for (let r = 0; r < 6; r++) { const y = gy * 0.52 + r * 7; const hop = mood === "great" ? Math.round(Math.abs(Math.sin(t * 6 + i * 0.7 + r)) * 3) : rnd(i * 7 + r, 3) > 0.985 ? 1 : 0; const col = ["#e5484d", "#3b82f6", "#ffd23f", "#f1f5ff", "#4a5278", "#34d399"][Math.floor(rnd(i * 13 + r, 4) * 6)]; R(g, "#0a0f26", x, y + 2, 5, 6); R(g, col, x + 1, y - hop, 3, 3); R(g, "#d9a679", x + 1, y - hop - 2, 3, 2); } });
  // hanging banners
  g.save(); g.translate(0, Math.round(gy * 0.22));
  layer(W, sc, 0.26, 140, (i, x) => { if (rnd(i, 5) > 0.75) return; const col = ["#e5484d", "#3b82f6", "#ffd23f"][Math.floor(rnd(i, 6) * 3)]; R(g, "#555e82", x + 8, 0, 1, 14); R(g, col, x, 14, 18, 30); R(g, "#0a0f26", x, 40, 18, 4); glyphs(g, String(Math.floor(rnd(i, 7) * 90) + 3), x + 3, 22, "#0a0f26", 2); });
  g.restore();
  // scoreboard cube
  g.save(); g.translate(0, Math.round(gy * 0.3));
  layer(W, sc, 0.42, 560, (i, x) => { R(g, "#0e1430", x, 10, 120, 40); R(g, "#2b3a78", x, 10, 120, 2); R(g, "#2b3a78", x, 48, 120, 2); glyphs(g, "HOME", x + 8, 16, "#9fb4e8", 1); glyphs(g, "GUEST", x + 76, 16, "#9fb4e8", 1); const hs = 60 + Math.floor((sc / 90 + i * 7) % 60), gs = 55 + Math.floor((sc / 110 + i * 5) % 60); glyphs(g, String(hs), x + 8, 26, "#ff5d5d", 3); glyphs(g, String(gs), x + 76, 26, "#ff5d5d", 3); const sec = Math.floor(t) % 60; glyphs(g, `${11 - Math.floor(t / 60) % 12}:${String(59 - sec).padStart(2, "0")}`, x + 44, 38, "#ffd23f", 1); });
  g.restore();
  // hoops
  layer(W, sc, 0.7, 760, (i, x) => { R(g, "#c9d0e6", x, gy - 62, 3, 62); R(g, "#f1f5ff", x - 24, gy - 74, 26, 20); R(g, "#cfd6ee", x - 22, gy - 72, 22, 16); R(g, "#e5484d", x - 14, gy - 66, 10, 7); R(g, "#ff7a2e", x - 20, gy - 52, 14, 2); for (let k = 0; k < 4; k++) R(g, "#f1f5ff", x - 19 + k * 3, gy - 50, 1, 7 - (k % 2)); });
  // courtside LED board + floor
  R(g, "#05070f", 0, gy - 12, W, 12); const msg = "SPORTS ARENA * TRIVIA NIGHT * GAME ON * "; const L = msg.length * 4; for (let k = 0; k < Math.ceil(W / L) + 2; k++) glyphs(g, msg, k * L - Math.floor((t * 24 + sc * 1.4) % L), gy - 9, "#ff9a3c", 1);
  R(g, "#e5484d", 0, gy - 1, W, 1);
  for (let y = gy, k = 0; y < H; y += 5, k++) R(g, k % 2 ? "#c98a46" : "#d99b55", 0, y, W, 5);
  layer(W, sc, 1, 16, (i, x) => R(g, "rgba(120,70,20,.35)", x, gy, 1, H - gy));
  const fh = H - gy;
  layer(W, sc, 1, 520, (i, x) => { // arc, key and logo
    g.strokeStyle = "rgba(255,244,214,.75)"; g.lineWidth = 2; g.beginPath(); g.ellipse(x + 40, gy + fh * 0.45, 96, fh * 0.4, 0, -1.5, 1.5); g.stroke();
    R(g, "rgba(229,72,77,.45)", x + 40, gy + fh * 0.22, 90, fh * 0.46); R(g, "rgba(255,244,214,.8)", x + 40, gy + fh * 0.22, 90, 1); R(g, "rgba(255,244,214,.8)", x + 40, gy + fh * 0.68, 90, 1); R(g, "rgba(255,244,214,.8)", x + 130, gy + fh * 0.22, 1, fh * 0.46);
    centred(g, "TRIVIA", x + 280, gy + fh * 0.32, "rgba(255,244,214,.55)", 4);
  });
  R(g, "rgba(255,255,255,.08)", 0, gy + 1, W, 2);
}

// ================================================================================================ MUSIC: Stage Lights
function music(c: C) {
  const { g, W, H, gy, sc, t, mood } = c;
  bands(g, W, 0, gy, "#08041a", "#2a0f55", 14, 1.3);
  // equaliser wall
  const beat = (Math.sin(t * 6.3) + 1) / 2;
  for (let i = 0, n = Math.ceil(W / 7); i < n; i++) { const h = ((Math.sin(t * 3 + i * 0.7) + Math.sin(t * 5.2 + i * 1.3) + 2) / 4) * gy * 0.5 + (mood === "great" ? gy * 0.12 : 0); for (let y = 0; y < h; y += 3) R(g, mix("#ff5d9e", "#4cc3ff", y / (gy * 0.6)), i * 7, gy - y - 3, 5, 2); }
  // light beams
  const cols = ["rgba(255,93,158,.17)", "rgba(76,195,255,.15)", "rgba(169,139,255,.17)", "rgba(255,210,63,.13)", "rgba(134,239,172,.12)"];
  for (let k = 0; k < 5; k++) beam(g, W * (0.08 + k * 0.21), 0, Math.sin(t * (0.7 + k * 0.13) + k * 1.7) * 0.7, gy * 1.15, 0.05, cols[k]);
  // truss + disco ball
  R(g, "#1b1236", 0, 0, W, 5); for (let x = 0; x < W; x += 8) R(g, "#2b2050", x, 0, 1, 5);
  layer(W, sc, 0.3, 520, (i, x) => { R(g, "#5a4f86", x + 12, 5, 1, 22); for (let yy = -10; yy <= 10; yy++) { const w = Math.floor(Math.sqrt(100 - yy * yy)); for (let xx = -w; xx <= w; xx += 2) R(g, (xx + yy + Math.floor(t * 8)) % 6 === 0 ? "#fff" : (xx / 2 + yy) % 2 ? "#aab4d8" : "#7d86b0", x + 12 + xx, 38 + yy, 2, 1); } });
  // speaker stacks
  layer(W, sc, 0.5, 340, (i, x) => { R(g, "#0a0716", x, gy - 56, 30, 56); R(g, "#1b1238", x, gy - 56, 30, 2); for (const [cy, r] of [[gy - 40, 7], [gy - 18, 9]] as const) { const pr = r + beat * 1.6; g.fillStyle = "#2a2150"; g.beginPath(); g.arc(x + 15, cy, pr, 0, 7); g.fill(); g.fillStyle = "#07040f"; g.beginPath(); g.arc(x + 15, cy, pr - 3, 0, 7); g.fill(); } });
  // floor
  R(g, "#120a2a", 0, gy, W, H - gy); R(g, "#ff5d9e", 0, gy, W, 2); R(g, "rgba(255,93,158,.2)", 0, gy + 2, W, 3);
  layer(W, sc, 1, 32, (i, x) => R(g, "rgba(169,139,255,.18)", x, gy + 3, 1, H - gy));
  for (let y = gy + 6; y < H; y += 9) R(g, "rgba(76,195,255,.07)", 0, y, W, 2);
  // floating notes
  for (let i = 0; i < 9; i++) { const x = (rnd(i, 3) * W + sc * 0.15 * (i % 3 + 1)) % W, y = gy - 20 - ((t * (10 + rnd(i, 4) * 12) + rnd(i, 5) * 200) % (gy * 0.8)); const col = ["#ff5d9e", "#4cc3ff", "#ffd23f", "#a98bff"][i % 4]; R(g, col, x, y, 4, 3); R(g, col, x + 3, y - 9, 1, 10); R(g, col, x + 4, y - 9, 3, 2); }
  // crowd
  layer(W, sc, 1.25, 20, (i, x) => { const hh = 6 + rnd(i, 6) * 5, arm = (mood === "great" || rnd(i, 7) > 0.55) ? Math.sin(t * 4 + i) * 3 : 0; R(g, "#05030f", x, H - hh, 9, hh); R(g, "#05030f", x + 2, H - hh - 4, 5, 4); if (rnd(i, 8) > 0.5) R(g, "#05030f", x + 8, H - hh - 3 + arm, 2, 5); });
}

// ================================================================================================ TV: Channel Wall
function tvScreen(g: G, x: number, y: number, w: number, h: number, kind: number, t: number, id: number) {
  switch (kind) {
    case 0: for (let yy = 0; yy < h; yy += 2) for (let xx = 0; xx < w; xx += 2) { const v = rnd(xx * 3 + yy * 7 + Math.floor(t * 12), id); R(g, v > 0.5 ? "#dfe6f0" : "#4a5468", x + xx, y + yy, 2, 2); } break;
    case 1: ["#e5e5e5", "#e5e51a", "#1ae5e5", "#1ae51a", "#e51ae5", "#e51a1a", "#1a1ae5"].forEach((cc, k) => R(g, cc, x + (k * w) / 7, y, w / 7 + 1, h)); break;
    case 2: R(g, "#12304a", x, y, w, h); g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(x + w / 2 + Math.sin(t * 2 + id) * w * 0.25, y + h / 2 + Math.cos(t * 3 + id) * h * 0.2, Math.min(w, h) * 0.22, 0, 7); g.fill(); break;
    case 3: R(g, "#2a0f55", x, y, w, h); for (let k = 0; k < 4; k++) R(g, ["#ff5d9e", "#4cc3ff", "#ffd23f", "#86efac"][k], x, y + ((k * 6 + t * 18 + id * 3) % h), w, 3); break;
    case 4: for (let yy = 0; yy < h; yy += 4) for (let xx = 0; xx < w; xx += 4) R(g, (xx + yy + Math.floor(t * 3)) % 8 === 0 ? "#ff5d9e" : "#1b1236", x + xx, y + yy, 4, 4); break;
    default: R(g, "#0a0a12", x, y, w, h); R(g, "#ff5d5d", x + 3, y + 3, 4, 4); glyphs(g, "REC", x + 9, y + 3, "#ff5d5d", 1);
  }
}
function tv(c: C) {
  const { g, W, H, gy, sc, t } = c;
  R(g, "#120c1c", 0, 0, W, gy);
  const tw = 34, th = 27;
  for (let row = 0; row * th < gy + th; row++) layer(W, sc, 0.5, tw, (i, x) => {
    const id = i * 31 + row * 7, y = row * th - 4, kind = Math.floor(rnd(id + Math.floor(t / 3 + rnd(id, 2) * 4), 1) * 6);
    R(g, "#2c2c3c", x, y, tw - 2, th - 2); R(g, "#44445a", x, y, tw - 2, 1); R(g, "#0a0a12", x + 2, y + 2, tw - 6, th - 8);
    tvScreen(g, x + 3, y + 3, tw - 8, th - 10, kind, t, id); R(g, "rgba(255,255,255,.07)", x + 3, y + 3, tw - 8, 3); R(g, "#6b6b80", x + tw - 6, y + th - 5, 2, 2);
    g.globalAlpha = 0.06; R(g, kind === 1 ? "#ffd23f" : "#9fd4ff", x - 2, y - 2, tw + 2, th + 2); g.globalAlpha = 1;
  });
  layer(W, sc, 0.4, 780, (i, x) => { const on = Math.floor(t * 1.4) % 2, sy = Math.round(gy * 0.5); R(g, "#2a0a0a", x, sy, 78, 26); R(g, on ? "#ff3b3b" : "#7a1a1a", x + 2, sy + 2, 74, 22); glyphs(g, "ON AIR", x + 10, sy + 8, on ? "#fff" : "#c46a6a", 3); R(g, "#555", x + 38, sy - 6, 2, 6); });
  // scan band
  g.globalAlpha = 0.07; R(g, "#fff", 0, (t * 40) % (gy + 20) - 10, W, 12); g.globalAlpha = 1;
  // shag carpet
  R(g, "#8f3d14", 0, gy, W, H - gy); layer(W, sc, 1, 24, (i, x) => { R(g, "#b4531e", x, gy + 2, 12, 5); R(g, "#d4752c", x + 12, gy + 9, 12, 5); R(g, "#6e2d0e", x, gy + 16, 12, 5); });
  R(g, "#3a1a08", 0, gy, W, 3);
  layer(W, sc, 1, 460, (i, x) => { R(g, "#241a40", x + 6, gy - 48, 3, 48); R(g, "#241a40", x, gy - 4, 16, 4); R(g, "#ffd88a", x - 4, gy - 58, 22, 12); g.globalAlpha = 0.12; g.fillStyle = "#ffd88a"; g.beginPath(); g.arc(x + 7, gy - 52, 30, 0, 7); g.fill(); g.globalAlpha = 1; });
  layer(W, sc, 0.9, 640, (i, x) => { R(g, "#3a1a3a", x, gy - 20, 70, 20); R(g, "#4e2450", x + 4, gy - 28, 62, 10); R(g, "#2a102a", x - 4, gy - 24, 8, 24); R(g, "#2a102a", x + 66, gy - 24, 8, 24); });
}

// ================================================================================================ GAMES: Pixel Kingdom
function games(c: C) {
  const { g, W, H, gy, sc, t } = c;
  bands(g, W, 0, gy, "#3fb4ff", "#c6efff", 14, 1);
  R(g, "#fff3a8", W * 0.8 - 9, gy * 0.18 - 9, 18, 18); R(g, "#fff9d4", W * 0.8 - 6, gy * 0.18 - 6, 12, 12);
  for (let i = 0; i < 6; i++) { const cw = 30 + rnd(i, 1) * 26, x = ((rnd(i, 2) * (W + 120) - sc * 0.08 - t * (2 + i)) % (W + 120) + (W + 120)) % (W + 120) - 60, y = 14 + rnd(i, 3) * gy * 0.38; R(g, "#fff", x + 4, y, cw - 8, 4); R(g, "#fff", x, y + 4, cw, 5); R(g, "#fff", x + 8, y - 4, cw / 2, 4); R(g, "#cfe6f6", x + 2, y + 9, cw - 4, 2); }
  layer(W, sc, 0.15, 160, (i, x) => { const h = 30 + rnd(i, 4) * 34; for (let k = 0; k < h; k += 2) R(g, "#7fc3d8", x + Math.floor(k * 0.7), gy - k, 120 - Math.floor(k * 1.4), 2); });
  layer(W, sc, 0.3, 120, (i, x) => { const h = 16 + rnd(i, 5) * 22; for (let k = 0; k < h; k += 2) R(g, "#59c36a", x + Math.floor(k * 0.9), gy - k, 120 - Math.floor(k * 1.8), 2); R(g, "#3a9a4c", x + 30, gy - h * 0.4, 3, 3); });
  // castle
  layer(W, sc, 0.42, 820, (i, x) => { R(g, "#8a7bd0", x, gy - 54, 90, 54); for (let k = 0; k < 6; k++) R(g, "#8a7bd0", x + k * 16, gy - 60, 9, 6); R(g, "#6a5cb0", x + 34, gy - 28, 20, 28); R(g, "#2a1a5a", x + 38, gy - 22, 12, 22); R(g, "#6a5cb0", x + 6, gy - 82, 18, 28); R(g, "#6a5cb0", x + 66, gy - 82, 18, 28); for (const tx of [6, 66]) { R(g, "#ff5d9e", x + tx - 2, gy - 90, 22, 8); R(g, "#ff5d9e", x + tx + 2, gy - 96, 14, 6); } R(g, "#fff", x + 14, gy - 106, 1, 10); R(g, "#ffd23f", x + 15 + Math.round(Math.sin(t * 5)), gy - 106, 7, 4); });
  // floating islands
  layer(W, sc, 0.55, 270, (i, x) => { const y = gy * (0.34 + rnd(i, 6) * 0.3) + Math.sin(t * 1.2 + i) * 3, w = 40 + rnd(i, 7) * 30; R(g, "#8b5a2b", x + 3, y + 5, w - 6, 8); R(g, "#6e4620", x + 8, y + 13, w - 16, 5); R(g, "#3fbf4f", x, y, w, 5); R(g, "#7be08a", x, y, w, 1); if (rnd(i, 8) > 0.5) { R(g, "#5a3a1a", x + w / 2, y - 12, 2, 12); R(g, "#2f9c3f", x + w / 2 - 5, y - 20, 12, 10); } });
  // gem blocks + coins
  layer(W, sc, 0.78, 190, (i, x) => { const y = gy * 0.5 + rnd(i, 9) * gy * 0.1; R(g, "#c47f17", x, y, 15, 15); R(g, "#ffd23f", x + 1, y + 1, 13, 13); R(g, "#fff3a8", x + 1, y + 1, 13, 2); const sp = (Math.sin(t * 5 + i) + 1) / 2; R(g, "#fff", x + 6, y + 4, 3, 7); R(g, "#fff", x + 4, y + 6, 7, 3); g.globalAlpha = sp; R(g, "#7be0ff", x + 7, y + 7, 1, 1); g.globalAlpha = 1; });
  layer(W, sc, 0.9, 38, (i, x) => { if (rnd(i, 10) > 0.4) return; const y = gy - 24 - Math.abs(Math.sin(i * 0.5)) * 16, w = Math.abs(Math.sin(t * 5 + i)) * 5 + 1; R(g, "#c47f17", x + 4 - w / 2, y, w + 1, 8); R(g, "#ffd23f", x + 4 - w / 2 + 1, y + 1, Math.max(1, w - 1), 6); });
  // ground
  R(g, "#8b5a2b", 0, gy, W, H - gy); layer(W, sc, 1, 16, (i, x) => { R(g, "#6e4620", x, gy + 8, 15, 1); R(g, "#6e4620", x + (i % 2 ? 8 : 0), gy + 16, 1, 8); R(g, "#a06a35", x + 2, gy + 11, 5, 3); });
  R(g, "#3fbf4f", 0, gy, W, 5); R(g, "#7be08a", 0, gy, W, 1); layer(W, sc, 1, 7, (i, x) => R(g, "#2f9c3f", x, gy + 5, 3, 2 + (i % 3)));
}

const SCENES: Record<ThemeId, (c: C) => void> = { movies, sports, music, tv, games };

// ================================================================================================ the vehicle: a fish in a rolling bowl
function bowl(c: C, st: { sprite: HTMLCanvasElement | null; hop: number }, x: number, ground: number, theme: ThemeId, moving: boolean, shake: number, dim: boolean) {
  const { g, t, sc } = c;
  const bounce = theme === "sports" ? Math.abs(Math.sin(sc * 0.045 + t * 2)) * 9 : Math.sin(t * 3.2) * 1.2;
  const y = ground - 4 - bounce - st.hop, squash = theme === "sports" ? 1 + (1 - bounce / 9) * 0.0 : 0;
  g.globalAlpha = dim ? 0.55 : 1;
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x, ground + 2, 15 - bounce * 0.3, 3, 0, 0, 7); g.fill();
  // wheels
  for (const dx of [-9, 9]) { const wx = x + dx + shake; R(g, "#1a1a2a", wx - 4, y + 1, 9, 9); R(g, "#6b7090", wx - 3, y + 2, 7, 7); R(g, "#1a1a2a", wx - 1, y + 4, 3, 3); const a = sc * 0.18 + dx; R(g, "#c9cde6", wx + Math.round(Math.cos(a) * 2) - 0, y + 5 + Math.round(Math.sin(a) * 2), 1, 1); }
  R(g, "#ff5d9e", x - 12 + shake, y - 2, 25, 4); R(g, "#ffd23f", x - 12 + shake, y - 2, 25, 1);
  // glass
  const bx = x + shake, by = y - 15; g.fillStyle = "rgba(120,200,255,.35)"; g.beginPath(); g.arc(bx, by, 13, 0, 7); g.fill(); g.fillStyle = "rgba(70,150,230,.45)"; g.beginPath(); g.arc(bx, by + 2, 11, 0, Math.PI); g.fill();
  if (st.sprite) { g.imageSmoothingEnabled = false; g.drawImage(st.sprite, Math.round(bx - 11), Math.round(by - 11 + Math.sin(t * 2.4) * 1), 22, 22); }
  g.strokeStyle = "rgba(235,248,255,.85)"; g.lineWidth = 1; g.beginPath(); g.arc(bx, by, 13, 0, 7); g.stroke();
  R(g, "rgba(255,255,255,.85)", bx - 8, by - 9, 3, 1); R(g, "rgba(255,255,255,.85)", bx - 9, by - 8, 1, 3);
  for (let i = 0; i < 2; i++) R(g, "rgba(235,248,255,.8)", bx + 3 + i * 3, by - 6 - ((t * 9 + i * 5) % 7), 1, 1);
  g.globalAlpha = 1; void squash; void moving;
}

export default function ThemeScene({ theme, dist, fishId = null, mood = "idle", onDist, onArrive, arriveKey = 0 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ onDist, onArrive }); cb.current = { onDist, onArrive };
  const st = useRef({ cur: dist, from: dist, to: dist, start: 0, dur: 1, moving: false, sprite: null as HTMLCanvasElement | null, mood, theme, drift: 0, lastInt: -1, hop: 0, hopV: 0, parts: [] as { x: number; y: number; vx: number; vy: number; l: number; c: string }[], lastMood: mood });
  st.current.mood = mood; st.current.theme = theme;

  useEffect(() => {
    const s = st.current;
    if (Math.abs(dist - s.cur) < 0.5) { if (!s.moving) setTimeout(() => cb.current.onArrive?.(), 650); return; }
    s.from = s.cur; s.to = dist; s.start = performance.now(); s.dur = clamp(900 + Math.abs(dist - s.cur) * 3, 1300, 3600); s.moving = true;
  }, [dist, arriveKey]);

  useEffect(() => { let live = true; if (fishId) makeSprite(fishId).then((cv) => { if (live) st.current.sprite = cv; }); else st.current.sprite = null; return () => { live = false; }; }, [fishId]);

  useEffect(() => {
    const canvas = ref.current!, g = canvas.getContext("2d")!; let raf = 0, W = 150, H = 300, last = performance.now();
    const calm = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const resize = () => { const r = canvas.getBoundingClientRect(); const scale = clamp(r.height / 300, 2.6, 4.6); W = Math.max(120, Math.round(r.width / scale)); H = Math.max(120, Math.ceil(r.height / scale)); canvas.width = W; canvas.height = H; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
    const frame = (now: number) => {
      const s = st.current, dt = Math.min(0.05, (now - last) / 1000); last = now; const t = calm ? 0 : now / 1000;
      if (s.moving) { const f = Math.min(1, (now - s.start) / s.dur), e = f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2; s.cur = lerp(s.from, s.to, e); if (f >= 1) { s.moving = false; s.cur = s.to; cb.current.onArrive?.(); } }
      const iv = Math.round(s.cur); if (iv !== s.lastInt) { s.lastInt = iv; cb.current.onDist?.(iv); }
      if (!calm) s.drift += dt * (s.moving ? 70 : 9);
      const sc = s.cur * PX_PER_UNIT + s.drift;
      const gy = Math.round(H * 0.58);
      if (s.mood !== s.lastMood) { if (s.mood === "good" || s.mood === "great") s.hopV = s.mood === "great" ? 11 : 7; s.lastMood = s.mood; }
      if (s.hopV !== 0 || s.hop > 0) { s.hop = Math.max(0, s.hop + s.hopV * dt * 12); s.hopV -= dt * 26; if (s.hop <= 0) { s.hop = 0; s.hopV = 0; } }
      g.imageSmoothingEnabled = false;
      const ctx: C = { g, W, H, gy, sc, t, mood: s.mood, calm };
      SCENES[s.theme](ctx);
      // speed streaks while rolling
      if (s.moving && !calm) { g.globalAlpha = 0.5; for (let i = 0; i < 9; i++) R(g, "#fff", ((rnd(i, 3) * W - now * 0.6 * (1 + i % 3)) % W + W) % W, gy + 6 + rnd(i, 4) * (H - gy - 12), 10 + rnd(i, 5) * 16, 1); g.globalAlpha = 1; }
      const bx = Math.round(W * 0.5), ground = Math.round(H * 0.735);
      const shake = s.mood === "nope" ? Math.round(Math.sin(now / 35) * 2) : 0;
      if (s.mood === "great" && !calm && Math.random() < 0.7) s.parts.push({ x: bx + (Math.random() - 0.5) * 30, y: ground - 24, vx: (Math.random() - 0.5) * 50, vy: -50 - Math.random() * 40, l: 1, c: ["#ff5d9e", "#ffd23f", "#4cc3ff", "#86efac", "#fff"][Math.floor(Math.random() * 5)] });
      if (s.moving && !calm && Math.random() < 0.5) s.parts.push({ x: bx - 10, y: ground, vx: -30 - Math.random() * 30, vy: -8 - Math.random() * 8, l: 0.5, c: "rgba(255,255,255,.55)" });
      bowl(ctx, s, bx, ground, s.theme, s.moving, shake, s.mood === "miss");
      for (const p of s.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.l -= dt * 0.9; g.globalAlpha = clamp(p.l * 1.6, 0, 1); R(g, p.c, p.x, p.y, 2, 2); }
      g.globalAlpha = 1; s.parts = s.parts.filter((p) => p.l > 0);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className="px-canvas" aria-hidden style={{ imageRendering: "pixelated" }} />;
}

export { textW };

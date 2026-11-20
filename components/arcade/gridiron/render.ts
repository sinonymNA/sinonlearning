// Retro Gridiron pixel renderer. Everything is drawn procedurally on a small logical canvas (CW x CH) that the page scales
// up with image-rendering: pixelated. No external art: every sprite is generated here. Rendering never mutates game state.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FIELD, TEAMS, getPlay } from "../../../arcade-server/gridiron/index.mjs";

export const PPY = 6;            // logical pixels per yard
export const VW = 46;            // yards visible across (wide receivers still fit)
export const VIEW = 30;          // yards visible downfield: a tight, Retro-Bowl-style camera
export const CW = VW * PPY;      // 276
export const CH = VIEW * PPY;    // 180
export const SPR = 2;            // sprite pixel scale
export const LABEL_COLORS = ["#ffb020", "#34d399", "#f472b6", "#60a5fa"];
export type Cam = { bottom: number; left: number };

const sx = (cam: Cam, x: number) => Math.round((x - cam.left) * PPY);
const sy = (cam: Cam, y: number) => Math.round((cam.bottom + VIEW - y) * PPY);
const rnd = (i: number, salt = 0) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- 3x5 bitmap font -------------------------------------------------------------------------------------------
const G: Record<string, string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"], B: ["##.", "#.#", "##.", "#.#", "##."], C: [".##", "#..", "#..", "#..", ".##"], D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"], F: ["###", "#..", "##.", "#..", "#.."], G: [".##", "#..", "#.#", "#.#", ".##"], H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"], J: ["..#", "..#", "..#", "#.#", ".#."], K: ["#.#", "#.#", "##.", "#.#", "#.#"], L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"], N: ["###", "#.#", "#.#", "#.#", "#.#"], O: [".#.", "#.#", "#.#", "#.#", ".#."], P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "###", "..#"], R: ["##.", "#.#", "##.", "#.#", "#.#"], S: [".##", "#..", ".#.", "..#", "##."], T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"], V: ["#.#", "#.#", "#.#", "#.#", ".#."], W: ["#.#", "#.#", "###", "###", "#.#"], X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."], Z: ["###", "..#", ".#.", "#..", "###"],
  "0": ["###", "#.#", "#.#", "#.#", "###"], "1": [".#.", "##.", ".#.", ".#.", "###"], "2": ["##.", "..#", ".#.", "#..", "###"], "3": ["##.", "..#", ".#.", "..#", "##."],
  "4": ["#.#", "#.#", "###", "..#", "..#"], "5": ["###", "#..", "##.", "..#", "##."], "6": [".##", "#..", "###", "#.#", "###"], "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"], "9": ["###", "#.#", "###", "..#", "##."], "-": ["...", "...", "###", "...", "..."], " ": ["...", "...", "...", "...", "..."],
};
export function glyphs(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale = 1) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = G[ch] || G[" "];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r][c] === "#") ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
    cx += 4 * scale;
  }
}
const textW = (t: string, s = 1) => t.length * 4 * s - s;
function centred(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, color: string, scale = 1) { glyphs(ctx, text, Math.round(cx - textW(text, scale) / 2), y, color, scale); }

const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, w = 1, h = 1) => ctx.fillRect(Math.round(x), Math.round(y), w, h);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ---- field -----------------------------------------------------------------------------------------------------
export type FieldOpts = { losY: number | null; firstY: number | null; tick: number; cheer?: boolean; youName?: string; cpuName?: string };
export function drawField(ctx: CanvasRenderingContext2D, cam: Cam, o: FieldOpts) {
  const yMin = cam.bottom, yMax = cam.bottom + VIEW;
  ctx.fillStyle = "#171a2e"; ctx.fillRect(0, 0, CW, CH);
  const fx0 = sx(cam, 0), fx1 = sx(cam, FIELD.W), a0 = Math.max(0, fx0), a1 = Math.min(CW, fx1);
  // grass in alternating 5-yard bands (end zones tinted)
  for (let y0 = Math.floor(yMin / 5) * 5; y0 < yMax; y0 += 5) {
    const top = sy(cam, y0 + 5), bot = sy(cam, y0);
    const inEZ = y0 < FIELD.END || y0 >= FIELD.END + 100;
    ctx.fillStyle = inEZ ? (y0 < FIELD.END ? "#1f4aa0" : "#a02636") : Math.floor(y0 / 5) % 2 ? "#2f8c3c" : "#37984a";
    ctx.fillRect(a0, top, a1 - a0, bot - top);
  }
  for (const [yc, name, col] of [[FIELD.END / 2, o.youName ?? TEAMS.you.name, "#bcd3ff"], [FIELD.END + 100 + FIELD.END / 2, o.cpuName ?? TEAMS.cpu.name, "#ffc2c8"]] as const) {
    const y = sy(cam, yc);
    if (y > -20 && y < CH + 20) centred(ctx, name, (fx0 + fx1) / 2, y - 8, col as string, 3);
  }
  // crowd beyond the sidelines
  for (let w = Math.floor(yMin * 1.5); w < yMax * 1.5; w++) {
    const y = sy(cam, w / 1.5);
    for (const side of [0, 1]) {
      const x0 = side ? fx1 + 2 : 0, x1 = side ? CW : fx0 - 2;
      if (x1 - x0 < 4) continue;
      for (let k = 0; k < 3; k++) {
        const r = rnd(w * 7 + side * 91 + k * 13);
        ctx.fillStyle = r < 0.25 ? "#e5484d" : r < 0.5 ? "#3b82f6" : r < 0.65 ? "#ffd23f" : r < 0.8 ? "#d8dcf5" : "#4a4f78";
        const hop = o.cheer ? Math.round(Math.abs(Math.sin(o.tick * 0.35 + w)) * 3) : Math.sin(o.tick * 0.05 + w) > 0.96 ? 1 : 0;
        dot(ctx, x0 + ((r * 977) % 1) * (x1 - x0 - 3), y + k * 2 - hop, 3, 3);
      }
    }
  }
  // sideline benches every 20 yards
  for (let b = Math.ceil((yMin - 2) / 20) * 20; b < yMax + 3; b += 20) {
    const y = sy(cam, b);
    for (const side of [0, 1]) {
      const bx = side ? fx1 + 3 : fx0 - 11; if (bx < -8 || bx > CW) continue;
      ctx.fillStyle = "#6b4a2b"; ctx.fillRect(bx, y - 10, 8, 20);
      ctx.fillStyle = side ? "#e5484d" : "#3b82f6"; for (let i = 0; i < 3; i++) ctx.fillRect(bx + 1, y - 8 + i * 6, 5, 4);
    }
  }
  // yard lines
  for (let yl = 0; yl <= 100; yl += 5) {
    const y = sy(cam, FIELD.END + yl);
    if (y < -3 || y > CH + 3) continue;
    ctx.fillStyle = yl === 0 || yl === 100 ? "#ffffff" : yl % 10 === 0 ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.55)";
    ctx.fillRect(a0, y - 1, a1 - a0, yl === 0 || yl === 100 ? 3 : 2);
  }
  // hash marks (every yard) and sideline ticks
  ctx.fillStyle = "rgba(255,255,255,.7)";
  for (let yl = 1; yl < 100; yl++) {
    const y = sy(cam, FIELD.END + yl); if (y < 0 || y > CH) continue;
    for (const hx of [FIELD.CX - 11.8, FIELD.CX + 11.8]) ctx.fillRect(sx(cam, hx) - 3, y, 6, 1);
    ctx.fillRect(fx0 + 2, y, 4, 1); ctx.fillRect(fx1 - 6, y, 4, 1);
  }
  // big yard numbers
  for (let yl = 10; yl <= 90; yl += 10) {
    const y = sy(cam, FIELD.END + yl); if (y < -20 || y > CH + 20) continue;
    const n = String(Math.min(yl, 100 - yl)); const w = textW(n, 3);
    for (const nx of [sx(cam, 9), sx(cam, FIELD.W - 9)]) glyphs(ctx, n, Math.round(nx - w / 2), y - 8, "rgba(255,255,255,.7)", 3);
  }
  ctx.fillStyle = "#ffffff"; ctx.fillRect(fx0 - 2, 0, 2, CH); ctx.fillRect(fx1, 0, 2, CH);
  if (o.losY != null) { const y = sy(cam, o.losY); ctx.fillStyle = "#3b82f6"; ctx.fillRect(a0, y - 1, a1 - a0, 3); }
  if (o.firstY != null && o.firstY < FIELD.GOAL_Y) { const y = sy(cam, o.firstY); ctx.fillStyle = "#ffd23f"; ctx.fillRect(a0, y - 1, a1 - a0, 3); }
}

// ---- players (drawn at 2x so they read clearly on a phone) --------------------------------------------------------
const SKIN = ["#f1c9a0", "#c68642", "#8d5524", "#e0ac69"];
type Pl = { id: string; team: "o" | "d"; role: string; label: string | null; x: number; y: number; vx: number; vy: number; state: string; stun: boolean; blocked: boolean; ball: boolean };
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Pl, cam: Cam, tick: number, o: { prone?: boolean; label?: boolean; selected?: boolean; you: boolean; ghost?: boolean }) {
  const X = sx(cam, p.x), Y = sy(cam, p.y);
  if (Y < -50 || Y > CH + 30 || X < -30 || X > CW + 30) return;
  const jersey = p.team === "o" ? "#3b82f6" : "#e5484d", dark = p.team === "o" ? "#1d4ed8" : "#9f1239";
  const trim = p.team === "o" ? "#ffffff" : "#ffe08a", helmet = p.team === "o" ? "#1e3a8a" : "#7f1d1d";
  const skin = SKIN[hash(p.id) % SKIN.length];
  const sp = Math.hypot(p.vx, p.vy), running = sp > 1.2 && !o.prone;
  const frame = running ? Math.floor((tick * 0.5 + (hash(p.id) % 5)) * (0.6 + sp / 10)) % 2 : 0;
  const bigger = p.role === "OL" || p.role === "DL" ? 1 : 0;
  ctx.save(); ctx.translate(X, Y); ctx.scale(SPR, SPR);
  ctx.globalAlpha = o.ghost ? 0.55 : 1;
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(-3 - bigger, -1, 7 + bigger * 2, 2);
  if (o.prone) {
    ctx.fillStyle = jersey; ctx.fillRect(-5, -4, 8, 4); ctx.fillStyle = trim; ctx.fillRect(-3, -4, 1, 4);
    ctx.fillStyle = helmet; ctx.fillRect(3, -4, 3, 3); ctx.fillStyle = "#e8ecf8"; ctx.fillRect(-7, -3, 2, 2); ctx.restore(); return;
  }
  const facingDown = p.vy < -0.5 || (Math.abs(p.vy) <= 0.5 && p.team === "d");
  ctx.fillStyle = "#e8ecf8"; ctx.fillRect(-2 - bigger, -3 + (frame ? 1 : 0), 2, 3 - (frame ? 1 : 0)); ctx.fillRect(1 + bigger, -3 + (frame ? 0 : 1), 2, 3 - (frame ? 0 : 1));
  ctx.fillStyle = jersey; ctx.fillRect(-3 - bigger, -7, 6 + bigger * 2, 4);
  ctx.fillStyle = trim; ctx.fillRect(-3 - bigger, -5, 6 + bigger * 2, 1);
  if (!facingDown) { ctx.fillStyle = dark; ctx.fillRect(-1, -7, 2, 1); }
  ctx.fillStyle = p.blocked || p.state === "BLOCKED" ? dark : skin; const aw = running ? (frame ? 1 : 0) : 0;
  ctx.fillRect(-4 - bigger, -7 + aw, 1, 3); ctx.fillRect(3 + bigger, -7 + (1 - aw), 1, 3);
  ctx.fillStyle = helmet; ctx.fillRect(-2, -10, 4, 3);
  if (p.role === "QB") { ctx.fillStyle = "#fff"; ctx.fillRect(0, -10, 1, 3); }
  if (facingDown) { ctx.fillStyle = "#c9cfe0"; ctx.fillRect(-2, -8, 4, 1); ctx.fillStyle = skin; ctx.fillRect(-1, -9, 2, 1); } else { ctx.fillStyle = "#2b3a7a"; ctx.fillRect(-2, -10, 4, 1); }
  if (p.stun) { ctx.fillStyle = "#ffd23f"; ctx.fillRect(-3 + ((tick >> 2) % 6), -13, 1, 1); ctx.fillRect(2 - ((tick >> 2) % 6), -12, 1, 1); }
  ctx.restore();
  if (o.label && p.label) {
    const idx = "ABCD".indexOf(p.label), col = LABEL_COLORS[idx] || "#fff", by = Y - 44;
    ctx.fillStyle = "#0b1020"; ctx.fillRect(X - 7, by - 2, 15, 18); ctx.fillStyle = col; ctx.fillRect(X - 6, by - 1, 13, 16);
    glyphs(ctx, p.label, X - 3, by + 2, "#0b1020", 2);
    ctx.fillStyle = col; ctx.fillRect(X - 1, by + 16, 3, 3);
    if (o.selected) { ctx.fillStyle = "#fff"; ctx.fillRect(X - 10, by - 5, 21, 2); ctx.fillRect(X - 10, by + 19, 21, 2); }
  }
}

export function drawBall(ctx: CanvasRenderingContext2D, b: { x: number; y: number; z: number }, cam: Cam, trail?: { x: number; y: number }[]) {
  const gx = sx(cam, b.x), gy = sy(cam, b.y), by = gy - Math.round(b.z * 5);
  if (trail) trail.forEach((t, i) => { ctx.fillStyle = `rgba(255,255,255,${0.1 + (i / trail.length) * 0.4})`; ctx.fillRect(sx(cam, t.x) - 2, sy(cam, t.y) - 6, 4, 4); });
  if (b.z > 1.2) { ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(gx - 4, gy, 9, 2); }
  ctx.save(); ctx.translate(gx, by); ctx.scale(SPR, SPR);
  ctx.fillStyle = "#2b1405"; ctx.fillRect(-3, -2, 6, 4); ctx.fillRect(-2, -3, 4, 6);
  ctx.fillStyle = "#b9652a"; ctx.fillRect(-2, -2, 4, 3); ctx.fillStyle = "#e08a45"; ctx.fillRect(-2, -2, 4, 1); ctx.fillStyle = "#fff"; ctx.fillRect(-1, -1, 2, 1);
  ctx.restore();
}

export function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, cam: Cam, color: string, tick: number) {
  const cx = sx(cam, x), cy = sy(cam, y), r = 13 + ((tick >> 3) % 2) * 2;
  ctx.fillStyle = color;
  for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2; dot(ctx, cx + Math.cos(t) * r, cy - 2 + Math.sin(t) * r * 0.5, 2, 2); }
}

/** Dotted route lines with an arrow at the end, in the receiver's colour. */
export function drawRoutes(ctx: CanvasRenderingContext2D, wr: { x: number; y: number; path: { x: number; y: number }[]; wp: number }[], cam: Cam, alpha: number, fromStart: boolean, tick: number) {
  ctx.globalAlpha = alpha;
  wr.forEach((w, i) => {
    ctx.fillStyle = LABEL_COLORS[i];
    const pts = [{ x: w.x, y: w.y }, ...(fromStart ? w.path : w.path.slice(w.wp))];
    let n2 = 0;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) * PPY / 2));
      for (let s = 0; s < n; s++) { n2++; if ((n2 + (tick >> 2)) % 4 < 3) dot(ctx, sx(cam, a.x + ((b.x - a.x) * s) / n) - 1, sy(cam, a.y + ((b.y - a.y) * s) / n) - 1, 3, 3); }
    }
    if (pts.length > 1) {
      const a = pts[pts.length - 2], b = pts[pts.length - 1], ex = sx(cam, b.x), ey = sy(cam, b.y), ang = Math.atan2(ey - sy(cam, a.y), ex - sx(cam, a.x));
      for (const da of [0.5, -0.5]) for (let s = 1; s <= 5; s++) dot(ctx, ex - Math.cos(ang + da) * s * 2, ey - Math.sin(ang + da) * s * 2, 3, 3);
      ctx.fillRect(ex - 3, ey - 3, 7, 7);
    }
  });
  ctx.globalAlpha = 1;
}

export function drawLanding(ctx: CanvasRenderingContext2D, p: { x: number; y: number }, cam: Cam) {
  const x = sx(cam, p.x), y = sy(cam, p.y); ctx.fillStyle = "rgba(255,255,255,.6)";
  for (const [dx, dy] of [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]]) ctx.fillRect(x + dx - 1, y + dy - 1, 3, 3);
}

/** Receivers that have run off the top/sides of the camera get a lettered arrow at the screen edge. */
export function drawEdgeMarkers(ctx: CanvasRenderingContext2D, wr: { x: number; y: number; label: string }[], cam: Cam) {
  for (const w of wr) {
    const px = sx(cam, w.x), py = sy(cam, w.y);
    if (py > 16 && px > 8 && px < CW - 8 && py < CH) continue;
    const cx = clamp(px, 12, CW - 12), cy = clamp(py, 14, CH - 12), idx = "ABCD".indexOf(w.label), col = LABEL_COLORS[idx] || "#fff";
    ctx.fillStyle = "#0b1020"; ctx.fillRect(cx - 8, cy - 8, 17, 19); ctx.fillStyle = col; ctx.fillRect(cx - 7, cy - 7, 15, 17);
    glyphs(ctx, w.label, cx - 3, cy - 4, "#0b1020", 2);
    ctx.fillStyle = col; if (py <= 16) { ctx.fillRect(cx - 1, cy - 12, 3, 3); ctx.fillRect(cx - 3, cy - 10, 7, 2); }
  }
}

// ---- particles ---------------------------------------------------------------------------------------------------
export type Particle = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; c: string; s: number; g: number };
export function stepParticles(ps: Particle[], dt: number) {
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]; p.life += dt; if (p.life >= p.max) { ps.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.7; p.vy *= 0.7; }
  }
}
export function drawParticles(ctx: CanvasRenderingContext2D, ps: Particle[], cam: Cam) {
  for (const p of ps) { ctx.globalAlpha = Math.min(1, (1 - p.life / p.max) * 1.6); ctx.fillStyle = p.c; ctx.fillRect(sx(cam, p.x), sy(cam, p.y) - Math.round(p.z * 5), p.s, p.s); }
  ctx.globalAlpha = 1;
}

export function playMeta(id: string) { return getPlay(id); }

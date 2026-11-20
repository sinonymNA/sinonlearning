"use client";

import { renderToStaticMarkup } from "react-dom/server";
import { useEffect, useRef } from "react";
import Avatar from "./Avatar";

/**
 * Retro pixel-art ocean, drawn procedurally on a low-resolution canvas (W logical px wide) and scaled up with
 * image-rendering: pixelated. The camera follows the diver down a tall world: sky, sun, clouds and a little boat at
 * the surface, banded water that darkens with depth, light shafts, fish silhouettes, kelp, bubbles, glowing deep-sea
 * specks, a depth ruler with tier markers, and flavour text at set depths. All original art, generated in code.
 */
export type Marker = { depth: number; label: string; color: string };
type Props = {
  depth: number;                 // target depth in metres (tweens when it changes)
  surfaceFrac?: number;          // where the surface sits on screen at depth 0 (0..1)
  markers?: Marker[];
  fishId?: string | null;        // sprite shown as the diver (null = no diver)
  mood?: "idle" | "nope" | "good" | "great" | "miss";
  ruler?: boolean;
  onDepth?: (m: number) => void;
  onArrive?: () => void;
  arriveKey?: number;            // bump to re-trigger onArrive for zero-distance moves
  paused?: boolean;              // stop redrawing (a sheet/menu is covering the scene)
};

const PPM = 0.7;
const LINES: [number, string][] = [[60, "warm water ends here"], [200, "sunlight is running out"], [500, "the blue turns to black"], [1000, "quiet down here"], [1600, "things glow now"], [2500, "the pressure builds"], [3500, "no sun has ever been here"], [5000, "the old trench"], [6800, "hadal zone - few have seen it"]];
const rnd = (i: number, salt = 0) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; };
const WATER: [number, string][] = [[0, "#3b8fd0"], [150, "#2468b0"], [400, "#164a88"], [1000, "#0d2f5e"], [2500, "#071b3a"], [5000, "#040f22"], [7000, "#02060f"]];
type Pt = { x: number; y: number; vx: number; vy: number; l: number; max: number; c: string; sz: number; g: number };
/** Big, slow sea creatures that cross the scene so the dive feels alive. */
function creature(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number, t: number, dir: number, shade: string, glow: string) {
  const R = (c: string, dx: number, dy: number, w: number, h: number) => { ctx.fillStyle = c; ctx.fillRect(Math.round(dir > 0 ? x + dx : x - dx - w), Math.round(y + dy), w, h); };
  if (kind === 0) { // whale
    R(shade, 6, -6, 46, 14); R(shade, 0, -3, 8, 9); R(shade, 52, -4, 8, 8); R(shade, 58, -10, 10, 5); R(shade, 58, 4, 10, 5); R(glow, 14, 4, 34, 3); R("#c9e6f5", 40, -3, 2, 2);
    for (let i = 0; i < 4; i++) R(glow, 12 + i * 3, 1 + (i % 2), 2, 1);
  } else if (kind === 1) { // manta
    const f = Math.round(Math.sin(t * 2) * 3); R(shade, 10, -2, 24, 6); R(shade, 2, -4 + f, 14, 3); R(shade, 28, -4 + f, 14, 3); R(shade, 0, -6 + f, 6, 3); R(shade, 36, -6 + f, 6, 3); R(shade, 34, 0, 18, 1); R(glow, 18, -1, 6, 2);
  } else { // jellyfish
    const pulse = Math.round(Math.sin(t * 3) * 1.5);
    ctx.globalAlpha = 0.85; R(glow, 3, -8 + pulse, 14, 3); R(glow, 1, -5 + pulse, 18, 4); R(glow, 0, -1 + pulse, 20, 2);
    ctx.globalAlpha = 0.5; for (let i = 0; i < 5; i++) for (let k = 0; k < 10; k += 2) R(glow, 2 + i * 4 + Math.round(Math.sin(t * 2 + k * 0.5 + i) * 1.5), 1 + k + pulse, 1, 2);
    ctx.globalAlpha = 1;
  }
}

function waterAt(m: number) {
  const q = Math.floor(Math.max(0, m) / 14) * 14;        // band the colour so it reads as pixel art
  for (let i = 1; i < WATER.length; i++) if (q <= WATER[i][0]) { const [d0, c0] = WATER[i - 1], [d1, c1] = WATER[i]; return mix(c0, c1, (q - d0) / (d1 - d0)); }
  return WATER[WATER.length - 1][1];
}

export function makeSprite(fishId: string): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    try {
      const svg = renderToStaticMarkup(<Avatar id={fishId} size={112} />).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = 30; c.height = 30;
        const x = c.getContext("2d")!; x.imageSmoothingEnabled = true; x.drawImage(img, 0, 0, 30, 30);
        const d = x.getImageData(0, 0, 30, 30);
        for (let i = 0; i < d.data.length; i += 4) d.data[i + 3] = d.data[i + 3] < 120 ? 0 : 255;   // crisp pixel edges
        x.putImageData(d, 0, 0); resolve(c);
      };
      img.onerror = () => resolve(null);
      img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    } catch { resolve(null); }
  });
}

export default function PixelOcean({ depth, surfaceFrac = 0.28, markers = [], fishId = null, mood = "idle", ruler = true, onDepth, onArrive, arriveKey = 0, paused = false }: Props) {
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const ref = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const st = useRef({ cur: depth, from: depth, to: depth, start: 0, dur: 1, moving: false, sprite: null as HTMLCanvasElement | null, mood, markers, surfaceFrac, ruler, lastInt: -1, bubbles: [] as { x: number; y: number; r: number; v: number }[], burst: 0 });
  const cb = useRef({ onDepth, onArrive }); cb.current = { onDepth, onArrive };

  st.current.mood = mood; st.current.markers = markers; st.current.surfaceFrac = surfaceFrac; st.current.ruler = ruler;

  useEffect(() => {
    const s = st.current;
    if (Math.abs(depth - s.cur) < 0.5) { if (s.moving === false) setTimeout(() => cb.current.onArrive?.(), 650); return; }
    s.from = s.cur; s.to = depth; s.start = performance.now(); s.dur = Math.min(3800, Math.max(1300, 900 + Math.abs(depth - s.cur) * 4)); s.moving = true; s.burst = 1;
  }, [depth, arriveKey]);

  useEffect(() => { let live = true; if (fishId) makeSprite(fishId).then((c) => { if (live) st.current.sprite = c; }); else st.current.sprite = null; return () => { live = false; }; }, [fishId]);

  useEffect(() => {
    const canvas = ref.current!; const ctx = canvas.getContext("2d")!;
    let raf = 0, H = 300, dpr = 1, W = 150, ox = 0, colW = 150;
    const calm = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const scale = Math.min(4.6, Math.max(2.6, r.height / 300));       // bigger pixels on tall screens (iPad), same chunky look on phones
      W = Math.max(120, Math.round(r.width / scale)); H = Math.max(120, Math.ceil(r.height / scale));
      canvas.width = W; canvas.height = H; dpr = r.width / W;
      colW = Math.min(W, Math.round(620 / scale)); ox = Math.round((W - colW) / 2);   // the UI column; the scene itself fills the screen
      const lab = labelsRef.current; if (lab) { lab.style.left = `${ox * dpr}px`; lab.style.width = `${colW * dpr}px`; lab.style.right = "auto"; }
    };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
    try { void document.fonts?.load("8px VT323"); } catch { /* fonts optional */ }

    const frame = (now: number) => {
      if (pausedRef.current || document.hidden) { raf = requestAnimationFrame(frame); return; }
      const s = st.current; const t = calm ? 0 : now / 1000;
      if (s.moving) {
        const f = Math.min(1, (now - s.start) / s.dur), e = f < .5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
        s.cur = lerp(s.from, s.to, e);
        if (f >= 1) { s.moving = false; s.cur = s.to; s.burst = 0; cb.current.onArrive?.(); }
      }
      const d = s.cur;
      const iv = Math.round(d); if (iv !== s.lastInt) { s.lastInt = iv; cb.current.onDepth?.(iv); }
      const surfY0 = H * s.surfaceFrac;
      const camY = Math.max(0, d - 60);
      const sy = (m: number) => surfY0 + (m - camY) * PPM;          // metres -> logical y
      const surf = sy(0);
      ctx.imageSmoothingEnabled = false;

      // water, banded
      for (let y = Math.max(0, Math.floor(surf)); y < H; y += 2) { ctx.fillStyle = waterAt(camY + (y - surf) / PPM); ctx.fillRect(0, y, W, 2); }
      // sky
      if (surf > 0) {
        for (let y = 0; y < Math.min(H, surf); y += 2) { ctx.fillStyle = mix("#8fd0f2", "#dff3fb", Math.min(1, Math.floor((y / surf) * 12) / 12)); ctx.fillRect(0, y, W, 2); }
        const sunX = ox + colW * 0.78, sunY = surf - 46;
        for (let r = 12; r > 0; r -= 3) { ctx.fillStyle = r > 7 ? "rgba(255,244,190,.35)" : "#ffe985"; for (let yy = -r; yy <= r; yy++) { const w = Math.floor(Math.sqrt(r * r - yy * yy)); ctx.fillRect(sunX - w, sunY + yy, w * 2, 1); } }
        for (let i = 0; i < 5; i++) {
          const cw = 22 + rnd(i, 1) * 22, cx = ((rnd(i, 2) * (W + 60) + t * (1.5 + rnd(i, 3) * 2.5)) % (W + 60)) - 30, cy = surf - 30 - rnd(i, 4) * (surf * 0.7);
          ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fillRect(cx + 3, cy, cw - 6, 3); ctx.fillRect(cx, cy + 3, cw, 3); ctx.fillRect(cx + 7, cy - 3, cw / 2, 3);
          ctx.fillStyle = "rgba(180,215,240,.9)"; ctx.fillRect(cx + 2, cy + 6, cw - 4, 1);
        }
        // boat
        const bx = ox + colW * 0.3, bob = Math.round(Math.sin(t * 1.4) * 1);
        ctx.fillStyle = "#1a2b45"; ctx.fillRect(bx, surf - 3 + bob, 18, 3); ctx.fillRect(bx + 2, surf + bob, 14, 1);
        ctx.fillRect(bx + 4, surf - 7 + bob, 6, 4); ctx.fillStyle = "#c9d6e8"; ctx.fillRect(bx + 5, surf - 6 + bob, 2, 1);
        ctx.fillStyle = "#1a2b45"; ctx.fillRect(bx + 12, surf - 13 + bob, 1, 10); ctx.fillStyle = "#ff5d73"; ctx.fillRect(bx + 13, surf - 13 + bob, 5, 3);
        ctx.fillStyle = "rgba(255,255,255,.75)"; for (let x = 0; x < W; x += 6) ctx.fillRect(x + (Math.floor(t * 4) % 6), surf, 3, 1);   // foam line
      }

      // light shafts (fade with depth)
      const shaft = Math.max(0, 1 - d / 500);
      if (shaft > 0) for (let i = 0; i < 4; i++) { const x0 = (i * 41 + Math.sin(t * .5 + i) * 6) % W; ctx.fillStyle = `rgba(190,235,255,${0.08 * shaft})`; for (let y = Math.max(0, surf); y < H; y += 2) ctx.fillRect(x0 + (y - surf) * .22, y, 10 - Math.min(8, (y - surf) / 40), 2); }

      // fish silhouettes: lanes every 36 m
      const m0 = camY - 50, m1 = camY + H / PPM + 20;
      for (let lane = Math.floor(Math.max(0, m0) / 36); lane * 36 < m1; lane++) {
        const n = 1 + Math.floor(rnd(lane, 5) * 3), dir = rnd(lane, 6) > .5 ? 1 : -1, speed = 4 + rnd(lane, 7) * 9, size = rnd(lane, 8) > .8 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const x = (((rnd(lane * 7 + k, 9) * (W + 40) + t * speed * dir) % (W + 40)) + (W + 40)) % (W + 40) - 20, y = sy(lane * 36 + rnd(lane * 7 + k, 10) * 30);
          if (y < surf + 6 || y > H) continue;
          ctx.fillStyle = mix(waterAt(lane * 36).startsWith("rgb") ? "#0a1c38" : "#0a1c38", "#000000", Math.min(.8, d / 4000 + .2));
          const u = size, fx = Math.round(x), fy = Math.round(y), flip = dir > 0 ? 1 : -1, px = (dx: number, dy: number, w: number, h: number) => ctx.fillRect(flip > 0 ? fx + dx * u : fx - (dx + w) * u + 6 * u, fy + dy * u, w * u, h * u);
          px(1, 0, 5, 3); px(2, -1, 3, 1); px(2, 3, 3, 1); px(0, -1, 1, 5); px(-1, -2, 1, 7);
        }
      }
      // big creatures: one lane every 140 m, kind and direction chosen per lane, drifting slowly across the screen
      for (let lane = Math.floor(Math.max(0, m0) / 140); lane * 140 < m1; lane++) {
        if (lane < 2 || rnd(lane, 21) > 0.7) continue;
        const kind = Math.floor(rnd(lane, 22) * 3), dir = rnd(lane, 23) > 0.5 ? 1 : -1, sp = kind === 2 ? 2.5 : 5 + rnd(lane, 24) * 4, span = W + 140;
        const x = ((rnd(lane, 25) * span + t * sp * dir) % span + span) % span - 70, y = sy(lane * 140 + 40 + rnd(lane, 26) * 60) + (kind === 2 ? Math.sin(t * 0.9 + lane) * 5 : 0);
        if (y < surf + 12 || y > H + 10) continue;
        const dk = Math.min(0.85, d / 3500 + 0.15);
        creature(ctx, kind, x, y, t, dir, mix("#12305a", "#02060f", dk), kind === 2 ? `rgba(${kind === 2 ? "255,140,220" : "125,255,216"},${0.8 - dk * 0.3})` : mix("#3a6a9a", "#0a1a30", dk));
      }

      // glowing specks deeper down
      const glow = Math.min(1, Math.max(0, (d - 900) / 1800));
      if (glow > 0) for (let i = 0; i < 22; i++) { const gx = rnd(i, 11) * W, gy = (rnd(i, 12) * H + t * -3 + H) % H, a = (Math.sin(t * 2 + i) + 1) / 2 * glow; ctx.fillStyle = `rgba(125,255,216,${a})`; ctx.fillRect(Math.floor(gx), Math.floor(gy), 1, 1); ctx.fillStyle = `rgba(125,255,216,${a * .25})`; ctx.fillRect(Math.floor(gx) - 1, Math.floor(gy) - 1, 3, 3); }

      // kelp along both edges
      for (let lane = Math.floor(Math.max(0, m0) / 48); lane * 48 < Math.min(m1, 900); lane++) {
        for (const side of [0, 1]) {
          const base = sy(lane * 48 + 30 + rnd(lane + side * 50, 13) * 10), h = 26 + rnd(lane + side * 50, 14) * 14, x0 = side ? W - 18 - rnd(lane, 15) * 12 : 4 + rnd(lane, 16) * 12;
          if (base < surf + 10 || base - h > H) continue;
          ctx.fillStyle = mix(waterAt(lane * 48), "#04101f", .55);
          for (let seg = 0; seg < h; seg += 2) { const sway = Math.round(Math.sin(t * 1.2 + seg * .12 + lane) * 2), yy = base - seg; ctx.fillRect(x0 + sway, yy, 2, 2); if (seg % 6 === 0) ctx.fillRect(x0 + sway + (seg % 12 === 0 ? 2 : -3), yy - 1, 3, 2); }
        }
      }

      // bubbles
      if (s.bubbles.length < 26 && !calm && Math.random() < .25) s.bubbles.push({ x: Math.random() * W, y: H + 2, r: Math.random() < .3 ? 2 : 1, v: 6 + Math.random() * 10 });
      for (const b of s.bubbles) { b.y -= b.v * (s.moving ? 3.2 : 1) / 60; b.x += Math.sin(b.y * .15) * .15; ctx.fillStyle = "rgba(215,240,255,.65)"; ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.r, b.r); if (b.r > 1) { ctx.fillStyle = "rgba(10,40,80,.4)"; ctx.fillRect(Math.floor(b.x) + 1, Math.floor(b.y) + 1, 1, 1); } }
      s.bubbles = s.bubbles.filter((b) => b.y > -4);

      // ruler + tier markers + flavour text (text itself is DOM so it stays crisp)
      const labels: { y: number; text: string; kind: string; color: string }[] = [];
      if (s.ruler) {
        const rx = ox + colW - 7; ctx.fillStyle = "rgba(190,225,250,.5)"; ctx.fillRect(rx, Math.max(0, surf), 1, H);
        for (let m = Math.max(0, Math.floor(m0 / 10) * 10); m < m1; m += 10) {
          const y = Math.round(sy(m)); if (y < 0 || y > H) continue;
          const big = m % 100 === 0, mid = m % 50 === 0;
          ctx.fillStyle = "rgba(190,225,250,.5)"; ctx.fillRect(rx - (big ? 5 : mid ? 3 : 2), y, big ? 5 : mid ? 3 : 2, 1);
          if (big && m > 0) labels.push({ y, text: `${m}m`, kind: "ruler", color: "rgba(200,230,250,.6)" });
        }
      }
      for (const [m, text] of LINES) { const y = Math.round(sy(m)); if (y < 4 || y > H - 4) continue; labels.push({ y, text: `— ${text}`, kind: "flavor", color: "rgba(200,230,250,.5)" }); }
      for (const mk of s.markers) {
        const y = Math.round(sy(mk.depth)); if (y < surf + 4 || y > H + 4) continue;
        ctx.fillStyle = "rgba(220,240,255,.35)"; for (let x = ox + 4; x < ox + colW - 10; x += 6) ctx.fillRect(x, y, 3, 1);
        labels.push({ y, text: mk.label, kind: "marker", color: mk.color });
      }

      // diver
      if (s.sprite) {
        const ay = Math.round(surfY0 + (d - camY) * PPM);
        const bob = Math.round(Math.sin(t * 2.2) * 1.2), shake = s.mood === "nope" ? Math.round(Math.sin(now / 35) * 2) : 0;
        const x = Math.round(W * 0.5 - 15 + shake), y = ay - 15 + bob;
        if (s.mood === "great") { ctx.fillStyle = "#ffe985"; for (let i = 0; i < 6; i++) { const a = now / 300 + i * 1.05, r = 20 + (i % 2) * 5; ctx.fillRect(Math.round(x + 15 + Math.cos(a) * r), Math.round(y + 15 + Math.sin(a) * r), 2, 2); } }
        ctx.globalAlpha = s.mood === "miss" ? .55 : 1; ctx.drawImage(s.sprite, x, y); ctx.globalAlpha = 1;
        if (s.moving) { ctx.fillStyle = "rgba(215,240,255,.7)"; for (let i = 0; i < 4; i++) ctx.fillRect(x + 6 + ((now / 60 + i * 9) % 18), y - 4 - ((now / 40 + i * 13) % 14), 2, 2); }
      }
      // reaction bursts: bubbles for a good answer, a golden shockwave for a deep cut, ink for a miss
      const sx0 = Math.round(W * 0.5), sy0 = Math.round(surfY0 + (d - camY) * PPM);
      const sa = s as unknown as { lastMood?: string; parts?: Pt[]; ring?: number };
      sa.parts ??= []; if (s.mood !== sa.lastMood) {
        if (!calm && s.sprite) {
          if (s.mood === "good") for (let i = 0; i < 14; i++) sa.parts.push({ x: sx0 + (Math.random() - 0.5) * 20, y: sy0, vx: (Math.random() - 0.5) * 20, vy: -22 - Math.random() * 30, l: 0, max: 1.1, c: "rgba(215,240,255,.9)", sz: 2, g: -4 });
          else if (s.mood === "great") { sa.ring = 0; for (let i = 0; i < 34; i++) { const a = Math.random() * 6.28, v = 30 + Math.random() * 50; sa.parts.push({ x: sx0, y: sy0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0, max: 1.2, c: ["#ffe985", "#ffd23d", "#fff", "#ff9a3c"][i % 4], sz: 2, g: 40 }); } }
          else if (s.mood === "miss") for (let i = 0; i < 18; i++) sa.parts.push({ x: sx0 + (Math.random() - 0.5) * 10, y: sy0 + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 14, vy: -2 - Math.random() * 6, l: 0, max: 1.6, c: "rgba(8,6,20,.7)", sz: 4, g: 0 });
        }
        sa.lastMood = s.mood;
      }
      if (sa.ring != null) { sa.ring += 1 / 60; const rr = sa.ring * 70; ctx.globalAlpha = Math.max(0, 1 - sa.ring * 1.3); ctx.fillStyle = "#ffe985"; for (let a = 0; a < 40; a++) { const th = (a / 40) * 6.28; ctx.fillRect(Math.round(sx0 + Math.cos(th) * rr), Math.round(sy0 + Math.sin(th) * rr * 0.7), 2, 2); } ctx.globalAlpha = 1; if (sa.ring > 0.8) sa.ring = undefined; }
      for (const q of sa.parts) { q.l += 1 / 60; q.x += q.vx / 60; q.y += q.vy / 60; q.vy += q.g / 60; ctx.globalAlpha = Math.max(0, 1 - q.l / q.max); ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.sz, q.sz); }
      ctx.globalAlpha = 1; sa.parts = sa.parts.filter((q) => q.l < q.max);
      // speed lines while diving
      if (s.moving && !calm) { ctx.globalAlpha = 0.35; ctx.fillStyle = "#dff3ff"; for (let i = 0; i < 12; i++) ctx.fillRect(Math.round(rnd(i, 31) * W), Math.round(((rnd(i, 32) * H + now * 0.5 * (1 + (i % 3))) % H)), 1, 8 + (i % 4) * 4); ctx.globalAlpha = 1; }
      const host = labelsRef.current;
      if (host) {
        while (host.children.length < labels.length) { const e = document.createElement("div"); e.className = "px-lab"; host.appendChild(e); }
        for (let i = 0; i < host.children.length; i++) {
          const e = host.children[i] as HTMLElement, l = labels[i];
          if (!l) { e.style.display = "none"; continue; }
          e.style.display = ""; if (e.textContent !== l.text) e.textContent = l.text;
          e.className = `px-lab ${l.kind}`; e.style.color = l.color; e.style.transform = `translateY(${Math.round(l.y * dpr)}px)`;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <><canvas ref={ref} className="px-canvas" aria-hidden /><div ref={labelsRef} className="px-labels" aria-hidden /></>;
}

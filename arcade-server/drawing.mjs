import { GameError } from "./util.mjs";

/**
 * Shared drawing protocol used by Quick Draw AND Telephone (one canvas engine, one validator).
 * A drawing is an append-only log of compact segments:
 *   { k: strokeId, t: 0 pen | 1 eraser | 2 clear | 3 paint-bucket fill, c: colorIndex 0-7, w: sizeIndex 0-3, p: [x,y,x,y,...] }
 * A fill (t 3) has exactly one point: the pixel that was clicked. Every client replays it with the same flood fill.
 * Coordinates are integers: x in 0..1000, y in 0..750 (4:3 canvas).
 */
export const CANVAS = { w: 1000, h: 750 };
export const LIMITS = { segsPerAction: 12, ptsPerSeg: 64, maxSegs: 900, maxPoints: 9000, maxFills: 60 };

export function validateSegs(segs, log) {
  if (!Array.isArray(segs) || !segs.length) throw new GameError("Nothing to draw.");
  if (segs.length > LIMITS.segsPerAction) throw new GameError("Too many strokes at once.");
  const clean = [];
  let pts = log.points ?? 0, fills = log.fills ?? 0;
  for (const s of segs) {
    if (!s || typeof s !== "object") throw new GameError("Bad stroke.");
    const t = s.t | 0;
    if (t < 0 || t > 3) throw new GameError("Bad stroke tool.");
    if (t === 2) { clean.push({ k: s.k | 0, t: 2, c: 0, w: 0, p: [] }); continue; }
    if (t === 3) {
      if (!Array.isArray(s.p) || s.p.length !== 2) throw new GameError("Bad fill point.");
      fills++;
      clean.push({ k: s.k | 0, t: 3, c: Math.min(7, Math.max(0, s.c | 0)), w: 0, p: [Math.round(Math.min(CANVAS.w, Math.max(0, Number(s.p[0]) || 0))), Math.round(Math.min(CANVAS.h, Math.max(0, Number(s.p[1]) || 0)))] });
      continue;
    }
    if (!Array.isArray(s.p) || s.p.length < 2 || s.p.length % 2 || s.p.length > LIMITS.ptsPerSeg * 2) throw new GameError("Bad stroke points.");
    const p = s.p.map((v, i) => Math.round(Math.min(i % 2 ? CANVAS.h : CANVAS.w, Math.max(0, Number(v) || 0))));
    pts += p.length / 2;
    clean.push({ k: s.k | 0, t, c: Math.min(7, Math.max(0, s.c | 0)), w: Math.min(3, Math.max(0, s.w | 0)), p });
  }
  if (fills > LIMITS.maxFills) throw new GameError("That is a lot of fills - hit clear to start over.");
  if (log.segs.length + clean.length > LIMITS.maxSegs || pts > LIMITS.maxPoints) throw new GameError("That drawing is full - hit clear to start over.");
  return { clean, points: pts };
}

export function newLog() { return { segs: [], points: 0, fills: 0 }; }

export function appendSegs(log, segs) {
  const { clean } = validateSegs(segs, log);
  for (const s of clean) {
    log.segs.push(s);
    if (s.t === 2) { log.points = 0; log.fills = 0; } else if (s.t === 3) log.fills = (log.fills ?? 0) + 1; else log.points += s.p.length / 2;
  }
  return clean.length;
}

/** A drawing counts as "real" once it has a few visible marks (used for participation points). */
export function hasInk(log) {
  let lastClear = -1;
  log.segs.forEach((s, i) => { if (s.t === 2) lastClear = i; });
  return log.segs.slice(lastClear + 1).filter((s) => s.t === 0 || s.t === 3).length >= 2;
}

/** Collapse a log to what is visible after the last clear (for reveals / replay). */
export function compact(log) {
  let lastClear = -1;
  log.segs.forEach((s, i) => { if (s.t === 2) lastClear = i; });
  return log.segs.slice(lastClear + 1);
}

/** Predefined doodles used by bots (simple shapes in canvas coordinates). */
export function botDoodle(seed = 0) {
  const cx = 300 + (seed * 97) % 400, cy = 250 + (seed * 53) % 250, r = 80 + (seed * 31) % 120;
  const circle = [];
  for (let i = 0; i <= 24; i++) circle.push(Math.round(cx + Math.cos((i / 24) * Math.PI * 2) * r), Math.round(cy + Math.sin((i / 24) * Math.PI * 2) * r));
  return [
    { k: seed * 10 + 1, t: 0, c: seed % 8, w: 1, p: circle },
    { k: seed * 10 + 2, t: 0, c: (seed + 3) % 8, w: 2, p: [cx - r, cy + r, cx, cy - r - 60, cx + r, cy + r] },
    { k: seed * 10 + 3, t: 0, c: (seed + 5) % 8, w: 0, p: [cx - 30, cy - 20, cx - 30, cy - 10, cx + 30, cy - 20, cx + 30, cy - 10] },
  ];
}

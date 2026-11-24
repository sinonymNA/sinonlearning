// Bolt Sort engine: sort coloured nuts so every bolt holds one colour. Move the top run of same-coloured nuts onto an empty bolt or a bolt whose top nut matches.
// Pure ESM, JSON state, seeded RNG (a level number always makes the same puzzle). No Date.now/Math.random.
import { makeRng } from "../gridiron/rng.mjs";

export const MAX_COLORS = 12;
export const MAX_POWERUPS = 9;
export const MAX_EXTRA = 2;            // extra bolts you may add on one level
export const LEVEL_COUNT_HINT = 200;   // levels are endless; this is only how far the level picker lists

/** The shape of a level: how many colours, how tall the bolts are, how many empty bolts, how many nuts start hidden ("?"). */
export function specFor(level) {
  const L = Math.max(1, Math.floor(level) || 1);
  return {
    level: L, colors: Math.min(MAX_COLORS, 3 + Math.floor((L - 1) / 3)), cap: Math.min(9, 4 + Math.floor((L - 1) / 10)),
    empties: 2, mystery: L < 8 ? 0 : Math.min(0.6, 0.1 + (L - 8) * 0.02),
  };
}

// ---------------------------------------------------------------- solver (also gives hints and the par)
const ckey = (bolts) => bolts.map((b) => b.join(",")).join("|");
function legal(bolts, cap) {
  const out = [];
  for (let a = 0; a < bolts.length; a++) {
    const A = bolts[a]; if (!A.length) continue; const c = A[A.length - 1], uniform = A.every((x) => x === c);
    if (uniform && A.length === cap) continue;                       // already finished
    for (let b = 0; b < bolts.length; b++) {
      if (a === b) continue; const B = bolts[b]; if (B.length >= cap) continue;
      if (!B.length) { if (!uniform) out.push([a, b]); }            // moving a pure bolt to an empty one changes nothing
      else if (B[B.length - 1] === c) out.push([a, b]);
    }
  }
  return out;
}
function apply(bolts, a, b, cap) {
  const A = bolts[a], B = bolts[b], c = A[A.length - 1]; let n = 0; while (n < A.length && A[A.length - 1 - n] === c) n++;
  n = Math.min(n, cap - B.length); const next = bolts.map((x) => x.slice()); const moved = next[a].splice(next[a].length - n, n); next[b].push(...moved); return next;
}
const solvedBolts = (bolts, cap) => bolts.every((b) => !b.length || (b.length === cap && b.every((x) => x === b[0])));
/** How far from solved: colour changes inside bolts plus nuts sitting on top of a different colour. Lower is better. */
function cost(bolts, cap) {
  let h = 0; for (const b of bolts) { if (!b.length) continue; let changes = 0; for (let i = 1; i < b.length; i++) if (b[i] !== b[i - 1]) changes++; h += changes * 2 + (changes ? 1 : (b.length < cap ? 1 : 0)); }
  return h;
}
/** Weighted best-first search. Returns a list of [from, to] moves, or null if none was found within the node budget. */
export function solve(bolts, cap, budget = 60000) {
  if (solvedBolts(bolts, cap)) return [];
  const start = bolts.map((b) => b.slice()), seen = new Map([[ckey(start), 0]]), heap = [[cost(start, cap) * 2, 0, start, null]];
  const push = (e) => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  let nodes = 0;
  while (heap.length && nodes++ < budget) {
    const [, g, state, trail] = pop();
    for (const [a, b] of legal(state, cap)) {
      const next = apply(state, a, b, cap), k = ckey(next), ng = g + 1; if (seen.has(k) && seen.get(k) <= ng) continue; seen.set(k, ng);
      const t = { a, b, prev: trail }; if (solvedBolts(next, cap)) { const path = []; for (let x = t; x; x = x.prev) path.push([x.a, x.b]); return path.reverse(); }
      push([ng + cost(next, cap) * 2, ng, next, t]);
    }
  }
  return null;
}

// ---------------------------------------------------------------- level generation
/** Undo-moves from a solved board: guaranteed solvable (the reverse of the scramble is a solution), even with a single empty bolt. */
function scramble(sp, rng, steps) {
  const bolts = [...Array.from({ length: sp.colors }, (_, c) => Array(sp.cap).fill(c)), ...Array.from({ length: sp.empties }, () => [])]; let done = 0;
  for (let tries = 0; done < steps && tries < steps * 40; tries++) {
    const b = rng.int(bolts.length), B = bolts[b]; if (!B.length) continue; const c = B[B.length - 1]; let r = 0; while (r < B.length && B[B.length - 1 - r] === c) r++;
    const n = 1 + rng.int(r); if (n === r && r !== B.length) continue;                  // taking a whole run is only a legal reverse when the bolt empties
    const a = rng.int(bolts.length); if (a === b) continue; const A = bolts[a]; if (A.length + n > sp.cap || (A.length && A[A.length - 1] === c) || (!A.length && rng() < 0.85)) continue;   // mostly bury nuts under other colours, not shuffle into the gap
    A.push(...B.splice(B.length - n, n)); done++;
  }
  return { bolts, steps: done };
}
/** Make the puzzle for a level: nuts are {id, c (colour), q (still a hidden "?")}. Always solvable; par is the best solution length found. */
export function generate(level, seedBump = 0) {
  const sp = specFor(level), rng = makeRng((sp.level * 7919 + 101 + seedBump * 104729) >>> 0);
  for (let attempt = 0; attempt < 60; attempt++) {
    let bolts, known = null;
    if (attempt < 50) {          // a random deal (checked by the solver) feels fresher on the easier levels
      const pool = []; for (let c = 0; c < sp.colors; c++) for (let i = 0; i < sp.cap; i++) pool.push(c);
      for (let i = pool.length - 1; i > 0; i--) { const j = rng.int(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      bolts = [...Array.from({ length: sp.colors }, (_, b) => pool.slice(b * sp.cap, b * sp.cap + sp.cap)), ...Array.from({ length: sp.empties }, () => [])];
    } else { const sc = scramble(sp, rng, sp.colors * sp.cap * 8); bolts = sc.bolts; known = sc.steps; }
    if (bolts.slice(0, sp.colors).every((b) => b.every((x) => x === b[0]))) continue;     // already sorted: reshuffle
    const path = solve(bolts, sp.cap, 40000), par = path ? (known ? Math.min(path.length, known) : path.length) : known; if (!par) continue;
    let id = 0; const nuts = bolts.map((b) => b.map((c, i) => ({ id: id++, c, q: sp.mystery > 0 && i < b.length - 1 && rng() < sp.mystery })));
    return { spec: sp, bolts: nuts, par: Math.max(1, par) };
  }
  throw new Error("could not make a Bolt Sort level " + level);
}

// ---------------------------------------------------------------- game state
export function newGame(level) {
  const g = generate(level); return { v: 1, level: g.spec.level, cap: g.spec.cap, colors: g.spec.colors, bolts: g.bolts, par: g.par, moves: 0, extra: 0, hints: 0, history: [], done: false, won: false, nextId: g.bolts.flat().length };
}
const plain = (st) => st.bolts.map((b) => b.map((n) => n.c));
export const topRun = (st, a) => { const A = st.bolts[a]; if (!A.length) return 0; const c = A[A.length - 1].c; let n = 0; while (n < A.length && A[A.length - 1 - n].c === c) n++; return n; };
/** Can the top run of bolt a go onto bolt b? */
export function canMove(st, a, b) {
  if (st.done || a === b) return false; const A = st.bolts[a], B = st.bolts[b]; if (!A || !B || !A.length || B.length >= st.cap) return false;
  return !B.length || B[B.length - 1].c === A[A.length - 1].c;
}
export function isSolved(st) { return st.bolts.every((b) => !b.length || (b.length === st.cap && b.every((n) => n.c === b[0].c))); }
/** Is this bolt finished (full, one colour)? */
export const boltDone = (st, a) => { const b = st.bolts[a]; return b.length === st.cap && b.every((n) => n.c === b[0].c); };
/** Move the top run from a to b. Returns {ok, ids (moved nut ids, top first), n, revealed (id of a mystery nut that came to light)}. */
export function move(st, a, b) {
  if (!canMove(st, a, b)) return { ok: false };
  const A = st.bolts[a], B = st.bolts[b], n = Math.min(topRun(st, a), st.cap - B.length), moved = A.splice(A.length - n, n); B.push(...moved);
  let revealed = null; const top = A[A.length - 1]; if (top && top.q) { top.q = false; revealed = top.id; }
  st.moves++; st.history.push({ a, b, n, revealed }); if (isSolved(st)) { st.done = true; st.won = true; }
  return { ok: true, n, ids: moved.map((x) => x.id).reverse(), revealed, from: a, to: b, won: st.won };
}
/** Take back the last move (free). */
export function undo(st) {
  if (!st.history.length || st.done) return null; const { a, b, n, revealed } = st.history.pop(), B = st.bolts[b], moved = B.splice(B.length - n, n); st.bolts[a].push(...moved);
  if (revealed !== null) { const t = st.bolts[a].find((x) => x.id === revealed); if (t) t.q = true; }
  st.moves = Math.max(0, st.moves - 1); return { from: b, to: a, n, ids: moved.map((x) => x.id).reverse() };
}
/** Add one empty bolt (limited per level). The caller spends the power-up. */
export function addBolt(st) { if (st.done || st.extra >= MAX_EXTRA) return false; st.bolts.push([]); st.extra++; return true; }
/** A hint: the next move of a solution from where the board is now (or null if the solver is stuck, e.g. after a dead end it cannot reach). */
export function hint(st) { const p = solve(plain(st), st.cap, 60000); return p && p.length ? { from: p[0][0], to: p[0][1], left: p.length } : null; }
/** Is the board still solvable from here? (Used to tell the player they are stuck.) */
export const stuck = (st) => !st.done && !isSolved(st) && !solve(plain(st), st.cap, 30000);

// ---------------------------------------------------------------- score and profile
/** 3 stars at or near par, 2 a bit over, 1 for finishing. */
export const starsFor = (st) => (st.moves <= Math.ceil(st.par * 1.25) ? 3 : st.moves <= Math.ceil(st.par * 1.6) ? 2 : 1);
export const newProfile = () => ({ v: 1, level: 1, solved: 0, hints: 3, bolts: 2, stars: {}, best: {} });
export const totalStars = (p) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
export function normalizeProfile(p = {}) { const d = newProfile(), o = { ...d, ...p, stars: { ...(p.stars || {}) }, best: { ...(p.best || {}) } }; for (const k of ["hints", "bolts"]) o[k] = Math.min(MAX_POWERUPS, Math.max(0, +o[k] || 0)); o.level = Math.max(1, Math.floor(o.level) || 1); return o; }
/** Apply a won level. Stars only go up; the first clear opens the next level and earns a hint every 2nd clear and an extra bolt every 4th. */
export function completeLevel(p, st) {
  const stars = starsFor(st), first = !(p.stars[st.level] > 0); p.stars[st.level] = Math.max(p.stars[st.level] || 0, stars); p.best[st.level] = Math.min(p.best[st.level] || 1e9, st.moves);
  p.level = Math.max(p.level, st.level + 1); const reward = { hint: 0, bolt: 0 };
  if (first) { p.solved++; if (p.solved % 2 === 0) { reward.hint = Math.min(1, MAX_POWERUPS - p.hints); p.hints += reward.hint; } if (p.solved % 4 === 0) { reward.bolt = Math.min(1, MAX_POWERUPS - p.bolts); p.bolts += reward.bolt; } }
  return { stars, first, reward };
}

/** Is there any legal move at all? (A cheap check the screen uses to say "no moves left".) */
export function hasMoves(st) { for (let a = 0; a < st.bolts.length; a++) for (let b = 0; b < st.bolts.length; b++) if (canMove(st, a, b)) return true; return false; }

// Shelf Stocker engine. You are the stock clerk: sort the delivery onto the shelves. Move the top run of matching items from one bay to another.
// Five departments, one new rule each (taught one at a time):
//   Clothing Corner (free sorting) / Book Nook (every shelf has a subject sign) / Boutique (racks for shirts, shelves for books)
//   Toy Aisle (size order: a bigger toy can never sit on a smaller one) / Pantry (glass jars are fragile: each can only be moved a few times).
// Carts are temporary: they take anything and must be empty when you finish. Wrapped (mystery) items never move with a run, so they cannot give their colour away.
// Pure ESM, JSON state, seeded RNG (a level number always makes the same puzzle). No Date.now/Math.random.
import { makeRng } from "../gridiron/rng.mjs";
import { PICKS } from "./levels.mjs";

export const MAX_POWERUPS = 9;
export const MAX_EXTRA = 2;            // extra carts you may add on one level
export const MAX_BAYS = 14;
export const DEPTS = [
  { id: "clothing", name: "Clothing Corner", short: "Clothes", mode: "free", rule: "Sort the folded shirts so every stack is one colour." },
  { id: "books", name: "Book Nook", short: "Books", mode: "free", rule: "Every shelf has a sign. Put each book on the shelf for its subject. The cart can hold anything for a moment." },
  { id: "boutique", name: "Boutique", short: "Boutique", mode: "free", rule: "Shirts only go on racks and books only on shelves. Sort both. The bin is just for moving things around." },
  { id: "toys", name: "Toy Aisle", short: "Toys", mode: "size", rule: "Stack each toy set from the biggest at the bottom to the smallest on top. A bigger toy can never sit on a smaller one." },
  { id: "pantry", name: "Pantry", short: "Pantry", mode: "fragile", rule: "Glass jars are fragile: the dots on a lid show how many more times it can be moved before it cracks. Tins can be moved freely. Plan ahead!" },
];
export const DEPT_COUNT = DEPTS.length;
export const SUBJECTS = ["Science", "History", "Fiction", "Math", "Art", "Music", "Nature", "Space"];
export const deptOf = (level) => Math.floor((Math.max(1, Math.floor(level) || 1) - 1) / 10) % DEPT_COUNT;
export const posOf = (level) => ((Math.max(1, Math.floor(level) || 1) - 1) % 10) + 1;       // 1..10 inside a department
export const cycleOf = (level) => Math.floor((Math.max(1, Math.floor(level) || 1) - 1) / (10 * DEPT_COUNT));
export const LEVELS_PER_DEPT = 10;

/** What a level looks like. keys: the kinds of item in play; bays: shelf rules in order; mode: free | size | fragile. Every 5th level is a breather, every 10th a boss ("Stock Take"). */
export function specFor(level) {
  const L = Math.max(1, Math.floor(level) || 1), d = deptOf(L), i = posOf(L), cycle = cycleOf(L), breather = i === 5, boss = i === 10, mode = DEPTS[d].mode;
  const hidden = breather ? 0 : Math.min(0.55, (i >= 7 ? 0.12 + (i - 7) * 0.05 : 0) + cycle * 0.1);
  const base = { level: L, dept: d, pos: i, cycle, breather, boss, mode, hidden };
  const adj = (n, lo, hi) => Math.max(lo, Math.min(hi, n + (breather ? -1 : 0) + (boss ? 1 : 0)));
  if (d === 0) {                                   // Clothing Corner: free sorting
    const cap = Math.min(8, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 2)), n = adj(Math.min(10, [3, 3, 3, 4, 4, 4, 5, 5, 6, 6][i - 1] + cycle), 3, 10);
    return { ...base, cap, keys: Array.from({ length: n }, (_, k) => ({ kind: "shirt", v: k })), bays: [...Array.from({ length: n }, () => ({ a: "any", s: false })), { a: "any", s: false }, { a: "any", s: false }] };
  }
  if (d === 1) {                                   // Book Nook: every shelf is labelled with its subject; a cart helps
    const cap = Math.min(8, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 2)), n = adj(Math.min(7, [3, 3, 4, 4, 4, 5, 5, 5, 6, 6][i - 1] + Math.floor(cycle / 2)), 3, 7), carts = (i >= 3 || cycle >= 1 ? 2 : 1) + (cycle >= 2 ? 1 : 0);
    return { ...base, cap, keys: Array.from({ length: n }, (_, k) => ({ kind: "book", v: k })), bays: [...Array.from({ length: n }, (_, k) => ({ a: k, s: false })), ...Array.from({ length: carts }, () => ({ a: "any", s: true }))] };
  }
  if (d === 2) {                                   // Boutique: racks for shirts, shelves for books
    const cap = Math.min(8, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 2)), sc = Math.min(5, [2, 2, 3, 3, 3, 3, 4, 4, 4, 4][i - 1] + Math.floor(cycle / 2) + (boss ? 1 : 0)), bc = Math.min(5, Math.max(2, [2, 3, 2, 3, 3, 4, 3, 3, 4, 4][i - 1] + Math.floor(cycle / 2) + (boss ? 1 : 0) - (breather ? 1 : 0)));
    return { ...base, cap, keys: [...Array.from({ length: sc }, (_, k) => ({ kind: "shirt", v: k })), ...Array.from({ length: bc }, (_, k) => ({ kind: "book", v: k }))], bays: [...Array.from({ length: sc + 1 }, () => ({ a: "shirt", s: false })), ...Array.from({ length: bc + 1 }, () => ({ a: "book", s: false })), { a: "any", s: true }] };
  }
  if (d === 3) {                                   // Toy Aisle: nesting toys, sizes 1..cap, each set sorted big to small
    const cap = Math.min(5, [3, 4, 3, 4, 4, 4, 5, 5, 5, 5][i - 1]), n = adj(Math.min(5, [2, 2, 3, 3, 3, 3, 4, 4, 4, 4][i - 1] + Math.min(1, cycle)), 2, 5);   // capped at 5x5: bigger nesting puzzles are too slow to prove solvable
    return { ...base, cap, keys: Array.from({ length: n }, (_, k) => ({ kind: "toy", v: k })), bays: [...Array.from({ length: n }, () => ({ a: "any", s: false })), { a: "any", s: false }, { a: "any", s: false }] };
  }
  // Pantry: jars (fragile) and tins (not), colour-sorted; every jar has a limited number of moves
  const cap = Math.min(6, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 3)), n = adj(Math.min(7, [3, 4, 4, 5, 5, 5, 6, 6, 6, 6][i - 1] + Math.min(1, cycle)), 3, 7), jars = Math.ceil(n / 2), dur = i <= 3 ? 3 : 3 - (cycle >= 1 ? 0 : 0);
  return { ...base, cap, dur, keys: [...Array.from({ length: jars }, (_, k) => ({ kind: "jar", v: k })), ...Array.from({ length: n - jars }, (_, k) => ({ kind: "tin", v: k }))], bays: [...Array.from({ length: n }, () => ({ a: "any", s: false })), { a: "any", s: false }, { a: "any", s: false }] };
}

// ---------------------------------------------------------------- rules (shared by the game and the solver)
/** May an item with key k stand on a bay with this accept rule? "any" | "shirt" | "book" | a number (that key only). */
export const accepts = (a, k, keys) => (a === "any" ? true : typeof a === "number" ? a === k : keys[k].kind === a);
const UNBREAKABLE = 7;
/** The matching items on top that would move together: they stop at the first wrapped item (so a wrapped item never gives its colour away), and in size mode they must nest (each one smaller than the one below). */
export function runLen(items, mode) {
  if (!items.length) return 0; const top = items[items.length - 1]; let n = 0;
  for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; if (it.q || it.k !== top.k) break; if (mode === "size" && n > 0 && !((items[i].x || 0) > (items[i + 1].x || 0))) break; n++; }
  return n;
}
const brittle = (it) => typeof it.x === "number" && it.x < UNBREAKABLE;
/** Why a move is refused, in words a player understands (null if it is fine). */
export function whyNot(st, a, b) {
  if (st.done || a === b) return "Pick a different shelf.";
  const A = st.bays[a], B = st.bays[b]; if (!A?.items.length) return "That shelf is empty.";
  const top = A.items[A.items.length - 1], k = top.k, rule = B.a, mode = st.mode || "free";
  if (!accepts(rule, k, st.keys)) return typeof rule === "number" ? `That shelf is for ${SUBJECTS[st.keys[rule].v % SUBJECTS.length]} books.` : rule === "shirt" ? "Only shirts go on a rack." : "Only books go on a shelf.";
  if (B.items.length >= st.cap) return "That shelf is full.";
  const n = Math.min(runLen(A.items, mode), st.cap - B.items.length), moved = A.items.slice(A.items.length - n), land = moved[0];
  if (B.items.length) {
    const bt = B.items[B.items.length - 1];
    if (bt.k !== k) return "Items must match the one on top.";
    if (mode === "size" && !((bt.x || 0) > (land.x || 0))) return "A bigger toy can't sit on a smaller one.";
  }
  if (mode === "fragile" && moved.some((it) => brittle(it) && it.x <= 0)) return "That jar would crack! It can't be moved again.";
  return null;
}
const goodEnd = (bays, cap, keys, mode) => bays.every((b) => {   // bays: [{a, s, ks:[keys], xs:[aux]}]
  if (b.s) return b.ks.length === 0;
  if (typeof b.a === "number") return b.ks.length === cap && b.ks.every((k) => k === b.a);
  if (!b.ks.length) return true;
  if (!(b.ks.length === cap && b.ks.every((k) => k === b.ks[0]) && accepts(b.a, b.ks[0], keys))) return false;
  return mode !== "size" || b.xs.every((x, i) => i === 0 || x < b.xs[i - 1]);   // toys: biggest at the bottom
});

// ---------------------------------------------------------------- solver (also gives hints and the par)
// Solver items are ints: key (0-31) + 32 while wrapped + 64 * aux (toy size, or jar moves left; 7 = unbreakable).
const HID = 32, K = (v) => v & 31, Q = (v) => (v & HID) !== 0, X = (v) => v >> 6;
const keyOf = (ks) => ks.map((b) => b.join(",")).join("|");
function runN(A, mode) {
  const top = A[A.length - 1]; let n = 0;
  for (let i = A.length - 1; i >= 0; i--) { const v = A[i]; if (Q(v) || K(v) !== K(top)) break; if (mode === "size" && n > 0 && !(X(A[i]) > X(A[i + 1]))) break; n++; }
  return n;
}
function legalMoves(ks, rules, cap, keys, mode) {
  const out = [];
  for (let a = 0; a < ks.length; a++) {
    const A = ks[a]; if (!A.length) continue; const top = A[A.length - 1], k = K(top), n0 = runN(A, mode), uniform = mode === "size" ? n0 === A.length : A.every((x) => K(x) === k);
    if (uniform && A.length === cap && !rules[a].s && accepts(rules[a].a, k, keys) && (typeof rules[a].a !== "number" || rules[a].a === k)) continue;   // already home and full
    for (let b = 0; b < ks.length; b++) {
      if (a === b) continue; const B = ks[b], space = cap - B.length; if (space <= 0 || !accepts(rules[b].a, k, keys)) continue;
      const n = Math.min(n0, space), moved = A.slice(A.length - n);
      if (mode === "fragile" && moved.some((v) => X(v) < UNBREAKABLE && X(v) === 0)) continue;
      if (!B.length) { if (!(uniform && !rules[a].s && rules[a].a === rules[b].a && mode !== "fragile")) out.push([a, b]); }   // moving a pure stack to an identical empty bay changes nothing
      else { const bt = B[B.length - 1]; if (K(bt) !== k) continue; if (mode === "size" && !(X(bt) > X(moved[0]))) continue; out.push([a, b]); }
    }
  }
  return out;
}
function applyMove(ks, a, b, cap, mode) {
  const A = ks[a], B = ks[b], n = Math.min(runN(A, mode), cap - B.length), next = ks.map((x) => x.slice()), moved = next[a].splice(next[a].length - n, n);
  if (mode === "fragile") for (let i = 0; i < moved.length; i++) if (X(moved[i]) < UNBREAKABLE) moved[i] -= 64;      // a jar loses one of its moves
  next[b].push(...moved); const top = next[a].length - 1; if (top >= 0 && Q(next[a][top])) next[a][top] &= ~HID;            // the item that comes to light is unwrapped
  return next;
}
function cost(ks, rules, cap, mode) {
  let h = 0;
  for (let i = 0; i < ks.length; i++) {
    const b = ks[i]; if (rules[i].s) { h += b.length * 2; continue; } if (!b.length) { if (typeof rules[i].a === "number") h += 2; continue; }
    let changes = 0; for (let j = 1; j < b.length; j++) { if (K(b[j]) !== K(b[j - 1])) changes++; else if (mode === "size" && X(b[j]) > X(b[j - 1])) changes++; } h += changes * 2 + (changes ? 1 : b.length < cap ? 1 : 0);
    if (typeof rules[i].a === "number") for (const v of b) if (K(v) !== rules[i].a) h += 2;
  }
  return h;
}
const view = (arr, rules) => arr.map((b, i) => ({ a: rules[i].a, s: rules[i].s, ks: b.map(K), xs: b.map(X) }));
/** Weighted best-first search (weight 2 is fast, weight 1 finds near-optimal solutions). ks: bays as lists of solver items, rules: [{a, s}] per bay. Returns [[from, to], ...] or null if none in the node budget. */
export function solve(ks, rules, cap, keys, budget = 60000, mode = "free", weight = 2) {
  if (goodEnd(view(ks, rules), cap, keys, mode)) return [];
  const start = ks.map((b) => b.slice()), seen = new Map([[keyOf(start), 0]]), heap = [[cost(start, rules, cap, mode) * weight, 0, start, null]];
  const push = (e) => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  let nodes = 0;
  while (heap.length && nodes++ < budget) {
    const [, g, state, trail] = pop();
    for (const [a, b] of legalMoves(state, rules, cap, keys, mode)) {
      const next = applyMove(state, a, b, cap, mode), k = keyOf(next), ng = g + 1; if (seen.has(k) && seen.get(k) <= ng) continue; seen.set(k, ng);
      const t = { a, b, prev: trail }; if (goodEnd(view(next, rules), cap, keys, mode)) { const path = []; for (let x = t; x; x = x.prev) path.push([x.a, x.b]); return path.reverse(); }
      push([ng + cost(next, rules, cap, mode) * weight, ng, next, t]);
    }
  }
  return null;
}
const coded = (it) => it.k + (it.q ? HID : 0) + ((it.x || 0) << 6);
export const plainState = (st) => ({ ks: st.bays.map((b) => b.items.map(coded)), rules: st.bays.map((b) => ({ a: b.a, s: b.s })), cap: st.cap, keys: st.keys, mode: st.mode || "free" });
/** Solve the board as it stands now (used by hints, tests and the browser checks). */
export function solveState(st, budget = 60000, weight = 2) { const p = plainState(st); return solve(p.ks, p.rules, p.cap, p.keys, budget, p.mode, weight); }

// ---------------------------------------------------------------- level generation
/** The par a level is aiming for, as a share of its item count: it climbs through a department, a breather is gentler, a boss is the hardest. */
export function targetPar(level) {
  const sp = specFor(level), items = sp.keys.length * sp.cap, ratio = 0.55 + (sp.pos - 1) * 0.04 - (sp.breather ? 0.14 : 0) + (sp.boss ? 0.1 : 0) + Math.min(0.2, sp.cycle * 0.05);
  return Math.max(4, Math.round(items * ratio));
}
/** One candidate puzzle for a level (the same seed bump always gives the same board). null if this seed cannot be dealt and solved. */
export function candidate(level, bump = 0, budget = 50000) {
  const sp = specFor(level), rng = makeRng((sp.level * 7919 + 211 + bump * 104729) >>> 0), nKeys = sp.keys.length, rules = sp.bays.map((b) => ({ a: b.a, s: b.s })), mode = sp.mode;
  const fillable = sp.bays.map((b, i) => (b.s ? -1 : i)).filter((i) => i >= 0), emptyCount = fillable.length - nKeys;
  for (let attempt = 0; attempt < 40; attempt++) {
    const pool = [];
    for (let k = 0; k < nKeys; k++) for (let i = 0; i < sp.cap; i++) pool.push({ k, x: mode === "size" ? i + 1 : mode === "fragile" ? (sp.keys[k].kind === "jar" ? sp.dur : UNBREAKABLE) : 0 });
    for (let i = pool.length - 1; i > 0; i--) { const j = rng.int(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    let emptied = new Set();
    if (sp.dept === 2) { const racks = fillable.filter((i) => sp.bays[i].a === "shirt"), shelves = fillable.filter((i) => sp.bays[i].a === "book"); emptied = new Set([racks[rng.int(racks.length)], shelves[rng.int(shelves.length)]]); }
    else { const order = [...fillable]; for (let i = order.length - 1; i > 0; i--) { const j = rng.int(i + 1); [order[i], order[j]] = [order[j], order[i]]; } emptied = new Set(order.slice(0, sp.dept === 1 ? 1 : emptyCount)); }
    const grid = sp.bays.map(() => []); let p = 0; for (const i of fillable) if (!emptied.has(i)) { grid[i] = pool.slice(p, p + sp.cap); p += sp.cap; }
    if (sp.dept === 1) { const cart = sp.bays.findIndex((b) => b.s); grid[cart] = pool.slice(p, p + sp.cap); p += sp.cap; }   // Book Nook: one shelf starts bare and the cart arrives loaded
    if (p !== pool.length) continue;
    const sorted = grid.every((b, i) => !b.length || (typeof rules[i].a === "number" ? b.every((it) => it.k === rules[i].a) : b.every((it) => it.k === b[0].k) && (mode !== "size" || b.every((it, j) => j === 0 || it.x < b[j - 1].x))));
    if (sorted) continue;
    const flagged = grid.map((bay) => bay.map((it, j) => ({ ...it, q: sp.hidden > 0 && j < bay.length - 1 && rng() < sp.hidden })));   // some items start wrapped (never the top one)
    const path = solve(flagged.map((bay) => bay.map(coded)), rules, sp.cap, sp.keys, budget, mode); if (!path) continue;
    let id = 0; const bays = sp.bays.map((b, i) => ({ a: b.a, s: b.s, items: flagged[i].map((it) => ({ id: id++, k: it.k, q: it.q, x: it.x })) }));
    return { spec: sp, bays, par: Math.max(1, path.length) };
  }
  return null;
}
/** The puzzle for a level: the board the level builder picked as best fitting the difficulty curve (levels.mjs), or the first dealt board. Proven solvable. */
export function generate(level) {
  const pick = PICKS[Math.max(1, Math.floor(level)) - 1], first = pick ? candidate(level, pick[0]) : null;
  if (first) return pick ? { ...first, par: pick[1] || first.par } : first;
  for (let bump = 0; bump < 12; bump++) { const c = candidate(level, bump); if (c) return c; }
  throw new Error("could not make a Shelf Stocker level " + level);
}

// ---------------------------------------------------------------- game state
export function newGame(level) {
  const g = generate(level), sp = g.spec; return { v: 2, level: sp.level, dept: sp.dept, mode: sp.mode, boss: sp.boss, breather: sp.breather, cap: sp.cap, keys: sp.keys, bays: g.bays, par: g.par, moves: 0, extra: 0, history: [], done: false, won: false, nextId: g.bays.flatMap((b) => b.items).length };
}
export const topRun = (st, a) => runLen(st.bays[a].items, st.mode || "free");
export const canMove = (st, a, b) => whyNot(st, a, b) === null;
const viewOf = (st) => st.bays.map((b) => ({ a: b.a, s: b.s, ks: b.items.map((n) => n.k), xs: b.items.map((n) => n.x || 0) }));
export const isSolved = (st) => goodEnd(viewOf(st), st.cap, st.keys, st.mode || "free");
/** Is this bay finished: full of the right thing (sorted, for toys) and not a cart? */
export const bayDone = (st, a) => { const v = viewOf(st)[a]; return !v.s && v.ks.length === st.cap && goodEnd([v], st.cap, st.keys, st.mode || "free") && (typeof v.a !== "number" || v.ks[0] === v.a); };
/** Move the top run from a to b. Returns {ok, ids (moved item ids, top first), n, revealed, unwrapped, finished (bays that just became done), cracked (jars that just used their last move)}. */
export function move(st, a, b) {
  if (!canMove(st, a, b)) return { ok: false };
  const mode = st.mode || "free", A = st.bays[a].items, B = st.bays[b].items, n = Math.min(runLen(A, mode), st.cap - B.length), moved = A.splice(A.length - n, n);
  const worn = []; if (mode === "fragile") for (const it of moved) if (brittle(it)) { it.x--; worn.push(it.id); }
  B.push(...moved);
  let revealed = null; const top = A[A.length - 1]; if (top && top.q) { top.q = false; revealed = top.id; }
  const unwrapped = []; if (bayDone(st, b)) for (const it of B) if (it.q) { it.q = false; unwrapped.push(it.id); }   // a finished shelf unwraps everything on it
  st.moves++; st.history.push({ a, b, n, revealed, unwrapped, worn }); if (isSolved(st)) { st.done = true; st.won = true; }
  return { ok: true, n, ids: moved.map((x) => x.id).reverse(), revealed, unwrapped, from: a, to: b, won: st.won, finished: bayDone(st, b) ? [b] : [], cracked: moved.filter((it) => brittle(it) && it.x === 0).map((it) => it.id) };
}
/** Take back the last move (free). Jars get their move back. */
export function undo(st) {
  if (!st.history.length || st.done) return null; const { a, b, n, revealed, unwrapped = [], worn = [] } = st.history.pop(), B = st.bays[b].items;
  for (const id of unwrapped) { const t = B.find((x) => x.id === id); if (t) t.q = true; }                          // wrap them again before moving back
  const moved = B.splice(B.length - n, n); for (const it of moved) if (worn.includes(it.id)) it.x++; st.bays[a].items.push(...moved);
  if (revealed !== null) { const t = st.bays[a].items.find((x) => x.id === revealed); if (t) t.q = true; }
  st.moves = Math.max(0, st.moves - 1); return { from: b, to: a, n, ids: moved.map((x) => x.id).reverse() };
}
/** Add one cart (a temporary bay that takes anything). Limited per level; the caller spends the power-up. */
export function addCart(st) { if (st.done || st.extra >= MAX_EXTRA || st.bays.length >= MAX_BAYS + MAX_EXTRA) return false; st.bays.push({ a: "any", s: true, items: [] }); st.extra++; return true; }
/** The next move of a real solution from the current board (or null). */
export function hint(st) { const p = solveState(st, 60000); return p && p.length ? { from: p[0][0], to: p[0][1], left: p.length } : null; }
/** Is there any legal move at all? */
export function hasMoves(st) { for (let a = 0; a < st.bays.length; a++) for (let b = 0; b < st.bays.length; b++) if (canMove(st, a, b)) return true; return false; }

// ---------------------------------------------------------------- score and profile
/** 3 stars within 10% of the best known solution, 2 within 40%, else 1. "Perfect" means you matched it. */
export const starsFor = (st) => (st.moves <= Math.ceil(st.par * 1.1) ? 3 : st.moves <= Math.ceil(st.par * 1.4) ? 2 : 1);
export const isPerfect = (st) => st.moves <= st.par;
export const newProfile = () => ({ v: 1, level: 1, solved: 0, hints: 3, carts: 2, stars: {}, best: {}, seen: {}, perfect: {}, coached: {} });
export const totalStars = (p) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
export function normalizeProfile(p = {}) { const d = newProfile(), o = { ...d, ...p, stars: { ...(p.stars || {}) }, best: { ...(p.best || {}) }, seen: { ...(p.seen || {}) }, perfect: { ...(p.perfect || {}) }, coached: { ...(p.coached || {}) } }; for (const k of ["hints", "carts"]) o[k] = Math.min(MAX_POWERUPS, Math.max(0, +o[k] || 0)); o.level = Math.max(1, Math.floor(o.level) || 1); return o; }
/** Apply a won level. Stars only go up; the first clear opens the next level and earns a hint every 2nd clear and a cart every 4th; a boss ("Stock Take") pays a bonus. */
export function completeLevel(p, st) {
  const stars = starsFor(st), perfect = isPerfect(st), first = !(p.stars[st.level] > 0); p.stars[st.level] = Math.max(p.stars[st.level] || 0, stars); p.best[st.level] = Math.min(p.best[st.level] || 1e9, st.moves);
  const newPerfect = perfect && !p.perfect[st.level]; if (perfect) p.perfect[st.level] = true;
  p.level = Math.max(p.level, st.level + 1); const reward = { hint: 0, cart: 0 }, give = (key, n) => { const got = Math.min(n, MAX_POWERUPS - p[key]); p[key] += got; return got; };
  if (first) { p.solved++; if (p.solved % 2 === 0) reward.hint += give("hints", 1); if (p.solved % 4 === 0) reward.cart += give("carts", 1); if (st.boss) { reward.hint += give("hints", 1); reward.cart += give("carts", 1); } }
  return { stars, first, perfect, newPerfect, boss: !!st.boss, reward };
}

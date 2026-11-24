// Shelf Stocker engine. You are the stock clerk: sort the delivery onto the shelves. Move the top run of matching items from one bay to another.
// Three departments teach three rules (one new rule at a time): Clothing Corner (free: sort shirts by colour), Book Nook (labelled shelves: each book goes on its subject's shelf),
// Boutique (typed bays: shirts on racks, books on shelves, both mixed up). Carts are temporary: they take anything and must be empty when you finish.
// Pure ESM, JSON state, seeded RNG (a level number always makes the same puzzle). No Date.now/Math.random.
import { makeRng } from "../gridiron/rng.mjs";

export const MAX_POWERUPS = 9;
export const MAX_EXTRA = 2;            // extra carts you may add on one level
export const MAX_BAYS = 14;
export const DEPTS = [
  { id: "clothing", name: "Clothing Corner", rule: "Sort the folded shirts so every stack is one colour." },
  { id: "books", name: "Book Nook", rule: "Every shelf has a sign. Put each book on the shelf for its subject. The cart can hold anything for a moment." },
  { id: "boutique", name: "Boutique", rule: "Shirts only go on racks and books only on shelves. Sort both. The bin is just for moving things around." },
];
export const SHIRT_COLOURS = 10, BOOK_SUBJECTS = 8;
export const SUBJECTS = ["Science", "History", "Fiction", "Math", "Art", "Music", "Nature", "Space"];
export const deptOf = (level) => Math.floor((Math.max(1, level) - 1) / 10) % 3;
export const LEVELS_PER_DEPT = 10;

/** What a level looks like. `kinds`: the item types in play (shirt colours / book subjects), `bays`: shelf rules in order. */
export function specFor(level) {
  const L = Math.max(1, Math.floor(level) || 1), d = deptOf(L), i = ((L - 1) % 10) + 1, cycle = Math.floor((L - 1) / 30);   // cycle: how many times through all three departments
  const cap = Math.min(8, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 2) + (cycle >= 1 && i >= 3 ? 0 : 0));
  const hidden = Math.min(0.55, (i >= 7 ? 0.12 + (i - 7) * 0.05 : 0) + cycle * 0.12);
  if (d === 0) {                                   // Clothing Corner: free sorting
    const n = Math.min(10, [3, 3, 3, 4, 4, 4, 5, 5, 6, 6][i - 1] + cycle);
    return { level: L, dept: d, cap, hidden, keys: Array.from({ length: n }, (_, k) => ({ kind: "shirt", v: k })), bays: [...Array.from({ length: n }, () => ({ a: "any", s: false })), { a: "any", s: false }, { a: "any", s: false }] };
  }
  if (d === 1) {                                   // Book Nook: every shelf is labelled with its subject; a cart helps
    const n = Math.min(7, [3, 3, 4, 4, 4, 5, 5, 5, 6, 6][i - 1] + Math.floor(cycle / 2)), carts = (i >= 3 || cycle >= 1 ? 2 : 1) + (cycle >= 2 ? 1 : 0);
    return { level: L, dept: d, cap, hidden, keys: Array.from({ length: n }, (_, k) => ({ kind: "book", v: k })), bays: [...Array.from({ length: n }, (_, k) => ({ a: k, s: false })), ...Array.from({ length: carts }, () => ({ a: "any", s: true }))] };
  }
  const sc = Math.min(5, [2, 2, 3, 3, 3, 3, 4, 4, 4, 4][i - 1] + Math.floor(cycle / 2)), bc = Math.min(5, [2, 3, 2, 3, 3, 4, 3, 3, 4, 4][i - 1] + Math.floor(cycle / 2));   // Boutique: racks for shirts, shelves for books
  return {
    level: L, dept: d, cap, hidden, keys: [...Array.from({ length: sc }, (_, k) => ({ kind: "shirt", v: k })), ...Array.from({ length: bc }, (_, k) => ({ kind: "book", v: k }))],
    bays: [...Array.from({ length: sc + 1 }, () => ({ a: "shirt", s: false })), ...Array.from({ length: bc + 1 }, () => ({ a: "book", s: false })), { a: "any", s: true }],
  };
}

// ---------------------------------------------------------------- rules (shared by the game and the solver)
/** May an item with key k stand on a bay with this accept rule? "any" | "shirt" | "book" | a number (that key only). */
export const accepts = (a, k, keys) => (a === "any" ? true : typeof a === "number" ? a === k : keys[k].kind === a);
/** Why a move is refused, in words a player understands (null if it is fine). */
export function whyNot(st, a, b) {
  if (st.done || a === b) return "Pick a different shelf.";
  const A = st.bays[a], B = st.bays[b]; if (!A?.items.length) return "That shelf is empty.";
  const k = A.items[A.items.length - 1].k, rule = B.a;
  if (!accepts(rule, k, st.keys)) return typeof rule === "number" ? `That shelf is for ${SUBJECTS[st.keys[rule].v % SUBJECTS.length]} books.` : rule === "shirt" ? "Only shirts go on a rack." : "Only books go on a shelf.";
  if (B.items.length >= st.cap) return "That shelf is full.";
  if (B.items.length && B.items[B.items.length - 1].k !== k) return "Items must match the one on top.";
  return null;
}
const HID = 32;                        // solver items are key (0-31) plus 32 while still wrapped
const goodEnd = (bays, cap, keys) => bays.every((b) => {   // bays: [{a, s, ks:[keys]}]
  if (b.s) return b.ks.length === 0;
  if (typeof b.a === "number") return b.ks.length === cap && b.ks.every((k) => k === b.a);
  return !b.ks.length || (b.ks.length === cap && b.ks.every((k) => k === b.ks[0]) && accepts(b.a, b.ks[0], keys));
});

// ---------------------------------------------------------------- solver (also gives hints and the par)
const keyOf = (ks) => ks.map((b) => b.join(",")).join("|");
function legalMoves(ks, rules, cap, keys) {
  const out = [];
  for (let a = 0; a < ks.length; a++) {
    const A = ks[a]; if (!A.length) continue; const k = A[A.length - 1], uniform = A.every((x) => (x & 31) === k);
    if (uniform && A.length === cap && !rules[a].s && accepts(rules[a].a, k, keys) && (typeof rules[a].a !== "number" || rules[a].a === k)) continue;   // already home and full
    for (let b = 0; b < ks.length; b++) {
      if (a === b) continue; const B = ks[b]; if (B.length >= cap || !accepts(rules[b].a, k, keys)) continue;
      if (!B.length) { if (!(uniform && !rules[a].s && rules[a].a === rules[b].a)) out.push([a, b]); }   // moving a pure stack to an identical empty bay changes nothing
      else if (B[B.length - 1] === k) out.push([a, b]);
    }
  }
  return out;
}
function applyMove(ks, a, b, cap) {
  const A = ks[a], B = ks[b], k = A[A.length - 1]; let n = 0; while (n < A.length && A[A.length - 1 - n] === k) n++;   // a wrapped item (key+32) is not equal, so it stops the run
  n = Math.min(n, cap - B.length); const next = ks.map((x) => x.slice()); next[b].push(...next[a].splice(next[a].length - n, n));
  const top = next[a].length - 1; if (top >= 0 && next[a][top] >= HID) next[a][top] -= HID;                                    // the item that comes to light is unwrapped
  return next;
}
function cost(ks, rules, cap) {
  let h = 0;
  for (let i = 0; i < ks.length; i++) {
    const b = ks[i].map((x) => x & 31); if (rules[i].s) { h += b.length * 2; continue; } if (!b.length) { if (typeof rules[i].a === "number") h += 2; continue; }
    let changes = 0; for (let j = 1; j < b.length; j++) if (b[j] !== b[j - 1]) changes++; h += changes * 2 + (changes ? 1 : b.length < cap ? 1 : 0);
    if (typeof rules[i].a === "number") for (const k of b) if (k !== rules[i].a) h += 2;
  }
  return h;
}
/** Weighted best-first search. `ks` is the bays as lists of item keys, `rules` is [{a, s}] per bay. Returns [[from, to], ...] or null if none was found in the node budget. */
export function solve(ks, rules, cap, keys, budget = 60000) {
  const view = (arr) => arr.map((b, i) => ({ a: rules[i].a, s: rules[i].s, ks: b.map((x) => x & 31) }));
  if (goodEnd(view(ks), cap, keys)) return [];
  const start = ks.map((b) => b.slice()), seen = new Map([[keyOf(start), 0]]), heap = [[cost(start, rules, cap) * 2, 0, start, null]];
  const push = (e) => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  let nodes = 0;
  while (heap.length && nodes++ < budget) {
    const [, g, state, trail] = pop();
    for (const [a, b] of legalMoves(state, rules, cap, keys)) {
      const next = applyMove(state, a, b, cap), k = keyOf(next), ng = g + 1; if (seen.has(k) && seen.get(k) <= ng) continue; seen.set(k, ng);
      const t = { a, b, prev: trail }; if (goodEnd(view(next), cap, keys)) { const path = []; for (let x = t; x; x = x.prev) path.push([x.a, x.b]); return path.reverse(); }
      push([ng + cost(next, rules, cap) * 2, ng, next, t]);
    }
  }
  return null;
}

// ---------------------------------------------------------------- level generation
/** Make the puzzle for a level. The delivery arrives mis-shelved (a mess), and the solver proves it can be fixed. */
export function generate(level, seedBump = 0) {
  const sp = specFor(level), rng = makeRng((sp.level * 7919 + 211 + seedBump * 104729) >>> 0), nKeys = sp.keys.length, rules = sp.bays.map((b) => ({ a: b.a, s: b.s }));
  const fillable = sp.bays.map((b, i) => (b.s ? -1 : i)).filter((i) => i >= 0), emptyCount = fillable.length - nKeys;   // how many ordinary bays start empty
  for (let attempt = 0; attempt < 60; attempt++) {
    const pool = []; for (let k = 0; k < nKeys; k++) for (let i = 0; i < sp.cap; i++) pool.push(k);
    for (let i = pool.length - 1; i > 0; i--) { const j = rng.int(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    // choose which ordinary bays start empty (in the Boutique: one rack and one shelf), the rest are filled completely with the shuffled mess
    let emptied = new Set();
    if (sp.dept === 2) { const racks = fillable.filter((i) => sp.bays[i].a === "shirt"), shelves = fillable.filter((i) => sp.bays[i].a === "book"); emptied = new Set([racks[rng.int(racks.length)], shelves[rng.int(shelves.length)]]); }
    else { const order = [...fillable]; for (let i = order.length - 1; i > 0; i--) { const j = rng.int(i + 1); [order[i], order[j]] = [order[j], order[i]]; } emptied = new Set(order.slice(0, sp.dept === 1 ? 1 : emptyCount)); }
    const ks = sp.bays.map(() => []); let p = 0; for (const i of fillable) if (!emptied.has(i)) { ks[i] = pool.slice(p, p + sp.cap); p += sp.cap; }
    if (sp.dept === 1) { const cart = sp.bays.findIndex((b) => b.s); ks[cart] = pool.slice(p, p + sp.cap); p += sp.cap; }   // Book Nook: one shelf starts bare and the cart arrives loaded
    if (p !== pool.length) continue;
    if (ks.every((b, i) => !b.length || (typeof rules[i].a === "number" ? b.every((k) => k === rules[i].a) : b.every((k) => k === b[0])))) continue;   // already sorted: reshuffle
    const flagged = ks.map((bay) => bay.map((k, j) => (sp.hidden > 0 && j < bay.length - 1 && rng() < sp.hidden ? k + HID : k)));   // some items start wrapped (never the top one)
    const path = solve(flagged, rules, sp.cap, sp.keys, 50000); if (!path) continue;
    let id = 0; const bays = sp.bays.map((b, i) => ({ a: b.a, s: b.s, items: flagged[i].map((v) => ({ id: id++, k: v & 31, q: v >= HID })) }));
    return { spec: sp, bays, par: Math.max(1, path.length) };
  }
  throw new Error("could not make a Shelf Stocker level " + level);
}

// ---------------------------------------------------------------- game state
export function newGame(level) {
  const g = generate(level); return { v: 2, level: g.spec.level, dept: g.spec.dept, cap: g.spec.cap, keys: g.spec.keys, bays: g.bays, par: g.par, moves: 0, extra: 0, history: [], done: false, won: false, nextId: g.bays.flatMap((b) => b.items).length };
}
const plain = (st) => ({ ks: st.bays.map((b) => b.items.map((n) => n.k + (n.q ? HID : 0))), rules: st.bays.map((b) => ({ a: b.a, s: b.s })) });
/** How many items would move together: the matching items on top, stopping at the first wrapped one (a wrapped item never moves with a run, so it cannot give away its colour). */
export const topRun = (st, a) => { const A = st.bays[a].items; if (!A.length) return 0; const k = A[A.length - 1].k; let n = 0; while (n < A.length && !A[A.length - 1 - n].q && A[A.length - 1 - n].k === k) n++; return n; };
export const canMove = (st, a, b) => whyNot(st, a, b) === null;
export const isSolved = (st) => goodEnd(st.bays.map((b) => ({ a: b.a, s: b.s, ks: b.items.map((n) => n.k) })), st.cap, st.keys);
/** Is this bay finished: full of the right thing (and not a cart)? */
export const bayDone = (st, a) => { const B = st.bays[a]; return !B.s && B.items.length === st.cap && B.items.every((n) => n.k === B.items[0].k && accepts(B.a, n.k, st.keys)) && (typeof B.a !== "number" || B.items[0].k === B.a); };
/** Move the top run from a to b. Returns {ok, ids (moved item ids, top first), n, revealed, finished (bays that just became done)}. */
export function move(st, a, b) {
  if (!canMove(st, a, b)) return { ok: false };
  const A = st.bays[a].items, B = st.bays[b].items, n = Math.min(topRun(st, a), st.cap - B.length), moved = A.splice(A.length - n, n); B.push(...moved);
  let revealed = null; const top = A[A.length - 1]; if (top && top.q) { top.q = false; revealed = top.id; }
  const unwrapped = []; if (bayDone(st, b)) for (const it of B) if (it.q) { it.q = false; unwrapped.push(it.id); }   // a finished shelf unwraps everything on it
  st.moves++; st.history.push({ a, b, n, revealed, unwrapped }); if (isSolved(st)) { st.done = true; st.won = true; }
  return { ok: true, n, ids: moved.map((x) => x.id).reverse(), revealed, unwrapped, from: a, to: b, won: st.won, finished: bayDone(st, b) ? [b] : [] };
}
/** Take back the last move (free). */
export function undo(st) {
  if (!st.history.length || st.done) return null; const { a, b, n, revealed, unwrapped = [] } = st.history.pop(), B = st.bays[b].items;
  for (const id of unwrapped) { const t = B.find((x) => x.id === id); if (t) t.q = true; }                          // wrap them again before moving back
  const moved = B.splice(B.length - n, n); st.bays[a].items.push(...moved);
  if (revealed !== null) { const t = st.bays[a].items.find((x) => x.id === revealed); if (t) t.q = true; }
  st.moves = Math.max(0, st.moves - 1); return { from: b, to: a, n, ids: moved.map((x) => x.id).reverse() };
}
/** Add one cart (a temporary bay that takes anything). Limited per level; the caller spends the power-up. */
export function addCart(st) { if (st.done || st.extra >= MAX_EXTRA || st.bays.length >= MAX_BAYS + MAX_EXTRA) return false; st.bays.push({ a: "any", s: true, items: [] }); st.extra++; return true; }
/** The next move of a real solution from the current board (or null). */
export function hint(st) { const { ks, rules } = plain(st), p = solve(ks, rules, st.cap, st.keys, 60000); return p && p.length ? { from: p[0][0], to: p[0][1], left: p.length } : null; }
/** Is there any legal move at all? */
export function hasMoves(st) { for (let a = 0; a < st.bays.length; a++) for (let b = 0; b < st.bays.length; b++) if (canMove(st, a, b)) return true; return false; }

// ---------------------------------------------------------------- score and profile
/** 3 stars at or near par, 2 a bit over, 1 for finishing. */
export const starsFor = (st) => (st.moves <= Math.ceil(st.par * 1.25) ? 3 : st.moves <= Math.ceil(st.par * 1.6) ? 2 : 1);
export const newProfile = () => ({ v: 1, level: 1, solved: 0, hints: 3, carts: 2, stars: {}, best: {}, seen: {} });
export const totalStars = (p) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
export function normalizeProfile(p = {}) { const d = newProfile(), o = { ...d, ...p, stars: { ...(p.stars || {}) }, best: { ...(p.best || {}) }, seen: { ...(p.seen || {}) } }; for (const k of ["hints", "carts"]) o[k] = Math.min(MAX_POWERUPS, Math.max(0, +o[k] || 0)); o.level = Math.max(1, Math.floor(o.level) || 1); return o; }
/** Apply a won level. Stars only go up; the first clear opens the next level and earns a hint every 2nd clear and a cart every 4th. */
export function completeLevel(p, st) {
  const stars = starsFor(st), first = !(p.stars[st.level] > 0); p.stars[st.level] = Math.max(p.stars[st.level] || 0, stars); p.best[st.level] = Math.min(p.best[st.level] || 1e9, st.moves);
  p.level = Math.max(p.level, st.level + 1); const reward = { hint: 0, cart: 0 };
  if (first) { p.solved++; if (p.solved % 2 === 0) { reward.hint = Math.min(1, MAX_POWERUPS - p.hints); p.hints += reward.hint; } if (p.solved % 4 === 0) { reward.cart = Math.min(1, MAX_POWERUPS - p.carts); p.carts += reward.cart; } }
  return { stars, first, reward };
}

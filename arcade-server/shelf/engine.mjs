// Shelf Stocker engine. You are the stock clerk: sort the delivery onto the shelves. Move the top run of matching items from one bay to another.
// Nine departments, each teaching one rule (the last one mixes two):
//   Clothing Corner (free sorting) / Book Nook (shelf signs) / Boutique (racks for shirts, shelves for books) / Toy Aisle (size order) / Pantry (fragile jars)
//   Shoe Wall (pairs: left, right, left, right) / Gift Corner (padlocked shelves open when you finish a shelf) / Customer Orders (pack exactly what the order asks for) / Mixed Day (two rules at once)
// Carts are temporary: they take anything and must be empty when you finish. Wrapped (mystery) items never move with a run, so they cannot give their colour away.
// Pure ESM, JSON state, seeded RNG (a level number always makes the same puzzle). No Date.now/Math.random.
import { makeRng } from "../gridiron/rng.mjs";
import { PICKS } from "./levels.mjs";

export const MAX_POWERUPS = 9;
export const MAX_EXTRA = 2;            // extra carts you may add on one level
export const MAX_BAYS = 14;
export const DEPTS = [
  { id: "clothing", name: "Clothing Corner", short: "Clothes", rules: [], rule: "Sort the folded shirts so every stack is one colour." },
  { id: "books", name: "Book Nook", short: "Books", rules: [], rule: "Every shelf has a sign. Put each book on the shelf for its subject. The cart can hold anything for a moment." },
  { id: "boutique", name: "Boutique", short: "Boutique", rules: [], rule: "Shirts only go on racks and books only on shelves. Sort both. The bin is just for moving things around." },
  { id: "toys", name: "Toy Aisle", short: "Toys", rules: ["size"], rule: "Stack each toy set from the biggest at the bottom to the smallest on top. A bigger toy can never sit on a smaller one." },
  { id: "pantry", name: "Pantry", short: "Pantry", rules: ["fragile"], rule: "Glass jars are fragile: the dots on a lid show how many more times it can be moved before it cracks. Tins can be moved freely. Plan ahead!" },
  { id: "shoes", name: "Shoe Wall", short: "Shoes", rules: ["pairs"], rule: "Every shoe has a partner. Stack each style left, right, left, right so every pair sits together." },
  { id: "gifts", name: "Gift Corner", short: "Gifts", rules: ["locks"], rule: "Some shelves are padlocked. Finish a shelf (full, one colour) and the next padlock opens." },
  { id: "orders", name: "Customer Orders", short: "Orders", rules: ["orders"], rule: "A customer wants specific items. Dig them out and pack exactly what the order asks for into the bag. Packed items can't be unpacked." },
  { id: "mixed", name: "Mixed Day", short: "Mixed", rules: ["size", "locks"], rule: "Mixed Day: two rules at once. Read the signs and the padlocks. You've got this." },
];
export const DEPT_COUNT = DEPTS.length;
export const SUBJECTS = ["Science", "History", "Fiction", "Math", "Art", "Music", "Nature", "Space"];
export const deptOf = (level) => Math.floor((Math.max(1, Math.floor(level) || 1) - 1) / 10) % DEPT_COUNT;
export const posOf = (level) => ((Math.max(1, Math.floor(level) || 1) - 1) % 10) + 1;       // 1..10 inside a department
export const cycleOf = (level) => Math.floor((Math.max(1, Math.floor(level) || 1) - 1) / (10 * DEPT_COUNT));
export const LEVELS_PER_DEPT = 10;
export const flags = (rules) => { const r = Array.isArray(rules) ? rules : []; return { size: r.includes("size"), pairs: r.includes("pairs"), fragile: r.includes("fragile"), locks: r.includes("locks"), orders: r.includes("orders") }; };
/** The rules in force for a game (older saves stored a single `mode`). */
export const rulesOf = (st) => st.rules ?? (st.mode && st.mode !== "free" ? [st.mode] : []);
const UNBREAKABLE = 7;

/** What a level looks like. keys: the kinds of item in play; bays: shelf rules in order; rules: which special rules apply. Every 5th level is a breather, every 10th a boss ("Stock Take"). */
export function specFor(level) {
  const L = Math.max(1, Math.floor(level) || 1), d = deptOf(L), i = posOf(L), cycle = cycleOf(L), breather = i === 5, boss = i === 10;
  const hidden = breather ? 0 : Math.min(0.5, (i >= 7 ? 0.1 + (i - 7) * 0.05 : 0) + cycle * 0.08);
  const base = { level: L, dept: d, pos: i, cycle, breather, boss, rules: DEPTS[d].rules, hidden };
  const adj = (n, lo, hi) => Math.max(lo, Math.min(hi, n + (breather ? -1 : 0) + (boss ? 1 : 0)));
  const anyBays = (n, extra) => [...Array.from({ length: n }, () => ({ a: "any", s: false })), ...Array.from({ length: extra }, () => ({ a: "any", s: false }))];
  if (d === 0) {
    const cap = Math.min(8, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 2)), n = adj(Math.min(10, [3, 3, 3, 4, 4, 4, 5, 5, 6, 6][i - 1] + cycle), 3, 10);
    return { ...base, cap, keys: Array.from({ length: n }, (_, k) => ({ kind: "shirt", v: k })), bays: anyBays(n, 2) };
  }
  if (d === 1) {
    const cap = Math.min(8, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 2)), n = adj(Math.min(7, [3, 3, 4, 4, 4, 5, 5, 5, 6, 6][i - 1] + Math.floor(cycle / 2)), 3, 7), carts = (i >= 3 || cycle >= 1 ? 2 : 1) + (cycle >= 2 ? 1 : 0);
    return { ...base, cap, keys: Array.from({ length: n }, (_, k) => ({ kind: "book", v: k })), bays: [...Array.from({ length: n }, (_, k) => ({ a: k, s: false })), ...Array.from({ length: carts }, () => ({ a: "any", s: true }))] };
  }
  if (d === 2) {
    const cap = Math.min(8, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 2)), sc = Math.min(5, [2, 2, 3, 3, 3, 3, 4, 4, 4, 4][i - 1] + Math.floor(cycle / 2) + (boss ? 1 : 0)), bc = Math.min(5, Math.max(2, [2, 3, 2, 3, 3, 4, 3, 3, 4, 4][i - 1] + Math.floor(cycle / 2) + (boss ? 1 : 0) - (breather ? 1 : 0)));
    return { ...base, cap, keys: [...Array.from({ length: sc }, (_, k) => ({ kind: "shirt", v: k })), ...Array.from({ length: bc }, (_, k) => ({ kind: "book", v: k }))], bays: [...Array.from({ length: sc + 1 }, () => ({ a: "shirt", s: false })), ...Array.from({ length: bc + 1 }, () => ({ a: "book", s: false })), { a: "any", s: true }] };
  }
  if (d === 3) {   // Toy Aisle: nesting toys
    const cap = Math.min(5, [3, 4, 3, 4, 4, 4, 5, 5, 5, 5][i - 1]), n = adj(Math.min(5, [2, 2, 3, 3, 3, 3, 4, 4, 4, 4][i - 1] + Math.min(1, cycle)), 2, 5);
    return { ...base, cap, keys: Array.from({ length: n }, (_, k) => ({ kind: "toy", v: k })), bays: anyBays(n, 2) };
  }
  if (d === 4) {   // Pantry: jars (fragile) and tins
    const cap = Math.min(6, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 3)), n = adj(Math.min(7, [3, 4, 4, 5, 5, 5, 6, 6, 6, 6][i - 1] + Math.min(1, cycle)), 3, 7), jars = Math.ceil(n / 2);
    return { ...base, cap, dur: 3, keys: [...Array.from({ length: jars }, (_, k) => ({ kind: "jar", v: k })), ...Array.from({ length: n - jars }, (_, k) => ({ kind: "tin", v: k }))], bays: anyBays(n, 2) };
  }
  if (d === 5) {   // Shoe Wall: pairs
    const cap = i >= 8 ? 6 : 4, n = adj(Math.min(5, [2, 2, 3, 3, 3, 3, 3, 3, 3, 3][i - 1] + Math.min(1, cycle)), 2, 5);
    return { ...base, cap: Math.min(cap, 6), keys: Array.from({ length: n }, (_, k) => ({ kind: "shoe", v: k })), bays: anyBays(n, 2) };
  }
  if (d === 6) {   // Gift Corner: padlocks
    const cap = Math.min(7, 4 + (i >= 6 ? 1 : 0) + Math.floor(cycle / 3)), n = adj(Math.min(7, [3, 3, 4, 4, 4, 5, 5, 5, 5, 6][i - 1] + Math.min(1, cycle)), 3, 7), locks = i <= 3 ? 1 : i <= 6 ? 1 : 2;
    return { ...base, hidden: 0, cap, keys: Array.from({ length: n }, (_, k) => ({ kind: "gift", v: k })), bays: anyBays(n, 2).map((b, j) => (j < locks ? { ...b, lock: j + 1 } : b)) };
  }
  if (d === 7) {   // Customer Orders: pack exactly what the ticket asks for
    const cap = i <= 3 ? 4 : i <= 6 ? 5 : 6, n = adj(Math.min(6, [3, 3, 4, 4, 4, 5, 5, 5, 6, 6][i - 1] + Math.min(1, cycle)), 3, 6);
    return { ...base, hidden: breather ? 0 : i >= 3 ? 0.12 + i * 0.02 : 0, cap, keys: [...Array.from({ length: Math.ceil(n / 2) }, (_, k) => ({ kind: "shirt", v: k })), ...Array.from({ length: Math.floor(n / 2) }, (_, k) => ({ kind: "book", v: k }))], bays: [...anyBays(n, 1), { a: "any", s: false, bag: true }] };
  }
  // Mixed Day: levels 1-3 toys + padlocks, 4-6 pantry typed shelves + fragile jars, 7-10 shoe pairs + padlocks
  if (i <= 3) { const cap = i === 1 ? 3 : 4, n = adj(i === 3 ? 3 : 2, 2, 4); return { ...base, hidden: 0, rules: ["size", "locks"], cap, keys: Array.from({ length: n }, (_, k) => ({ kind: "toy", v: k })), bays: anyBays(n, 2).map((b, j) => (j === 0 ? { ...b, lock: 1 } : b)) }; }
  if (i <= 6) { const jars = adj(i === 4 ? 2 : 2, 2, 3), tins = adj(i === 6 ? 3 : 2, 2, 3), cap = 4; return { ...base, hidden: 0, rules: ["fragile"], cap, dur: 3, keys: [...Array.from({ length: jars }, (_, k) => ({ kind: "jar", v: k })), ...Array.from({ length: tins }, (_, k) => ({ kind: "tin", v: k }))], bays: [...Array.from({ length: jars + 1 }, () => ({ a: "jar", s: false })), ...Array.from({ length: tins + 1 }, () => ({ a: "tin", s: false }))] }; }
  { const n = adj(i >= 9 ? 4 : 3, 3, 4); return { ...base, hidden: 0, rules: ["pairs", "locks"], cap: 4, keys: Array.from({ length: n }, (_, k) => ({ kind: "shoe", v: k })), bays: anyBays(n, 2).map((b, j) => (j === 0 ? { ...b, lock: 1 } : b)) }; }
}

// ---------------------------------------------------------------- rules (shared by the game and the solver)
/** May an item with key k stand on a bay with this accept rule? "any" | a kind ("shirt", "book", "jar", "tin") | a number (that one key only). */
export const accepts = (a, k, keys) => (a === "any" ? true : typeof a === "number" ? a === k : keys[k].kind === a);
/** The matching items on top that would move together: they stop at the first wrapped item (so a wrapped item never gives its colour away); toys must nest (each smaller than the one below) and shoes must alternate left and right. */
export function runLen(items, rules) {
  const F = Array.isArray(rules) ? flags(rules) : (rules || {}); if (!items.length) return 0; const top = items[items.length - 1]; let n = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]; if (it.q || it.k !== top.k) break;
    if (n > 0 && F.size && !((items[i].x || 0) > (items[i + 1].x || 0))) break;
    if (n > 0 && F.pairs && (items[i].x || 0) === (items[i + 1].x || 0)) break;
    n++;
  }
  return n;
}
const brittle = (it) => typeof it.x === "number" && it.x < UNBREAKABLE;
const bagCount = (st, k) => { const bag = st.bays.find((b) => b.bag); return bag ? bag.items.filter((it) => it.k === k).length : 0; };
/** How many shelves are finished right now (full, one kind, in order, not a cart or bag): padlocks open as this grows. */
export function doneCount(st) { let n = 0; for (let a = 0; a < st.bays.length; a++) if (bayDone(st, a)) n++; return n; }
const lockedNow = (st, bay, dn) => (bay.lock || 0) > dn;
const lockMsg = (bay, dn) => { const need = (bay.lock || 0) - dn; return `Padlocked! Finish ${need} more shelf${need === 1 ? "" : "s"} to open it.`; };
/** Why a move is refused, in words a player understands (null if it is fine). */
export function whyNot(st, a, b) {
  if (st.done || a === b) return "Pick a different shelf.";
  const A = st.bays[a], B = st.bays[b]; if (!A?.items.length) return "That shelf is empty."; const F = flags(rulesOf(st));
  if (F.locks) { const dn = doneCount(st); if (lockedNow(st, A, dn)) return lockMsg(A, dn); if (lockedNow(st, B, dn)) return lockMsg(B, dn); }
  if (A.bag) return "Packed items can't be unpacked.";
  const top = A.items[A.items.length - 1], k = top.k, rule = B.a, run = runLen(A.items, F);
  if (B.bag) {
    const ord = (st.order || []).find((o) => o.k === k); if (!ord) return "That isn't on the order."; if (bagCount(st, k) >= ord.n) return "You already packed enough of those."; if (B.items.length >= st.cap) return "The bag is full."; return null;
  }
  if (!accepts(rule, k, st.keys)) return typeof rule === "number" ? `That shelf is for ${SUBJECTS[st.keys[rule].v % SUBJECTS.length]} books.` : rule === "shirt" ? "Only shirts go on a rack." : rule === "book" ? "Only books go on a shelf." : rule === "jar" ? "Only jars go on a jar shelf." : "Only tins go on a tin shelf.";
  if (B.items.length >= st.cap) return "That shelf is full.";
  const n = Math.min(run, st.cap - B.items.length), moved = A.items.slice(A.items.length - n), land = moved[0];
  if (B.items.length) {
    const bt = B.items[B.items.length - 1];
    if (bt.k !== k) return "Items must match the one on top.";
    if (F.size && !((bt.x || 0) > (land.x || 0))) return "A bigger toy can't sit on a smaller one.";
    if (F.pairs && (bt.x || 0) === (land.x || 0)) return "A shoe goes next to its partner: left, right, left, right.";
  }
  if (F.fragile && moved.some((it) => brittle(it) && it.x <= 0)) return "That jar would crack! It can't be moved again.";
  return null;
}
const bayOk = (b, ctx) => {   // b: {a, s, bag, ks, xs}: is this one shelf finished?
  if (b.bag || b.s) return false; if (b.ks.length !== ctx.cap) return false;
  if (typeof b.a === "number") { if (!b.ks.every((k) => k === b.a)) return false; } else { if (!b.ks.every((k) => k === b.ks[0]) || !accepts(b.a, b.ks[0], ctx.keys)) return false; }
  if (ctx.F.size && !b.xs.every((x, i) => i === 0 || x < b.xs[i - 1])) return false;
  if (ctx.F.pairs && !b.xs.every((x, i) => i === 0 || x !== b.xs[i - 1])) return false;
  return true;
};
const goodEnd = (bays, ctx) => {
  if (ctx.F.orders) { const bag = bays.find((b) => b.bag), have = {}; for (const k of bag.ks) have[k] = (have[k] || 0) + 1; return ctx.order.every((o) => (have[o.k] || 0) === o.n); }
  return bays.every((b) => { if (b.bag) return true; if (b.s) return b.ks.length === 0; if (typeof b.a === "number") return bayOk(b, ctx); return !b.ks.length || bayOk(b, ctx); });
};

// ---------------------------------------------------------------- solver (also gives hints and the par)
// Solver items are ints: key (0-31) + 32 while wrapped + 64 * aux (toy size, shoe side, or jar moves left; 7 = unbreakable).
const HID = 32, K = (v) => v & 31, Q = (v) => (v & HID) !== 0, X = (v) => v >> 6;
const keyOf = (ks) => ks.map((b) => b.join(",")).join("|");
function runN(A, F) {
  const top = A[A.length - 1]; let n = 0;
  for (let i = A.length - 1; i >= 0; i--) { const v = A[i]; if (Q(v) || K(v) !== K(top)) break; if (n > 0 && F.size && !(X(A[i]) > X(A[i + 1]))) break; if (n > 0 && F.pairs && X(A[i]) === X(A[i + 1])) break; n++; }
  return n;
}
const viewK = (ks, rules) => ks.map((b, i) => ({ a: rules[i].a, s: rules[i].s, bag: !!rules[i].bag, ks: b.map(K), xs: b.map(X) }));
const dnOf = (ks, rules, ctx) => { let n = 0; for (const v of viewK(ks, rules)) if (bayOk(v, ctx)) n++; return n; };
function legalMoves(ks, rules, ctx) {
  const out = [], { cap, keys, F, order } = ctx, dn = F.locks ? dnOf(ks, rules, ctx) : 0;
  for (let a = 0; a < ks.length; a++) {
    const A = ks[a]; if (!A.length || rules[a].bag || (rules[a].lock || 0) > dn) continue; const top = A[A.length - 1], k = K(top), n0 = runN(A, F);
    const uniform = (F.size || F.pairs) ? n0 === A.length : A.every((x) => K(x) === k);
    if (!F.orders && uniform && A.length === cap && !rules[a].s && accepts(rules[a].a, k, keys) && (typeof rules[a].a !== "number" || rules[a].a === k)) continue;   // already home and full
    for (let b = 0; b < ks.length; b++) {
      if (a === b || (rules[b].lock || 0) > dn) continue; const B = ks[b], space = cap - B.length; if (space <= 0) continue;
      if (rules[b].bag) { const o = order.find((o) => o.k === k); if (!o) continue; let have = 0; for (const v of B) if (K(v) === k) have++; if (have < o.n) out.push([a, b]); continue; }
      if (!accepts(rules[b].a, k, keys)) continue;
      const n = Math.min(n0, space), moved = A.slice(A.length - n);
      if (F.fragile && moved.some((v) => X(v) < UNBREAKABLE && X(v) === 0)) continue;
      if (!B.length) { if (!(uniform && !rules[a].s && rules[a].a === rules[b].a && !F.fragile && !F.locks)) out.push([a, b]); }   // moving a pure stack to an identical empty bay changes nothing
      else { const bt = B[B.length - 1]; if (K(bt) !== k) continue; if (F.size && !(X(bt) > X(moved[0]))) continue; if (F.pairs && X(bt) === X(moved[0])) continue; out.push([a, b]); }
    }
  }
  return out;
}
function applyMove(ks, a, b, rules, ctx) {
  const { cap, F, order } = ctx, A = ks[a], B = ks[b]; let n = Math.min(runN(A, F), cap - B.length);
  if (rules[b].bag) { const k = K(A[A.length - 1]); let have = 0; for (const v of B) if (K(v) === k) have++; n = Math.min(n, order.find((o) => o.k === k).n - have); }
  const next = ks.map((x) => x.slice()), moved = next[a].splice(next[a].length - n, n);
  if (F.fragile) for (let i = 0; i < moved.length; i++) if (X(moved[i]) < UNBREAKABLE) moved[i] -= 64;      // a jar loses one of its moves
  next[b].push(...moved); const top = next[a].length - 1; if (top >= 0 && Q(next[a][top])) next[a][top] &= ~HID;            // the item that comes to light is unwrapped
  return next;
}
function cost(ks, rules, ctx) {
  const { cap, F, order } = ctx; let h = 0;
  if (F.orders) {
    const bagI = rules.findIndex((r) => r.bag);
    for (const o of order) { let have = 0; for (const v of ks[bagI]) if (K(v) === o.k) have++; const need = o.n - have; if (need <= 0) continue; const depths = []; for (let i = 0; i < ks.length; i++) if (i !== bagI) { for (let j = 0; j < ks[i].length; j++) if (K(ks[i][j]) === o.k) depths.push(ks[i].length - 1 - j); } depths.sort((x, y) => x - y); for (let t = 0; t < need; t++) h += 1 + (depths[t] ?? 6) * 0.7; }
    return h;
  }
  for (let i = 0; i < ks.length; i++) {
    const b = ks[i]; if (rules[i].s) { h += b.length * 2; continue; } if (!b.length) { if (typeof rules[i].a === "number") h += 2; continue; }
    let changes = 0; for (let j = 1; j < b.length; j++) { if (K(b[j]) !== K(b[j - 1])) changes++; else if (F.size && X(b[j]) > X(b[j - 1])) changes++; else if (F.pairs && X(b[j]) === X(b[j - 1])) changes++; } h += changes * 2 + (changes ? 1 : b.length < cap ? 1 : 0);
    if (typeof rules[i].a === "number") for (const v of b) if (K(v) !== rules[i].a) h += 2;
  }
  return h;
}
/** Weighted best-first search (weight 2 is fast, weight 1 finds near-optimal solutions). ks: bays as lists of solver items, rules: [{a, s, bag?, lock?}] per bay. */
export function solve(ks, rules, cap, keys, budget = 60000, rulesList = [], weight = 2, order = null) {
  const F = flags(rulesList), ctx = { cap, keys, F, order: order || [] };
  if (goodEnd(viewK(ks, rules), ctx)) return [];
  const start = ks.map((b) => b.slice()), seen = new Map([[keyOf(start), 0]]), heap = [[cost(start, rules, ctx) * weight, 0, start, null]];
  const push = (e) => { heap.push(e); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  let nodes = 0;
  while (heap.length && nodes++ < budget) {
    const [, g, state, trail] = pop();
    for (const [a, b] of legalMoves(state, rules, ctx)) {
      const next = applyMove(state, a, b, rules, ctx), k = keyOf(next), ng = g + 1; if (seen.has(k) && seen.get(k) <= ng) continue; seen.set(k, ng);
      const t = { a, b, prev: trail }; if (goodEnd(viewK(next, rules), ctx)) { const path = []; for (let x = t; x; x = x.prev) path.push([x.a, x.b]); return path.reverse(); }
      push([ng + cost(next, rules, ctx) * weight, ng, next, t]);
    }
  }
  return null;
}
const coded = (it) => it.k + (it.q ? HID : 0) + ((it.x || 0) << 6);
export const plainState = (st) => ({ ks: st.bays.map((b) => b.items.map(coded)), rules: st.bays.map((b) => ({ a: b.a, s: b.s, bag: !!b.bag, lock: b.lock || 0 })), cap: st.cap, keys: st.keys, rulesList: rulesOf(st), order: st.order || null });
/** Solve the board as it stands now (used by hints, tests and the browser checks). */
export function solveState(st, budget = 60000, weight = 2) { const p = plainState(st); return solve(p.ks, p.rules, p.cap, p.keys, budget, p.rulesList, weight, p.order); }

// ---------------------------------------------------------------- level generation
/** The par a level is aiming for, as a share of its item count: it climbs through a department, a breather is gentler, a boss is the hardest. */
export function targetPar(level) {
  const sp = specFor(level), items = sp.keys.length * sp.cap, F = flags(sp.rules), ratio = (F.orders ? 0.1 : 0.55) + (sp.pos - 1) * (F.orders ? 0.012 : 0.04) - (sp.breather ? 0.14 : 0) + (sp.boss ? 0.1 : 0) + Math.min(0.2, sp.cycle * 0.05);
  return Math.max(4, Math.round(items * ratio));
}
function makeOrder(sp, rng) {
  const nk = sp.keys.length, want = Math.min(nk, 2 + Math.floor(sp.pos / 4)), ids = [...Array(nk).keys()]; for (let i = ids.length - 1; i > 0; i--) { const j = rng.int(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  const order = []; let left = Math.min(sp.cap, 3 + Math.floor((sp.pos + 1) / 3)); const picks = ids.slice(0, want);
  picks.forEach((k, idx) => { const n = idx === picks.length - 1 ? Math.max(1, left) : Math.max(1, Math.min(left - (picks.length - 1 - idx), 1 + rng.int(2))); order.push({ k, n }); left -= n; });
  return order.filter((o) => o.n > 0).sort((a, b) => a.k - b.k);
}
/** One candidate puzzle for a level (the same seed bump always gives the same board). null if this seed cannot be dealt and solved. */
export function candidate(level, bump = 0, budget = 50000) {
  const sp = specFor(level), rng = makeRng((sp.level * 7919 + 211 + bump * 104729) >>> 0), nKeys = sp.keys.length, F = flags(sp.rules), rules = sp.bays.map((b) => ({ a: b.a, s: b.s, bag: !!b.bag, lock: b.lock || 0 }));
  const fillable = sp.bays.map((b, i) => (b.s || b.bag ? -1 : i)).filter((i) => i >= 0), locked = new Set(sp.bays.map((b, i) => (b.lock ? i : -1)).filter((i) => i >= 0)), emptiable = fillable.filter((i) => !locked.has(i)), emptyCount = fillable.length - nKeys;
  const typed = sp.bays.some((b) => b.a === "shirt" || b.a === "jar");   // racks/shelves (or jar/tin shelves): one of each kind starts empty
  for (let attempt = 0; attempt < 40; attempt++) {
    const pool = [];
    for (let k = 0; k < nKeys; k++) for (let i = 0; i < sp.cap; i++) pool.push({ k, x: F.size ? i + 1 : F.pairs ? (i % 2) + 1 : F.fragile ? (sp.keys[k].kind === "jar" ? sp.dur : UNBREAKABLE) : 0 });
    for (let i = pool.length - 1; i > 0; i--) { const j = rng.int(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    let emptied = new Set();
    if (typed) { const kinds = [...new Set(sp.bays.filter((b) => !b.s).map((b) => b.a))]; emptied = new Set(kinds.map((kd) => { const group = fillable.filter((i) => sp.bays[i].a === kd); return group[rng.int(group.length)]; })); }
    else { const order = [...emptiable]; for (let i = order.length - 1; i > 0; i--) { const j = rng.int(i + 1); [order[i], order[j]] = [order[j], order[i]]; } emptied = new Set(order.slice(0, sp.dept === 1 ? 1 : emptyCount)); }
    const grid = sp.bays.map(() => []); let p = 0; for (const i of fillable) if (!emptied.has(i)) { grid[i] = pool.slice(p, p + sp.cap); p += sp.cap; }
    if (sp.dept === 1) { const cart = sp.bays.findIndex((b) => b.s); grid[cart] = pool.slice(p, p + sp.cap); p += sp.cap; }   // Book Nook: one shelf starts bare and the cart arrives loaded
    if (p !== pool.length) continue;
    const order = F.orders ? makeOrder(sp, rng) : null;
    const sorted = !F.orders && grid.every((b, i) => !b.length || (typeof rules[i].a === "number" ? b.every((it) => it.k === rules[i].a) : b.every((it) => it.k === b[0].k) && (!F.size || b.every((it, j) => j === 0 || it.x < b[j - 1].x)) && (!F.pairs || b.every((it, j) => j === 0 || it.x !== b[j - 1].x))));
    if (sorted) continue;
    const flagged = grid.map((bay) => bay.map((it, j) => ({ ...it, q: sp.hidden > 0 && j < bay.length - 1 && rng() < sp.hidden })));   // some items start wrapped (never the top one)
    const path = solve(flagged.map((bay) => bay.map(coded)), rules, sp.cap, sp.keys, budget, sp.rules, 2, order); if (!path) continue;
    let id = 0; const bays = sp.bays.map((b, i) => ({ a: b.a, s: b.s, ...(b.bag ? { bag: true } : {}), ...(b.lock ? { lock: b.lock } : {}), items: flagged[i].map((it) => ({ id: id++, k: it.k, q: it.q, x: it.x })) }));
    return { spec: sp, bays, order, par: Math.max(1, path.length) };
  }
  return null;
}
/** The puzzle for a level: the board the level builder picked as best fitting the difficulty curve (levels.mjs), or the first dealt board. Proven solvable. */
export function generate(level) {
  const pick = PICKS[Math.max(1, Math.floor(level)) - 1], first = pick ? candidate(level, pick[0]) : null;
  if (first) return { ...first, par: pick[1] || first.par };
  for (let bump = 0; bump < 12; bump++) { const c = candidate(level, bump); if (c) return c; }
  throw new Error("could not make a Shelf Stocker level " + level);
}

// ---------------------------------------------------------------- game state
const gameFrom = (g, extra = {}) => { const sp = g.spec; return { v: 2, level: sp.level, dept: sp.dept, rules: sp.rules, order: g.order || null, boss: sp.boss, breather: sp.breather, cap: sp.cap, keys: sp.keys, bays: g.bays, par: g.par, moves: 0, extra: 0, history: [], done: false, won: false, nextId: g.bays.flatMap((b) => b.items).length, ...extra }; };
export const newGame = (level) => gameFrom(generate(level));
export const topRun = (st, a) => runLen(st.bays[a].items, rulesOf(st));
export const canMove = (st, a, b) => whyNot(st, a, b) === null;
const viewOf = (st) => st.bays.map((b) => ({ a: b.a, s: b.s, bag: !!b.bag, ks: b.items.map((n) => n.k), xs: b.items.map((n) => n.x || 0) }));
const ctxOf = (st) => ({ cap: st.cap, keys: st.keys, F: flags(rulesOf(st)), order: st.order || [] });
export const isSolved = (st) => goodEnd(viewOf(st), ctxOf(st));
/** Is this shelf finished: full of the right thing (sorted/alternating where a rule says so) and not a cart or bag? */
export const bayDone = (st, a) => { const v = viewOf(st)[a]; return bayOk(v, ctxOf(st)) && (typeof v.a !== "number" || v.ks[0] === v.a); };
/** Is this bay padlocked right now? */
export const isLocked = (st, a) => flags(rulesOf(st)).locks && lockedNow(st, st.bays[a], doneCount(st));
/** Move the top run from a to b. Returns {ok, ids (moved item ids, top first), n, revealed, unwrapped, finished (shelves that just became done), unlocked (bays whose padlock just opened), cracked}. */
export function move(st, a, b) {
  if (!canMove(st, a, b)) return { ok: false };
  const F = flags(rulesOf(st)), A = st.bays[a].items, B = st.bays[b].items, before = F.locks ? st.bays.map((bay) => lockedNow(st, bay, doneCount(st))) : [];
  let n = Math.min(runLen(A, F), st.cap - B.length); if (st.bays[b].bag) { const k = A[A.length - 1].k; n = Math.min(n, st.order.find((o) => o.k === k).n - bagCount(st, k)); }
  const moved = A.splice(A.length - n, n), worn = []; if (F.fragile) for (const it of moved) if (brittle(it)) { it.x--; worn.push(it.id); }
  B.push(...moved);
  let revealed = null; const top = A[A.length - 1]; if (top && top.q) { top.q = false; revealed = top.id; }
  const unwrapped = []; if (bayDone(st, b)) for (const it of B) if (it.q) { it.q = false; unwrapped.push(it.id); }   // a finished shelf unwraps everything on it
  const unlocked = F.locks ? st.bays.map((bay, i) => (before[i] && !lockedNow(st, bay, doneCount(st)) ? i : -1)).filter((i) => i >= 0) : [];
  st.moves++; st.history.push({ a, b, n, revealed, unwrapped, worn }); if (isSolved(st)) { st.done = true; st.won = true; }
  return { ok: true, n, ids: moved.map((x) => x.id).reverse(), revealed, unwrapped, unlocked, from: a, to: b, won: st.won, finished: bayDone(st, b) ? [b] : [], cracked: F.fragile ? moved.filter((it) => brittle(it) && it.x === 0).map((it) => it.id) : [] };
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
/** Is the board a dead end (still unsolved, but the solver cannot find a way)? `budget` keeps this cheap; a "true" can rarely be a false alarm on a very hard board, so the screen only suggests undo. */
export const looksStuck = (st, budget = 12000) => !st.done && !isSolved(st) && !hasMoves(st) || (!st.done && !isSolved(st) && solveState(st, budget) === null);

// ---------------------------------------------------------------- Daily Delivery: the same board for everyone on a given day
const hashStr = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const toUtc = (day) => { const [y, m, d] = day.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const prevDay = (day) => new Date(toUtc(day) - 86400000).toISOString().slice(0, 10);
const WEEK_POS = [10, 3, 4, 6, 7, 8, 9];   // Sunday is the big one, Monday is gentle
/** The level a day's delivery is built like: the department rotates daily, the size follows the weekday. */
export function dailyLevel(day) { const days = Math.floor(toUtc(day) / 86400000), dept = ((days % DEPT_COUNT) + DEPT_COUNT) % DEPT_COUNT, pos = WEEK_POS[new Date(toUtc(day)).getUTCDay()]; return dept * 10 + pos; }
export function newDailyGame(day) {
  const L = dailyLevel(day), seed = hashStr("shelf-daily-" + day) % 5000;
  for (let t = 0; t < 30; t++) { const c = candidate(L, 300 + seed + t * 7); if (c) return gameFrom(c, { daily: day }); }
  return gameFrom(generate(L), { daily: day });
}

// ---------------------------------------------------------------- score, coins and profile
/** 3 stars within 10% of the best known solution, 2 within 40%, else 1. "Perfect" means you matched it. */
export const starsFor = (st) => (st.moves <= Math.ceil(st.par * 1.1) ? 3 : st.moves <= Math.ceil(st.par * 1.4) ? 2 : 1);
export const isPerfect = (st) => st.moves <= st.par;
export const newProfile = () => ({ v: 1, level: 1, solved: 0, hints: 3, carts: 2, coins: 0, stars: {}, best: {}, seen: {}, perfect: {}, coached: {}, daily: { last: "", streak: 0, best: 0, done: {} }, decor: { owned: ["sign:wood", "awning:none", "plant:none", "pet:none", "rug:none", "finish:oak"], equipped: { sign: "wood", awning: "none", plant: "none", pet: "none", rug: "none", finish: "oak" } } });
export const totalStars = (p) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
export function normalizeProfile(p = {}) {
  const d = newProfile(), o = { ...d, ...p, stars: { ...(p.stars || {}) }, best: { ...(p.best || {}) }, seen: { ...(p.seen || {}) }, perfect: { ...(p.perfect || {}) }, coached: { ...(p.coached || {}) }, daily: { ...d.daily, ...(p.daily || {}), done: { ...(p.daily?.done || {}) } }, decor: { owned: [...new Set([...d.decor.owned, ...(p.decor?.owned || [])])], equipped: { ...d.decor.equipped, ...(p.decor?.equipped || {}) } } };
  for (const k of ["hints", "carts"]) o[k] = Math.min(MAX_POWERUPS, Math.max(0, +o[k] || 0)); o.coins = Math.max(0, Math.floor(+o.coins || 0)); o.level = Math.max(1, Math.floor(o.level) || 1); return o;
}
/** Apply a won level. Stars only go up; the first clear opens the next level, pays coins, and earns a hint every 2nd clear and a cart every 4th; a boss ("Stock Take") pays a bonus. */
export function completeLevel(p, st) {
  const stars = starsFor(st), perfect = isPerfect(st), first = !(p.stars[st.level] > 0); p.stars[st.level] = Math.max(p.stars[st.level] || 0, stars); p.best[st.level] = Math.min(p.best[st.level] || 1e9, st.moves);
  const newPerfect = perfect && !p.perfect[st.level]; if (perfect) p.perfect[st.level] = true;
  p.level = Math.max(p.level, st.level + 1); const reward = { hint: 0, cart: 0, coins: 0 }, give = (key, n) => { const got = Math.min(n, MAX_POWERUPS - p[key]); p[key] += got; return got; };
  if (first) { p.solved++; reward.coins += 4 + stars * 3 + (st.boss ? 25 : 0); if (p.solved % 2 === 0) reward.hint += give("hints", 1); if (p.solved % 4 === 0) reward.cart += give("carts", 1); if (st.boss) { reward.hint += give("hints", 1); reward.cart += give("carts", 1); } }
  if (newPerfect) reward.coins += 6; p.coins += reward.coins;
  return { stars, first, perfect, newPerfect, boss: !!st.boss, reward };
}
/** Finish a Daily Delivery: pays once per day, a streak builds on consecutive days. */
export function completeDaily(p, st, day) {
  const d = p.daily, first = !d.done[day], stars = starsFor(st), perfect = isPerfect(st); if (!first) return { first: false, stars, perfect, streak: d.streak, reward: { coins: 0, hint: 0, cart: 0 } };
  d.streak = d.last === prevDay(day) ? d.streak + 1 : 1; d.best = Math.max(d.best, d.streak); d.last = day; d.done[day] = stars; d.done = Object.fromEntries(Object.keys(d.done).sort().slice(-60).map((k) => [k, d.done[k]]));
  const reward = { coins: 15 + stars * 3 + Math.min(d.streak, 7) * 3 + (perfect ? 6 : 0), hint: 0, cart: 0 }; p.coins += reward.coins; if (d.streak % 2 === 0 && p.hints < MAX_POWERUPS) { p.hints++; reward.hint = 1; } if (d.streak % 3 === 0 && p.carts < MAX_POWERUPS) { p.carts++; reward.cart = 1; }
  p.solved++; return { first: true, stars, perfect, streak: d.streak, reward };
}

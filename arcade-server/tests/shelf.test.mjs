import test from "node:test";
import assert from "node:assert/strict";
import { specFor, deptOf, generate, newGame, accepts, whyNot, canMove, move, undo, addCart, hint, isSolved, bayDone, hasMoves, solve, topRun, starsFor, newProfile, normalizeProfile, completeLevel, totalStars, MAX_EXTRA, MAX_BAYS, SUBJECTS } from "../shelf/index.mjs";

const KEYS = [{ kind: "shirt", v: 0 }, { kind: "shirt", v: 1 }, { kind: "book", v: 0 }, { kind: "book", v: 1 }];   // keys 0,1 shirts; 2,3 books
const mk = (bays, cap = 3) => ({ v: 2, level: 1, dept: 0, cap, keys: KEYS, par: 5, moves: 0, extra: 0, history: [], done: false, won: false, bays: bays.map(([a, s, items], bi) => ({ a, s, items: items.map((k, i) => ({ id: bi * 100 + i, k: Math.abs(k), q: k < 0 })) })) });   // a negative key = a hidden item

test("departments: Clothing Corner, Book Nook, Boutique repeat every 10 levels; every spec is a legal shape", () => {
  assert.deepEqual([1, 10, 11, 20, 21, 30, 31, 41, 51].map(deptOf), [0, 0, 1, 1, 2, 2, 0, 1, 2]);
  for (let L = 1; L <= 300; L++) { const s = specFor(L); assert.ok(s.bays.length <= MAX_BAYS && s.cap >= 4 && s.cap <= 8, `level ${L}`); assert.ok(s.keys.length >= 3); if (s.dept === 1) { assert.ok(s.bays.filter((b) => typeof b.a === "number").length === s.keys.length); assert.ok(s.keys.every((k) => k.kind === "book" && k.v < SUBJECTS.length)); } if (s.dept === 2) assert.ok(s.keys.some((k) => k.kind === "shirt") && s.keys.some((k) => k.kind === "book")); assert.equal(s.hidden > 0, ((L - 1) % 10) + 1 >= 7 || L > 30, `hidden level ${L}`); }
  assert.ok(specFor(1).keys.length === 3 && specFor(10).keys.length > specFor(1).keys.length);
});
test("what each kind of bay accepts", () => {
  assert.equal(accepts("any", 3, KEYS), true); assert.equal(accepts("shirt", 0, KEYS), true); assert.equal(accepts("shirt", 2, KEYS), false); assert.equal(accepts("book", 3, KEYS), true); assert.equal(accepts(2, 2, KEYS), true); assert.equal(accepts(2, 3, KEYS), false);
});
test("moves obey the bay rules and every refusal explains itself", () => {
  const st = mk([["shirt", false, [0, 1]], ["book", false, [2]], [2, false, []], ["any", true, []], ["shirt", false, [0]], ["book", false, [3, 3, 3]]]);
  assert.equal(canMove(st, 0, 4), false, "a 1 does not match the 0"); assert.match(whyNot(st, 0, 4), /match/);
  assert.equal(canMove(st, 0, 1), false); assert.match(whyNot(st, 0, 1), /Only books/); assert.match(whyNot(st, 1, 0), /Only shirts/);
  assert.equal(canMove(st, 1, 2), true, "book 2 onto the shelf labelled for it"); assert.equal(canMove(st, 5, 2), false); assert.match(whyNot(st, 5, 2), new RegExp(`for ${SUBJECTS[0]} books`));
  assert.equal(canMove(st, 0, 3), true, "a cart takes anything"); assert.match(whyNot(st, 5, 1), /full|match/); assert.match(whyNot(st, 3, 0), /empty/); assert.equal(whyNot(st, 0, 0) !== null, true);
  const full = mk([["any", false, [0, 0, 0]], ["any", false, [0]]]); assert.match(whyNot(full, 1, 0), /full/);
});
test("win rule: carts must be empty, a labelled shelf must be full of its own subject, ordinary bays full and one colour or empty", () => {
  const ok = mk([["shirt", false, [0, 0, 0]], ["shirt", false, [1, 1, 1]], [2, false, [2, 2, 2]], [3, false, [3, 3, 3]], ["any", true, []]]); assert.equal(isSolved(ok), true);
  const cart = mk([["shirt", false, [0, 0, 0]], ["shirt", false, [1, 1]], [2, false, [2, 2, 2]], [3, false, [3, 3, 3]], ["any", true, [1]]]); assert.equal(isSolved(cart), false);
  const wrong = mk([["any", false, [2, 2, 2]], [2, false, []], [3, false, [3, 3, 3]], ["any", true, []]]); assert.equal(isSolved(wrong), false, "the subject must sit on ITS shelf");
  const part = mk([["any", false, [0, 0]], ["any", false, []]]); assert.equal(isSolved(part), false); assert.equal(bayDone(ok, 0), true); assert.equal(bayDone(ok, 4), false);
});
test("a whole run moves, hidden items come to light on the new top, undo hides them again", () => {
  const st = mk([["any", false, [-2, -1, 0, 0]], ["any", false, [0]], ["any", false, []]], 4); assert.equal(topRun(st, 0), 2);
  const r = move(st, 0, 1); assert.ok(r.ok && r.n === 2); assert.equal(st.bays[1].items.length, 3); assert.equal(st.bays[0].items[1].q, false); assert.equal(r.revealed, st.bays[0].items[1].id); assert.equal(st.bays[0].items[0].q, true);
  undo(st); assert.equal(st.bays[0].items.length, 4); assert.equal(st.bays[0].items[1].q, true); assert.equal(st.moves, 0);
  const cap = mk([["any", false, [0, 0, 0]], ["any", false, [0, 0]], ["any", false, []]], 4); assert.equal(move(cap, 0, 1).n, 2, "only two fit");
});
test("finishing a bay is reported, and the last move wins", () => {
  const st = mk([["any", false, [0, 0]], ["any", false, [0]], ["shirt", false, [1, 1, 1]], [2, false, [2, 2, 2]], [3, false, [3, 3, 3]], ["any", true, []]]);
  const r = move(st, 1, 0); assert.ok(r.ok && r.finished.includes(0) && r.won === true && st.won === true);
});
test("carts: addCart adds a cart, at most MAX_EXTRA per level", () => {
  const st = mk([["any", false, [0]], ["any", false, []]]); for (let i = 0; i < MAX_EXTRA; i++) assert.equal(addCart(st), true); assert.equal(addCart(st), false); assert.equal(st.bays.slice(2).every((b) => b.s && b.a === "any" && b.items.length === 0), true);
});
test("every level 1-120 is solvable, deterministic, fully dealt, messy, with unique ids and no hidden top item", () => {
  for (let L = 1; L <= 120; L++) {
    const g = newGame(L), s = specFor(L), ids = g.bays.flatMap((b) => b.items).map((n) => n.id); assert.equal(new Set(ids).size, ids.length);
    const counts = {}; for (const n of g.bays.flatMap((b) => b.items)) counts[n.k] = (counts[n.k] || 0) + 1; assert.equal(Object.keys(counts).length, s.keys.length, `level ${L}`); for (const k in counts) assert.equal(counts[k], s.cap);
    assert.ok(g.par > 0 && !isSolved(g)); assert.ok(g.bays.every((b) => b.items.length <= s.cap)); assert.ok(g.bays.every((b) => !b.items.length || !b.items[b.items.length - 1].q), "the top item is never hidden");
    assert.ok(g.bays.filter((b) => b.s).every((b) => b.items.length === 0 || s.dept === 1), "only the Book Nook cart starts loaded");
    if (L % 17 === 1) assert.deepEqual(newGame(L), g, "deterministic");
    if (s.hidden === 0) assert.equal(g.bays.flatMap((b) => b.items).filter((n) => n.q).length, 0);
  }
});
test("hints: following the hint finishes levels in every department, and every hint is legal", () => {
  for (const L of [1, 7, 12, 17, 22, 28, 34, 45]) { const st = newGame(L); let guard = 0; while (!st.done && guard++ < st.par * 3 + 20) { const h = hint(st); assert.ok(h, `level ${L}: a hint exists`); assert.ok(canMove(st, h.from, h.to)); assert.ok(move(st, h.from, h.to).ok); } assert.ok(st.won, `level ${L} finished by hints`); assert.ok(st.moves <= st.par * 2 + 10); assert.equal(isSolved(st), true); }
});
test("a dead end has no legal moves; a fresh level does", () => {
  const dead = mk([["any", false, [0, 1, 0]], ["any", false, [1, 0, 1]]]); assert.equal(hasMoves(dead), false); assert.equal(hasMoves(newGame(3)), true);
});
test("stars, profile and rewards", () => {
  const st = newGame(2); st.par = 10; st.moves = 12; assert.equal(starsFor(st), 3); st.moves = 15; assert.equal(starsFor(st), 2); st.moves = 40; assert.equal(starsFor(st), 1);
  const p = newProfile(), a = completeLevel(p, { level: 1, moves: 9, par: 8 }); assert.ok(a.first && p.level === 2 && p.stars[1] === 3);
  assert.equal(completeLevel(p, { level: 1, moves: 80, par: 8 }).first, false); assert.equal(p.stars[1], 3, "stars only go up");
  for (let l = 2; l <= 4; l++) completeLevel(p, { level: l, moves: 5, par: 5 }); assert.equal(p.hints, 5); assert.equal(p.carts, 3); assert.equal(totalStars(p), 12);
  const old = normalizeProfile({ level: 5, hints: 99 }); assert.equal(old.hints, 9); assert.equal(old.carts, 2); assert.deepEqual(old.seen, {}); assert.equal(normalizeProfile().level, 1);
});
test("the solver handles a tiny labelled puzzle", () => {
  const rules = [{ a: 2, s: false }, { a: 3, s: false }, { a: "any", s: true }, { a: "any", s: true }], p = solve([[3, 2], [2, 3], [], []], rules, 2, KEYS); assert.ok(p && p.length >= 3);
});

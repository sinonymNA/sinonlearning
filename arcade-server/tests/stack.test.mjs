import test from "node:test";
import assert from "node:assert/strict";
import { specFor, generate, newGame, canMove, move, undo, addBolt, hint, isSolved, stuck, solve, topRun, boltDone, starsFor, newProfile, normalizeProfile, completeLevel, totalStars, MAX_EXTRA, MAX_COLORS } from "../stack/index.mjs";

const mk = (rows, cap = 4) => ({ v: 1, level: 1, cap, colors: 3, par: 5, moves: 0, extra: 0, history: [], done: false, won: false, bolts: rows.map((r, bi) => r.map((c, i) => ({ id: bi * 100 + i, c: Math.abs(c), q: c < 0 }))) });   // negative = hidden "?" nut

test("level ramp: colours and bolt height grow, never more than 14 bolts, mystery nuts only from level 8", () => {
  assert.equal(specFor(1).colors, 3); assert.equal(specFor(1).cap, 4); assert.ok(specFor(30).colors > specFor(5).colors && specFor(60).cap > specFor(5).cap);
  for (let L = 1; L <= 400; L++) { const s = specFor(L); assert.ok(s.colors <= MAX_COLORS && s.colors + s.empties <= 14 && s.cap <= 9 && s.cap >= 4); assert.equal(s.mystery > 0, L >= 8); }
});
test("moving: a run goes onto an empty bolt or a matching top; mismatches, full bolts and the same bolt are refused", () => {
  const st = mk([[0, 1, 1], [2, 1], [], [0, 0, 0, 0]]);
  assert.equal(canMove(st, 0, 1), true, "1 onto 1"); assert.equal(canMove(st, 0, 2), true, "empty target"); assert.equal(canMove(st, 3, 1), false, "a 0 cannot land on a 1"); assert.equal(canMove(st, 3, 3), false);
});
test("a whole run moves together, limited by space; mystery nuts reveal when they become the top; undo hides them again", () => {
  const st = mk([[-3, -2, 1, 1], [0, 1], [], []]); assert.equal(topRun(st, 0), 2);
  const r = move(st, 0, 1); assert.ok(r.ok); assert.equal(r.n, 2); assert.equal(st.bolts[1].length, 4); assert.equal(st.bolts[0].length, 2);
  assert.equal(st.bolts[0][1].q, false, "the nut that came to light is shown"); assert.equal(r.revealed, st.bolts[0][1].id); assert.equal(st.bolts[0][0].q, true, "still hidden under it");
  assert.equal(st.moves, 1); undo(st); assert.equal(st.bolts[0].length, 4); assert.equal(st.bolts[0][1].q, true, "undo hides it again"); assert.equal(st.moves, 0);
  const cap = mk([[1, 1, 1], [1, 1], []], 4); const m = move(cap, 0, 1); assert.equal(m.n, 2, "only two fit"); assert.equal(cap.bolts[0].length, 1);
});
test("rules are enforced by canMove", () => {
  const st = mk([[0, 1], [1, 0], [1], []]); assert.equal(canMove(st, 0, 2), true); assert.equal(canMove(st, 1, 0), false, "0 cannot land on 1"); assert.equal(canMove(st, 0, 0), false); assert.equal(canMove(st, 3, 0), false, "nothing to move");
  const full = mk([[1, 1, 1, 1], [1]], 4); assert.equal(canMove(full, 1, 0), false, "full bolt");
});
test("solved and win: every bolt empty or full of one colour", () => {
  const st = mk([[0, 0, 0, 0], [1, 1, 1, 1], []]); assert.equal(isSolved(st), true); assert.equal(boltDone(st, 0), true); assert.equal(boltDone(st, 2), false);
  const g = mk([[0, 0, 0], [1, 1, 1, 1], [0]], 4); assert.equal(isSolved(g), false); assert.ok(move(g, 2, 0).ok); assert.equal(g.won, true, "the last move wins");
});
test("extra bolt: adds an empty bolt, at most MAX_EXTRA per level", () => {
  const st = mk([[0, 0], []]); for (let i = 0; i < MAX_EXTRA; i++) assert.equal(addBolt(st), true); assert.equal(addBolt(st), false); assert.equal(st.bolts.length, 2 + MAX_EXTRA);
});
test("every level 1-120 is solvable, deterministic, has unique nut ids, the right nut counts, and par > 0", () => {
  for (let L = 1; L <= 120; L++) {
    const g = newGame(L), s = specFor(L), ids = g.bolts.flat().map((n) => n.id); assert.equal(new Set(ids).size, ids.length); assert.equal(g.bolts.length, s.colors + s.empties);
    const counts = {}; for (const n of g.bolts.flat()) counts[n.c] = (counts[n.c] || 0) + 1; assert.equal(Object.keys(counts).length, s.colors); for (const c in counts) assert.equal(counts[c], s.cap);
    assert.ok(g.par > 0); assert.ok(g.bolts.every((b) => b.length <= s.cap)); assert.equal(isSolved(g), false);
    if (L % 15 === 1) assert.deepEqual(newGame(L), g, "deterministic");
    const top = g.bolts.flat().filter((n) => n.q); if (s.mystery === 0) assert.equal(top.length, 0);
    for (const b of g.bolts) if (b.length) assert.equal(b[b.length - 1].q, false, "the top nut is never hidden");
  }
});
test("hints: following the hint every time finishes the level, and a hint is always a legal move", () => {
  for (const L of [1, 7, 14, 25, 45]) { const st = newGame(L); let guard = 0; while (!st.done && guard++ < st.par * 3 + 20) { const h = hint(st); assert.ok(h, `level ${L}: a hint exists`); assert.ok(canMove(st, h.from, h.to)); assert.ok(move(st, h.from, h.to).ok); } assert.ok(st.won, `level ${L} finished by hints`); assert.ok(st.moves <= st.par * 2 + 10); }
});
test("stuck: a board with no way out is detected, a normal one is not", () => {
  const dead = mk([[0, 1, 0, 1], [1, 0, 1, 0]], 4); assert.equal(stuck(dead), true); assert.equal(stuck(newGame(3)), false);
  assert.equal(solve([[0, 1], [1, 0], [], []], 2).length > 0, true);
});
test("stars, profile and rewards", () => {
  const st = newGame(2); st.par = 10; st.moves = 12; assert.equal(starsFor(st), 3); st.moves = 15; assert.equal(starsFor(st), 2); st.moves = 40; assert.equal(starsFor(st), 1);
  const p = newProfile(), a = completeLevel(p, { level: 1, moves: 9, par: 8, bolts: [] }); assert.ok(a.first && p.level === 2 && p.stars[1] === 3);
  const b = completeLevel(p, { level: 1, moves: 80, par: 8 }); assert.equal(b.first, false); assert.equal(p.stars[1], 3, "stars only go up");
  for (let l = 2; l <= 4; l++) completeLevel(p, { level: l, moves: 5, par: 5 }); assert.equal(p.hints, 3 + 2); assert.equal(p.bolts, 2 + 1); assert.equal(totalStars(p), 12);
  const old = normalizeProfile({ level: 5, hints: 99 }); assert.equal(old.hints, 9); assert.equal(old.bolts, 2); assert.equal(normalizeProfile().level, 1);
});

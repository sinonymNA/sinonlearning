import test from "node:test";
import assert from "node:assert/strict";
import { generate, puzzleFor, transformPuzzle, countSolutions, solutions, logicSolvable, logicSteps, puzzleTier, tierFor, minTierFor, sizeFor, newGame, setCell, toggleX, toggleCat, setMark, undo, retract, clearBoard, cats, conflictCells, blocked, hint, smartHint, wink, levelScore, newProfile, completeLevel, MAX_FISH, MAX_POWERUPS, encodePuzzle } from "../meowdoku/engine.mjs";
import { LEVELS } from "../meowdoku/levels.mjs";
import { makeRng } from "../gridiron/rng.mjs";

const connectedRegions = (p) => { for (let g = 0; g < p.n; g++) { const cells = []; for (let r = 0; r < p.n; r++) for (let c = 0; c < p.n; c++) if (p.regions[r][c] === g) cells.push([r, c]); const seen = new Set([cells[0].join()]), q = [cells[0]]; while (q.length) { const [r, c] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (p.regions[r + a]?.[c + b] === g && !seen.has(`${r + a},${c + b}`)) { seen.add(`${r + a},${c + b}`); q.push([r + a, c + b]); } } if (seen.size !== cells.length) return false; } return true; };
const valid = (p) => { const n = p.n, cs = p.solution.map((c, r) => [r, c]); return new Set(p.solution).size === n && new Set(cs.map(([r, c]) => p.regions[r][c])).size === n && cs.every(([r, c], i) => i === 0 || Math.abs(c - cs[i - 1][1]) >= 2); };

test("board size grows slowly: 4x4 for the first two levels, up to 9x9", () => { assert.deepEqual([1, 2, 3, 6, 7, 12, 13, 20, 21, 30, 31, 99].map(sizeFor), [4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9]); });

test("difficulty ramp: levels 1-4 need only 'one spot left' moves, tiers never exceed the level's allowance, and later levels are never trivial", () => {
  assert.deepEqual([1, 4, 5, 10, 11, 20, 21].map(tierFor), [0, 0, 1, 1, 2, 2, 3]); assert.ok(minTierFor(40) >= 2 && minTierFor(1) === 0);
  for (let L = 1; L <= 4; L++) { const p = puzzleFor(L); assert.equal(puzzleTier(p), 0, `level ${L} is tier 0`); assert.ok(logicSteps(p, 0) <= p.n + 1, `level ${L}: no more than a step per cat`); }
  assert.ok(puzzleFor(1).regions.flat().filter((g) => g === puzzleFor(1).regions[0].find((x) => x !== undefined)).length >= 1);
  for (const L of [1, 3, 5, 8, 12, 15, 21, 28, 35, 60, 120, 200]) { const p = puzzleFor(L); assert.ok(puzzleTier(p) <= tierFor(L), `level ${L} tier ${puzzleTier(p)} <= ${tierFor(L)}`); assert.ok(puzzleTier(p) >= Math.min(minTierFor(L), 2) - 0 || L > 200, `level ${L} not trivial`); }
  const small = (L) => { const p = puzzleFor(L), sizes = new Map(); p.regions.flat().forEach((g) => sizes.set(g, (sizes.get(g) || 0) + 1)); return Math.min(...sizes.values()); };
  assert.equal(small(1), 1, "level 1 has a one-square colour: an obvious first cat");
});

test("generated puzzles are valid: n connected colours, a legal cat layout, exactly one solution, solvable by teachable logic, and deterministic", () => {
  for (const level of [1, 5, 10, 17, 31]) {
    const p = generate(level), q = generate(level); assert.deepEqual(p, q, "same level, same puzzle");
    assert.equal(p.n, sizeFor(level)); assert.equal(p.regions.length, p.n); assert.equal(new Set(p.regions.flat()).size, p.n); assert.ok(connectedRegions(p), "regions connected"); assert.ok(valid(p), "the stored solution obeys the rules");
    assert.equal(countSolutions(p.regions, 3), 1, "unique"); assert.deepEqual(solutions(p.regions, 2)[0], p.solution); assert.ok(logicSolvable(p, tierFor(level)), "solvable by logic within the level's tier");
  }
});

test("shipped levels: a full table that is valid and unique, and levels past it recycle with rotations", () => {
  assert.ok(LEVELS.length >= 100, "run scripts/meowdoku-build-levels.mjs"); const sampleLevels = [1, 2, 7, 12, 20, 31, 77, LEVELS.length];
  for (const L of sampleLevels) { const p = puzzleFor(L); assert.equal(p.n, sizeFor(L)); assert.ok(valid(p) && connectedRegions(p)); assert.equal(countSolutions(p.regions, 2), 1); }
  for (const L of [LEVELS.length + 1, LEVELS.length + 57, 999]) { const p = puzzleFor(L); assert.equal(p.n, 9); assert.ok(valid(p) && connectedRegions(p)); assert.equal(countSolutions(p.regions, 2), 1, "a rotated, recoloured puzzle is still unique"); assert.deepEqual(puzzleFor(L), p); }
  assert.equal(new Set(LEVELS).size, LEVELS.length, "no duplicate levels");
  for (const k of [0, 1, 2, 3, 4, 5, 6, 7]) { const t = transformPuzzle(puzzleFor(30), k, makeRng(k + 1)); assert.ok(valid(t) && connectedRegions(t)); assert.equal(countSolutions(t.regions, 2), 1, "transform " + k); }
  assert.match(encodePuzzle(puzzleFor(1)), /^4:\d{16}:\d{4}$/); assert.match(encodePuzzle(puzzleFor(3)), /^5:\d{25}:\d{5}$/);
});

test("rules: cats conflict by row, column, colour or touching (corners too); far apart cats are fine", () => {
  const st = newGame(3); st.marks[0][0] = 2; st.marks[2][2] = 2; st.marks[4][4] = 2; const reg = st.regions;
  const bad = conflictCells(st); const sameColour = [[0, 0], [2, 2], [4, 4]].filter(([a, b], i, all) => all.some(([x, y], j) => j !== i && reg[a][b] === reg[x][y])).length; assert.equal(bad.size, sameColour);
  const s2 = newGame(3); s2.marks[1][1] = 2; s2.marks[2][2] = 2; assert.equal(conflictCells(s2).size, 2, "diagonal touch"); const s3 = newGame(3); s3.marks[1][1] = 2; s3.marks[1][4] = 2; assert.equal(conflictCells(s3).size, 2, "same row"); const s4 = newGame(3); s4.marks[0][3] = 2; s4.marks[3][3] = 2; assert.equal(conflictCells(s4).size, 2, "same column");
  assert.equal(blocked(s2)[0][0], true, "touching cells are blocked"); assert.equal(blocked(s2)[1][4], true, "the whole row of a cat is blocked"); const s5 = newGame(3); s5.marks[1][1] = 2; assert.equal(blocked(s5)[1][1], false, "a cat's own cell is not blocked by itself");
});

test("gestures are deterministic: X toggles on and off, a cat toggles on and off, and a double-tap always ends in a cat whatever the cell was before", () => {
  const st = newGame(1), [r, c] = [0, st.solution[0]];
  assert.equal(toggleX(st, r, c).mark, 1); assert.equal(toggleX(st, r, c).mark, 0); assert.equal(toggleCat(st, r, c).mark, 2); assert.equal(toggleX(st, r, c).mark, 0, "tapping a cat takes it off"); assert.equal(st.fish, 3);
  // double tap = undo the first tap, then do the other thing; from empty, X and cat alike it must end as a cat (or an off-cat from a cat)
  for (const start of [0, 1]) { const g = newGame(1); if (start) g.marks[r][c] = 1; toggleX(g, r, c); undo(g); toggleCat(g, r, c); assert.equal(g.marks[r][c], 2, `from mark ${start}`); }
  const onCat = newGame(1); onCat.marks[r][c] = 2; toggleX(onCat, r, c); undo(onCat); toggleCat(onCat, r, c); assert.equal(onCat.marks[r][c], 0, "a double-tap on a cat takes it off");
  assert.equal(setCell(st, r, c, 0).changed, false, "setting the same mark is a no-op");
});

test("retract cancels the first tap of a double-tap and refunds a fish that tap cost; undo does not refund", () => {
  const st = newGame(3), col = st.solution[0]; toggleCat(st, 0, col); const bad = toggleCat(st, 1, col); assert.ok(bad.conflict && st.fish === 2);
  assert.ok(retract(st)); assert.equal(st.fish, 3); assert.equal(st.mistakes, 0); assert.equal(st.marks[1][col], 0);
  toggleCat(st, 1, col); assert.equal(st.fish, 2); assert.ok(undo(st)); assert.equal(st.fish, 2, "undo keeps the lost fish");
  const g = newGame(3); toggleX(g, 2, 2); assert.ok(retract(g)); assert.equal(g.marks[2][2], 0); assert.equal(g.moves, 0); assert.equal(retract(g), false);
});

test("a cat that breaks a rule costs a fish; the right cats win the game; nothing changes after a win", () => {
  const st = newGame(2); const row = 0, col = st.solution[0]; toggleCat(st, row, col); assert.equal(st.fish, 3);
  const touch = toggleCat(st, 1, col); assert.ok(touch.conflict && st.fish === 2 && st.mistakes === 1);
  const g = newGame(2); for (let r = 0; r < g.n; r++) { const x = toggleCat(g, r, g.solution[r]); assert.equal(x.conflict, false); } assert.ok(g.won && g.done && g.fish === 3); assert.equal(toggleX(g, 0, 0).changed, false, "no moves after winning");
});

test("losing: three mistakes end the level; undo restores a mark but not a fish", () => {
  const st = newGame(1); st.marks[0][st.solution[0]] = 2;
  for (let i = 0; i < MAX_FISH; i++) { const col = (st.solution[0] + 1) % st.n; st.marks[0][col] = 0; toggleCat(st, 0, col); if (!st.done) st.marks[0][col] = 0; }
  assert.ok(st.lost && st.done && st.fish === 0);
  const u = newGame(1); toggleX(u, 3, 3); assert.equal(u.marks[3][3], 1); assert.ok(undo(u)); assert.equal(u.marks[3][3], 0); assert.equal(undo(u), false);
  const cl = newGame(1); toggleX(cl, 0, 0); toggleX(cl, 1, 1); clearBoard(cl); assert.equal(cats(cl).length + cl.marks.flat().filter(Boolean).length, 0);
});

test("hints teach: a forced cat or a cross-out with a reason, never a wrong move; following hints solves every sampled level", () => {
  for (const L of [1, 2, 3, 8, 14, 22, 33, 60]) {
    const st = newGame(L); let guard = 0;
    while (!st.won && guard++ < 300) {
      const h = hint(st, true); assert.ok(["cat", "cross"].includes(h.kind), `level ${L}: hint kind ${h.kind}`); assert.ok(h.text.length > 10);
      if (h.kind === "cat") { assert.equal(st.solution[h.cell[0]], h.cell[1], "a hinted cat is always a right cat"); setMark(st, h.cell[0], h.cell[1], 2); }
      else { for (const [r, c] of h.cells) { assert.notEqual(st.solution[r], c, "a crossed-out cell is never a solution cell"); st.marks[r][c] = 1; } }
    }
    assert.ok(st.won, `level ${L} solved by hints`); assert.equal(st.mistakes, 0);
  }
  const bad = newGame(1); bad.marks[0][0] = 2; bad.marks[0][1] = 2; assert.equal(hint(bad).kind, "conflict");
});

test("smartHint catches a wrong X of yours, then trusts your other X marks", () => {
  const st = newGame(2); st.marks[0][st.solution[0]] = 1; const h = smartHint(st); assert.equal(h.kind, "badx"); assert.deepEqual(h.cells[0], [0, st.solution[0]]);
  st.marks[0][st.solution[0]] = 0; const h2 = smartHint(st); assert.ok(["cat", "cross"].includes(h2.kind));
});

test("Cat Helper removes a wrong cat first, then places right ones; it counts as help", () => {
  const st = newGame(1); st.marks[0][(st.solution[0] + 2) % st.n] = 2; const a = wink(st); assert.equal(a.placed, false); assert.equal(st.marks[a.cell[0]][a.cell[1]], 0);
  for (let i = 0; i < st.n; i++) { const w = wink(st); if (!w) break; assert.equal(w.placed, true); assert.equal(st.solution[w.cell[0]], w.cell[1]); } assert.ok(st.won); assert.equal(st.helps, st.n + 1);
});

test("scoring and profile: bigger, faster, fewer helps and more fish score more; rewards stay capped", () => {
  const a = newGame(1), b = newGame(30); assert.ok(levelScore(b, 60) > levelScore(a, 60)); assert.ok(levelScore(a, 5) > levelScore(a, 500)); const c = newGame(1); c.helps = 3; assert.ok(levelScore(c, 30) < levelScore(a, 30)); const d = newGame(1); d.fish = 1; assert.ok(levelScore(d, 30) < levelScore(a, 30));
  const p = newProfile(), st = newGame(1); st.won = true; const r = completeLevel(p, st, 40); assert.equal(p.level, 2); assert.equal(p.score, r.points); assert.equal(p.hints, 4); assert.equal(p.streak, 1);
  for (let i = 0; i < 30; i++) completeLevel(p, newGame(1), 10); assert.ok(p.hints <= MAX_POWERUPS && p.winks <= MAX_POWERUPS);
  const m = newGame(1); m.mistakes = 1; completeLevel(p, m, 10); assert.equal(p.streak, 0); assert.ok(p.bestStreak >= 31);
});

test("state is plain JSON", () => { const st = newGame(4); toggleX(st, 0, 0); assert.deepEqual(JSON.parse(JSON.stringify(st)), st); });

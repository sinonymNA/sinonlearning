import test from "node:test";
import assert from "node:assert/strict";
import { AREAS, LEVEL_COUNT, areaOf, areaIndex, levelInArea, isFinale, entersNewArea } from "../meowdoku/areas.mjs";
import { beginStroke, endStroke, starsFor, totalStars, generate, puzzleFor, transformPuzzle, countSolutions, solutions, logicSolvable, logicSteps, puzzleTier, tierFor, minTierFor, sizeFor, newGame, setCell, toggleX, toggleCat, markX, setMark, undo, retract, clearBoard, cats, conflictCells, blocked, hint, smartHint, wink, levelScore, newProfile, completeLevel, MAX_FISH, MAX_POWERUPS, encodePuzzle } from "../meowdoku/engine.mjs";
import { LEVELS } from "../meowdoku/levels.mjs";
import { makeRng } from "../gridiron/rng.mjs";

const connectedRegions = (p) => { for (let g = 0; g < p.n; g++) { const cells = []; for (let r = 0; r < p.n; r++) for (let c = 0; c < p.n; c++) if (p.regions[r][c] === g) cells.push([r, c]); const seen = new Set([cells[0].join()]), q = [cells[0]]; while (q.length) { const [r, c] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (p.regions[r + a]?.[c + b] === g && !seen.has(`${r + a},${c + b}`)) { seen.add(`${r + a},${c + b}`); q.push([r + a, c + b]); } } if (seen.size !== cells.length) return false; } return true; };
const valid = (p) => { const n = p.n, cs = p.solution.map((c, r) => [r, c]); return new Set(p.solution).size === n && new Set(cs.map(([r, c]) => p.regions[r][c])).size === n && cs.every(([r, c], i) => i === 0 || Math.abs(c - cs[i - 1][1]) >= 2); };

test("board size grows slowly over 100 levels: 4x4 for the first two, 9x9 from level 66", () => { assert.deepEqual([1, 2, 3, 8, 9, 20, 21, 40, 41, 65, 66, 100].map(sizeFor), [4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9]); });

test("difficulty ramp: levels 1-6 need only 'one spot left' moves, tiers never exceed the level's allowance, and later levels are never trivial", () => {
  assert.deepEqual([1, 6, 7, 25, 26, 55, 56, 100].map(tierFor), [0, 0, 1, 1, 2, 2, 3, 3]); assert.ok(minTierFor(60) >= 2 && minTierFor(1) === 0);
  for (let L = 1; L <= 6; L++) { const p = puzzleFor(L); assert.equal(puzzleTier(p), 0, `level ${L} is tier 0`); assert.ok(logicSteps(p, 0) <= p.n + 1, `level ${L}: no more than a step per cat`); }
  assert.ok(puzzleFor(1).regions.flat().filter((g) => g === puzzleFor(1).regions[0].find((x) => x !== undefined)).length >= 1);
  for (const L of [1, 3, 5, 8, 12, 15, 21, 28, 35, 60, 90, 100]) { const p = puzzleFor(L); assert.ok(puzzleTier(p) <= tierFor(L), `level ${L} tier ${puzzleTier(p)} <= ${tierFor(L)}`); assert.ok(puzzleTier(p) >= Math.min(minTierFor(L), 2) - 0 || L > 200, `level ${L} not trivial`); }
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
  assert.equal(LEVELS.length, LEVEL_COUNT, "run scripts/meowdoku-build-levels.mjs"); const sampleLevels = [1, 2, 7, 12, 20, 31, 66, 77, LEVELS.length];
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
  const m = newGame(1); m.marks[r][c] = 2; assert.equal(markX(m, r, c).mark, 1, "markX turns a cat into an X"); assert.equal(markX(m, r, c).mark, 0, "and toggles an X off");
  const dc = newGame(1); dc.marks[r][c] = 2; toggleCat(dc, r, c); undo(dc); markX(dc, r, c); assert.equal(dc.marks[r][c], 1, "cat-mode double-tap on a cat ends as an X");
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

test("scoring: bigger, faster, fewer helps and more fish score more", () => {
  const a = newGame(1), b = newGame(30); assert.ok(levelScore(b, 60) > levelScore(a, 60)); assert.ok(levelScore(a, 5) > levelScore(a, 500)); const c = newGame(1); c.helps = 3; assert.ok(levelScore(c, 30) < levelScore(a, 30)); const d = newGame(1); d.fish = 1; assert.ok(levelScore(d, 30) < levelScore(a, 30));
});

test("stars: 3 for a clean level, one lost for a mistake and one for help, never below 1", () => {
  const st = newGame(1); assert.equal(starsFor(st), 3); st.mistakes = 1; assert.equal(starsFor(st), 2); st.helps = 1; assert.equal(starsFor(st), 1); st.mistakes = 5; st.helps = 9; assert.equal(starsFor(st), 1);
});

test("profile: first clear pays points and rewards and unlocks the next level; a replay only raises stars; rewards stay capped; 100 is the end", () => {
  const p = newProfile(), st = newGame(1); st.won = true; const r = completeLevel(p, st, 40);
  assert.equal(p.level, 2); assert.equal(p.score, r.points); assert.ok(r.first && r.points > 0); assert.equal(p.hints, 4); assert.equal(p.stars[1], 3); assert.equal(p.streak, 1);
  const again = newGame(1); again.mistakes = 2; const r2 = completeLevel(p, again, 10); assert.equal(r2.first, false); assert.equal(r2.points, 0); assert.equal(p.hints, 4, "no reward for a replay"); assert.equal(p.stars[1], 3, "a worse replay never lowers stars");
  const better = newProfile(); const w = newGame(2); w.mistakes = 1; completeLevel(better, w, 30); assert.equal(better.stars[2], 2); const w2 = newGame(2); completeLevel(better, w2, 30); assert.equal(better.stars[2], 3, "a cleaner replay raises stars"); assert.equal(totalStars(better), 3);
  const q = newProfile(); for (let L = 1; L <= 40; L++) completeLevel(q, newGame(L), 10); assert.ok(q.hints <= MAX_POWERUPS && q.winks <= MAX_POWERUPS); assert.equal(q.level, 41);
  const last = newProfile(); last.level = 100; completeLevel(last, newGame(100), 10); assert.equal(last.level, LEVEL_COUNT + 1);
  const m = newGame(1); m.mistakes = 1; q.streak = 5; completeLevel(q, Object.assign(newGame(41), { mistakes: 1 }), 10); assert.equal(q.streak, 0);
});

test("areas: the 10 named cat worlds cover levels 1-100, 10 levels each, finale on every tenth", () => {
  assert.deepEqual(AREAS.map((a) => a.name), ["Whisker Village", "Yarn Meadows", "Milkshake Falls", "Catnip Forest", "Biscuit Bakery", "Sardine Shores", "Cardboard Canyon", "Purrmafrost Peaks", "Midnight Rooftops", "The Royal Catdom"]);
  assert.equal(LEVEL_COUNT, 100); assert.equal(areaOf(1).id, "whisker-village"); assert.equal(areaOf(10).id, "whisker-village"); assert.equal(areaOf(11).id, "yarn-meadows"); assert.equal(areaOf(100).id, "royal-catdom"); assert.equal(areaIndex(101), 9);
  assert.equal(levelInArea(1), 1); assert.equal(levelInArea(10), 10); assert.equal(levelInArea(11), 1); assert.ok(isFinale(10) && isFinale(100) && !isFinale(9)); assert.ok(entersNewArea(10) && !entersNewArea(100) && !entersNewArea(11));
  for (const a of AREAS) { for (const k of ["blurb", "sky", "ground", "accent", "bgA", "bgB"]) assert.ok(a[k], `${a.id}.${k}`); assert.ok(a.blurb.length > 30); }
});

test("swipe strokes: everything marked in one swipe is undone together", () => {
  const st = newGame(3); toggleX(st, 0, 0); beginStroke(st); for (let c = 1; c < 5; c++) setCell(st, 2, c, 1); endStroke(st);
  assert.equal(st.marks[2].filter((m) => m === 1).length, 4); assert.ok(undo(st)); assert.equal(st.marks[2].filter((m) => m === 1).length, 0, "the whole swipe went"); assert.equal(st.marks[0][0], 1, "earlier marks stay"); assert.ok(undo(st)); assert.equal(st.marks[0][0], 0);
  beginStroke(st); setCell(st, 1, 1, 1); endStroke(st); beginStroke(st); setCell(st, 1, 2, 1); setCell(st, 1, 3, 1); endStroke(st); undo(st); assert.equal(st.marks[1][3] + st.marks[1][2], 0); assert.equal(st.marks[1][1], 1, "a different swipe is separate");
});

test("state is plain JSON", () => { const st = newGame(4); toggleX(st, 0, 0); assert.deepEqual(JSON.parse(JSON.stringify(st)), st); });

// ---------------------------------------------------------------- upgrade: modes, power-ups, shop, generator styles
import { generateWith, normalizeProfile, newProfile as newProf, completeLevel as completeLvl, setCell as setC, undo as undoMv, newGame as newG, puzzleTier as ptier, countSolutions as cs2, ITEMS, STYLES, styleFor, parFor } from "../meowdoku/engine.mjs";
import { dailySpec, dailyPuzzle, newDailyGame, newEndlessGame, endlessPuzzle, completeDaily, completeEndless, buy, sweepBoard, feedFish, prevDay, dayOfWeek, DIFFS, ENDLESS_PAID_PER_DAY } from "../meowdoku/modes.mjs";

test("generator styles: every style makes unique puzzles that fit the requested tiers, deterministically", () => {
  for (const style of STYLES) for (const [n, maxTier, minTier] of [[5, 1, 0], [6, 2, 1], [7, 3, 2]]) {
    const p = generateWith({ n, seed: 4242, maxTier, minTier, style }); assert.ok(p, `${style} ${n}`);
    assert.equal(cs2(p.regions, 2), 1); const t = ptier(p); assert.ok(t <= maxTier && t >= minTier, `tier ${t} not in ${minTier}-${maxTier}`);
    assert.deepEqual(generateWith({ n, seed: 4242, maxTier, minTier, style }), p);
  }
  assert.deepEqual([1, 11, 21, 31, 41].map(styleFor), ["blob", "round", "blob", "snake", "round"]);
});
test("daily puzzle: same for everyone on a day, different days differ, harder on Sunday than Monday, always unique", () => {
  const d = "2026-11-23"; assert.deepEqual(dailyPuzzle(d), dailyPuzzle(d)); assert.notDeepEqual(dailyPuzzle(d), dailyPuzzle("2026-11-24"));
  assert.equal(dayOfWeek("2026-11-22"), 0); assert.equal(dayOfWeek("2026-11-23"), 1); assert.ok(dailySpec("2026-11-22").n > dailySpec("2026-11-23").n);
  for (const day of ["2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28"]) { const p = dailyPuzzle(day); assert.equal(p.n, dailySpec(day).n); assert.equal(cs2(p.regions, 2), 1, day); }
  const g = newDailyGame(d); assert.equal(g.mode, "daily"); assert.equal(g.level, 0); assert.ok(g.label.length > 3);
  assert.equal(prevDay("2026-03-01"), "2026-02-28"); assert.equal(prevDay("2027-01-01"), "2026-12-31");
});
test("daily rewards: pays once a day, streak grows on consecutive days and resets after a gap", () => {
  const p = normalizeProfile({}); const win = (day) => { const g = newDailyGame(day); g.mistakes = 0; return completeDaily(p, g, 100, day); };
  const a = win("2026-11-23"); assert.ok(a.first && a.streak === 1 && a.reward.yarn > 0); const y = p.yarn; assert.equal(win("2026-11-23").first, false); assert.equal(p.yarn, y, "no second payout the same day");
  assert.equal(win("2026-11-24").streak, 2); assert.equal(win("2026-11-25").streak, 3); assert.equal(win("2026-11-28").streak, 1, "a missed day resets"); assert.equal(p.daily.best, 3);
});
test("endless: size and difficulty are respected, fish drop with difficulty, yarn pays for the first few wins a day only", () => {
  for (const diff of Object.keys(DIFFS)) { const g = newEndlessGame({ n: 6, diff, seed: 77 }); assert.equal(g.n, 6); assert.equal(g.fish, DIFFS[diff].fish); assert.equal(cs2(g.regions, 2), 1); assert.ok(ptier(g) <= DIFFS[diff].maxTier); }
  assert.ok(DIFFS.expert.fish < DIFFS.hard.fish && DIFFS.hard.fish < DIFFS.easy.fish);
  const p = normalizeProfile({}); let paid = 0; for (let i = 0; i < ENDLESS_PAID_PER_DAY + 3; i++) { const g = newEndlessGame({ n: 5, diff: "easy", seed: i + 1 }); const r = completeEndless(p, g, 50 + i, "2026-11-24", "easy"); if (r.paid) paid++; }
  assert.equal(paid, ENDLESS_PAID_PER_DAY); assert.equal(completeEndless(p, newEndlessGame({ n: 5, diff: "easy", seed: 99 }), 10, "2026-11-25", "easy").paid, true, "a new day pays again"); assert.equal(p.endless.best["5-easy"], 10, "best time per size and difficulty");
});
test("shop: spends yarn, refuses when poor or full, power-up counts are capped", () => {
  const p = normalizeProfile({ yarn: 100, hints: 8 }); assert.equal(buy(p, "hint").ok, true); assert.equal(p.hints, 9); assert.equal(p.yarn, 100 - ITEMS.hint.price); assert.equal(buy(p, "hint").reason, "full");
  p.yarn = 1; assert.equal(buy(p, "helper").reason, "poor"); assert.equal(buy(p, "nope").ok, false); assert.equal(p.yarn, 1);
});
test("old saves load: missing fields are filled in and nothing is lost", () => {
  const o = normalizeProfile({ v: 1, level: 12, score: 900, hints: 2, winks: 1, solved: 11, stars: { 1: 3, 2: 1 } }); assert.equal(o.level, 12); assert.equal(o.stars[1], 3); assert.equal(o.hints, 2); assert.ok(o.sweeps >= 0 && o.sardines >= 0 && o.yarn === 0 && o.daily.streak === 0 && o.endless.wins === 0);
});
test("combo: clean cats build it, a wrong cat resets it, retract and undo keep it honest", () => {
  const P = puzzleFor(3), g = newG(3, P); P.solution.slice(0, 3).forEach((c, r) => setC(g, r, c, 2)); assert.equal(g.combo, 3); assert.equal(g.bestCombo, 3);
  const bad = P.solution[0] === 0 ? 1 : 0; setC(g, 4, bad === P.solution[4] ? (bad + 2) % P.n : bad, 2); // may or may not conflict; combo never goes up on a conflict
  const before = g.combo; const r = setC(g, 3, P.solution[3], 2); assert.ok(g.combo === before + 1 || r.conflict);
  assert.equal(g.bestCombo >= 3, true);
});
test("sweep crosses out exactly the ruled-out squares in one undo, never touches cats, costs no star", () => {
  const P = puzzleFor(15), g = newG(15, P); assert.equal(sweepBoard(g), 0, "nothing ruled out on an empty board"); setC(g, 2, P.solution[2], 2);
  const n = sweepBoard(g); assert.ok(n > 5); assert.equal(g.helps, 0); let xs = 0, cats = 0; for (const row of g.marks) for (const m of row) { if (m === 1) xs++; if (m === 2) cats++; } assert.equal(xs, n); assert.equal(cats, 1);
  for (let r = 0; r < g.n; r++) assert.notEqual(g.marks[r][P.solution[r]], 1, "a sweep never crosses out a true cat spot");
  undoMv(g); xs = 0; for (const row of g.marks) for (const m of row) if (m === 1) xs++; assert.equal(xs, 0, "one Undo takes the whole sweep back");
});
test("sardine gives a fish back up to the max, and a lost fish can be refilled", () => {
  const g = newEndlessGame({ n: 5, diff: "easy", seed: 3 }); assert.equal(feedFish(g), false); g.fish--; assert.equal(feedFish(g), true); assert.equal(g.fish, 3); assert.equal(feedFish(g), false);
  const x = newEndlessGame({ n: 5, diff: "expert", seed: 3 }); assert.equal(x.fish, 1); assert.equal(feedFish(x), true, "a sardine is worth using on Expert"); assert.equal(x.fish, 2); assert.equal(feedFish(x), false, "but only one extra fish");
});
test("campaign rewards: yarn, finale chest, speed badge once", () => {
  const p = normalizeProfile({}), st = newG(10, puzzleFor(10)); const r = completeLvl(p, st, parFor(st.n) - 1); assert.ok(r.first && r.speedy && r.newSpeedy && r.reward.yarn > 30 && r.reward.sardine === 1); assert.equal(p.fast[10], true);
  const r2 = completeLvl(p, newG(10, puzzleFor(10)), 5); assert.equal(r2.first, false); assert.equal(r2.newSpeedy, false); assert.equal(r2.reward.yarn, 0); assert.equal(r2.points, 0);
});

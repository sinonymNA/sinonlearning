import test from "node:test";
import assert from "node:assert/strict";
import { newIssue, puzzlesFor, introFor, crateInfo, crateOf, posOf, UNLOCK, TYPES, CRATES, advance, relax, puzzleDone, cwSet, cwWrong, cwReveal, cwRevealWord, sdSet, sdNote, sdConflicts, sdReveal, sdIsGiven, wsSelect, wsReveal, cpSet, cpReveal, cpClashes, starsFor, timeLimitFor, newProfile, normalizeProfile, completeIssue, useHint, totalStars, MAX_HINTS, buildCrossword, crosswordConsistent, buildSudoku, sudokuUnique, buildWordSearch, buildCipher, lineLetters, WORDS, ALL_WORDS, SAYINGS, THEMES } from "../issues/index.mjs";

/** Solve every puzzle of a paper through the player's own actions (so the actions are what is tested). */
function solveAll(st) {
  st.puzzles.forEach((p, pi) => {
    if (p.type === "crossword") p.data.cells.forEach((row, r) => row.forEach((ch, c) => { if (ch) cwSet(st, pi, r, c, ch); }));
    else if (p.type === "sudoku") p.data.solution.forEach((row, r) => row.forEach((v, c) => sdSet(st, pi, r, c, v)));
    else if (p.type === "wordsearch") p.data.words.forEach((w) => wsSelect(st, pi, w.r, w.c, w.r + w.dr * (w.word.length - 1), w.c + w.dc * (w.word.length - 1)));
    else Object.entries(p.data.key).forEach(([cl, pl]) => cpSet(st, pi, cl, pl));
  });
}

test("word bank: 240 unique clean words over 10 themes, every clue present and not containing its own answer, sayings are letters only", () => {
  assert.equal(THEMES.length, 10); assert.equal(ALL_WORDS.length, 240); assert.equal(new Set(ALL_WORDS.map((w) => w.w)).size, 240);
  for (const w of ALL_WORDS) { assert.match(w.w, /^[A-Z]{3,10}$/); assert.ok(w.c.length > 8); assert.ok(![1, 2, 3].includes(w.d) === false); assert.ok(!w.c.toUpperCase().split(/[^A-Z]+/).includes(w.w), `clue gives away ${w.w}`); }
  for (const t of THEMES) assert.equal(WORDS[t].length, 24); for (const s of SAYINGS) assert.match(s, /^[A-Z ]+$/);
});
test("crates and the unlock ramp: crossword only for 3 papers, sudoku at 4, word search at 7, cryptogram at 11; every crate has 10 papers and its own theme", () => {
  assert.deepEqual([1, 2, 3].map((l) => puzzlesFor(l).map((p) => p.type)), [["crossword"], ["crossword"], ["crossword"]]);
  assert.ok(puzzlesFor(4).some((p) => p.type === "sudoku") && !puzzlesFor(6).some((p) => p.type === "wordsearch") && puzzlesFor(7).some((p) => p.type === "wordsearch") && !puzzlesFor(10).some((p) => p.type === "cipher") && puzzlesFor(11).some((p) => p.type === "cipher"));
  assert.deepEqual(TYPES.map((t) => introFor(UNLOCK[t])), TYPES); assert.equal(introFor(5), null);
  for (let L = 1; L <= 200; L++) { const ps = puzzlesFor(L); assert.ok(ps.length >= 1 && ps.length <= 5); assert.ok(ps.every((p) => UNLOCK[p.type] <= L), `level ${L} uses a locked type`); assert.equal(ps[0].type, "crossword"); }
  assert.ok(puzzlesFor(10).length === 3 && puzzlesFor(30).length >= puzzlesFor(12).length - 0); assert.equal(crateOf(10), 0); assert.equal(crateOf(11), 1); assert.equal(posOf(20), 10); assert.equal(crateInfo(1).theme, "animals"); assert.equal(CRATES.length, 10);
});
test("crossword generator: no accidental words, every word has an original clue, deterministic, grid fits", () => {
  const pool = [...WORDS.animals, ...WORDS.nature]; for (let seed = 1; seed <= 12; seed++) { const cw = buildCrossword(seed, pool, 9, 13); assert.ok(cw && cw.words.length >= 8, `seed ${seed}`); assert.ok(crosswordConsistent(cw), `seed ${seed} consistent`); assert.ok(cw.rows <= 13 && cw.cols <= 13); for (const w of cw.words) assert.ok(w.clue && w.num > 0 && w.answer.length === w.len); }
  assert.deepEqual(buildCrossword(5, pool, 9, 13), buildCrossword(5, pool, 9, 13));
});
test("sudoku generator: 4x4, 6x6 and 9x9 each have exactly one solution, valid givens and a valid solution", () => {
  for (const [n, g] of [[4, 9], [6, 18], [9, 32]]) for (let seed = 1; seed <= 3; seed++) { const s = buildSudoku(seed, n, g); assert.ok(sudokuUnique(s), `${n}x${n} seed ${seed}`); assert.ok(s.givens <= g + 3); assert.ok(s.puzzle.every((row, r) => row.every((v, c) => v === 0 || v === s.solution[r][c]))); for (let i = 0; i < n; i++) { assert.equal(new Set(s.solution[i]).size, n); assert.equal(new Set(s.solution.map((r) => r[i])).size, n); } }
});
test("word search and cryptogram: every word can be traced, directions follow the tier, ciphers never map a letter to itself", () => {
  for (const dirs of [2, 3, 6, 8]) { const ws = buildWordSearch(4, WORDS.space.slice(0, 8).map((w) => w.w), 12, dirs); assert.ok(ws); for (const w of ws.words) { assert.equal(lineLetters(ws.grid, w.r, w.c, w.r + w.dr * (w.word.length - 1), w.c + w.dc * (w.word.length - 1)), w.word); assert.ok(dirs >= 6 || (w.dr >= 0 && w.dc >= 0), "no backwards words on easy tiers"); } }
  assert.equal(lineLetters([["A", "B"], ["C", "D"]], 0, 0, 1, 1), "AD"); assert.equal(lineLetters([["A", "B"], ["C", "D"]], 0, 0, 1, 0), "AC"); assert.equal(lineLetters([["A", "B", "C"], ["D", "E", "F"]], 0, 0, 1, 2), null, "not a straight line");
  for (const t of SAYINGS) { const c = buildCipher(9, t, 2); assert.ok(c); assert.ok([...t].every((ch, i) => ch === " " ? c.cipherText[i] === " " : c.cipherText[i] !== ch)); assert.equal(Object.keys(c.given).length, 2); assert.equal([...c.cipherText].map((ch) => (ch === " " ? " " : c.key[ch])).join(""), t); }
});
test("every paper 1-150 builds in time, is deterministic, and its time limit is fair; solving every puzzle through the actions wins it", () => {
  for (let L = 1; L <= 150; L++) {
    const st = newIssue(L); assert.equal(st.level, L); assert.ok(st.timeLimit >= 150 && st.timeLimit <= 3000 && st.timeLimit % 10 === 0 && st.timeLeft === st.timeLimit, `limit ${st.timeLimit} at ${L}`); assert.equal(st.timeLimit, timeLimitFor(st.puzzles)); assert.ok(st.masthead && st.headline && /\d{4}$/.test(st.date));
    for (const p of st.puzzles) { if (p.type === "crossword") assert.ok(crosswordConsistent(p.data)); if (p.type === "sudoku") assert.ok(L % 5 !== 0 || sudokuUnique(p.data)); assert.equal(puzzleDone(p), false, `paper ${L} starts unsolved`); }
    if (L % 11 === 1) assert.deepEqual(newIssue(L), st, "deterministic");
    if (L <= 40 || L % 7 === 0) { solveAll(st); assert.ok(st.won && st.done, `paper ${L} wins`); }
  }
});
test("crossword play: letters go in, only letters on cells, wrong letters are found, reveal costs a hint, finishing wins", () => {
  const st = newIssue(1), cw = st.puzzles[0].data, [r, c] = [cw.words[0].r, cw.words[0].c]; assert.equal(cwSet(st, 0, r, c, "q").changed, true); assert.equal(st.puzzles[0].st.g[r][c], "Q"); assert.deepEqual(cwWrong(st, 0), cw.cells[r][c] === "Q" ? [] : [[r, c]]);
  let blank = null; cw.cells.forEach((row, rr) => row.forEach((x, cc) => { if (!x) blank = [rr, cc]; })); if (blank) assert.equal(cwSet(st, 0, blank[0], blank[1], "A").changed, false, "a black square takes nothing");
  assert.equal(cwSet(st, 0, r, c, "").changed, true); assert.equal(st.puzzles[0].st.g[r][c], ""); assert.equal(cwReveal(st, 0, r, c).changed, true); assert.equal(st.hintsUsed, 1); assert.equal(cwReveal(st, 0, r, c).changed, false, "already right: no hint spent");
  assert.equal(cwRevealWord(st, 0, 1).changed, true); assert.equal(st.hintsUsed, 2); solveAll(st); assert.ok(st.won);
});
test("sudoku play: givens cannot change, conflicts are flagged, notes toggle and clear when a number goes in, reveal fills the right number", () => {
  const st = newIssue(4), pi = st.puzzles.findIndex((p) => p.type === "sudoku"), p = st.puzzles[pi]; let given = null, empty = null; p.data.puzzle.forEach((row, r) => row.forEach((v, c) => { if (v && !given) given = [r, c]; if (!v && !empty) empty = [r, c]; }));
  assert.equal(sdSet(st, pi, given[0], given[1], 1).changed, false); assert.ok(sdIsGiven(p, ...given)); assert.equal(sdNote(st, pi, empty[0], empty[1], 2).changed, true); assert.equal(p.st.notes[`${empty[0]},${empty[1]}`], 1 << 2); assert.equal(sdNote(st, pi, empty[0], empty[1], 2).changed, true); assert.equal(p.st.notes[`${empty[0]},${empty[1]}`], undefined);
  sdNote(st, pi, empty[0], empty[1], 3); const wrongV = p.data.solution[empty[0]][empty[1]] % p.data.n + 1; sdSet(st, pi, empty[0], empty[1], wrongV); assert.equal(p.st.notes[`${empty[0]},${empty[1]}`], undefined, "notes clear when a number goes in");
  const dup = p.data.puzzle[given[0]][given[1]]; const other = p.data.puzzle[given[0]].findIndex((v, c) => c !== given[1] && v === 0); if (other >= 0) { sdSet(st, pi, given[0], other, dup); assert.ok(sdConflicts(st, pi).has(`${given[0]},${other}`) && sdConflicts(st, pi).has(`${given[0]},${given[1]}`), "a repeated number is flagged in both cells"); }
  assert.equal(sdReveal(st, pi, empty[0], empty[1]).changed, true); assert.equal(p.st.g[empty[0]][empty[1]], p.data.solution[empty[0]][empty[1]]); assert.equal(st.hintsUsed, 1);
});
test("word search play: a hidden word counts forwards or backwards, once; random lines do not; reveal finds one word and costs a hint", () => {
  const st = newIssue(7), pi = st.puzzles.findIndex((p) => p.type === "wordsearch"), p = st.puzzles[pi], w = p.data.words[0], er = w.r + w.dr * (w.word.length - 1), ec = w.c + w.dc * (w.word.length - 1);
  assert.equal(wsSelect(st, pi, w.r, w.c, w.r, w.c + 1).found, null); assert.equal(wsSelect(st, pi, er, ec, w.r, w.c).found, w.word, "backwards works too"); assert.equal(wsSelect(st, pi, w.r, w.c, er, ec).found, null, "already found"); assert.equal(p.st.found.length, 1);
  const r = wsReveal(st, pi); assert.ok(r.changed && r.word !== w.word); assert.equal(st.hintsUsed, 1); while (!st.won && wsReveal(st, pi).changed); assert.ok(puzzleDone(p));
});
test("cryptogram play: given letters are fixed, guesses are saved, clashes are flagged, reveal fixes one letter", () => {
  const st = newIssue(11), pi = st.puzzles.findIndex((p) => p.type === "cipher"), p = st.puzzles[pi], cl = Object.keys(p.data.key).find((k) => !(k in p.data.given)), given = Object.keys(p.data.given)[0];
  if (given) assert.equal(cpSet(st, pi, given, "Z").changed, false, "a given letter cannot be changed"); assert.equal(cpSet(st, pi, cl, "z").changed, true); assert.equal(p.st.g[cl], "Z"); const cl2 = Object.keys(p.data.key).find((k) => k !== cl && !(k in p.data.given)); cpSet(st, pi, cl2, "Z"); assert.ok(cpClashes(st, pi).has(cl) && cpClashes(st, pi).has(cl2));
  cpSet(st, pi, cl2, ""); assert.equal(p.st.g[cl2], undefined); assert.equal(cpReveal(st, pi, cl).changed, true); assert.equal(p.st.g[cl], p.data.key[cl]); assert.equal(st.hintsUsed, 1);
});
test("the clock: it counts down, the presses roll at zero (no more moves), relaxed mode removes the deadline", () => {
  const st = newIssue(1); assert.equal(advance(st, 10), false); assert.equal(st.timeLeft, st.timeLimit - 10); assert.equal(advance(st, st.timeLimit), true); assert.ok(st.failed && st.timeLeft === 0); assert.equal(cwSet(st, 0, st.puzzles[0].data.words[0].r, st.puzzles[0].data.words[0].c, "A").changed, false, "no more writing after the deadline");
  relax(st); assert.ok(!st.failed && st.relaxed); assert.equal(advance(st, 999), false); assert.equal(cwSet(st, 0, st.puzzles[0].data.words[0].r, st.puzzles[0].data.words[0].c, "A").changed, true); solveAll(st); assert.ok(st.won); assert.equal(starsFor(st), 1, "a relaxed paper earns one star");
});
test("stars, profile and hints: stars follow time left and hint use, first clears open the next paper and pay hints, a crate boss pays more", () => {
  const mk = (frac, hints = 0, relaxed = false) => ({ timeLimit: 100, timeLeft: 100 * frac, hintsUsed: hints, relaxed }); assert.equal(starsFor(mk(0.6)), 3); assert.equal(starsFor(mk(0.3)), 2); assert.equal(starsFor(mk(0.05)), 1); assert.equal(starsFor(mk(0.6, 4)), 2, "four hints cost a star"); assert.equal(starsFor(mk(0.05, 9)), 1, "never below one");
  const p = newProfile(); const a = completeIssue(p, { ...mk(0.5), level: 1, boss: false }); assert.ok(a.first && p.level === 2 && p.stars[1] === 3 && p.hints === 7 && a.reward.hints === 2); const b = completeIssue(p, { ...mk(0.1), level: 1, boss: false }); assert.equal(b.first, false); assert.equal(p.stars[1], 3, "stars only go up"); assert.equal(p.hints, 7);
  const q = newProfile(); completeIssue(q, { ...mk(0.5), level: 10, boss: true }); assert.equal(q.hints, 10, "a crate-ending paper pays 5 hints"); const r = normalizeProfile({ hints: 99, level: 0 }); assert.equal(r.hints, MAX_HINTS); assert.equal(r.level, 1);
  assert.equal(useHint(q), true); assert.equal(q.hints, 9); const z = newProfile(); z.hints = 0; assert.equal(useHint(z), false); assert.equal(totalStars(p), 3);
});

import test from "node:test";
import assert from "node:assert/strict";
import { PICKS } from "../shelf/levels.mjs";
import { specFor, deptOf, posOf, cycleOf, DEPTS, DEPT_COUNT, generate, candidate, newGame, accepts, whyNot, canMove, move, undo, addCart, hint, isSolved, bayDone, hasMoves, solve, solveState, plainState, topRun, runLen, starsFor, isPerfect, newProfile, normalizeProfile, completeLevel, completeDaily, totalStars, targetPar, flags, isLocked, doneCount, dayKey, prevDay, dailyLevel, newDailyGame, looksStuck, MAX_EXTRA, MAX_BAYS, SUBJECTS } from "../shelf/index.mjs";

const KEYS = [{ kind: "shirt", v: 0 }, { kind: "shirt", v: 1 }, { kind: "book", v: 0 }, { kind: "book", v: 1 }];   // keys 0,1 shirts; 2,3 books
/** bays: [accept, isCart, items]; an item is a key, or [key, x] with x = toy size / jar moves left; a negative key = a hidden item. */
const mk = (bays, cap = 3, rules = [], keys = KEYS, order = null) => ({ v: 2, level: 1, dept: 0, rules: typeof rules === "string" ? (rules === "free" ? [] : [rules]) : rules, order, cap, keys, par: 5, moves: 0, extra: 0, history: [], done: false, won: false, bays: bays.map(([a, s, items, extra], bi) => ({ a, s, ...(extra || {}), items: items.map((it, i) => { const [k, x] = Array.isArray(it) ? it : [it, 0]; return { id: bi * 100 + i, k: Math.abs(k), q: k < 0, x }; }) })) });
const TOYS = [{ kind: "toy", v: 0 }, { kind: "toy", v: 1 }], PANTRY = [{ kind: "jar", v: 0 }, { kind: "jar", v: 1 }, { kind: "tin", v: 0 }], SHOES = [{ kind: "shoe", v: 0 }, { kind: "shoe", v: 1 }], GIFTS = [{ kind: "gift", v: 0 }, { kind: "gift", v: 1 }, { kind: "gift", v: 2 }];

test("nine departments repeat every 90 levels; every spec is a legal shape; breathers and bosses are flagged", () => {
  assert.equal(DEPT_COUNT, 9); assert.deepEqual([1, 10, 11, 21, 31, 41, 51, 61, 71, 81, 90, 91].map(deptOf), [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 0]); assert.deepEqual([1, 10, 11, 55].map(posOf), [1, 10, 1, 5]); assert.equal(cycleOf(90), 0); assert.equal(cycleOf(91), 1);
  for (let L = 1; L <= 400; L++) {
    const s = specFor(L), F = flags(s.rules); assert.ok(s.bays.length <= MAX_BAYS && s.cap >= 3 && s.cap <= 8 && s.keys.length >= 2, `level ${L}`); assert.equal(s.boss, posOf(L) === 10); assert.equal(s.breather, posOf(L) === 5);
    if (s.dept === 1) { assert.equal(s.bays.filter((b) => typeof b.a === "number").length, s.keys.length); assert.ok(s.keys.every((k) => k.kind === "book" && k.v < SUBJECTS.length)); }
    if (s.dept === 2) assert.ok(s.keys.some((k) => k.kind === "shirt") && s.keys.some((k) => k.kind === "book"));
    if (s.dept === 3) assert.ok(F.size && s.cap <= 5 && s.keys.length <= 5); if (s.dept === 4) assert.ok(F.fragile && s.keys.some((k) => k.kind === "jar") && s.keys.some((k) => k.kind === "tin"));
    if (s.dept === 5) assert.ok(F.pairs && s.cap % 2 === 0); if (s.dept === 6) assert.ok(F.locks && s.bays.some((b) => b.lock)); if (s.dept === 7) assert.ok(F.orders && s.bays.filter((b) => b.bag).length === 1); if (s.dept === 8) assert.ok(F.locks || F.fragile);
    if (s.breather) assert.equal(s.hidden, 0, "a breather has no wrapped items");
  }
  assert.deepEqual(DEPTS.map((d) => d.rules.length > 0 || d.id === "clothing" || d.id === "books" || d.id === "boutique"), DEPTS.map(() => true));
});
test("what each kind of bay accepts", () => { assert.equal(accepts("any", 3, KEYS), true); assert.equal(accepts("shirt", 0, KEYS), true); assert.equal(accepts("shirt", 2, KEYS), false); assert.equal(accepts("book", 3, KEYS), true); assert.equal(accepts(2, 2, KEYS), true); assert.equal(accepts(2, 3, KEYS), false); });
test("moves obey the bay rules and every refusal explains itself", () => {
  const st = mk([["shirt", false, [0, 1]], ["book", false, [2]], [2, false, []], ["any", true, []], ["shirt", false, [0]], ["book", false, [3, 3, 3]]]);
  assert.equal(canMove(st, 0, 4), false); assert.match(whyNot(st, 0, 4), /match/); assert.match(whyNot(st, 0, 1), /Only books/); assert.match(whyNot(st, 1, 0), /Only shirts/);
  assert.equal(canMove(st, 1, 2), true); assert.equal(canMove(st, 5, 2), false); assert.match(whyNot(st, 5, 2), new RegExp(`for ${SUBJECTS[0]} books`)); assert.equal(canMove(st, 0, 3), true); assert.match(whyNot(st, 3, 0), /empty/); assert.notEqual(whyNot(st, 0, 0), null);
  assert.match(whyNot(mk([["any", false, [0, 0, 0]], ["any", false, [0]]]), 1, 0), /full/);
});
test("win rule: carts empty, labelled shelf full of its own subject, ordinary bays full and one colour or empty", () => {
  const ok = mk([["shirt", false, [0, 0, 0]], ["shirt", false, [1, 1, 1]], [2, false, [2, 2, 2]], [3, false, [3, 3, 3]], ["any", true, []]]); assert.equal(isSolved(ok), true);
  assert.equal(isSolved(mk([["shirt", false, [0, 0, 0]], ["shirt", false, [1, 1]], [2, false, [2, 2, 2]], [3, false, [3, 3, 3]], ["any", true, [1]]])), false);
  assert.equal(isSolved(mk([["any", false, [2, 2, 2]], [2, false, []], [3, false, [3, 3, 3]], ["any", true, []]])), false, "the subject must sit on ITS shelf"); assert.equal(isSolved(mk([["any", false, [0, 0]], ["any", false, []]])), false); assert.equal(bayDone(ok, 0), true); assert.equal(bayDone(ok, 4), false);
});
test("a whole run moves together, limited by space; hidden items come to light on the new top; undo hides them again", () => {
  const st = mk([["any", false, [-2, -1, 0, 0]], ["any", false, [0]], ["any", false, []]], 4); assert.equal(topRun(st, 0), 2);
  const r = move(st, 0, 1); assert.ok(r.ok && r.n === 2); assert.equal(st.bays[1].items.length, 3); assert.equal(st.bays[0].items[1].q, false); assert.equal(r.revealed, st.bays[0].items[1].id); assert.equal(st.bays[0].items[0].q, true);
  undo(st); assert.equal(st.bays[0].items.length, 4); assert.equal(st.bays[0].items[1].q, true); assert.equal(st.moves, 0); assert.equal(move(mk([["any", false, [0, 0, 0]], ["any", false, [0, 0]], ["any", false, []]], 4), 0, 1).n, 2, "only two fit");
});
test("a wrapped item never moves with a run, so it cannot give its colour away; a finished shelf unwraps everything and undo wraps it again", () => {
  const wrap = (st, bay, i) => { st.bays[bay].items[i].q = true; return st; };
  const st = wrap(mk([["any", false, [0, 0, 0]], ["any", false, []]], 4), 0, 0); assert.equal(topRun(st, 0), 2); const r = move(st, 0, 1); assert.equal(r.n, 2); assert.equal(st.bays[0].items[0].q, false); assert.equal(r.revealed, st.bays[0].items[0].id);
  const d2 = wrap(mk([["any", false, [0]], ["any", false, [0, 0, 0]]], 4), 1, 0); const pre = move(d2, 0, 1); assert.ok(pre.finished.includes(1) && pre.unwrapped.length === 1); assert.ok(d2.bays[1].items.every((n) => !n.q));
  d2.done = false; d2.won = false; undo(d2); assert.equal(d2.bays[1].items.length, 3); assert.equal(d2.bays[1].items[0].q, true);
});
test("Toy Aisle: a bigger toy never sits on a smaller one, runs must nest, and a set is only finished when sorted big to small", () => {
  const st = mk([["any", false, [[0, 1], [0, 3]]], ["any", false, [[0, 2]]], ["any", false, []], ["any", false, [[1, 1], [1, 2]]]], 3, "size", TOYS);
  assert.equal(runLen(st.bays[0].items, ["size"]), 1, "a 3 on top of a 1 is not a nested run"); assert.equal(runLen(st.bays[3].items, ["size"]), 1, "a 2 sitting on a 1 is upside down, so it does not nest");
  assert.match(whyNot(st, 0, 1), /bigger toy/); assert.equal(canMove(st, 1, 0), true, "a 2 may sit on a 3"); assert.equal(canMove(st, 0, 2), true); assert.match(whyNot(st, 0, 3), /match/);
  const nest = mk([["any", false, [[0, 3], [0, 2], [0, 1]]], ["any", false, []]], 3, "size", TOYS); assert.equal(runLen(nest.bays[0].items, ["size"]), 3); const r = move(nest, 0, 1); assert.equal(r.n, 3, "a nested run moves together");
  const wrong = mk([["any", false, [[0, 1], [0, 2], [0, 3]]]], 3, "size", TOYS); assert.equal(isSolved(wrong), false, "all one colour but big on top is not sorted"); assert.equal(isSolved(mk([["any", false, [[0, 3], [0, 2], [0, 1]]]], 3, "size", TOYS)), true);
  const half = mk([["any", false, [[0, 4], [0, 3], [0, 2], [0, 1]]], ["any", false, [[0, 5]]], ["any", false, []]], 5, "size", TOYS); assert.equal(move(half, 0, 1).n, 4, "all four nest onto the 5");
});
test("Pantry: each jar can only be moved a few times, tins never wear out, undo gives a move back", () => {
  const st = mk([["any", false, [[0, 1]]], ["any", false, []], ["any", false, [[2, 7]]], ["any", false, []]], 3, "fragile", PANTRY);
  const r = move(st, 0, 1); assert.ok(r.ok); assert.equal(st.bays[1].items[0].x, 0, "the jar used its last move"); assert.deepEqual(r.cracked, [st.bays[1].items[0].id]); assert.match(whyNot(st, 1, 0), /crack/); assert.equal(canMove(st, 1, 0), false, "it cannot be moved again");
  undo(st); assert.equal(st.bays[0].items[0].x, 1, "undo returns the move"); for (let i = 0; i < 6; i++) { move(st, 2, 3); move(st, 3, 2); } assert.equal(st.bays[2].items.length + st.bays[3].items.length, 1); assert.equal([...st.bays[2].items, ...st.bays[3].items][0].x, 7, "a tin never wears out");
  const run = mk([["any", false, [[0, 2], [0, 0]]], ["any", false, []]], 3, "fragile", PANTRY); assert.match(whyNot(run, 0, 1), /crack/, "a run with a cracked jar cannot move");
});
test("carts: addCart adds a cart, at most MAX_EXTRA per level", () => { const st = mk([["any", false, [0]], ["any", false, []]]); for (let i = 0; i < MAX_EXTRA; i++) assert.equal(addCart(st), true); assert.equal(addCart(st), false); assert.ok(st.bays.slice(2).every((b) => b.s && b.a === "any" && !b.items.length)); });
test("every level 1-180 is solvable, deterministic, fully dealt, messy, with unique ids and no hidden top item; toys have each size once; jars start with moves left", () => {
  for (let L = 1; L <= 180; L++) {
    const g = newGame(L), s = specFor(L), F = flags(s.rules), ids = g.bays.flatMap((b) => b.items).map((n) => n.id); assert.equal(new Set(ids).size, ids.length);
    const counts = {}; for (const n of g.bays.flatMap((b) => b.items)) counts[n.k] = (counts[n.k] || 0) + 1; assert.equal(Object.keys(counts).length, s.keys.length, `level ${L}`); for (const k in counts) assert.equal(counts[k], s.cap);
    assert.ok(g.par > 0 && !isSolved(g)); assert.ok(g.bays.every((b) => b.items.length <= s.cap)); assert.ok(g.bays.every((b) => !b.items.length || !b.items[b.items.length - 1].q), "the top item is never hidden");
    assert.ok(g.bays.filter((b) => b.s).every((b) => b.items.length === 0 || s.dept === 1), "only the Book Nook cart starts loaded"); assert.ok(g.bays.filter((b) => b.bag).every((b) => b.items.length === 0), "the bag starts empty"); if (F.orders) { assert.ok(g.order.length >= 2 && g.order.reduce((t, o) => t + o.n, 0) <= s.cap); assert.ok(g.order.every((o) => o.k < s.keys.length)); } else assert.equal(g.order, null);
    if (F.size) for (let k = 0; k < s.keys.length; k++) assert.deepEqual(g.bays.flatMap((b) => b.items).filter((n) => n.k === k).map((n) => n.x).sort(), Array.from({ length: s.cap }, (_, i) => i + 1));
    if (F.fragile) assert.ok(g.bays.flatMap((b) => b.items).every((n) => (s.keys[n.k].kind === "jar" ? n.x === s.dur : n.x === 7)));
    if (F.pairs) for (let k = 0; k < s.keys.length; k++) assert.equal(g.bays.flatMap((b) => b.items).filter((n) => n.k === k && n.x === 1).length, s.cap / 2, "half left, half right");
    if (L % 29 === 1) assert.deepEqual(newGame(L), g, "deterministic"); if (s.hidden === 0) assert.equal(g.bays.flatMap((b) => b.items).filter((n) => n.q).length, 0);
  }
});
test("hints: following the hint finishes levels in all five departments, and every hint is legal", () => {
  for (const L of [1, 7, 12, 17, 22, 28, 31, 34, 36, 41, 44, 48, 55, 58, 63, 66, 71, 74, 78, 83, 86, 89]) { const st = newGame(L); let guard = 0; while (!st.done && guard++ < st.par * 3 + 20) { const h = hint(st); assert.ok(h, `level ${L}: a hint exists`); assert.ok(canMove(st, h.from, h.to), `level ${L} legal hint`); assert.ok(move(st, h.from, h.to).ok); } assert.ok(st.won, `level ${L} finished by hints`); assert.equal(isSolved(st), true); }
});
test("the level table: picks exist for 180 levels, every pick reproduces a board whose solution length is near the curve target, and par is at most the first solver's", () => {
  assert.ok(PICKS.length >= 180); let close = 0;
  for (let L = 1; L <= 180; L++) { const g = generate(L), c = candidate(L, PICKS[L - 1][0]); assert.deepEqual(c.bays, g.bays); assert.ok(g.par <= c.par && g.par >= Math.ceil(c.par * 0.5), `par ${g.par} vs ${c.par} at ${L}`); if (Math.abs(c.par - targetPar(L)) <= Math.max(3, targetPar(L) * 0.35)) close++; }
  assert.ok(close >= 135, `most levels follow the curve (${close}/180)`);
  const pars = (a, b) => { let t = 0; for (let L = a; L <= b; L++) t += generate(L).par / (specFor(L).keys.length * specFor(L).cap); return t / (b - a + 1); };
  assert.ok(generate(5).par / (specFor(5).keys.length * specFor(5).cap) <= generate(4).par / (specFor(4).keys.length * specFor(4).cap) + 0.25, "a breather is not harder than the level before it"); void pars;
});
test("stars are stricter and meaningful, perfect means par, bosses pay a bonus, profile upgrades", () => {
  const st = newGame(2); st.par = 10; st.moves = 11; assert.equal(starsFor(st), 3); assert.equal(isPerfect(st), false); st.moves = 10; assert.equal(isPerfect(st), true); st.moves = 12; assert.equal(starsFor(st), 2); st.moves = 14; assert.equal(starsFor(st), 2); st.moves = 15; assert.equal(starsFor(st), 1);
  const p = newProfile(), a = completeLevel(p, { level: 1, moves: 8, par: 8 }); assert.ok(a.first && a.perfect && a.newPerfect && p.level === 2 && p.stars[1] === 3 && p.perfect[1]); assert.equal(completeLevel(p, { level: 1, moves: 80, par: 8 }).first, false); assert.equal(p.stars[1], 3, "stars only go up");
  const q = newProfile(); q.hints = 0; q.carts = 0; const b = completeLevel(q, { level: 10, moves: 9, par: 9, boss: true }); assert.ok(b.boss && b.reward.hint >= 1 && b.reward.cart >= 1, "a boss pays a bonus");
  for (let l = 2; l <= 4; l++) completeLevel(p, { level: l, moves: 5, par: 5 }); assert.equal(totalStars(p), 12); const old = normalizeProfile({ level: 5, hints: 99 }); assert.equal(old.hints, 9); assert.deepEqual([old.perfect, old.coached, old.seen], [{}, {}, {}]);
});
test("the solver handles a tiny labelled puzzle and a tiny size puzzle", () => {
  const rules = [{ a: 2, s: false }, { a: 3, s: false }, { a: "any", s: true }, { a: "any", s: true }], p = solve([[3, 2], [2, 3], [], []], rules, 2, KEYS); assert.ok(p && p.length >= 3);
  const st = mk([["any", false, [[0, 1], [0, 2]]], ["any", false, [[0, 3]]], ["any", false, []]], 3, "size", TOYS); const path = solveState(st); assert.ok(path && path.length >= 1); const ps = plainState(st); assert.deepEqual(ps.rulesList, ["size"]);
  assert.equal(hasMoves(newGame(33)), true);
});

test("Shoe Wall: shoes must alternate left and right, runs alternate, and a stack is finished only when it alternates", () => {
  const st = mk([["any", false, [[0, 1], [0, 2]]], ["any", false, [[0, 1]]], ["any", false, []], ["any", false, [[1, 2], [1, 2]]]], 4, ["pairs"], SHOES);
  assert.equal(runLen(st.bays[0].items, ["pairs"]), 2, "a right on a left alternates, so both move together"); assert.equal(runLen(st.bays[3].items, ["pairs"]), 1, "two lefts in a row are not a run");
  assert.equal(canMove(st, 0, 1), false); assert.match(whyNot(st, 0, 1), /partner/, "a right cannot go on a left run... the 2 on top lands on a 1? the landing item is the bottom of the run"); assert.equal(canMove(st, 0, 2), true);
  const ok = mk([["any", false, [[0, 1], [0, 2], [0, 1], [0, 2]]]], 4, ["pairs"], SHOES); assert.equal(isSolved(ok), true); assert.equal(isSolved(mk([["any", false, [[0, 1], [0, 1], [0, 2], [0, 2]]]], 4, ["pairs"], SHOES)), false);
  const m = mk([["any", false, [[0, 1], [0, 2]]], ["any", false, [[0, 1]]]], 4, ["pairs"], SHOES); assert.equal(canMove(m, 0, 1), false, "the 1 at the bottom of the run would land on a 1");
});
test("Gift Corner: padlocked shelves cannot be touched until enough shelves are finished; undo locks them again", () => {
  const st = mk([["any", false, [0, 0]], ["any", false, [0, 1, 1], { lock: 1 }], ["any", false, [0]], ["any", false, []]], 3, ["locks"], GIFTS);
  assert.equal(isLocked(st, 1), true); assert.match(whyNot(st, 1, 3), /Padlocked! Finish 1 more shelf/); assert.match(whyNot(st, 2, 1), /Padlocked/, "nothing can be put on it either"); assert.equal(doneCount(st), 0);
  const r = move(st, 2, 0); assert.ok(r.ok && r.finished.includes(0) && r.unlocked.includes(1), "finishing a shelf opens the padlock"); assert.equal(isLocked(st, 1), false); assert.equal(doneCount(st), 1);
  st.done = false; undo(st); assert.equal(isLocked(st, 1), true, "undo closes it again");
});
test("Customer Orders: only what is on the order goes in the bag, never more than asked, and packing cannot be undone by hand", () => {
  const keys = [{ kind: "shirt", v: 0 }, { kind: "shirt", v: 1 }, { kind: "book", v: 0 }], order = [{ k: 0, n: 2 }, { k: 2, n: 1 }];
  const st = mk([["any", false, [1, 0, 0]], ["any", false, [2, 1]], ["any", false, []], ["any", false, [], { bag: true }]], 4, ["orders"], keys, order);
  assert.match(whyNot(st, 1, 3), /isn't on the order/); assert.equal(canMove(st, 0, 3), true); const r = move(st, 0, 3); assert.equal(r.n, 2, "both 0s go in together"); assert.equal(st.bays[3].items.length, 2); assert.equal(isSolved(st), false);
  assert.match(whyNot(st, 3, 2), /unpacked/); st.bays[0].items.push({ id: 900, k: 0, q: false, x: 0 }); assert.match(whyNot(st, 0, 3), /enough/, "no more 0s than the order asks for");
  const st2 = mk([["any", false, [2]], ["any", false, [], { bag: true }]], 4, ["orders"], keys, [{ k: 2, n: 1 }]); const w = move(st2, 0, 1); assert.ok(w.won && isSolved(st2), "the last item packed finishes the level");
  const stuck = mk([["any", false, [1, 0]], ["any", false, [], { bag: true }]], 4, ["orders"], keys, [{ k: 0, n: 1 }]); assert.deepEqual(solveState(stuck), [[0, 1]]);
});
test("Mixed Day levels combine two rules and are solvable (toys + padlocks, jars on jar shelves, shoes + padlocks)", () => {
  for (const L of [81, 83, 84, 86, 87, 90]) { const g = newGame(L), F = flags(g.rules); assert.ok(F.locks || F.fragile || F.size, `level ${L}`); const st = newGame(L); let n = 0; while (!st.done && n++ < st.par * 3 + 10) { const h = hint(st); assert.ok(h); assert.ok(move(st, h.from, h.to).ok); } assert.ok(st.won, `mixed level ${L}`); }
  const g = newGame(81); assert.ok(flags(g.rules).size && flags(g.rules).locks && g.bays.some((b) => b.lock)); const j = newGame(84); assert.ok(j.bays.some((b) => b.a === "jar") && j.bays.some((b) => b.a === "tin") && flags(j.rules).fragile);
});
test("Daily Delivery: the same board for the same day, different days differ, department rotates, size follows the weekday; streaks and one payout a day", () => {
  assert.equal(prevDay("2026-03-01"), "2026-02-28"); assert.equal(dayKey(new Date(2026, 10, 25)), "2026-11-25");
  const a = newDailyGame("2026-11-25"), b = newDailyGame("2026-11-25"), c = newDailyGame("2026-11-26"); assert.deepEqual(a, b); assert.notDeepEqual(a.bays, c.bays); assert.equal(a.daily, "2026-11-25"); assert.ok(solveState(a) !== null);
  assert.equal(posOf(dailyLevel("2026-11-22")), 10, "Sunday is the big one"); assert.equal(posOf(dailyLevel("2026-11-23")), 3, "Monday is gentle"); assert.notEqual(deptOf(dailyLevel("2026-11-24")), deptOf(dailyLevel("2026-11-25")));
  const p = normalizeProfile({}), win = (day) => { const g = newDailyGame(day); g.moves = g.par; return completeDaily(p, g, day); };
  const r1 = win("2026-11-23"); assert.ok(r1.first && r1.streak === 1 && r1.reward.coins > 15 && r1.perfect); const coins = p.coins; assert.equal(win("2026-11-23").first, false); assert.equal(p.coins, coins, "no second payout the same day");
  assert.equal(win("2026-11-24").streak, 2); assert.equal(win("2026-11-25").streak, 3); assert.equal(win("2026-11-28").streak, 1, "a missed day resets"); assert.equal(p.daily.best, 3);
  for (let i = 0; i < 3; i++) assert.ok(newDailyGame("2027-01-0" + (i + 1)).bays.length > 2);
});
test("coins: levels pay coins on the first clear, bosses pay more, a first perfect pays a bonus", () => {
  const p = normalizeProfile({}); const a = completeLevel(p, { level: 1, moves: 9, par: 8 }); assert.equal(a.reward.coins, 6 + 4 * 3); const b = completeLevel(p, { level: 2, moves: 8, par: 8 }); assert.equal(b.reward.coins, 6 + 12 + 8, "perfect adds 8");
  const q = normalizeProfile({}); const boss = completeLevel(q, { level: 10, moves: 5, par: 5, boss: true }); assert.ok(boss.reward.coins >= 6 + 12 + 40); assert.equal(completeLevel(q, { level: 10, moves: 5, par: 5, boss: true }).reward.coins, 0, "replays pay nothing");
  assert.ok(normalizeProfile({ coins: 12.7 }).coins === 12); assert.ok(p.decor.owned.includes("sign:wood") && p.decor.equipped.finish === "oak");
});
test("looksStuck: a board with no moves, or no way out, is flagged; a fresh level is not", () => {
  const dead = mk([["any", false, [0, 1, 0]], ["any", false, [1, 0, 1]]], 3); assert.equal(looksStuck(dead), true); assert.equal(looksStuck(newGame(3)), false);
});

import { DECOR, SLOTS, buyDecor, equipDecor, isEquipped, decorById } from "../shelf/index.mjs";
test("decor: free defaults are owned and equipped, buying spends coins and equips, you cannot buy twice or without coins, equipping needs ownership", () => {
  const p = normalizeProfile({}); assert.ok(DECOR.length >= 120 && SLOTS.length === 11); for (const s of SLOTS) assert.ok(DECOR.some((d) => d.slot === s.id && d.price === 0), `a free default for ${s.id}`);
  assert.ok(isEquipped(p, "sign:wood") && isEquipped(p, "finish:oak")); assert.deepEqual(buyDecor(p, "pet:cat"), { ok: false, reason: "poor" }); p.coins = 200;
  assert.equal(buyDecor(p, "pet:cat").ok, true); assert.equal(p.coins, 110); assert.ok(isEquipped(p, "pet:cat")); assert.equal(buyDecor(p, "pet:cat").reason, "owned"); assert.equal(buyDecor(p, "nope").reason, "unknown");
  assert.equal(equipDecor(p, "pet:dog").ok, false, "not owned"); assert.equal(equipDecor(p, "pet:none").ok, true); assert.ok(!isEquipped(p, "pet:cat")); assert.equal(equipDecor(p, "pet:cat").ok, true); assert.equal(decorById("rug:round").price, 45);
  const old = normalizeProfile({ coins: 5, decor: { owned: ["plant:fern"], equipped: { plant: "fern" } } }); assert.ok(old.decor.owned.includes("plant:fern") && old.decor.owned.includes("sign:wood") && old.decor.equipped.plant === "fern");
});

test("only fragile levels ever report a cracked jar (items elsewhere default to x = 0 and must not count)", () => {
  const st = mk([["any", false, [0, 0]], ["any", false, []]], 3); const r = move(st, 0, 1); assert.ok(r.ok); assert.deepEqual(r.cracked, [], "a plain shirt is never a cracked jar");
  for (const L of [1, 21, 31, 51, 61, 71, 81]) { const g = newGame(L), h = hint(g), m = move(g, h.from, h.to); assert.deepEqual(m.cracked, [], `level ${L}`); }
});

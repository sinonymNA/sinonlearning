import test from "node:test";
import assert from "node:assert/strict";
import { dailyPuzzles, publicPuzzle, checkAnswer, stateFor, applyGuess, newDailyState, TRIES } from "../daily.mjs";
import { handleDaily } from "../api.mjs";
import { MemoryStore } from "../store.mjs";
import { studentCtx, guestCtx } from "./helpers.mjs";

test("daily puzzles are deterministic per date, vary across dates, and always solvable", () => {
  assert.deepEqual(dailyPuzzles("2031-05-05"), dailyPuzzles("2031-05-05"));
  const sigs = new Set();
  for (let d = 1; d <= 60; d++) {
    const date = `2031-06-${String((d % 28) + 1).padStart(2, "0")}-${d}`;
    const ps = dailyPuzzles(date);
    assert.equal(ps.length, 5);
    sigs.add(ps.map((p) => p.prompt).join("|"));
    for (const p of ps) {
      assert.ok(checkAnswer(p, p.type === "choice" ? p.answer : p.answer), p.kind);
      if (p.kind === "scramble") assert.notEqual(p.prompt.toLowerCase(), p.answer, "scramble must change the word");
      if (p.kind === "scramble") assert.equal([...p.prompt.toLowerCase()].sort().join(""), [...p.answer].sort().join(""));
      if (p.kind === "odd") { assert.equal(new Set(p.choices).size, 4); assert.ok(Number(p.answer) >= 0 && Number(p.answer) < 4); }
      if (p.kind === "sequence") assert.ok(Number.isInteger(Number(p.answer)));
    }
  }
  assert.ok(sigs.size >= 55, "different days give different puzzles");
});

test("public puzzles never contain the answer", () => {
  for (const p of dailyPuzzles("2031-07-01")) {
    const json = JSON.stringify(publicPuzzle(p, 0));
    assert.ok(!("answer" in publicPuzzle(p, 0)));
    if (p.type === "text" && p.kind !== "scramble") assert.ok(!json.toLowerCase().includes(`"${p.answer}"`));
    assert.ok(!json.includes("reveal"));
  }
});

test("tries, reveal, finishing and streaks", () => {
  const puzzles = dailyPuzzles("2031-08-10");
  let st = newDailyState("2031-08-10");
  const wrong = (p) => (p.type === "choice" ? String((Number(p.answer) + 1) % 4) : "zzzz");
  let r = applyGuess(puzzles, st, 0, wrong(puzzles[0]), "2031-08-10");
  assert.equal(r.correct, false); assert.equal(r.resolved, false); assert.equal(r.triesLeft, TRIES - 1);
  r = applyGuess(puzzles, st, 0, wrong(puzzles[0]), "2031-08-10");
  assert.equal(r.resolved, true); assert.ok(r.reveal);
  assert.match(applyGuess(puzzles, st, 0, "x", "2031-08-10").error, /already/);
  for (let i = 1; i < 5; i++) r = applyGuess(puzzles, st, i, puzzles[i].answer, "2031-08-10");
  assert.equal(r.finished, true); assert.equal(st.streak, 1);
  const next = stateFor(st, "2031-08-11");
  assert.equal(next.streak, 1, "streak survives one day");
  assert.equal(next.done, false);
  assert.equal(stateFor(st, "2031-08-13").streak, 0, "streak breaks after a missed day");
  // consecutive finish
  const p2 = dailyPuzzles("2031-08-11"); let s2 = next;
  for (let i = 0; i < 5; i++) applyGuess(p2, s2, i, p2[i].answer, "2031-08-11");
  assert.equal(s2.streak, 2); assert.equal(s2.best, 2);
});

test("API: guests can play statelessly; signed-in progress is server-enforced; coins once per day", async () => {
  const store = new MemoryStore();
  const g = await handleDaily(guestCtx(store), { type: "get" });
  assert.equal(g.signedIn, false); assert.equal(g.puzzles.length, 5);
  assert.ok(JSON.stringify(g).indexOf('"answer"') < 0);
  const ps = dailyPuzzles();
  assert.equal((await handleDaily(guestCtx(store), { type: "check", n: 0, answer: ps[0].answer })).correct, true);
  const gl = await handleDaily(guestCtx(store), { type: "check", n: 1, answer: "-1", tries: 2 });
  assert.equal(gl.resolved, true); assert.ok(gl.reveal);

  const ctx = studentCtx(store, "kid-daily");
  const first = await handleDaily(ctx, { type: "get" });
  assert.equal(first.signedIn, true);
  const wrongA = ps[2].type === "choice" ? String((Number(ps[2].answer) + 1) % 4) : "zzz";
  await handleDaily(ctx, { type: "check", n: 2, answer: wrongA });
  const lock = await handleDaily(ctx, { type: "check", n: 2, answer: wrongA });
  assert.equal(lock.resolved, true);
  await assert.rejects(handleDaily(ctx, { type: "check", n: 2, answer: ps[2].answer }), /already/);
  // refresh keeps state + reveal
  const again = await handleDaily(ctx, { type: "get" });
  assert.ok(again.reveals[2]); assert.equal(again.state.results[2].ok, false);
  let last;
  for (const i of [0, 1, 3, 4]) last = await handleDaily(ctx, { type: "check", n: i, answer: ps[i].answer });
  assert.equal(last.state.done, true); assert.equal(last.reward, 5 + 3 * 4);
  assert.equal((await store.getWallet("kid-daily")).coins, 17);
  const done = await handleDaily(ctx, { type: "get" });
  assert.equal(done.reward, 17);
  await assert.rejects(handleDaily(ctx, { type: "check", n: 99, answer: "x" }), /Unknown puzzle/);
});

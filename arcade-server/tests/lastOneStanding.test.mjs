import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom } from "./helpers.mjs";
import { nextTarget } from "../games/lastOneStanding.mjs";

const QS = Array.from({ length: 30 }, (_, i) => ({ q: `Question number ${i}?`, choices: ["A", "B", "C", "D"], answer: i % 4 }));
const content = { title: "Test", items: { questions: QS } };

/** Open the question then have each [pid, correct, ms] answer at the right server time. */
function play(ctx, answers) {
  const { room, clock, advance } = ctx;
  const g = room.game;
  advance(g.q.openAt - room.t() + 10, 10);
  const open = g.q.openAt;
  for (const [pid, correct, ms] of [...answers].sort((a, b) => a[2] - b[2])) {
    clock.now += open + ms - room.t();
    const choice = correct ? g.q.answer : (g.q.answer + 1) % 4;
    for (const p of room.players.values()) if (!p.bot) room.touch(p.id);
    room.act(pid, { type: "answer", choice });
  }
  advance(13000, 100);
  return g.last;
}

test("ladder targets: 35 -> 20 -> 10 -> 5 -> 2 -> 1", () => {
  let n = 35; const seq = [n];
  while (n > 1) { n = nextTarget(n); seq.push(n); }
  assert.deepEqual(seq, [35, 20, 10, 5, 2, 1]);
});

test("round one: fastest 20 correct players advance, wrong and slow players are out", () => {
  const ctx = makeRoom({ n: 35, playlist: ["last_one_standing"], content });
  const g = ctx.begin();
  const ids = [...g.alive];
  // 28 correct at distinct speeds (spaced beyond the tie window), 7 wrong
  const answers = ids.map((id, i) => [id, i < 28, 600 + i * 300]);
  const last = play(ctx, answers);
  assert.equal(g.alive.size, 20);
  const fastest20 = ids.slice(0, 20);
  for (const id of fastest20) assert.ok(g.alive.has(id), "fast correct players advance");
  for (const id of ids.slice(28)) assert.ok(!g.alive.has(id), "wrong answers never advance");
  assert.equal(last.eliminated.length, 15);
  assert.equal(last.advanced.length, 20);
});

test("server rejects early, duplicate and late answers", () => {
  const ctx = makeRoom({ n: 4, playlist: ["last_one_standing"], content });
  const g = ctx.begin();
  const [p] = ctx.players;
  assert.match(ctx.tryAct(p, { type: "answer", choice: 0 }).error, /Wait for the question/);
  ctx.advance(g.q.openAt - ctx.room.t() + 50, 10);
  assert.ok(ctx.tryAct(p, { type: "answer", choice: 1 }).ok);
  assert.match(ctx.tryAct(p, { type: "answer", choice: 2 }).error, /already answered/);
  assert.match(ctx.tryAct(ctx.players[1], { type: "answer", choice: 9 }).error, /Pick one/);
  ctx.advance(13000, 100);
  assert.match(ctx.tryAct(ctx.players[2], { type: "answer", choice: 0 }).error, /No game|Too late|reveal/i);
});

test("correct answer is never in a player's view while the question is open", () => {
  const ctx = makeRoom({ n: 4, playlist: ["last_one_standing"], content });
  const g = ctx.begin();
  ctx.advance(g.q.openAt - ctx.room.t() + 50, 10);
  const v = ctx.view(ctx.players[0]).game;
  assert.equal(v.correct, undefined);
  assert.equal(v.phase, "question");
});

test("tie window: answers within 250ms at the cut line are decided by a fair random draw", () => {
  const winners = new Map();
  for (let run = 0; run < 60; run++) {
    const ctx = makeRoom({ n: 6, playlist: ["last_one_standing"], content });
    const g = ctx.begin();
    const ids = [...g.alive];
    // alive 6 -> target 5. Players 4 and 5 tie (within 100ms) for the last spot... with 6 correct, one drops
    const answers = ids.map((id, i) => [id, true, 1000 + (i < 4 ? i * 400 : 2600 + (i - 4) * 100)]);
    play(ctx, answers);
    assert.equal(g.alive.size, 5);
    const dropped = ids.find((id) => !g.alive.has(id));
    assert.ok([ids[4], ids[5]].includes(dropped), "only a tied player may be cut");
    const idx = ids.indexOf(dropped); winners.set(idx, (winners.get(idx) ?? 0) + 1);
  }
  assert.equal(winners.size, 2, "both tied players must sometimes lose (random draw)");
});

test("nobody correct => question is asked again and nobody is eliminated", () => {
  const ctx = makeRoom({ n: 5, playlist: ["last_one_standing"], content });
  const g = ctx.begin();
  const ids = [...g.alive];
  const asked = g.asked;
  const last = play(ctx, ids.map((id, i) => [id, false, 800 + i * 400]));
  assert.equal(g.alive.size, 5);
  assert.equal(last.nobody, true);
  ctx.advance(6000, 100);
  assert.equal(g.asked, asked + 1);
});

test("final showdown: two players, exact-tie triggers sudden death, otherwise the faster correct player wins", () => {
  const ctx = makeRoom({ n: 2, playlist: ["last_one_standing"], content });
  const g = ctx.begin();
  const [a, b] = [...g.alive];
  assert.equal(g.alive.size, 2);
  let last = play(ctx, [[a, true, 1000], [b, true, 1100]]);
  assert.match(last.retry, /Sudden-death/);
  assert.equal(g.alive.size, 2);
  ctx.advance(6000, 100);
  last = play(ctx, [[a, true, 1500], [b, true, 3000]]);
  assert.equal(g.alive.size, 1);
  assert.equal(g.alive.has(a), true);
  ctx.advance(6000, 100);
  assert.equal(g.done, true);
  assert.equal(g.winner, a);
  assert.ok(g.points.get(a) > g.points.get(b));
});

test("eliminated players keep answering in a consolation competition and earn points", () => {
  const ctx = makeRoom({ n: 8, playlist: ["last_one_standing"], content });
  const g = ctx.begin();
  const ids = [...g.alive];
  play(ctx, ids.map((id, i) => [id, i < 6, 800 + i * 400]));
  const out = ids.filter((id) => !g.alive.has(id));
  assert.ok(out.length >= 1);
  ctx.advance(5000, 100);
  const before = g.points.get(out[0]);
  const aliveNow = [...g.alive];
  play(ctx, [...aliveNow.map((id, i) => [id, true, 1000 + i * 500]), [out[0], true, 900]]);
  assert.ok(g.points.get(out[0]) > before, "consolation correct answer should score");
  assert.ok(g.cons.get(out[0]) > 0);
});

test("teacher-created questions are used; built-in defaults otherwise", () => {
  const ctx = makeRoom({ n: 3, playlist: ["last_one_standing"], content });
  const g = ctx.begin();
  assert.match(g.q.q, /Question number/);
  const d = makeRoom({ n: 3, playlist: ["last_one_standing"] });
  const dg = d.begin();
  assert.ok(dg.q.q.length > 5 && dg.q.choices.length === 4);
});

test("full 35-player run with mixed bots ends with exactly one winner", () => {
  const ctx = makeRoom({ n: 0, playlist: ["last_one_standing"] });
  ctx.svc.addBots(ctx.room, 35, "mixed");
  ctx.room.start();
  ctx.advance(300000, 250);
  const res = ctx.room.history[0];
  assert.ok(res, "game should finish");
  assert.equal(ctx.room.history.length, 1);
});

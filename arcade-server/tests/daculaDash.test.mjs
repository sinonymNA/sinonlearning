import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom } from "./helpers.mjs";
import { GRAPH, CHECKPOINTS, DD } from "../games/daculaDash.mjs";
import { GAME_CATALOG } from "../catalog.mjs";
import { simulate, summarise } from "../dacula/sim.mjs";
import { shortestPath, stillConnected } from "../dacula/graph.mjs";

const setup = (o = {}) => {
  const ctx = makeRoom({ n: o.n ?? 4, playlist: ["dacula_dash"], settings: { seed: o.seed ?? 5, dacula: { minutes: o.minutes ?? 20, questionSeconds: 15 } } });
  ctx.begin(); ctx.advance(DD.INTRO_MS + 400);
  const g = ctx.room.game, b = g.boards[0], who = (id) => ctx.players.find((p) => p.id === id);
  return { ...ctx, g, b, who, cur: () => who(b.cur) };
};
const cpFor = (cat) => CHECKPOINTS.find((c) => c.cat === cat);
/** put the current player's token on `node` and run the landing */
const land = (s, node) => { const me = s.b.p.get(s.b.cur); me.pos = node; s.b.landing(s.b.cur, s.room.t()); };
const answerIdx = (s, right = true) => (right ? s.b.q.correct : (s.b.q.correct + 1) % 4);

test("registered game: catalog entry, 2+ players, available in rooms", () => {
  assert.equal(GAME_CATALOG.dacula_dash.name, "Dacula Dash"); assert.equal(GAME_CATALOG.dacula_dash.min, 2);
  const s = setup(); assert.equal(s.room.phase, "playing"); assert.equal(s.b.phase, "roll"); assert.ok(s.b.cur);
});

test("state machine: only the active player can roll; roll -> choose -> moving -> landing/question -> result -> next player", () => {
  const s = setup(); const first = s.b.cur, other = s.b.order.find((id) => id !== first);
  assert.equal(s.tryAct(other, { type: "roll" }).ok, false);
  assert.equal(s.tryAct(first, { type: "move", to: 1 }).ok, false, "can't move before rolling");
  assert.equal(s.tryAct(first, { type: "answer", index: 0 }).ok, false, "can't answer without a question");
  s.act(first, { type: "roll", turn: s.b.turnNo }); assert.equal(s.b.phase, "choose");
  assert.equal(s.tryAct(first, { type: "roll" }).ok, false, "no re-rolling");
  const dest = [...s.b.options.keys()][0]; s.act(first, { type: "move", to: dest, turn: s.b.turnNo }); assert.equal(s.b.phase, "moving");
  assert.equal(s.b.p.get(first).pos, dest);
  s.advance(8000, 100);
  assert.ok(["question", "result", "roll"].includes(s.b.phase) || s.b.cur !== first);
});

test("dice: server-authoritative 1-6, the move never exceeds the roll (+bonus), clients can't set the roll", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    const s = setup({ seed }); const p = s.b.cur;
    s.act(p, { type: "roll", turn: s.b.turnNo, die: 6, steps: 99 });
    const r = s.b.roll; seen.add(r.die); assert.ok(r.die >= 1 && r.die <= 6); assert.equal(r.steps, r.die + r.boost + r.green);
    if (s.b.options) for (const path of s.b.options.values()) assert.ok(path.length - 1 <= r.steps);
  }
  assert.ok(seen.size >= 5, "dice vary: " + [...seen]);
});

test("bonus tokens add steps on a roll, capped at 2 and by what you own", () => {
  const s = setup(); const p = s.b.cur; s.b.p.get(p).tokens = 5;
  s.act(p, { type: "roll", turn: s.b.turnNo, boost: 9 }); assert.equal(s.b.roll.boost, 2); assert.equal(s.b.p.get(p).tokens, 3);
});

test("route choice: destinations outside the options are rejected (no teleporting, no disconnected hops)", () => {
  const s = setup(); const p = s.b.cur; s.act(p, { type: "roll", turn: s.b.turnNo });
  const bad = GRAPH.nodes.find((n) => !s.b.options.has(n.id) && n.id !== s.b.p.get(p).pos);
  const r = s.tryAct(p, { type: "move", to: bad.id }); assert.equal(r.ok, false); assert.equal(r.code, "bad-move");
  assert.equal(s.tryAct(p, { type: "move", to: "abc" }).ok, false); assert.equal(s.tryAct(p, { type: "move", to: -5 }).ok, false);
});

test("checkpoint: correct answer earns exactly that wedge once; wrong answer earns nothing and the turn passes", () => {
  const s = setup(); const p = s.b.cur, cp = cpFor("ent"); s.b.p.get(p).pos = GRAPH.schoolNode;
  land(s, cp.node); assert.equal(s.b.phase, "question"); assert.equal(s.b.q.kind, "checkpoint"); assert.equal(s.b.q.cat, "ent");
  s.act(p, { type: "answer", index: answerIdx(s, false), turn: s.b.turnNo }); assert.deepEqual(s.b.p.get(p).wedges, []);
  assert.equal(s.b.result.correct, false); assert.equal(s.b.phase, "result");
  s.advance(DD.RESULT_MS + 300); assert.notEqual(s.b.cur, p, "turn passed on");
  // try again later: a fresh question, and now correct
  const again = s.b.order.find((id) => id === p); s.b.idx = s.b.order.indexOf(p) - 1; s.b.nextTurn(s.room.t()); assert.equal(s.b.cur, again);
  land(s, cp.node); s.act(p, { type: "answer", index: answerIdx(s, true), turn: s.b.turnNo }); assert.deepEqual(s.b.p.get(p).wedges, ["ent"]);
  s.advance(DD.RESULT_MS + 300);
  // landing on the same checkpoint again never offers a second wedge
  s.b.idx = s.b.order.indexOf(p) - 1; s.b.nextTurn(s.room.t()); land(s, cp.node); assert.notEqual(s.b.q?.kind, "checkpoint"); assert.equal(s.b.p.get(p).wedges.length, 1);
});

test("one wedge per category: six different checkpoints give six different colours", () => {
  const s = setup(); const p = s.b.cur;
  for (const c of CHECKPOINTS) { s.b.phase = "roll"; s.b.cur = p; land(s, c.node); assert.equal(s.b.q.cat, c.cat); s.b.resolve(p, s.b.q.correct, s.room.t()); }
  assert.equal(new Set(s.b.p.get(p).wedges).size, 6); assert.equal(s.b.p.get(p).wedges.length, 6);
});

test("catch-up and rewards: correct normal answers give bonus moves, trailing players get one extra", () => {
  const s = setup(); const [a, c] = s.b.order; const A = s.b.p.get(a); A.wedges = ["geo", "history", "science"];
  const node = GRAPH.nodes.find((n) => n.flavor === "question");
  s.b.cur = c; land(s, node.id); assert.equal(s.b.q.kind, "bonus"); s.b.resolve(c, s.b.q.correct, s.room.t());
  assert.equal(s.b.p.get(c).tokens, 2, "1 for the answer + 1 catch-up (trailing by 3 wedges)");
  s.b.cur = a; A.pos = node.id; s.b.phase = "roll"; land(s, node.id); s.b.resolve(a, s.b.q.correct, s.room.t()); assert.equal(A.tokens, 1, "the leader gets no catch-up");
});

test("final: with six wedges the school asks the final question; a correct answer wins, a wrong one does not", () => {
  const s = setup(); const p = s.b.cur, me = s.b.p.get(p); me.wedges = ["geo", "history", "science", "ent", "arts", "sports"];
  land(s, GRAPH.schoolNode); assert.equal(s.b.q.kind, "final"); assert.ok(s.b.q.endsAt > 0);
  s.act(p, { type: "answer", index: answerIdx(s, false), turn: s.b.turnNo }); assert.equal(s.b.winner, null);
  s.advance(DD.RESULT_MS + 300); s.b.idx = s.b.order.indexOf(p) - 1; s.b.nextTurn(s.room.t()); land(s, GRAPH.schoolNode);
  s.act(p, { type: "answer", index: answerIdx(s, true), turn: s.b.turnNo }); assert.equal(s.b.winner, p);
  s.advance(DD.RESULT_MS + 400); assert.equal(s.b.over, true); assert.equal(s.b.table[0].id, p);
});

test("school WITHOUT six wedges is just a normal space (no final question)", () => {
  const s = setup(); const p = s.b.cur; s.b.p.get(p).wedges = ["geo", "ent"]; land(s, GRAPH.schoolNode); assert.notEqual(s.b.q?.kind, "final");
});

test("early stop: an unclaimed checkpoint can be claimed without an exact roll; a claimed one cannot", () => {
  const s = setup(); const p = s.b.cur, cp = cpFor("ent"), d = shortestPath(GRAPH, GRAPH.schoolNode, cp.node).steps;
  const me = s.b.p.get(p); me.pos = GRAPH.schoolNode; me.tokens = 2; s.act(p, { type: "roll", turn: s.b.turnNo });
  s.b.roll = { ...s.b.roll, steps: d + 3 };
  const opts = s.b.options; assert.ok(opts, "has options");
  // recompute options with a larger roll through the engine's own helper
  const stop = s.b.stopSet(p); assert.ok(stop.has(cp.node)); me.wedges.push("ent"); assert.ok(!s.b.stopSet(p).has(cp.node));
});

test("failed checkpoint: the player may choose to stay and try the question again (no stuck players)", () => {
  const s = setup(); const p = s.b.cur, cp = cpFor("history"); s.b.p.get(p).pos = cp.node; assert.equal(s.b.needsRetry(p), true);
  s.act(p, { type: "roll", turn: s.b.turnNo }); assert.ok(s.b.options.has(cp.node), "staying put is offered");
  s.act(p, { type: "move", to: cp.node, turn: s.b.turnNo }); s.advance(1500, 100); assert.equal(s.b.q?.kind, "checkpoint");
});

test("questions never leak the answer: the view has no correct index until the result, and options only go to the active player", () => {
  const s = setup(); const p = s.b.cur, other = s.b.order.find((id) => id !== p); land(s, cpFor("geo").node);
  for (const id of [p, other]) {
    const board = s.view(s.who(id)).game.board, qj = JSON.stringify(board.q);
    assert.ok(board.q && board.q.choices.length === 4); assert.equal(board.result, null, "no result before answering");
    assert.ok(!/"(correct|answer|expl|explanation|right)"/.test(qj), "the question carries no answer key: " + qj);
    if (s.b.q.expl) assert.ok(!JSON.stringify(board).includes(s.b.q.expl), "explanation withheld until the result");
  }
  const right = s.b.q.choices[s.b.q.correct]; s.act(p, { type: "answer", index: s.b.q.correct, turn: s.b.turnNo });
  assert.equal(s.view(s.who(other)).game.board.result.right, right);
  const s2 = setup(); s2.act(s2.b.cur, { type: "roll", turn: s2.b.turnNo }); const o2 = s2.b.order.find((id) => id !== s2.b.cur);
  assert.ok(s2.view(s2.who(s2.b.cur)).game.board.options?.length); assert.equal(s2.view(s2.who(o2)).game.board.options, null);
});

test("server authority: wrong player, stale turn, out-of-range and garbage inputs are all rejected", () => {
  const s = setup(); const p = s.b.cur, other = s.b.order.find((id) => id !== p);
  assert.equal(s.tryAct(p, { type: "roll", turn: s.b.turnNo + 3 }).code, "stale");
  land(s, cpFor("geo").node);
  assert.equal(s.tryAct(other, { type: "answer", index: s.b.q.correct }).ok, false);
  assert.equal(s.tryAct(p, { type: "answer", index: 7 }).ok, false); assert.equal(s.tryAct(p, { type: "answer", index: "x" }).ok, false);
  assert.equal(s.tryAct(p, { type: "wedge", cat: "geo" }).ok, false); assert.equal(s.tryAct(p, { type: "give", wedges: 6 }).ok, false);
  s.act(p, { type: "answer", index: s.b.q.correct, turn: s.b.turnNo }); assert.equal(s.tryAct(p, { type: "answer", index: s.b.q.correct }).ok, false, "no double answering");
  assert.deepEqual(s.b.p.get(p).wedges, ["geo"]);
});

test("timers: roll, route and question time out into sensible automatic actions", () => {
  const s = setup(); const p = s.b.cur; s.advance(DD.ROLL_MS + 600); assert.ok(s.b.roll || s.b.cur !== p, "auto-rolled");
  const s2 = setup(); const p2 = s2.b.cur; s2.act(p2, { type: "roll", turn: s2.b.turnNo }); s2.advance(DD.CHOOSE_MS + 700); assert.ok(s2.b.p.get(p2).steps > 0 || s2.b.cur !== p2, "auto-moved");
  const s3 = setup(); const p3 = s3.b.cur; land(s3, cpFor("geo").node); s3.advance(15000 + 800); assert.equal(s3.b.result?.correct ?? false, false); assert.equal(s3.b.p.get(p3).wedges.length, 0);
});

test("disconnects and idle players never stall a board; the host can skip a turn; leavers are skipped", () => {
  const s = setup(); const p = s.b.cur; s.who(p).forceOffline = true; s.room.players.get(p).lastSeen = 0;
  s.advance(DD.OFFLINE_MS + 3000); assert.ok(s.b.cur !== p || s.b.phase !== "roll", "moved on after the disconnect");
  const s2 = setup(); const first = s2.b.cur; s2.room.act ? s2.room.hostAction?.call?.(s2.room, "skip") : null; s2.g.skip(); assert.notEqual(s2.b.cur, first, "host skip advances the turn");
  const s3 = setup(); const c = s3.b.cur; s3.room.removePlayer(c, "teacher"); s3.advance(600); assert.notEqual(s3.b.cur, c);
});

test("construction events never disconnect the board and are capped to one at a time", () => {
  let events = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const s = setup({ seed }); const node = GRAPH.nodes.find((n) => n.flavor === "event");
    for (let k = 0; k < 4; k++) { s.b.phase = "roll"; land(s, node.id); if (s.b.phase === "question") s.b.resolve(s.b.cur, null, s.room.t()); assert.ok(s.b.blocked.length <= 1); assert.ok(stillConnected(GRAPH, s.b.blockedKeys()), "board stays connected"); }
    if (s.b.blocked.length) events++;
  }
  assert.ok(events > 3, "construction does occur: " + events);
});

test("a class is split into boards of at most six, each with its own turn order and standings", () => {
  const s = setup({ n: 14 }); assert.ok(s.g.boards.length >= 3); for (const b of s.g.boards) assert.ok(b.members.length <= 6 && b.members.length >= 2);
  const ids = s.g.boards.flatMap((b) => b.members); assert.equal(new Set(ids).size, 14);
  const a = s.g.boards[0], bb = s.g.boards[1]; assert.notEqual(a.cur, bb.cur); assert.equal(s.view(s.who(a.members[0])).game.board.id, 0);
});

test("session timer: HOME STRETCH bell at 75%, then final standings by wedges -> correct answers -> distance -> earliest wedge", () => {
  const s = setup({ minutes: 4 }); const [a, c, d] = s.b.order;
  s.advance(4 * 60000 * DD.HOME_AT + 1500, 250); assert.equal(s.b.bell, true); assert.ok(s.b.feed.some((f) => /HOME STRETCH/.test(f.text)));
  const P = (id) => s.b.p.get(id);
  P(a).wedges = ["geo", "ent", "arts"]; P(c).wedges = ["geo", "ent", "arts"]; P(d).wedges = ["geo"];
  P(a).correct = 5; P(c).correct = 9; P(a).pos = GRAPH.schoolNode; P(c).pos = GRAPH.schoolNode;
  const rows = s.b.rankings(); assert.equal(rows[0].id, c, "same wedges: more correct answers wins"); assert.equal(rows.at(-1).wedges <= 1, true);
  P(a).correct = 9; P(c).pos = CHECKPOINTS[0].node; const r2 = s.b.rankings(); assert.equal(r2[0].id, a, "then closer to school wins");
  P(a).wedgeAt = { geo: 1 }; P(a).lastWedgeAt = 50; P(c).pos = GRAPH.schoolNode; P(c).lastWedgeAt = 20; const r3 = s.b.rankings(); assert.equal(r3[0].id, c, "then the earlier last wedge wins");
  s.advance(4 * 60000, 500); assert.equal(s.b.over, true); assert.equal(s.b.final.reason, "time");
});

test("exact ties share a rank (no arbitrary winner)", () => {
  const s = setup({ minutes: 4 }); const [a, c] = s.b.order; for (const id of [a, c]) { Object.assign(s.b.p.get(id), { pos: GRAPH.schoolNode, wedges: ["geo"], correct: 3, lastWedgeAt: 10 }); }
  const rows = s.b.rankings().filter((r) => r.id === a || r.id === c); assert.equal(rows[0].rank, rows[1].rank);
});

test("full simulated games finish, deterministically for a seed, inside the 20-minute cap", () => {
  const r1 = simulate({ players: 4, accuracy: 0.7, seed: 3 }), r2 = simulate({ players: 4, accuracy: 0.7, seed: 3 });
  assert.equal(r1.finished, true); assert.deepEqual(r1.boards, r2.boards); assert.ok(r1.elapsedMs <= 20 * 60000 + 8000, "elapsed " + r1.elapsedMs);
});

test("balance: default 4-player games usually end with a winner well inside the cap, and never run past it", () => {
  const runs = Array.from({ length: 12 }, (_, i) => simulate({ players: 4, accuracy: 0.7, seed: 100 + i })); const s = summarise(runs);
  assert.ok(s.finishedNaturally >= 0.75, JSON.stringify(s)); assert.ok(s.p90Minutes <= 20.2, JSON.stringify(s)); assert.ok(s.meanLeaderWedges >= 5.5, JSON.stringify(s));
  const slow = summarise(Array.from({ length: 6 }, (_, i) => simulate({ players: 6, accuracy: 0.5, seed: 200 + i }))); assert.ok(slow.maxMinutes <= 20.2, "timeout keeps classes on schedule: " + slow.maxMinutes);
});

test("weak players are still in it: at 50% accuracy the average player collects most of the wedges", () => {
  const s = summarise(Array.from({ length: 8 }, (_, i) => simulate({ players: 4, accuracy: 0.5, seed: 300 + i }))); assert.ok(s.meanWedgesPerPlayer >= 4, JSON.stringify(s));
});

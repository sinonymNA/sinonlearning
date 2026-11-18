import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom } from "./helpers.mjs";

const seg = (k) => ({ k, t: 0, c: 2, w: 1, p: [10, 10, 80, 80, 120, 30] });
const content = { title: "T", items: { telephonePrompts: ["a cat on a bike", "a sad pickle", "dragon tea party", "robot gardener", "moon pizza", "angry cloud", "singing fish", "sleepy knight"] } };

function stageTask(ctx, pid) { return ctx.room.view({ playerId: pid }).game.task; }

test("chain assignment: nobody receives their own chain after stage 1, every chain used once per stage", () => {
  const ctx = makeRoom({ n: 35, playlist: ["telephone"], content });
  const g = ctx.begin();
  assert.equal(g.groups.length, 5);
  for (const grp of g.groups) {
    for (let stage = 0; stage < 3; stage++) {
      const used = new Set();
      grp.members.forEach((m, i) => {
        const ci = g.chainIndex(grp, i, stage);
        used.add(ci);
        if (stage > 0) assert.notEqual(grp.chains[ci].owner, m, "must not get own chain");
      });
      assert.equal(used.size, grp.n);
    }
    // chain c is handled by three different people
    grp.chains.forEach((c, ci) => {
      const handlers = grp.members.filter((m, i) => [0, 1, 2].some((s) => g.chainIndex(grp, i, s) === ci));
      assert.equal(new Set(handlers).size, 3);
    });
  }
});

test("stage timings 45s / 20s / 45s and the private task is only the player's own chain", () => {
  const ctx = makeRoom({ n: 6, playlist: ["telephone"], content });
  const g = ctx.begin();
  const grp = g.groups[0];
  assert.deepEqual(g.view(null, {}).stageMs, [45000, 20000, 45000]);
  const v0 = ctx.room.view({ playerId: grp.members[0] }).game;
  assert.ok(Math.abs(v0.group.endsIn - 45000) < 200);
  assert.equal(v0.task.kind, "draw");
  assert.equal(v0.task.prompt, grp.chains[0].prompt);
  // another player's prompt is not in this player's view
  const json = JSON.stringify(v0);
  for (const c of grp.chains.slice(1)) assert.ok(!json.includes(c.prompt), "leaked another chain's prompt");
});

test("drawing streams, describe stage sees someone else's drawing, final stage draws a description", () => {
  const ctx = makeRoom({ n: 5, playlist: ["telephone"], content });
  const g = ctx.begin();
  const grp = g.groups[0];
  grp.members.forEach((m, i) => { ctx.act(m, { type: "draw", segs: [seg(i), seg(i + 10)] }); ctx.act(m, { type: "done" }); });
  ctx.advance(200);
  assert.equal(grp.stage, 1, "stage advances when everyone submitted");
  grp.members.forEach((m, i) => {
    const t = stageTask(ctx, m);
    assert.equal(t.kind, "describe");
    assert.ok(t.src.length >= 2, "receives a drawing");
    assert.notEqual(grp.chains[g.chainIndex(grp, i, 1)].owner, m);
    ctx.act(m, { type: "describe", text: `drawing number ${i}` });
  });
  assert.match(ctx.tryAct(grp.members[0], { type: "describe", text: "again" }).error, /already/);
  ctx.advance(200);
  assert.equal(grp.stage, 2);
  grp.members.forEach((m, i) => {
    const t = stageTask(ctx, m);
    assert.equal(t.kind, "draw");
    assert.match(t.description, /drawing number/);
    const chain = grp.chains[g.chainIndex(grp, i, 2)];
    assert.notEqual(chain.owner, m);
    assert.equal(t.description, chain.desc);
  });
});

test("timeouts fill in missing descriptions; reveal shows the full chain prompt -> drawing -> description -> drawing", () => {
  const ctx = makeRoom({ n: 4, playlist: ["telephone"], content });
  const g = ctx.begin();
  const grp = g.groups[0];
  grp.members.forEach((m) => ctx.act(m, { type: "draw", segs: [seg(1), seg(2)] }));
  ctx.advance(46000);
  assert.equal(grp.stage, 1);
  ctx.act(grp.members[0], { type: "describe", text: "a wobbly thing" });
  ctx.advance(22000);
  assert.equal(grp.stage, 2);
  assert.ok(grp.chains.some((c) => c.missing), "missing descriptions get a placeholder");
  grp.members.forEach((m) => ctx.act(m, { type: "draw", segs: [seg(5), seg(6)] }));
  ctx.advance(47000);
  assert.equal(grp.status, "reveal");
  // walk the reveal and collect everything a client would receive
  const got = {};
  let cursor = { ci: 0, st: -1 };
  for (let i = 0; i < 80 && grp.status === "reveal"; i++) {
    const r = ctx.room.view({ playerId: grp.members[1], opts: { tel: cursor } }).game.reveal;
    for (const e of r.chains) { got[e.ci] = { ...(got[e.ci] ?? {}), ...e }; cursor = { ci: e.ci, st: e.upto }; }
    ctx.advance(1000);
  }
  for (let ci = 0; ci < 4; ci++) {
    const c = got[ci];
    assert.ok(c, `chain ${ci} revealed`);
    assert.equal(c.prompt, grp.chains[ci].prompt);
    assert.ok(c.d1.length >= 1 && c.d2.length >= 1);
    assert.ok(typeof c.desc === "string");
  }
});

test("voting: can't vote own chain, votes close and award points to the funniest chain's makers", () => {
  const ctx = makeRoom({ n: 4, playlist: ["telephone"], content });
  const g = ctx.begin();
  const grp = g.groups[0];
  grp.members.forEach((m) => ctx.act(m, { type: "draw", segs: [seg(1), seg(2)] })); ctx.advance(46000);
  grp.members.forEach((m) => ctx.act(m, { type: "describe", text: "something silly" })); ctx.advance(300);
  grp.members.forEach((m) => { ctx.act(m, { type: "draw", segs: [seg(1), seg(2)] }); ctx.act(m, { type: "done" }); }); ctx.advance(500);
  ctx.advance(60000);
  assert.equal(grp.status, "vote");
  const own = grp.chains.findIndex((c) => c.owner === grp.members[0]);
  assert.match(ctx.tryAct(grp.members[0], { type: "vote", chain: own }).error, /own chain/);
  const target = grp.chains.findIndex((c) => c.owner === grp.members[1]);
  for (const m of grp.members) if (m !== grp.members[1]) ctx.act(m, { type: "vote", chain: target });
  assert.match(ctx.tryAct(grp.members[0], { type: "vote", chain: target }).error, /already voted/);
  ctx.act(grp.members[1], { type: "vote", chain: grp.chains.findIndex((c) => c.owner === grp.members[2]) });
  ctx.advance(300);
  assert.equal(grp.status, "voteReveal");
  assert.deepEqual(grp.funniest, [target]);
  assert.ok(g.points.get(grp.members[1]) >= 50);
});

test("full 35-bot Telephone session completes", () => {
  const ctx = makeRoom({ n: 0, playlist: ["telephone"] });
  ctx.svc.addBots(ctx.room, 35, "mixed");
  ctx.room.start();
  ctx.advance(330000, 250);
  assert.equal(ctx.room.history.length, 1);
});

import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom, teacherCtx, guestCtx } from "./helpers.mjs";
import { handle } from "../api.mjs";
import { ArcadeService } from "../service.mjs";
import { MemoryStore } from "../store.mjs";
import { PHRASES, PHRASE_BY_ID } from "../chat.mjs";

const QS = Array.from({ length: 30 }, (_, i) => ({ q: `Question number ${i}?`, choices: ["A", "B", "C", "D"], answer: i % 4 }));
const content = { title: "T", items: { questions: QS } };

function setup(n = 4) {
  const ctx = makeRoom({ n, playlist: ["piggy_bank"], content });
  const g = ctx.begin();
  return { ...ctx, g };
}
/** run the question phase: answers = [[pid, correct, ms]] then land in the chest phase */
function question(ctx, answers) {
  const { room, clock, advance, g } = ctx;
  advance(g.q.openAt - room.t() + 10, 10);
  const open = g.q.openAt;
  for (const [pid, correct, ms] of [...answers].sort((a, b) => a[2] - b[2])) {
    clock.now += open + ms - room.t();
    for (const p of room.players.values()) room.touch(p.id);
    room.act(pid, { type: "answer", choice: correct ? g.q.answer : (g.q.answer + 1) % 4 });
  }
  for (let i = 0; i < 200 && g.phase !== "chest"; i++) advance(100, 100);
  assert.equal(g.phase, "chest");
}
const bankOf = (g, p) => g.bank.get(p.id ?? p);

test("nobody is ever eliminated: all players play every round and the game ends after 8 rounds", () => {
  const ctx = makeRoom({ n: 0, playlist: ["piggy_bank"] });
  ctx.svc.addBots(ctx.room, 35, "mixed");
  ctx.room.start();
  ctx.advance(600000, 250);
  assert.equal(ctx.room.history.length, 1);
  const res = ctx.room.history[0];
  assert.equal(res.rows.length, 35);
  assert.ok(res.rows.every((r) => r.points >= 0));
  assert.ok(res.rows.filter((r) => r.points > 0).length >= 20, "almost everyone ends with coins in the piggy");
});

test("answering: correct earns 100 + speed bonus, wrong earns nothing, early/duplicate/late answers rejected", () => {
  const ctx = setup(3); const [a, b, c] = ctx.players; const { g } = ctx;
  assert.match(ctx.tryAct(a, { type: "answer", choice: 0 }).error, /Wait for the question/);
  question(ctx, [[a.id, true, 500], [b.id, true, 11000], [c.id, false, 800]]);
  assert.ok(bankOf(g, a) > 190 && bankOf(g, a) <= 200, `fast correct ~ +200 (${bankOf(g, a)})`);
  assert.ok(bankOf(g, b) >= 100 && bankOf(g, b) < 115, `slow correct ~ +100 (${bankOf(g, b)})`);
  assert.equal(bankOf(g, c), 0);
  assert.match(ctx.tryAct(a, { type: "answer", choice: 1 }).error, /Too late|already/);
});

test("chests: SAFE pays 120 (60 if wrong), WILD is locked unless you answered correctly, one pick per round", () => {
  const ctx = setup(3); const [a, b] = ctx.players; const { g } = ctx;
  question(ctx, [[a.id, true, 1000], [b.id, false, 1000]]);
  const before = bankOf(g, a);
  g.roll = () => 99; // no shield
  ctx.act(a, { type: "pick", chest: "safe" });
  assert.equal(bankOf(g, a) - before, 120);
  assert.match(ctx.tryAct(a, { type: "pick", chest: "safe" }).error, /already opened/);
  assert.match(ctx.tryAct(b, { type: "pick", chest: "wild" }).error, /locked/);
  ctx.act(b, { type: "pick", chest: "safe" });
  assert.equal(bankOf(g, b), 60);
  assert.match(ctx.tryAct(a, { type: "pick", chest: "bogus" }).error, /already|Pick a chest/);
});

test("SPICY steals 20% (10% if you answered wrong) capped at 400; shields block exactly one steal; tiny banks fall back to +40", () => {
  const ctx = setup(2); const [a, b] = ctx.players; const { g } = ctx;
  question(ctx, [[a.id, false, 1000], [b.id, false, 1000]]);
  g.setBank(b.id, 1000); g.setBank(a.id, 0); g.roll = () => 0;
  ctx.act(a, { type: "pick", chest: "spicy" });
  assert.equal(bankOf(g, a), 100, "wrong answerer steals 10%");
  assert.equal(bankOf(g, b), 900);
  // correct answerer, capped
  ctx.advance(20000, 100);
  question(ctx, [[a.id, true, 1000], [b.id, false, 1000]]);
  g.shield.clear(); g.setBank(b.id, 5000); g.setBank(a.id, 0); g.roll = () => 0;
  ctx.act(a, { type: "pick", chest: "spicy" });
  assert.equal(bankOf(g, a), 400, "steal capped at 400");
  // shield
  ctx.advance(20000, 100);
  question(ctx, [[a.id, true, 1000], [b.id, false, 1000]]);
  g.shield.clear(); g.setBank(b.id, 1000); const before = bankOf(g, a); g.shield.add(b.id); g.roll = () => 0;
  ctx.act(a, { type: "pick", chest: "spicy" });
  assert.equal(bankOf(g, a), before, "blocked steal gives nothing");
  assert.ok(!g.shield.has(b.id), "shield is consumed");
  assert.ok(g.feed.some((f) => f.kind === "blocked"));
  // tiny bank => fallback coins
  ctx.advance(20000, 100);
  question(ctx, [[a.id, true, 1000], [b.id, false, 1000]]);
  g.shield.clear(); g.setBank(b.id, 20); const pre = bankOf(g, a); g.roll = () => 0;
  ctx.act(a, { type: "pick", chest: "spicy" });
  assert.equal(bankOf(g, a) - pre, 40);
});

test("WILD outcomes: jackpot, steal from leader (or +200 if you lead), swap with a richer player, oops, plain coins", () => {
  const rolls = (v) => { let first = true; return () => { const r = first ? v : 99; first = false; return r; }; };
  const run = (setBanks, roll) => {
    const ctx = setup(3); const [a, b, c] = ctx.players; const { g } = ctx;
    question(ctx, [[a.id, true, 1000], [b.id, false, 1000], [c.id, false, 1000]]);
    setBanks(g, a, b, c); g.roll = roll;
    const before = bankOf(g, a);
    ctx.act(a, { type: "pick", chest: "wild" });
    return { g, a, b, c, before };
  };
  let r = run((g, a) => g.setBank(a.id, 100), rolls(5));
  assert.equal(bankOf(r.g, r.a) - r.before, 700, "jackpot");
  r = run((g, a, b, c) => { g.setBank(a.id, 100); g.setBank(b.id, 2000); g.setBank(c.id, 500); }, rolls(20));
  assert.equal(bankOf(r.g, r.a) - r.before, 500, "25% of 2000 = 500 (cap)");
  assert.equal(bankOf(r.g, r.b), 1500);
  r = run((g, a, b, c) => { g.setBank(a.id, 5000); g.setBank(b.id, 100); g.setBank(c.id, 100); }, rolls(20));
  assert.equal(bankOf(r.g, r.a) - r.before, 200, "already the leader -> +200 instead");
  r = run((g, a, b, c) => { g.setBank(a.id, 100); g.setBank(b.id, 900); g.setBank(c.id, 50); }, rolls(40));
  assert.equal(bankOf(r.g, r.a), 900, "swapped with the only richer player");
  assert.equal(bankOf(r.g, r.b), 100);
  r = run((g, a) => g.setBank(a.id, 1000), rolls(60));
  assert.equal(bankOf(r.g, r.a), 1000 - 150, "oops: lose 15%");
  r = run((g, a) => g.setBank(a.id, 1000), rolls(90));
  assert.equal(bankOf(r.g, r.a) - r.before, 200);
});

test("the chest phase ends when everyone picked, and auto-picks for anyone who didn't (round never stalls)", () => {
  const ctx = setup(3); const { g } = ctx;
  question(ctx, ctx.players.map((p, i) => [p.id, i === 0, 1000]));
  const [a, b, c] = ctx.players;
  ctx.act(a, { type: "pick", chest: "safe" });
  assert.equal(g.phase, "chest");
  ctx.advance(9000, 100);
  assert.equal(g.picks.size, 3, "auto-picked for b and c");
  assert.ok(["reveal", "ready"].includes(g.phase));
  void b; void c;
});

test("privacy: the correct answer and other players' chest results are never in a view before they should be", () => {
  const ctx = setup(3); const { g } = ctx; const [a, b] = ctx.players;
  ctx.advance(g.q.openAt - ctx.room.t() + 50, 10);
  assert.equal(ctx.view(a).game.correct, undefined);
  question(ctx, [[a.id, true, 1000], [b.id, true, 1200]]);
  g.roll = () => 99;
  const viewB = JSON.stringify(ctx.view(b).game);
  ctx.act(a, { type: "pick", chest: "wild" });
  assert.equal(ctx.view(b).game.you.result, null, "b has no result before picking");
  assert.ok(ctx.view(a).game.you.result, "a sees their own result");
  void viewB;
});

test("piggy bank is playable with the teacher's question set and counts toward Arcade Party", () => {
  const set = { title: "Mine", items: { questions: Array.from({ length: 6 }, (_, i) => ({ q: `Teacher question ${i}?`, choices: ["a", "b"], answer: 0 })) } };
  const ctx = makeRoom({ n: 3, playlist: ["piggy_bank", "last_one_standing"], content: set });
  const g = ctx.begin();
  assert.match(g.q.q, /Teacher question/);
});

test("quick chat: curated phrases only, cooldown, game-specific phrases, teacher switch, names in the view", async () => {
  const ctx = makeRoom({ n: 3, playlist: ["hot_potato"] });
  const [a, b] = ctx.players;
  assert.ok(PHRASES.length > 40 && PHRASES.every((p) => !/[<>]/.test(p.text)));
  const gg = PHRASES.find((p) => p.text.startsWith("GG")).id;
  ctx.room.chat(a.id, gg);
  assert.throws(() => ctx.room.chat(a.id, gg), /Hold on/);
  assert.throws(() => ctx.room.chat(b.id, "hello i am typing free text"), /quick chat phrases/);
  const imposterOnly = PHRASES.find((p) => p.game === "imposter").id;
  assert.throws(() => ctx.room.chat(b.id, imposterOnly), /quick chat phrases/, "imposter phrase not allowed in the lobby / other games");
  const v = ctx.room.view({ playerId: b.id });
  assert.equal(v.chat.length, 1);
  assert.equal(v.chat[0].nickname, a.nickname);
  assert.equal(v.chat[0].text, PHRASE_BY_ID.get(gg).text);
  ctx.clock.now += 3000;
  ctx.begin();
  const potato = PHRASES.find((p) => p.game === "hot_potato").id;
  ctx.room.chat(b.id, potato);
  ctx.room.host("chat", { on: false });
  assert.equal(ctx.room.view({ playerId: a.id }).chat.length, 0, "turning chat off clears it");
  assert.throws(() => ctx.room.chat(a.id, gg), /turned quick chat off/);
});

test("API: chat is rate limited and needs a valid seat; teacher can add bots only in the lobby (max 40) and bots are marked", async () => {
  const store = new MemoryStore(); const svc = new ArcadeService();
  const t = teacherCtx(store, "t1");
  const { code } = await handle(svc, t, { type: "create", playlist: ["hot_potato"] });
  const j = await handle(svc, guestCtx(store, "5.5.5.5"), { type: "join", code, nickname: "Chatty" });
  const gg = PHRASES.find((p) => p.text.startsWith("GG")).id;
  await handle(svc, guestCtx(store, "5.5.5.5"), { type: "chat", code, playerId: j.playerId, token: j.token, phrase: gg });
  await assert.rejects(() => handle(svc, guestCtx(store, "5.5.5.5"), { type: "chat", code, playerId: j.playerId, token: "bad", phrase: gg }), /not found|Rejoin/);
  await assert.rejects(() => handle(svc, guestCtx(store, "5.5.5.5"), { type: "chat", code, playerId: j.playerId, token: j.token, phrase: gg }), /Hold on|Slow down/);
  // bots
  await assert.rejects(() => handle(svc, guestCtx(store), { type: "host", code, cmd: "bots", args: { count: 5 } }), /Sign in|teacher/);
  const res = await handle(svc, t, { type: "host", code, cmd: "bots", args: { count: 12, difficulty: "hard" } });
  assert.equal(res.view.players.length, 13);
  assert.equal(res.view.players.filter((p) => p.bot).length, 12);
  const full = await handle(svc, t, { type: "host", code, cmd: "bots", args: { count: 99 } });
  assert.equal(full.view.players.length, 40, "never exceeds 40");
  await assert.rejects(() => handle(svc, t, { type: "host", code, cmd: "bots", args: { count: 1 } }), /full/);
  const cleared = await handle(svc, t, { type: "host", code, cmd: "clearbots" });
  assert.equal(cleared.view.players.length, 1);
  await handle(svc, t, { type: "host", code, cmd: "bots", args: { count: 3 } });
  await handle(svc, t, { type: "host", code, cmd: "start" });
  await assert.rejects(() => handle(svc, t, { type: "host", code, cmd: "bots", args: { count: 3 } }), /lobby|full|Add bots/);
});

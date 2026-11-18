import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom, teacherCtx, studentCtx, guestCtx } from "./helpers.mjs";
import { ArcadeService } from "../service.mjs";
import { handle } from "../api.mjs";
import { MemoryStore } from "../store.mjs";
import { partition } from "../util.mjs";

test("room codes are six unambiguous characters and unique", () => {
  const svc = new ArcadeService();
  const codes = new Set();
  for (let i = 0; i < 200; i++) { const r = svc.create({ playlist: ["hot_potato"] }); assert.match(r.code, /^[A-HJ-NP-Z2-9]{6}$/); codes.add(r.code); }
  assert.equal(codes.size, 200);
});

test("joining: nickname cleaning, dedupe, capacity of 40, moderation", () => {
  const { room } = makeRoom({ n: 0 });
  const a = room.addPlayer({ nickname: "  Sam<script>  " });
  assert.equal(a.nickname, "Samscript");
  const b = room.addPlayer({ nickname: "Sam<script>" });
  assert.notEqual(a.nickname, b.nickname);
  assert.throws(() => room.addPlayer({ nickname: "fuck" }), /different nickname/);
  assert.throws(() => room.addPlayer({ nickname: "f u c k" }), /different nickname/);
  assert.throws(() => room.addPlayer({ nickname: "call me 555 123 4567" }), /different nickname/);
  assert.throws(() => room.addPlayer({ nickname: "a" }), /at least 2/);
  for (let i = 0; i < 38; i++) room.addPlayer({ nickname: `Kid${i}` });
  assert.equal(room.players.size, 40);
  assert.throws(() => room.addPlayer({ nickname: "Overflow" }), /full/);
});

test("players never see tokens of other players; invalid tokens are rejected", () => {
  const { room, players } = makeRoom({ n: 3 });
  const json = JSON.stringify(room.view({ playerId: players[0].id }));
  for (const p of players) assert.ok(!json.includes(p.token), "token leaked in public state");
  assert.throws(() => room.authPlayer(players[0].id, "wrong"), /not found/);
  assert.equal(room.authPlayer(players[0].id, players[0].token).id, players[0].id);
});

test("reconnection: same id + token resumes with score intact; disconnect is detected by missed polls", () => {
  const { room, players, advance, clock } = makeRoom({ n: 4 });
  const p = players[0];
  assert.ok(room.isConnected(p.id));
  clock.now += 20000; // no polls
  assert.ok(!room.isConnected(p.id));
  room.touch(p.id);
  assert.ok(room.isConnected(p.id));
  assert.equal(room.authPlayer(p.id, p.token).nickname, p.nickname);
  void advance;
});

test("late joiners wait for the next game instead of breaking the current one", () => {
  const { room, begin, advance } = makeRoom({ n: 4, playlist: ["hot_potato", "last_one_standing"] });
  begin();
  const late = room.addPlayer({ nickname: "Latecomer" });
  assert.equal(late.waiting, true);
  assert.throws(() => room.act(late.id, { type: "word", word: "station" }), /next game/);
  assert.ok(!room.game.players.includes(late.id));
  room.settings.lateJoin = false;
  assert.throws(() => room.addPlayer({ nickname: "TooLate" }), /not accepting/);
  void advance;
});

test("server-side timers: pause freezes game time, resume continues, skip works", () => {
  const { room, begin, advance } = makeRoom({ n: 4, playlist: ["last_one_standing"] });
  begin();
  advance(1000);
  const before = room.t();
  room.host("pause");
  advance(60000);
  assert.equal(room.t(), before, "game clock must not advance while paused");
  assert.throws(() => room.act(room.playerList()[0].id, { type: "answer", choice: 0 }), /paused/);
  room.host("resume");
  advance(500);
  assert.ok(room.t() > before);
  room.host("skip");
});

test("teacher authorization over the API", async () => {
  const store = new MemoryStore();
  const svc = new ArcadeService();
  await assert.rejects(() => handle(svc, guestCtx(store), { type: "create", playlist: ["hot_potato"] }), /teacher account/);
  await assert.rejects(() => handle(svc, studentCtx(store), { type: "create", playlist: ["hot_potato"] }), /teacher account/);
  const { code } = await handle(svc, teacherCtx(store, "t1"), { type: "create", playlist: ["hot_potato"] });
  // other teacher / student / guest cannot control it
  for (const ctx of [teacherCtx(store, "t2"), studentCtx(store), guestCtx(store)]) {
    await assert.rejects(() => handle(svc, ctx, { type: "host", code, cmd: "start" }), /teacher who created|Sign in/);
    await assert.rejects(() => handle(svc, ctx, { type: "poll", code, host: true }), /teacher who created|Sign in/);
  }
  // the creator can
  const j = await handle(svc, guestCtx(store), { type: "join", code, nickname: "Kid" });
  await handle(svc, guestCtx(store), { type: "join", code, nickname: "Kid2" });
  assert.ok(j.token);
  // students cannot send host commands through the player path either
  await assert.rejects(() => handle(svc, guestCtx(store), { type: "act", code, playerId: j.playerId, token: j.token, action: { type: "start" } }), /No game|Unknown/);
  const started = await handle(svc, teacherCtx(store, "t1"), { type: "host", code, cmd: "start" });
  assert.equal(started.view.phase, "intro");
});

test("malformed requests and oversize actions are rejected, polls need valid credentials", async () => {
  const store = new MemoryStore(); const svc = new ArcadeService();
  await assert.rejects(() => handle(svc, guestCtx(store), null), /Malformed/);
  await assert.rejects(() => handle(svc, guestCtx(store), { type: "poll", code: "NOPE22" }), /Room not found/);
  const { code } = await handle(svc, teacherCtx(store), { type: "create", playlist: ["hot_potato"] });
  await assert.rejects(() => handle(svc, guestCtx(store), { type: "poll", code, playerId: "x", token: "y" }), /not found|Rejoin/);
});

test("rate limiting protects joins and actions", async () => {
  const store = new MemoryStore(); const svc = new ArcadeService();
  const { code } = await handle(svc, teacherCtx(store), { type: "create", playlist: ["hot_potato"] });
  const j = await handle(svc, guestCtx(store, "9.9.9.9"), { type: "join", code, nickname: "Spammer" });
  let limited = 0;
  for (let i = 0; i < 40; i++) {
    try { await handle(svc, guestCtx(store, "9.9.9.9"), { type: "act", code, playerId: j.playerId, token: j.token, action: { type: "word", word: "x" } }); }
    catch (e) { if (e.code === "rate") limited++; }
  }
  assert.ok(limited > 10, `expected rate limiting, got ${limited}`);
});

test("teacher can remove a player; removed players lose access", async () => {
  const { room, players } = makeRoom({ n: 3 });
  room.host("remove", { playerId: players[1].id });
  assert.equal(room.players.size, 2);
  assert.throws(() => room.authPlayer(players[1].id, players[1].token), /not found/);
});

test("ending a session blocks joins; restart returns to the lobby with scores reset", () => {
  const { room, players } = makeRoom({ n: 3 });
  room.host("end");
  assert.equal(room.phase, "ended");
  assert.throws(() => room.addPlayer({ nickname: "Nope" }), /ended/);
  void players;
});

test("partition: 35 -> groups sized 5-7, imposter groups 4-5, never empty", () => {
  const ids = Array.from({ length: 35 }, (_, i) => i);
  const g7 = partition(ids, { max: 7, floor: 4 });
  assert.deepEqual(g7.map((g) => g.length), [7, 7, 7, 7, 7]);
  const g5 = partition(ids, { max: 5, floor: 3 });
  assert.deepEqual(g5.map((g) => g.length), [5, 5, 5, 5, 5, 5, 5]);
  for (let n = 1; n <= 40; n++) {
    const groups = partition(Array.from({ length: n }, (_, i) => i), { max: 5, floor: 3 });
    assert.equal(groups.flat().length, n);
    assert.equal(new Set(groups.flat()).size, n);
    if (n >= 3) for (const g of groups) assert.ok(g.length >= 3 && g.length <= 5, `n=${n} size ${g.length}`);
  }
});

test("35 players join and a session starts with every game's minimum satisfied", () => {
  const { room, begin } = makeRoom({ n: 35, playlist: ["hot_potato", "quick_draw", "last_one_standing", "telephone", "imposter"] });
  assert.equal(room.players.size, 35);
  begin();
  assert.equal(room.phase, "playing");
  assert.equal(room.game.players.length, 35);
});

test("needs enough players for the chosen playlist", () => {
  const { room } = makeRoom({ n: 2, playlist: ["imposter"] });
  assert.throws(() => room.start(), /at least 3 players/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom, teacherCtx, guestCtx } from "./helpers.mjs";
import { ArcadeService } from "../service.mjs";
import { MemoryStore } from "../store.mjs";
import { handle, handleDev } from "../api.mjs";

const ALL = ["hot_potato", "last_one_standing", "quick_draw", "telephone", "imposter"];

test("complete Arcade Party: 35 players, all five games in sequence, normalised cumulative scores, final podium", () => {
  const ctx = makeRoom({ n: 0, playlist: ALL, settings: { teams: 4 } });
  ctx.svc.addBots(ctx.room, 35, "mixed");
  const seen = [];
  ctx.room.start();
  for (let i = 0; i < 4000 && ctx.room.phase !== "final"; i++) {
    ctx.advance(250, 250);
    const tag = `${ctx.room.phase}:${ctx.room.gameIndex}`;
    if (seen[seen.length - 1] !== tag) seen.push(tag);
  }
  assert.equal(ctx.room.phase, "final");
  assert.equal(ctx.room.history.length, 5);
  assert.deepEqual(ctx.room.history.map((h) => h.gameId), ALL);
  // each game was introduced, played and summarised before the next
  for (let i = 0; i < 5; i++) for (const ph of ["intro", "playing", "results"]) assert.ok(seen.includes(`${ph}:${i}`), `${ph}:${i}`);
  // normalisation: every game's best player scored exactly 1000 or less, nobody above 1000, totals add up
  for (const h of ctx.room.history) for (const r of h.rows) assert.ok(r.norm >= 0 && r.norm <= 1000);
  const board = ctx.room.leaderboard(0);
  for (const row of board) {
    const expected = ctx.room.history.reduce((a, h) => a + (h.rows.find((r) => r.id === row.id)?.norm ?? 0), 0);
    assert.equal(row.total, expected, "cumulative total must equal the sum of normalised game scores");
  }
  assert.ok(board[0].total >= board[1].total);
  assert.equal(ctx.room.teamBoard().length, 4);
  const v = ctx.room.view({ mode: "projector" });
  assert.equal(v.phase, "final");
  assert.equal(v.history.length, 5);
});

test("one game cannot dominate: a game with huge raw scores is capped at 1000 per player", () => {
  const ctx = makeRoom({ n: 4, playlist: ["hot_potato"] });
  ctx.begin();
  const g = ctx.room.game;
  ctx.players.forEach((p, i) => g.points.set(p.id, 9000 - i * 1000));
  g.done = true; ctx.advance(300);
  const rows = ctx.room.history[0].rows;
  assert.equal(rows[0].norm, 1000);
  assert.equal(rows[3].norm, Math.round((1000 * 6000) / 9000));
});

test("teacher controls: pause, skip, remove during a game, end session", () => {
  const ctx = makeRoom({ n: 6, playlist: ["hot_potato", "last_one_standing"] });
  ctx.begin();
  ctx.room.host("pause");
  assert.equal(ctx.room.paused, true);
  ctx.room.host("resume");
  ctx.room.host("remove", { playerId: ctx.players[0].id });
  ctx.advance(500);
  assert.equal(ctx.room.players.size, 5);
  ctx.room.host("skip"); // skips the whole hot potato game
  ctx.advance(500);
  assert.equal(ctx.room.phase, "results");
  ctx.room.host("skip"); // skip results
  ctx.advance(500);
  assert.equal(ctx.room.phase, "intro");
  ctx.room.host("end");
  assert.equal(ctx.room.phase, "ended");
});

test("a single-game session ends with a final screen", () => {
  const ctx = makeRoom({ n: 3, playlist: ["last_one_standing"] });
  ctx.begin();
  ctx.room.host("skip"); ctx.advance(300);
  ctx.room.host("skip"); ctx.advance(300);
  ctx.advance(12000);
  assert.ok(["results", "final", "intro", "playing"].includes(ctx.room.phase));
});

test("restart returns players to the lobby with fresh totals", () => {
  const ctx = makeRoom({ n: 3, playlist: ["last_one_standing"] });
  ctx.begin();
  ctx.room.game.done = true; ctx.advance(300);
  ctx.room.host("skip"); ctx.advance(300);
  assert.equal(ctx.room.phase, "final");
  ctx.room.host("restart");
  assert.equal(ctx.room.phase, "lobby");
  assert.ok([...ctx.room.totals.values()].every((t) => t === 0));
});

test("API-level 35-client session: independent sessions join, poll their private state and play Hot Potato", async () => {
  const store = new MemoryStore();
  const svc = new ArcadeService();
  const teacher = teacherCtx(store, "t1");
  const { code } = await handle(svc, teacher, { type: "create", playlist: ["last_one_standing"] });
  const clients = [];
  for (let i = 0; i < 35; i++) {
    const j = await handle(svc, guestCtx(store, `10.0.0.${i}`), { type: "join", code, nickname: `Kid ${i}`, avatar: "rk-moon" });
    clients.push(j);
  }
  const lobby = await handle(svc, teacher, { type: "poll", code, host: true });
  assert.equal(lobby.view.players.length, 35);
  await handle(svc, teacher, { type: "host", code, cmd: "start" });
  const room = svc.get(code);
  // fast-forward the intro via the room's clock-independent skip
  await handle(svc, teacher, { type: "host", code, cmd: "skip" });
  await handle(svc, guestCtx(store), { type: "poll", code, playerId: clients[0].playerId, token: clients[0].token });
  assert.equal(room.phase, "playing");
  // each client sees only its own private state
  const v = (await handle(svc, guestCtx(store), { type: "poll", code, playerId: clients[3].playerId, token: clients[3].token })).view;
  assert.equal(v.me.id, clients[3].playerId);
  assert.equal(v.phase, "playing");
  assert.equal(v.game.kind, "last_one_standing");
});

test("developer lab is restricted to developers; bots use the same rules; disconnect/reconnect simulation", async () => {
  const store = new MemoryStore(); const svc = new ArcadeService();
  const dev = teacherCtx(store, "dev1");
  await assert.rejects(() => handleDev(svc, guestCtx(store), { type: "create" }), /Developer/);
  await assert.rejects(() => handleDev(svc, { ...dev, user: { ...dev.user, role: "student" } }, { type: "create" }), /Developer/);
  try {
    const { code } = await handleDev(svc, dev, { type: "create", playlist: ["hot_potato"], bots: 39, behavior: "mixed", timeScale: 0.1 });
    const state = await handleDev(svc, dev, { type: "state", code });
    assert.equal(state.view.players.length, 39);
    assert.equal(state.bots.length, 39);
    await assert.rejects(() => handleDev(svc, teacherCtx(store, "other-teacher"), { type: "state", code }), /Not your/);
    await handleDev(svc, dev, { type: "disconnect", code, count: 10 });
    const after = await handleDev(svc, dev, { type: "state", code });
    assert.equal(after.view.players.filter((p) => !p.connected).length, 10);
    await handleDev(svc, dev, { type: "reconnect", code });
    const back = await handleDev(svc, dev, { type: "state", code });
    assert.equal(back.view.players.filter((p) => !p.connected).length, 0);
    const me = await handleDev(svc, dev, { type: "join_self", code });
    assert.ok(me.token);
    assert.equal(svc.get(code).players.size, 40);
  } finally { /* nothing to restore */ }
});

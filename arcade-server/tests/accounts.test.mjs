import test from "node:test";
import assert from "node:assert/strict";
import { cleanUsername, cleanPassword, signup, login, startSession, userFromToken, hashToken } from "../accounts.mjs";
import { handle, handleAccount, handleEconomy, SOLO } from "../api.mjs";
import { ArcadeService } from "../service.mjs";
import { MemoryStore } from "../store.mjs";
import { guestCtx } from "./helpers.mjs";

test("usernames: simple, no personal info, moderated; passwords: length only", () => {
  assert.equal(cleanUsername("  cool_kid7 "), "cool_kid7");
  for (const bad of ["ab", "has space", "x".repeat(21), "kid@school.org", "call5551234567", "fuck_you", "bad!name"]) assert.throws(() => cleanUsername(bad), undefined, bad);
  assert.throws(() => cleanPassword("12345"), /6-72/);
  assert.throws(() => cleanPassword("samename", "SameName"), /same as your username/);
  assert.equal(cleanPassword("secret1"), "secret1");
});

test("accounts store only a username and a password hash - no email, no real name", async () => {
  const store = new MemoryStore();
  const acc = await signup(store, { username: "Pixel_Fan", password: "hunter22" });
  const raw = [...store.accounts.values()][0];
  assert.deepEqual(Object.keys(raw).sort(), ["id", "key", "passwordHash", "username"]);
  assert.ok(!raw.passwordHash.includes("hunter22"));
  await assert.rejects(() => signup(store, { username: "pixel_fan", password: "another1" }), /taken/, "usernames are case-insensitive unique");
  assert.deepEqual(await login(store, { username: "PIXEL_FAN", password: "hunter22" }), { id: acc.id, username: "Pixel_Fan" });
  await assert.rejects(() => login(store, { username: "pixel_fan", password: "wrong" }), /Wrong username or password/);
  await assert.rejects(() => login(store, { username: "nobody", password: "whatever" }), /Wrong username or password/);
});

test("sessions: the token is random, only its hash is stored, it expires, logout kills it", async () => {
  const store = new MemoryStore();
  const acc = await signup(store, { username: "sess_kid", password: "hunter22" });
  const { token } = await startSession(store, acc.id);
  assert.ok(token.length >= 60);
  assert.ok(![...store.sessions.keys()].includes(token) && store.sessions.has(hashToken(token)));
  const user = await userFromToken(store, token);
  assert.equal(user.role, "student"); assert.equal(user.name, "sess_kid"); assert.equal(user.id, `acct:${acc.id}`); assert.equal(user.email, "");
  assert.equal(await userFromToken(store, "garbage"), undefined);
  store.sessions.get(hashToken(token)).expiresAt = new Date(Date.now() - 1000);
  assert.equal(await userFromToken(store, token), undefined, "expired");
});

test("account API: signup/login rate-limits, delete_account wipes coins + collection", async () => {
  const store = new MemoryStore(); const svc = new ArcadeService();
  const ctx = guestCtx(store, "7.7.7.7");
  const out = await handleAccount(svc, ctx, { type: "signup", username: "wipe_me", password: "hunter22" });
  assert.ok(out.startSession.token);
  const user = await userFromToken(store, out.startSession.token);
  await store.award({ userId: user.id, coins: 300, key: "seed" });
  await handleEconomy({ store, user }, { type: "open_pack", requestId: "req-wipe-0001" });
  assert.equal((await handleEconomy({ store, user }, { type: "me" })).kind, "arcade");
  const gone = await handleAccount(svc, { store, user, ip: "7.7.7.7" }, { type: "delete_account" });
  assert.equal(gone.endSession, true);
  assert.equal((await store.getWallet(user.id)).coins, 0);
  assert.deepEqual(await store.getCollection(user.id), []);
  assert.equal(await userFromToken(store, out.startSession.token), undefined);
  await assert.rejects(() => handleAccount(svc, guestCtx(store, "7.7.7.7"), { type: "delete_account" }), /Sign in/);
  let limited = 0;
  for (let i = 0; i < 12; i++) try { await handleAccount(svc, guestCtx(store, "8.8.8.8"), { type: "login", username: "wipe_me", password: "nope" + i }); } catch (e) { if (e.code === "rate") limited++; }
  assert.ok(limited >= 3, "brute-force attempts on one username are throttled");
});

function soloEnv() {
  const clock = { now: 1_000_000 }; const store = new MemoryStore();
  const svc = new ArcadeService({ clock: () => clock.now, onAward: (a) => (a.dailyCap ? store.awardCapped(a) : store.award(a)) });
  const run = async (ctx, body, ms = 600_000) => {
    const j = await handle(svc, ctx, { type: "solo_create", ...body });
    const room = svc.get(j.code);
    for (let t = 0; t < ms && room.phase !== "final"; t += 250) { clock.now += 250; room.touch(j.playerId); svc.tickAll(); }
    await new Promise((r) => setTimeout(r, 5));
    return { j, room };
  };
  return { svc, store, clock, run };
}

test("solo practice: every game runs end-to-end with bot opponents and the right player counts", async () => {
  const { run } = soloEnv();
  for (const game of Object.keys(SOLO.bots)) {
    const { room } = await run(guestCtx(new MemoryStore(), "1.1.1.1"), { game, difficulty: "medium" });
    assert.equal(room.phase, "final", game);
    assert.equal(room.players.size, SOLO.bots[game] + 1, game);
    assert.equal(room.playerList().filter((p) => !p.bot).length, 1);
    assert.equal(room.history.length, 1);
  }
});

test("solo coins: signed-in players earn by placement x difficulty, guests earn nothing, daily cap holds", async () => {
  const { run, store } = soloEnv();
  const acc = await signup(store, { username: "solo_kid", password: "hunter22" });
  const user = await userFromToken(store, (await startSession(store, acc.id)).token);
  const ctx = { store, user, ip: "2.2.2.2" };
  const { room } = await run(ctx, { game: "last_one_standing", difficulty: "hard" });
  const human = room.playerList().find((p) => !p.bot);
  assert.ok(human.coinsEarned >= 1, "paid something");
  assert.equal(room.view({ playerId: human.id }).me.solo.coins, human.coinsEarned);
  const afterOne = (await store.getWallet(user.id)).coins;
  assert.equal(afterOne, human.coinsEarned);
  // guest: no coins
  const g = await run(guestCtx(store, "3.3.3.3"), { game: "hot_potato", difficulty: "easy" });
  const guest = g.room.playerList().find((p) => !p.bot);
  assert.equal(guest.coinsEarned, null);
  // farming: once today's solo allowance is used up, further runs pay nothing
  await store.awardCapped({ userId: user.id, coins: 149, key: "pre-fill", reason: "solo prefill", dailyCap: SOLO.dailyCap });
  assert.equal((await store.getWallet(user.id)).coins, SOLO.dailyCap, "allowance filled to exactly the cap");
  const again = await run(ctx, { game: "last_one_standing", difficulty: "hard" });
  assert.equal(again.room.playerList().find((p) => !p.bot).coinsEarned, 0);
  assert.equal((await store.getWallet(user.id)).coins, SOLO.dailyCap, "wallet unchanged");
});

test("solo controls: only the solo player can pause/quit; non-solo rooms reject solo commands", async () => {
  const { svc, store } = soloEnv();
  const j = await handle(svc, guestCtx(store, "4.4.4.4"), { type: "solo_create", game: "imposter", difficulty: "easy" });
  const room = svc.get(j.code);
  await handle(svc, guestCtx(store), { type: "solo_cmd", code: j.code, playerId: j.playerId, token: j.token, cmd: "pause" });
  assert.equal(room.paused, true);
  await assert.rejects(() => handle(svc, guestCtx(store), { type: "solo_cmd", code: j.code, playerId: j.playerId, token: "bad", cmd: "quit" }), /not found|Rejoin/);
  await handle(svc, guestCtx(store), { type: "solo_cmd", code: j.code, playerId: j.playerId, token: j.token, cmd: "quit" });
  assert.equal(room.phase, "ended");
  await assert.rejects(() => handle(svc, guestCtx(store), { type: "solo_create", game: "nope" }), /Pick a game/);
});

test("teacher gift: 100 coins to every signed-in student in the room; guests/bots skipped; host only; 3 per session; daily cap", async () => {
  const store = new MemoryStore(); const svc = new ArcadeService();
  const teacher = { user: { id: "t1", role: "teacher", name: "T" }, ip: "1.1.1.1", store };
  const { code } = await handle(svc, teacher, { type: "create", playlist: ["hot_potato"] });
  const mk = async (name) => { const a = await signup(store, { username: name, password: "hunter22" }); return userFromToken(store, (await startSession(store, a.id)).token); };
  const u1 = await mk("gift_kid1"), u2 = await mk("gift_kid2");
  await handle(svc, { store, user: u1, ip: "2.2.2.2" }, { type: "join", code, nickname: "Aaa" });
  await handle(svc, { store, user: u2, ip: "2.2.2.3" }, { type: "join", code, nickname: "Bbb" });
  await handle(svc, guestCtx(store, "2.2.2.4"), { type: "join", code, nickname: "Guest" });
  await handle(svc, teacher, { type: "host", code, cmd: "bots", args: { count: 3 } });
  // not the host: refused
  await assert.rejects(() => handle(svc, { store, user: u1, ip: "2.2.2.2" }, { type: "host", code, cmd: "gift" }), /teacher who created|Sign in/);
  await assert.rejects(() => handle(svc, guestCtx(store), { type: "host", code, cmd: "gift" }), /Sign in|teacher/);
  const r = await handle(svc, teacher, { type: "host", code, cmd: "gift" });
  assert.deepEqual([r.gift.given, r.gift.signedIn, r.gift.guests, r.gift.left, r.gift.coins], [2, 2, 1, 2, 100]);
  assert.equal((await store.getWallet(u1.id)).coins, 100);
  assert.equal((await store.getWallet(u2.id)).coins, 100);
  assert.equal(svc.get(code).playerList().find((p) => p.userId === u1.id).gift.coins, 100);
  const view = svc.get(code).view({ playerId: svc.get(code).playerList().find((p) => p.userId === u1.id).id });
  assert.equal(view.me.gift.coins, 100, "the student's own view carries the gift so the UI can celebrate");
  await handle(svc, teacher, { type: "host", code, cmd: "gift" });
  await handle(svc, teacher, { type: "host", code, cmd: "gift" });
  assert.equal((await store.getWallet(u1.id)).coins, 300);
  await assert.rejects(() => handle(svc, teacher, { type: "host", code, cmd: "gift" }), /3 times per session/);
  // daily cap across rooms: this student already received 300 today
  const again = await handle(svc, teacher, { type: "create", playlist: ["hot_potato"] });
  await handle(svc, { store, user: u1, ip: "2.2.2.2" }, { type: "join", code: again.code, nickname: "Aaa" });
  const capped = await handle(svc, teacher, { type: "host", code: again.code, cmd: "gift" });
  assert.equal(capped.gift.given, 0, "daily gift cap protects the economy");
  assert.equal((await store.getWallet(u1.id)).coins, 300);
  // empty room
  const empty = await handle(svc, teacher, { type: "create", playlist: ["hot_potato"] });
  await handle(svc, guestCtx(store, "9.9.9.9"), { type: "join", code: empty.code, nickname: "OnlyGuest" });
  await assert.rejects(() => handle(svc, teacher, { type: "host", code: empty.code, cmd: "gift" }), /No signed-in students/);
});

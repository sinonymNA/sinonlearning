import test from "node:test";
import assert from "node:assert/strict";
import { makeRoom, studentCtx, guestCtx } from "./helpers.mjs";
import { MemoryStore } from "../store.mjs";
import { CHARACTERS, PACKS, packOdds, rollPack, RARITIES } from "../characters.mjs";
import { handleEconomy } from "../api.mjs";

test("40 original characters across five rarities, all drawable; odds sum to 100%", () => {
  assert.equal(CHARACTERS.length, 40);
  assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, 40);
  assert.ok(CHARACTERS.every((c) => c.tagline.length > 10));
  for (const c of CHARACTERS) assert.ok(RARITIES[c.rarity]);
  const odds = packOdds("basic");
  assert.equal(odds.pack.cost, 150);
  assert.ok(Math.abs(odds.rarities.reduce((a, r) => a + r.percent, 0) - 100) < 0.2);
  assert.ok(Math.abs(odds.characters.reduce((a, c) => a + c.percent, 0) - 100) < 0.3);
});

test("pack rolls follow the published probabilities (statistically)", () => {
  const counts = {};
  const N = 20000;
  for (let i = 0; i < N; i++) { const c = rollPack("basic"); counts[c.rarity] = (counts[c.rarity] ?? 0) + 1; }
  for (const [id, w] of Object.entries(PACKS.basic.rarityWeights)) {
    const expected = w / 100, got = (counts[id] ?? 0) / N;
    assert.ok(Math.abs(got - expected) < 0.02 + expected * 0.35, `${id}: expected ${expected}, got ${got}`);
  }
});

test("coins are earned by signed-in players only, are separate from game points, and are idempotent", async () => {
  const store = new MemoryStore();
  const awards = [];
  const ctx = makeRoom({ n: 5, playlist: ["last_one_standing"], userIds: true, onAward: (a) => { awards.push(a); store.award(a); } });
  ctx.room.addPlayer({ nickname: "Guest" }); // guest: no userId
  ctx.begin();
  ctx.players.forEach((p, i) => ctx.room.game.points.set(p.id, 500 - i * 50));
  ctx.room.game.done = true;
  ctx.advance(300);
  assert.ok(awards.length >= 1, "signed-in players should be paid");
  assert.ok(awards.every((a) => a.userId.startsWith("user-")), "guests never earn persistent coins");
  const first = awards[0];
  assert.equal((await store.award(first)).awarded, false, "same award key is not paid twice");
  const w = await store.getWallet(first.userId);
  assert.ok(w.coins >= 10);
  // coins are not game points
  assert.ok(!("coins" in ctx.room.view({ playerId: ctx.players[0].id })));
});

test("a room never pays more than 150 coins per player in one session; tiny rooms pay nothing", () => {
  const awards = [];
  const ctx = makeRoom({ n: 4, playlist: ["last_one_standing", "last_one_standing", "last_one_standing"], userIds: true, onAward: (a) => awards.push(a) });
  for (let i = 0; i < 40; i++) { ctx.room.awardCoins(ctx.players.map((p, idx) => ({ id: p.id, points: 100 - idx, norm: 1000 })), "x"); }
  const per = new Map();
  for (const a of awards) per.set(a.userId, (per.get(a.userId) ?? 0) + a.coins);
  for (const total of per.values()) assert.ok(total <= 150);
  const small = makeRoom({ n: 2, userIds: true, onAward: (a) => awards.push({ ...a, small: true }) });
  small.room.awardCoins(small.players.map((p) => ({ id: p.id, points: 1, norm: 1 })), "x");
  assert.ok(!awards.some((a) => a.small));
});

test("pack opening: needs 150 coins, charges once, adds to the collection, and is duplicate-request safe", async () => {
  const store = new MemoryStore();
  const ctx = studentCtx(store, "kid-1");
  await assert.rejects(() => handleEconomy(ctx, { type: "open_pack", requestId: "req-aaaa1111" }), /need 150/);
  await store.award({ userId: "kid-1", coins: 400, key: "seed" });
  const a = await handleEconomy(ctx, { type: "open_pack", requestId: "req-aaaa1111" });
  assert.equal(a.coins, 250);
  assert.ok(CHARACTERS.find((c) => c.id === a.character.id));
  // retrying the same request (double click / network retry) returns the same result and does not charge again
  const again = await handleEconomy(ctx, { type: "open_pack", requestId: "req-aaaa1111" });
  assert.equal(again.character.id, a.character.id);
  assert.equal((await store.getWallet("kid-1")).coins, 250);
  // concurrent identical requests also charge once
  const [x, y] = await Promise.all([handleEconomy(ctx, { type: "open_pack", requestId: "req-bbbb2222" }), handleEconomy(ctx, { type: "open_pack", requestId: "req-bbbb2222" })]);
  assert.equal(x.character.id, y.character.id);
  assert.equal((await store.getWallet("kid-1")).coins, 100);
  const col = await store.getCollection("kid-1");
  assert.equal(col.reduce((n, c) => n + c.count, 0), 2);
  await assert.rejects(() => handleEconomy(ctx, { type: "open_pack", requestId: "req-cccc3333" }), /need 150/);
  await assert.rejects(() => handleEconomy(ctx, { type: "open_pack", requestId: "x" }), /request id/);
});

test("guests cannot open packs or keep a collection; delete-my-data wipes everything", async () => {
  const store = new MemoryStore();
  await assert.rejects(() => handleEconomy(guestCtx(store), { type: "open_pack", requestId: "req-guest0001" }), /Sign in/);
  const me = await handleEconomy(guestCtx(store), { type: "me" });
  assert.equal(me.signedIn, false);
  const ctx = studentCtx(store, "kid-9");
  await store.award({ userId: "kid-9", coins: 150, key: "s" });
  await handleEconomy(ctx, { type: "open_pack", requestId: "req-delete001" });
  await handleEconomy(ctx, { type: "delete_my_data" });
  assert.equal((await store.getWallet("kid-9")).coins, 0);
  assert.deepEqual(await store.getCollection("kid-9"), []);
});

test("unowned collectible avatars cannot be used in rooms", () => {
  const { room } = makeRoom({ n: 0 });
  const p = room.addPlayer({ nickname: "Sneaky", avatar: "c-ember", ownedAvatars: [] });
  assert.equal(p.avatar, "rk-sun");
  const q = room.addPlayer({ nickname: "Owner", avatar: "c-ember", ownedAvatars: ["c-ember"] });
  assert.equal(q.avatar, "c-ember");
});

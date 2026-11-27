import test from "node:test";
import assert from "node:assert/strict";
import { DECOR, SLOTS, RARITY, DEFAULTS, THEME_LOOK, itemsIn, decorById, newDecor, normalizeDecor, buyDecor, equipDecor, grantUnlocks, progressOf, closetCount, freshIn, clearFresh, isEquipped, owns } from "../shelf/decor.mjs";
import { newProfile, normalizeProfile, completeLevel, completeDaily } from "../shelf/engine.mjs";

test("catalog: 120+ items in 11 slots, unique ids, every item named with rarity and a line of text, bought items priced, earned items carry a known rule, legendary is earned", () => {
  assert.ok(DECOR.length >= 120, `${DECOR.length}`); assert.equal(SLOTS.length, 11); const seen = new Set();
  for (const d of DECOR) {
    assert.ok(!seen.has(d.id), `dup ${d.id}`); seen.add(d.id); assert.equal(d.id, `${d.slot}:${d.id.split(":")[1]}`); assert.ok(SLOTS.some((s) => s.id === d.slot) && d.name && RARITY[d.rarity] && d.text.length > 5, d.id);
    if (d.unlock) { assert.equal(d.price, 0); assert.ok(["dept", "stars", "solved", "perfect", "daily"].includes(d.unlock.t) && d.unlock.n > 0, d.id); } else if (d.id.split(":")[1] !== DEFAULTS[d.slot] && !["pet:none", "plant:none", "awning:none", "rug:none", "lights:none", "lights:scene"].includes(d.id)) assert.ok(d.price >= 40 && d.price <= 200, `${d.id} ${d.price}`);
  }
  for (const [s, v] of Object.entries(DEFAULTS)) assert.ok(decorById(`${s}:${v}`) && decorById(`${s}:${v}`).price === 0, `default ${s}`);
  assert.ok(DECOR.filter((d) => d.rarity === "legendary").every((d) => d.unlock), "legendary items are earned");
  assert.ok(itemsIn("theme").length >= 22 && itemsIn("pet").length >= 12 && itemsIn("plant").length >= 12 && itemsIn("finish").length >= 14 && itemsIn("skin").length >= 8 && itemsIn("fx").length >= 9);
});
test("rooms: every purchasable or earned room (except the department's own) has a complete look", () => {
  const hex = /^#[0-9a-f]{6}$/i, rooms = itemsIn("theme").filter((d) => d.id !== "theme:auto");
  for (const r of rooms) { const l = THEME_LOOK[r.id.split(":")[1]]; assert.ok(l, r.id); assert.equal(l.wall.length, 2); assert.ok(l.wall.every((c) => hex.test(c)) && l.floor.every((c) => hex.test(c)) && hex.test(l.trim), r.id); assert.ok(["stripes", "dots", "planks", "panes", "waves", "petals", "snow", "stars", "grid", "diamonds", "bricks", "none"].includes(l.pat[0]), r.id); assert.ok(["planks", "tiles", "checker", "sand", "grid", "carpet"].includes(l.fp), r.id); }
  assert.equal(Object.keys(THEME_LOOK).length, rooms.length);
});
test("old saves still load: a v1 shop gains the new free defaults, unknown ids are dropped, a worn item must be owned", () => {
  const old = normalizeProfile({ coins: 5, decor: { owned: ["plant:fern", "pet:cat", "zzz:nope"], equipped: { plant: "fern", pet: "cat", finish: "gold", sign: "wood" } } });
  assert.ok(old.decor.owned.includes("plant:fern") && !old.decor.owned.includes("zzz:nope")); assert.equal(old.decor.equipped.plant, "fern"); assert.equal(old.decor.equipped.finish, "oak", "an unowned finish cannot be worn"); assert.equal(old.decor.equipped.theme, "auto"); assert.equal(old.decor.equipped.skin, "classic"); assert.equal(old.decor.owned.length >= 11, true);
  assert.deepEqual(normalizeDecor(undefined), newDecor());
});
test("buying and wearing: coins are spent, items cannot be bought twice or without coins, earned items cannot be bought, wearing needs ownership", () => {
  const p = normalizeProfile({ coins: 100 }); assert.equal(buyDecor(p, "theme:cozy").ok, true); assert.equal(p.coins, 30); assert.ok(isEquipped(p, "theme:cozy")); assert.equal(buyDecor(p, "theme:cozy").reason, "owned");
  assert.equal(buyDecor(p, "theme:space").reason, "poor"); assert.equal(buyDecor(p, "theme:library").reason, "earned"); assert.equal(buyDecor(p, "zzz:zzz").reason, "unknown"); assert.equal(equipDecor(p, "theme:space").ok, false);
  assert.equal(equipDecor(p, "theme:auto").ok, true); assert.ok(!isEquipped(p, "theme:cozy")); assert.ok(owns(p, "theme:cozy"));
});
test("unlocks: clearing a department, stars, deliveries, perfects and a daily streak earn items once; NEW badges clear when you look", () => {
  const p = normalizeProfile({}); assert.deepEqual(grantUnlocks(p), []);
  p.stars = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 1])); assert.deepEqual(grantUnlocks(p).map((i) => i.id), ["theme:studio"]); assert.deepEqual(grantUnlocks(p), []); assert.equal(freshIn(p, "theme"), 1); clearFresh(p, "theme"); assert.equal(freshIn(p, "theme"), 0);
  p.stars = Object.fromEntries(Array.from({ length: 90 }, (_, i) => [i + 1, 2])); p.solved = 61; p.perfect = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i + 1, true])); p.daily.best = 7;
  const ids = grantUnlocks(p).map((i) => i.id); for (const w of ["theme:library", "theme:rooftop", "finish:pixel", "finish:gold", "tag:gold", "plant:trophy", "pet:unicorn", "fx:goldrain", "rug:welcome", "sign:royal", "lights:stars"]) assert.ok(ids.includes(w), `${w} in ${ids}`);
  assert.ok(!ids.includes("pet:dragon") && !ids.includes("skin:gold") && !ids.includes("plant:crystal"), "250 stars, 200 stars and 25 perfects are not met");
  const pr = progressOf(p, { t: "stars", n: 250 }); assert.equal(pr.met, false); assert.match(pr.text, /250 stars/); assert.equal(progressOf(p, { t: "dept", n: 1 }).met, true); assert.match(progressOf(p, { t: "dept", n: 3 }).text, /Boutique/);
  assert.equal(closetCount(p).total, DECOR.length); assert.ok(closetCount(p, "theme").owned >= 10);
});
test("finishing a level or a Daily reports the closet items it just unlocked", () => {
  const p = normalizeProfile({}); for (let L = 1; L <= 9; L++) completeLevel(p, { level: L, moves: 20, par: 10 }); const r = completeLevel(p, { level: 10, moves: 5, par: 5, boss: true });
  assert.ok(r.reward.unlocked.some((i) => i.id === "theme:studio"), "the Clothing Corner room"); assert.ok(r.reward.coins >= 60);
  const q = normalizeProfile({ daily: { last: "2030-01-09", streak: 6, best: 6, done: {} } }); const d = completeDaily(q, { moves: 4, par: 4 }, "2030-01-10"); assert.ok(d.reward.unlocked.some((i) => i.id === "fx:goldrain"), "a 7-day streak"); assert.deepEqual(completeDaily(q, { moves: 4, par: 4 }, "2030-01-10").reward.unlocked, []);
});
test("economy: ten levels pay enough for a first purchase or two, the full shop is a long-term goal", () => {
  const p = normalizeProfile({}); let coins = 0; for (let L = 1; L <= 10; L++) coins += completeLevel(p, { level: L, moves: 12, par: 10 }).reward.coins; assert.ok(coins >= 120 && coins <= 450, `10 levels pay ${coins}`);
  const buyable = DECOR.filter((d) => !d.unlock && d.price > 0), total = buyable.reduce((a, d) => a + d.price, 0); assert.ok(total >= 6000 && total <= 14000, `shop costs ${total}`); assert.ok(buyable.filter((d) => d.price <= 70).length >= 25, "many cheap first purchases");
});

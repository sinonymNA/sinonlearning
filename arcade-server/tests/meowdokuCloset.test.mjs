import test from "node:test";
import assert from "node:assert/strict";
import { CATALOG, SLOTS, DEFAULTS, RARITY, BREEDS, PALETTES, BACKDROPS, WORLD_BACKDROPS, itemOf, itemsIn, newCloset, normalizeCloset, buyItem, equipItem, grantUnlocks, progressOf, closetCount, freshIn, clearFresh, owns, equipped, colorsFor, colorNames } from "../meowdoku/closet.mjs";
import { newProfile, normalizeProfile, completeLevel, newGame, regionName, setRegionNames, totalStars } from "../meowdoku/engine.mjs";
import { completeDaily, completeEndless, newDailyGame, newEndlessGame } from "../meowdoku/modes.mjs";
import { AREAS } from "../meowdoku/areas.mjs";

test("catalog: 140+ items in 9 slots, unique ids, every item has a name, a rarity and a line of text, bought items have a price and earned items a rule", () => {
  assert.ok(CATALOG.length >= 140, `only ${CATALOG.length} items`); assert.equal(SLOTS.length, 9); const seen = new Set();
  for (const it of CATALOG) {
    const k = `${it.slot}:${it.id}`; assert.ok(!seen.has(k), `duplicate ${k}`); seen.add(k); assert.ok(SLOTS.some((s) => s.id === it.slot) && it.name && RARITY[it.rarity] && it.text.length > 5, k);
    if (it.unlock) { assert.equal(it.price, 0, `${k} is earned`); assert.ok(["world", "stars", "solved", "daily", "endless", "fast"].includes(it.unlock.t) && it.unlock.n > 0, k); } else if (it.id !== DEFAULTS[it.slot]) assert.ok(it.price >= 40 && it.price <= 500, `${k} price ${it.price}`);
  }
  for (const [slot, id] of Object.entries(DEFAULTS)) { const it = itemOf(slot, id); assert.ok(it && it.price === 0 && !it.unlock, `default ${slot}`); }
  assert.ok(BREEDS.length >= 20 && itemsIn("hat").length >= 15 && itemsIn("fish").length >= 10 && itemsIn("palette").length >= 12 && itemsIn("fx").length >= 8 && itemsIn("frame").length >= 8 && itemsIn("mark").length >= 6 && itemsIn("glasses").length >= 7);
  assert.ok(CATALOG.filter((i) => i.rarity === "legendary").every((i) => i.unlock), "legendary items are earned, never bought");
});
test("breeds: every look is complete and its colours are valid; palettes have 10 distinct colours with unique names; backdrops are real CSS; every world has its scene", () => {
  const hex = /^#[0-9a-f]{6}$/i;
  for (const b of BREEDS) { const l = b.look; for (const k of ["fur", "fur2", "white", "white2", "ear", "eye"]) assert.match(l[k], hex, `${b.id}.${k}`); assert.ok(["tuxedo", "solid", "tabby", "points", "calico", "spots", "mask", "sphynx", "fold", "coon", "cyber", "galaxy", "royal", "ghost"].includes(l.pattern), `${b.id} pattern ${l.pattern}`); if (l.pattern === "calico") { assert.match(l.patch1, hex); assert.match(l.patch2, hex); } if (l.pattern === "points" || l.pattern === "mask") assert.match(l.point, hex); }
  for (const p of PALETTES) { assert.equal(p.colors.length, 10, p.id); assert.ok(p.colors.every((c) => hex.test(c)), p.id); assert.equal(new Set(p.colors.map((c) => c.toLowerCase())).size, 10, `${p.id} has repeated colours`); const names = colorNames(p.colors); assert.equal(new Set(names).size, 10, `${p.id} names ${names.join()}`); assert.ok(names.every((n) => /^[a-z0-9 ]+$/.test(n))); }
  assert.equal(WORLD_BACKDROPS.length, AREAS.length); assert.equal(WORLD_BACKDROPS.length, 20); for (const b of [...BACKDROPS.slice(1), ...WORLD_BACKDROPS]) assert.ok(/gradient|#/.test(b.css), b.id);
});
test("colour names follow the equipped colour set, so a hint never calls a blue square green", () => {
  assert.deepEqual(colorNames(PALETTES[0].colors).slice(0, 4), ["green", "red", "pink", "orange"]); setRegionNames(colorNames(itemOf("palette", "ocean").colors)); assert.notEqual(regionName(0), "green"); assert.equal(regionName(0), colorNames(itemOf("palette", "ocean").colors)[0]);
  setRegionNames(null); assert.equal(regionName(0), "green");
});
test("old saves still load: a v1 profile gains a full default closet, junk ids are dropped, equipped items must be owned", () => {
  const old = normalizeProfile({ v: 1, level: 7, yarn: 33, hints: 2 }); assert.equal(old.level, 7); assert.equal(old.yarn, 33); assert.deepEqual(old.closet.equip, DEFAULTS); assert.equal(closetCount(old).owned, 9);
  const junk = normalizeCloset({ owned: { "breed:calico": 1, "breed:nope": 1, "weird": 1 }, equip: { breed: "calico", hat: "crown", fish: "koi" } });
  assert.ok(junk.owned["breed:calico"] && !junk.owned["breed:nope"] && !junk.owned.weird); assert.equal(junk.equip.breed, "calico"); assert.equal(junk.equip.hat, "none", "an unowned hat cannot be worn"); assert.equal(junk.equip.fish, "gold");
});
test("buying: costs yarn, cannot be repeated, earned items cannot be bought, equipping needs ownership and swaps one per slot", () => {
  const p = normalizeProfile({ yarn: 100 }); assert.deepEqual(buyItem(p, "breed", "tabby"), { ok: true, item: itemOf("breed", "tabby") }); assert.equal(p.yarn, 40); assert.equal(buyItem(p, "breed", "tabby").reason, "owned");
  assert.equal(buyItem(p, "breed", "galaxy").reason, "poor"); assert.equal(buyItem(p, "breed", "royal").reason, "earned"); assert.equal(buyItem(p, "breed", "zzz").reason, "unknown"); assert.equal(p.yarn, 40);
  assert.equal(equipItem(p, "breed", "siamese").ok, false); assert.equal(equipItem(p, "breed", "tabby").ok, true); assert.equal(equipped(p, "breed").id, "tabby"); assert.equal(equipItem(p, "breed", "tuxedo").ok, true); assert.equal(equipped(p, "breed").id, "tuxedo"); assert.ok(owns(p, "breed", "tabby"));
  p.yarn = 500; for (const slot of ["hat", "glasses", "palette", "backdrop", "fish", "fx", "mark", "frame"]) { const it = itemsIn(slot).find((i) => i.price > 0 && i.price <= 150 && !i.unlock); assert.ok(it, slot); assert.equal(buyItem(p, slot, it.id).ok, true, slot); assert.equal(equipItem(p, slot, it.id).ok, true); assert.equal(p.closet.equip[slot], it.id); }
  assert.ok(colorsFor(p).length === 10);
});
test("unlocks: clearing a world, collecting stars, solving, daily streaks and endless wins hand out earned items exactly once and flag them NEW until you look", () => {
  const p = normalizeProfile({}); assert.deepEqual(grantUnlocks(p), []);
  p.stars = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 3])); const got = grantUnlocks(p); assert.deepEqual(got.map((i) => i.id), ["world-1"]); assert.deepEqual(grantUnlocks(p), [], "only once"); assert.ok(owns(p, "backdrop", "world-1")); assert.equal(freshIn(p, "backdrop"), 1);
  clearFresh(p, "backdrop"); assert.equal(freshIn(p, "backdrop"), 0);
  p.stars = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [i + 1, 2])); p.solved = 55; p.daily.best = 7; p.endless.wins = 20; const ids = grantUnlocks(p).map((i) => i.id);
  for (const want of ["world-2", "world-3", "world-4", "world-5", "world-6", "heart", "goldpaw", "gold", "grad", "halo", "fireworks"]) assert.ok(ids.includes(want), `${want} in ${ids}`);
  assert.ok(!ids.includes("crown") && !ids.includes("royal"), "150 stars and world 10 are not met yet"); p.stars = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [i + 1, i < 50 ? 3 : 1])); const late = grantUnlocks(p).map((i) => i.id); assert.ok(late.includes("royal") && late.includes("crown") && late.includes("world-10"), late.join());
  const pr = progressOf(p, { t: "stars", n: 300 }); assert.equal(pr.met, false); assert.equal(pr.need, 300); assert.match(pr.text, /300 stars/); assert.equal(progressOf(p, { t: "world", n: 3 }).met, true); assert.match(progressOf(p, { t: "world", n: 15 }).text, /World 15/);
});
test("finishing a level, a Daily or an Endless puzzle reports the closet items it just unlocked", () => {
  const p = normalizeProfile({}); for (let L = 1; L <= 9; L++) { const g = newGame(L); g.won = true; completeLevel(p, g, 30); } const g10 = newGame(10); g10.won = true; const r = completeLevel(p, g10, 30);
  assert.ok(r.reward.unlocked.some((i) => i.id === "world-1"), "the finale of world 1 gives its scene"); assert.ok(r.reward.yarn >= 60, "a finale pays well"); assert.ok(totalStars(p) >= 10);
  const q = normalizeProfile({ daily: { best: 6, streak: 6, last: "2030-01-09", done: {} } }); const d = newDailyGame("2030-01-10"); d.won = true; const dr = completeDaily(q, d, 100, "2030-01-10"); assert.ok(Array.isArray(dr.reward.unlocked)); assert.ok(dr.reward.unlocked.some((i) => i.id === "halo"), "a 7-day streak earns the halo");
  const e = normalizeProfile({ endless: { wins: 19, day: "", today: 0, best: {} } }); const eg = newEndlessGame({ n: 5, diff: "easy", seed: 3 }); eg.won = true; const er = completeEndless(e, eg, 60, "2030-01-10", "easy"); assert.ok(er.unlocked.some((i) => i.id === "fireworks"));
});
test("economy: the first purchases are within reach of a few levels, and the whole closet is a long-term goal", () => {
  const p = normalizeProfile({}); let yarn = 0; for (let L = 1; L <= 10; L++) { const g = newGame(L); g.won = true; yarn += completeLevel(p, g, 30).reward.yarn; } assert.ok(yarn >= 100 && yarn <= 400, `10 levels pay ${yarn} yarn`);
  const buyable = CATALOG.filter((i) => !i.unlock && i.price > 0), total = buyable.reduce((a, i) => a + i.price, 0); assert.ok(total >= 8000 && total <= 20000, `closet costs ${total}`); assert.ok(buyable.filter((i) => i.price <= 70).length >= 25, "plenty of cheap first purchases");
});

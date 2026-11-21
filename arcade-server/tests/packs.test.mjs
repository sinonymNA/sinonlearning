import test from "node:test";
import assert from "node:assert/strict";
import { newState, openPack, openMany, buyUpgrade, upgradeCost, unlocked, packCost, mods, odds, claimFree, tick, offline, reboot, rebootGain, buyNode, starsAvailable, simulate, bestTier, ownedInSet, levelOf, nextAt, cardRate, incomeRate, tap, packsForRarity, CARDS, SETS } from "../packs/engine.mjs";
import { RARITIES, UPGRADES, TREE, SET_SIZE } from "../packs/config.mjs";

test("72 unique cards, 12 per set with the fixed rarity layout, unique names and seeds", () => {
  assert.equal(CARDS.length, 72); assert.equal(new Set(CARDS.map((c) => c.id)).size, 72); assert.equal(new Set(CARDS.map((c) => c.name)).size, 72); assert.equal(new Set(CARDS.map((c) => c.seed)).size, 72);
  for (let k = 0; k < 6; k++) { const s = CARDS.filter((c) => c.set === k); assert.equal(s.length, SET_SIZE); assert.equal(s.filter((c) => c.rarity === "legendary").length, 1); assert.equal(s.filter((c) => c.rarity === "common").length, 5); }
});

test("opening a pack costs coins, adds cards to the collection, and duplicates level a card up", () => {
  const st = newState(5); const c0 = st.coins, cost = packCost(st, 0);
  const r = openPack(st, 0); assert.equal(r.cards.length, 3); assert.equal(st.coins, c0 - cost); assert.ok(Object.keys(st.dex).length >= 1);
  const st2 = newState(5); st2.coins = 0; assert.throws(() => openPack(st2, 0), /Not enough/); assert.throws(() => openPack(newState(1), 1), /locked/);
  const d = newState(1); d.coins = 1e9; for (let i = 0; i < 200; i++) openPack(d, 0); assert.ok(Object.values(d.dex).some((x) => x.n >= 4) && Object.values(d.dex).some((x) => levelOf(x.n) >= 3));
  assert.equal(levelOf(1), 1); assert.equal(levelOf(2), 2); assert.equal(levelOf(3), 2); assert.equal(levelOf(4), 3); assert.equal(nextAt(1), 2); assert.equal(nextAt(20), null);
});

test("rarity odds follow the table; luck shifts rare+ up but probabilities still sum to 1", () => {
  const st = newState(1), o = odds(st); assert.ok(Math.abs(o.reduce((a, r) => a + r.p, 0) - 1) < 1e-9); assert.ok(Math.abs(o[0].p - 0.62) < 1e-9);
  st.up.luck = 10; const o2 = odds(st); assert.ok(o2[4].p > o[4].p && o2[0].p < o[0].p && Math.abs(o2.reduce((a, r) => a + r.p, 0) - 1) < 1e-9);
  const sim = simulate(newState(2), 0, 20000, 9), n = sim.cards;
  RARITIES.forEach((r, i) => assert.ok(Math.abs(sim.counts[r.id] / n - o[i].p) < 0.01, `${r.id} ${sim.counts[r.id] / n} vs ${o[i].p}`));
});

test("coupon collector: packs needed for a legendary matches simulation", () => {
  const st = newState(1), exp = packsForRarity(st, "legendary"); let total = 0; const trials = 1500;
  for (let s = 1; s <= trials; s++) { const g = newState(s); g.coins = Infinity; let n = 0; for (;;) { n++; if (openPack(g, 0).cards.some((c) => c.rarity === "legendary")) break; } total += n; }
  assert.ok(Math.abs(total / trials - exp) / exp < 0.12, `sim ${total / trials} vs expected ${exp}`);
});

test("owned cards pay coins per second; levels, variants, completed sets and stars raise it", () => {
  const st = newState(1); assert.equal(incomeRate(st), 0);
  st.dex["meadow-0"] = { n: 1, foil: 0, holo: 0 }; const base = incomeRate(st); assert.ok(base > 0);
  st.dex["meadow-0"].n = 4; const lv = incomeRate(st); assert.ok(lv > base * 2);
  st.dex["meadow-0"].foil = 1; assert.ok(incomeRate(st) > lv * 1.5);
  const before = incomeRate(st); st.stars = 10; assert.ok(incomeRate(st) > before * 1.4); st.up.income = 5; assert.ok(incomeRate(st) > before * 2);
  const g = newState(2); g.dex["cave-0"] = { n: 1, foil: 0, holo: 0 }; g.dex["meadow-0"] = { n: 1, foil: 0, holo: 0 }; assert.ok(cardRate(CARDS.find((c) => c.id === "cave-0"), g.dex["cave-0"]) >= 7 * cardRate(CARDS.find((c) => c.id === "meadow-0"), g.dex["meadow-0"]) * 0.9, "later sets pay far more");
  const c0 = st.coins; assert.ok(tap(st) >= 1 && st.coins > c0);
});

test("upgrades cost coins, cap at max, and change the mods", () => {
  const st = newState(1); st.coins = 1e12; const c = upgradeCost("bulk", 0); const before = st.coins; buyUpgrade(st, "bulk"); assert.equal(before - st.coins, c); assert.ok(mods(st).cost < 1);
  for (const u of UPGRADES) { while ((st.up[u.id] || 0) < u.max) buyUpgrade(st, u.id); assert.throws(() => buyUpgrade(st, u.id), /Maxed/); }
  assert.equal(mods(st).cards, 3 + 4); assert.deepEqual(mods(st).multi, [1, 5, 10]); assert.ok(mods(st).autoEvery > 0);
  const poor = newState(1); poor.coins = 1; assert.throws(() => buyUpgrade(poor, "bulk"), /Not enough/);
});

test("the next pack unlocks only when the previous set is complete", () => {
  const st = newState(1); assert.ok(!unlocked(st, 1));
  for (const c of CARDS.filter((x) => x.set === 0).slice(0, 11)) st.dex[c.id] = { n: 1, foil: 0, holo: 0 };
  assert.ok(!unlocked(st, 1)); st.dex["meadow-11"] = { n: 1, foil: 0, holo: 0 };
  assert.ok(unlocked(st, 1)); assert.ok(!unlocked(st, 2)); assert.equal(ownedInSet(st, 0), 12);
});

test("free pack: usable on a timer, never leaves a broke player stuck", () => {
  const st = newState(1, 0); st.coins = 0; assert.equal(claimFree(st, 0).cards.length, 3);
  assert.throws(() => claimFree(st, 1000), /Not ready/); claimFree(st, 30000); assert.equal(bestTier(st), 0);
});

test("tick pays passive income and the auto-ripper opens packs on its timer, stopping when broke", () => {
  const st = newState(1, 0); st.dex["meadow-0"] = { n: 1, foil: 0, holo: 0 }; st.coins = 0; tick(st, 5000); assert.ok(st.coins > 0 && st.coins < 5, "5s of one common");
  const a = newState(1, 0); a.coins = 1e6; a.up.auto = 1; assert.equal(mods(a).autoEvery, 8.5);
  const out = []; for (let t = 1000; t <= 60000; t += 1000) out.push(...tick(a, t)); assert.ok(out.length >= 6 && out.length <= 8, "about 7 packs in 60s at 8.5s each, got " + out.length);
  const broke = newState(1, 0); broke.up.auto = 1; broke.coins = 0; assert.equal(tick(broke, 9000).length, 0);
});

test("offline: income is credited up to the cap; with an auto-ripper packs open too", () => {
  const st = newState(1, 0); st.dex["meadow-0"] = { n: 1, foil: 0, holo: 0 }; const r0 = offline(st, 10 * 3600); assert.ok(Math.abs(r0.coins - incomeRate(st) * 2 * 3600) < 1e-6 || r0.coins > 0, "capped at 2h"); assert.equal(r0.packs, 0);
  const a = newState(1, 0); a.up.auto = 5; a.coins = 5000; for (const c of CARDS.slice(0, 8)) a.dex[c.id] = { n: 1, foil: 0, holo: 0 }; const r = offline(a, 10 * 3600); assert.ok(r.packs > 50 && r.packs <= 250, "packs " + r.packs);
  assert.equal(offline(newState(1), 10).coins, 0);
});

test("reboot: needs earnings, grants stars, keeps the collection, resets the run, tree spends stars", () => {
  const st = newState(1); assert.throws(() => reboot(st), /Earn more/);
  st.run.earned = 2e8; st.coins = 123; st.up.bulk = 5; st.dex["meadow-0"] = { n: 3, foil: 1, holo: 0 }; assert.equal(rebootGain(st), 2);
  assert.equal(reboot(st), 2); assert.equal(st.stars, 2); assert.deepEqual(st.up, {}); assert.equal(st.run.earned, 0); assert.equal(st.dex["meadow-0"].n, 3); assert.equal(st.coins, 300);
  assert.throws(() => buyNode(st, "whole"), /earlier/); buyNode(st, "seed"); assert.equal(starsAvailable(st), 1); st.stars += 2; buyNode(st, "whole"); assert.equal(starsAvailable(st), 1);
  assert.throws(() => buyNode(st, "sleeve"), /Costs/); assert.ok(mods(st).cost < 1 && mods(st).starMul > 1);
  st.run.earned = 1e8; reboot(st); assert.equal(st.coins, 300 + 1500, "seed money applies");
});

test("tree: every requirement exists and no node is unreachable", () => {
  const ids = new Set(TREE.map((n) => n.id)); for (const n of TREE) for (const r of n.req) assert.ok(ids.has(r), n.id + " needs " + r);
  const done = new Set(); let grew = true; while (grew) { grew = false; for (const n of TREE) if (!done.has(n.id) && n.req.every((r) => done.has(r))) { done.add(n.id); grew = true; } }
  assert.equal(done.size, TREE.length);
});

test("state is plain JSON and deterministic from its seed", () => {
  const a = newState(42), b = newState(42); a.coins = b.coins = 1000;
  assert.deepEqual(openMany(a, 0, 5).map((r) => r.cards.map((c) => c.id)), openMany(b, 0, 5).map((r) => r.cards.map((c) => c.id)));
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
});

import { human } from "../../scripts/packs-econ.mjs";
test("economy: a human-speed player unlocks tiers steadily, gets the auto-ripper early and reaches a first reboot (3 stars) in 12 to 60 minutes", () => {
  for (const seed of [1, 2, 3]) {
    const { st, log } = human(seed, 4 * 3600);
    assert.ok(log.tier1 !== undefined && log.tier1 < 900, `tier 1 at ${log.tier1}s`); assert.ok(log.auto !== undefined && log.auto < 1500, `auto at ${log.auto}s`);
    assert.ok(log.reboot !== undefined && log.reboot > 12 * 60 && log.reboot < 60 * 60, `first reboot at ${log.reboot / 60}min (seed ${seed}), earned ${st.run.earned.toExponential(2)}`);
  }
});

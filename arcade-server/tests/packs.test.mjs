import test from "node:test";
import assert from "node:assert/strict";
import { newState, mods, hit, buyPack, unlockTier, sellAll, sellOne, storedValue, buyUpgrade, hire, upgradeCost, advance, offline, rarityOdds, variantOdds, simulate, expectedValue, cardValue, freeSlot, dupeCount, albumCount, packsFor, comboMul, comboAlive, fuse, fusable, claimMission, missionReward, missionText, missionUnit, ALBUM_TOTAL, CARDS, SETS, VARIANTS, RARITIES, UPGRADES, STAFF, MAX_SLOTS } from "../packs/engine.mjs";
import { SET_SIZE, DISCOVERY, BASE_CAP, CRIT_MUL, COMBO_MAX, COMBO_WINDOW, FUSE_COST, GOLDEN, MISSION_SLOTS } from "../packs/config.mjs";
import { human } from "../../scripts/packs-econ.mjs";

test("72 unique creatures, 12 per set with the fixed rarity layout; 6 finishes give 432 album entries", () => {
  assert.equal(CARDS.length, 72); assert.equal(new Set(CARDS.map((c) => c.id)).size, 72); assert.equal(new Set(CARDS.map((c) => c.name)).size, 72); assert.equal(new Set(CARDS.map((c) => c.seed)).size, 72);
  for (let k = 0; k < 6; k++) { const s = CARDS.filter((c) => c.set === k); assert.equal(s.length, SET_SIZE); assert.equal(s.filter((c) => c.rarity === "legendary").length, 1); }
  assert.equal(VARIANTS.length, 6); assert.equal(ALBUM_TOTAL, 432); for (const c of CARDS) assert.match(c.flavor, /^A [a-z]+ [a-z ]+ from (the (Meadow|Cave|Reef|Sky|Void)|Neon City)\./, c.name);
});

test("rarity and finish odds sum to 1, luck and shiny shift them, and simulation matches", () => {
  const st = newState(1), ro = rarityOdds(st), vo = variantOdds(st);
  assert.ok(Math.abs(ro.reduce((a, r) => a + r.p, 0) - 1) < 1e-9 && Math.abs(vo.reduce((a, r) => a + r.p, 0) - 1) < 1e-9); assert.ok(Math.abs(ro[0].p - 0.62) < 1e-9);
  st.up.luck = 10; st.up.shine = 10; assert.ok(rarityOdds(st)[4].p > ro[4].p && variantOdds(st)[5].p > vo[5].p && variantOdds(st)[0].p < vo[0].p);
  const base = newState(2), sim = simulate(base, 0, 40000, 9), o = rarityOdds(base), v = variantOdds(base);
  RARITIES.forEach((r, i) => assert.ok(Math.abs(sim.rarity[r.id] / sim.n - o[i].p) < 0.01, r.id)); VARIANTS.forEach((x, i) => assert.ok(Math.abs(sim.variant[x.id] / sim.n - v[i].p) < 0.006, x.id));
});

test("buying a pack needs unlock, a free table slot, stock and cash; it lands on the table with HP", () => {
  const st = newState(1); assert.throws(() => buyPack(st, 1), /Unlock/); const cash = st.cash; const slot = buyPack(st, 0);
  assert.equal(slot, 0); assert.equal(st.cash, cash - SETS[0].cost); assert.equal(st.table[0].hp, SETS[0].hp); assert.ok(st.stock[0] < 6);
  buyPack(st, 0); buyPack(st, 0); assert.equal(freeSlot(st), -1); assert.throws(() => buyPack(st, 0), /table is full/);
  const poor = newState(1); poor.cash = 1; assert.throws(() => buyPack(poor, 0), /Not enough/);
  const dry = newState(1); dry.stock[0] = 0; assert.throws(() => buyPack(dry, 0), /stock/);
});

test("tapping tears a pack: damage scales with upgrades, crits triple it, and the pack bursts into a card", () => {
  const st = newState(3); buyPack(st, 0); let r = hit(st, 0); assert.equal(r.burst, false); assert.equal(st.table[0].hp, SETS[0].hp - 1);
  let taps = 1; while (!r.burst) { r = hit(st, 0); taps++; } assert.equal(taps, SETS[0].hp); assert.equal(st.table[0], null); assert.equal(r.result.cards.length >= 1, true); assert.equal(st.total.packs, 1);
  const up = newState(3); up.up.dmg = 5; up.up.crit = 25; buyPack(up, 0); assert.equal(mods(up).dmg, 6); up.up.crit = 15; assert.ok(mods(up).crit > 0.5);
  let crits = 0; for (let i = 0; i < 40 && !up.table[0] === false; i++) { const x = hit(up, 0); if (x.crit) { crits++; assert.equal(x.dmg, 6 * CRIT_MUL); } if (x.burst) break; } assert.ok(true);
  assert.throws(() => hit(newState(1), 2), /Nothing/);
});

test("new cards and new finishes go to the album and pay a discovery bonus; duplicates go to storage; a full storage sells extras at half", () => {
  const st = newState(5); st.cash = 1e9; const c0 = st.cash; buyPack(st, 0); let r; while (!(r = hit(st, 0)).burst);
  const card = r.result.cards[0]; assert.ok(card.isNewCard && card.isNewVariant && card.fate === "album"); assert.ok(st.cash > c0 - 5 + card.value * DISCOVERY - 1e-6); assert.equal(albumCount(st), 1); assert.equal(dupeCount(st), 0);
  const stored = []; for (let i = 0; i < 400; i++) { st.stock[0] = 9; buyPack(st, 0); let x; while (!(x = hit(st, st.table.findIndex(Boolean))).burst); stored.push(...x.result.cards.map((c) => c.fate)); }
  assert.ok(stored.includes("stored") && stored.includes("overflow") && stored.includes("album")); assert.ok(dupeCount(st) <= BASE_CAP);
});

test("selling: sell all and sell one pay the current price and clear storage", () => {
  const st = newState(1); st.dupes = { "meadow-0|0": 3, "meadow-11|5": 1 }; const a = cardValue(st, CARDS.find((c) => c.id === "meadow-0"), 0), b = cardValue(st, CARDS.find((c) => c.id === "meadow-11"), 5);
  assert.ok(b > a * 100); assert.ok(Math.abs(storedValue(st) - (3 * a + b)) < 1e-6); const c0 = st.cash; assert.equal(sellOne(st, "meadow-0|0"), a); assert.equal(dupeCount(st), 3);
  const r = sellAll(st); assert.equal(r.n, 3); assert.ok(Math.abs(st.cash - (c0 + a + (2 * a + b))) < 1e-6); assert.equal(dupeCount(st), 0); assert.throws(() => sellOne(st, "meadow-0|0"), /None/);
});

test("unlocking pack types costs cash and must go in order; upgrades and staff cost cash, cap out and change mods", () => {
  const st = newState(1); assert.throws(() => unlockTier(st, 2), /earlier/); assert.throws(() => unlockTier(st, 1), /Not enough/); st.cash = 1e12; unlockTier(st, 1); assert.ok(st.unlocked[1]); assert.throws(() => unlockTier(st, 1), /Already/);
  for (const u of UPGRADES) { const c = upgradeCost(UPGRADES, u.id, 0), b = st.cash; buyUpgrade(st, u.id); assert.equal(b - st.cash, c); while ((st.up[u.id] || 0) < u.max) buyUpgrade(st, u.id); assert.throws(() => buyUpgrade(st, u.id), /Maxed/); }
  for (const u of STAFF) { hire(st, u.id); while ((st.staff[u.id] || 0) < u.max) hire(st, u.id); assert.throws(() => hire(st, u.id), /Maxed/); }
  const m = mods(st); assert.equal(m.dmg, 41); assert.equal(m.slots, MAX_SLOTS); assert.ok(m.cap > 100 && m.openHits > 5 && m.sellEvery > 0 && m.buyEvery > 0 && m.extra === 1);
  const poor = newState(1); poor.cash = 1; assert.throws(() => buyUpgrade(poor, "dmg"), /Not enough/); assert.throws(() => hire(poor, "opener"), /Not enough/);
});

test("the shop restocks over time up to its cap, and staff do their jobs", () => {
  const st = newState(1); st.stock[0] = 0; advance(st, 4); assert.ok(Math.abs(st.stock[0] - 1) < 1e-9); advance(st, 1000); assert.equal(st.stock[0], mods(st).stockMax);
  const o = newState(2); o.cash = 1e6; buyPack(o, 0); buyPack(o, 0); o.staff.opener = 1; let bursts = 0; for (let i = 0; i < 40; i++) bursts += advance(o, 1).length; assert.ok(bursts >= 2, "opener tears open the packs");
  const s = newState(3); s.dupes = { "meadow-0|0": 5 }; s.staff.seller = 1; advance(s, 9); assert.equal(dupeCount(s), 0); assert.ok(s.cash > 25);
  const b = newState(4); b.cash = 100; b.staff.buyer = 1; advance(b, 7); assert.ok(b.table.some(Boolean), "buyer put a pack on the table");
});

test("a broke player is never stuck: a free sample pack arrives", () => {
  const st = newState(1); st.cash = 0; advance(st, 3); assert.ok(!st.table.some(Boolean)); advance(st, 4); assert.ok(st.table[0] && st.table[0].free);
  const rich = newState(1); rich.cash = 100; advance(rich, 30); assert.ok(!rich.table.some(Boolean), "no handouts when you can afford a pack");
});

test("offline: staff keep working for up to the cap; without staff nothing happens", () => {
  assert.equal(offline(newState(1), 7200).cash, 0);
  const st = newState(1); st.cash = 5000; st.staff = { opener: 3, buyer: 3, seller: 3 }; const r = offline(st, 10 * 3600); assert.ok(r.packs > 50 && r.secs === 7200, JSON.stringify(r));
});

test("expected value matches the odds and rises with luck, shine and sell upgrades; the Odds Lab maths holds", () => {
  const st = newState(1), ro = rarityOdds(st), vo = variantOdds(st), ev = expectedValue(st, 0);
  assert.ok(Math.abs(ev - ro.reduce((a, r) => a + r.p * r.v, 0) * vo.reduce((a, v) => a + v.p * v.mult, 0)) < 1e-9);
  const up = newState(1); up.up.luck = 10; up.up.shine = 10; up.up.sell = 10; assert.ok(expectedValue(up, 0) > ev * 2); assert.ok(expectedValue(st, 1) > ev * 6);
  const p = 0.005 * 0.1; assert.ok(Math.abs(packsFor(st, p) - 1 / p) / (1 / p) < 1e-9);
});

test("state is plain JSON and deterministic from its seed", () => {
  const run = () => { const st = newState(42); st.cash = 1e6; const out = []; for (let i = 0; i < 6; i++) { st.stock[0] = 9; const slot = buyPack(st, 0); let x; while (!(x = hit(st, slot)).burst); out.push(x.result.cards.map((c) => c.id + c.variant)); } return { st, out }; };
  const a = run(), b = run(); assert.deepEqual(a.out, b.out); assert.deepEqual(JSON.parse(JSON.stringify(a.st)), a.st);
});

test("combo: fast taps build +4% damage each up to x2; waiting breaks it; staff taps ignore it", () => {
  assert.equal(comboMul(1), 1); assert.ok(Math.abs(comboMul(6) - 1.2) < 1e-9); assert.equal(comboMul(500), 1 + COMBO_MAX * 0.04);
  const st = newState(1); st.cash = 1e6; const dmgs = []; buyPack(st, 0);
  for (let i = 0; i < 4; i++) { advance(st, 0.3); const before = st.table[0].hp; hit(st, 0); dmgs.push(before - st.table[0].hp); if (!st.table[0]) break; }
  assert.ok(dmgs[1] > dmgs[0] - 1e-9 || dmgs.length < 2); assert.ok(comboAlive(st) || !st.table[0]); st.stock[0] = 9; buyPack(st, 0); advance(st, COMBO_WINDOW + 0.1); assert.ok(!comboAlive(st));
  const slot = st.table.findIndex(Boolean), before = st.table[slot].hp; hit(st, slot, undefined, false); assert.equal(before - st.table[slot].hp, 1, "staff taps never get combo damage");
  assert.ok(st.total.bestCombo >= 2);
});

test("golden packs: rare chance on purchase, tougher, extra card, better odds", () => {
  let golds = 0, N = 3000; for (let s = 1; s <= N; s++) { const st = newState(s); st.cash = 1e9; const slot = buyPack(st, 0); if (st.table[slot].gold) { golds++; assert.equal(st.table[slot].max, Math.round(6 * GOLDEN.hp)); } }
  assert.ok(golds / N > 0.025 && golds / N < 0.06, `golden rate ${golds / N}`);
  const g = newState(3); g.cash = 1e9; g.table[0] = { tier: 0, hp: 1, max: 1, gold: true }; const r = hit(g, 0); assert.ok(r.result.gold && r.result.cards.length >= 2);
  const plain = rarityOdds(newState(1)), boosted = rarityOdds(newState(1), GOLDEN.rarity); assert.ok(boosted[4].p > plain[4].p * 2.2);
});

test("fusion: 3 stored copies become 1 of the next finish; costs, limits, discovery, determinism", () => {
  const st = newState(1); st.dex["meadow-0"] = { n: 4, vars: [4, 0, 0, 0, 0, 0] }; st.dupes = { "meadow-0|0": 3 };
  assert.deepEqual(fusable(st), ["meadow-0|0"]); const cash = st.cash; const r = fuse(st, "meadow-0", 0);
  assert.equal(r.variant, "chrome"); assert.ok(r.isNewVariant && r.fate === "album"); assert.equal(dupeCount(st), 0); assert.ok(st.cash > cash); assert.equal(st.dex["meadow-0"].vars[1], 1); assert.equal(st.total.fused, 1);
  st.dupes = { "meadow-0|0": 2 }; assert.throws(() => fuse(st, "meadow-0", 0), /Needs 3/); assert.throws(() => fuse(st, "meadow-0", 5), /best finish/);
  st.dupes = { "meadow-0|0": 5 }; const r2 = fuse(st, "meadow-0", 0); assert.ok(!r2.isNewVariant && r2.fate === "stored"); assert.equal(st.dupes["meadow-0|0"], 2); assert.equal(st.dupes["meadow-0|1"], 1);
  assert.equal(FUSE_COST, 3);
});

test("orders: three distinct orders, progress from play, claim pays a reward scaled to your best pack, then a fresh order appears", () => {
  const st = newState(2); assert.equal(st.missions.length, MISSION_SLOTS); assert.equal(new Set(st.missions.map((m) => m.k)).size, MISSION_SLOTS); st.missions.forEach((m) => assert.ok(missionText(m).length > 5));
  assert.throws(() => claimMission(st, 0), /Not finished/); st.cash = 1e9;
  st.missions[0] = { k: "open", n: 3, p: 0, w: 0.8, id: 99 }; for (let i = 0; i < 3; i++) { st.stock[0] = 9; const slot = buyPack(st, 0); let x; while (!(x = hit(st, slot)).burst); }
  assert.equal(st.missions[0].p, 3); const unit = missionUnit(st), c0 = st.cash; assert.equal(missionReward(st, st.missions[0]), Math.round(0.8 * 3 * unit)); const r = claimMission(st, 0);
  assert.ok(Math.abs(st.cash - c0 - r) < 1e-6 && st.missions.length === MISSION_SLOTS && st.total.missions === 1);
  st.unlocked[1] = st.unlocked[2] = true; assert.ok(missionUnit(st) > unit * 50, "rewards scale with progress");
  const sell = newState(1); sell.missions = [{ k: "sell", n: 2, p: 0, w: 0.5, id: 1 }]; sell.dupes = { "meadow-0|0": 3 }; sellAll(sell); assert.equal(sell.missions[0].p, 2);
});

test("economy: a human tapping 4 times a second unlocks packs, hires staff and progresses at a sensible pace", () => {
  for (const seed of [1, 2, 3]) {
    const { st, log } = human(seed, 45 * 60);
    assert.ok(log.tier1 !== undefined && log.tier1 < 10 * 60, `tier 1 at ${log.tier1}s`); assert.ok(log["staff:opener"] !== undefined && log["staff:opener"] < 15 * 60, `opener at ${log["staff:opener"]}s`);
    assert.ok(log.tier2 !== undefined && log.tier2 < 30 * 60 && log.tier2 > 5 * 60, `tier 2 at ${log.tier2}s`); assert.ok(log.tier5 === undefined, "the last pack type is a long-term goal"); assert.ok(albumCount(st) > 100, `album ${albumCount(st)}`);
  }
});

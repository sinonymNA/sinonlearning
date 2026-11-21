// Pack Rush engine. Pure ESM, JSON state, no clocks or Math.random: callers pass `now` (ms) and randomness is seeded.
import { makeRng } from "../gridiron/rng.mjs";
import { RARITIES, SETS, SET_SIZE, UNLOCK_OWNED, BASE_CARDS, LEVELS, LEVEL_MUL, VARIANT_BONUS, TAP_SECONDS, START_COINS, FREE_PACK_SECONDS, AUTO_BASE_SECONDS, OFFLINE_BASE_HOURS, OFFLINE_SIM_CAP, REBOOT_DIVISOR, STAR_BONUS, UPGRADES, TREE } from "./config.mjs";
import { CARDS, CARD_BY_ID, cardsOfSet } from "./cards.mjs";

const lvl = (st, id) => st.up[id] || 0, tl = (st, id) => st.tree[id] || 0;
const rngFor = (st) => makeRng(((st.seed >>> 0) + (st.ops++) * 7919 + 1) >>> 0);
export const SET_VALUE = SETS.map((_, k) => 8 ** k);                       // income per card grows x8 per set while pack prices grow ~x20

export function newState(seed = 1, now = 0) {
  return { v: 1, seed: seed >>> 0, ops: 0, coins: START_COINS, tier: 0, up: {}, tree: {}, dex: {}, stars: 0, starsSpent: 0, run: { earned: 0, packs: 0 }, total: { packs: 0, earned: 0, reboots: 0, legendaries: 0, best: 0 }, freeAt: now, autoAt: now, last: now };
}

/** Every multiplier in one place. */
export function mods(st) {
  const owned = Object.keys(st.dex).length, sets = SETS.filter((_, k) => ownedInSet(st, k) === SET_SIZE).length;
  let foilCards = 0, holoCards = 0; for (const d of Object.values(st.dex)) { if (d.holo) holoCards++; if (d.foil) foilCards++; }
  const coll = 1 + 0.02 * owned + 0.5 * sets + 0.01 * foilCards + 0.05 * holoCards;
  const starMul = 1 + STAR_BONUS * st.stars;
  const autoMul = 0.85 ** lvl(st, "auto") * 0.9 ** tl(st, "clock");
  return {
    coll, starMul, owned, sets,
    cost: 0.96 ** lvl(st, "bulk") * 0.92 ** tl(st, "whole"),
    income: (1 + 0.12 * lvl(st, "income")) * (1 + 0.2 * tl(st, "sleeve")) * coll * starMul,
    luck: (1 + 0.08 * lvl(st, "luck")) * (1 + 0.04 * tl(st, "foot")),
    foil: 0.08 + 0.01 * lvl(st, "shiny") + 0.015 * tl(st, "prism"),
    holo: 0.01 + 0.002 * lvl(st, "shiny"),
    cards: BASE_CARDS + lvl(st, "cards") + tl(st, "fat"),
    autoEvery: lvl(st, "auto") > 0 ? AUTO_BASE_SECONDS * autoMul : 0,
    freeEvery: FREE_PACK_SECONDS * 0.8 ** tl(st, "gift"),
    startCoins: START_COINS + 1500 * tl(st, "seed"),
    offlineHours: OFFLINE_BASE_HOURS + 2 * tl(st, "night"),
    multi: [1, ...(lvl(st, "multi") >= 1 ? [5] : []), ...(lvl(st, "multi") >= 2 ? [10] : []), ...(tl(st, "x25") ? [25] : [])],
  };
}
export const ownedInSet = (st, k) => cardsOfSet(k).filter((c) => st.dex[c.id]).length;
export const unlocked = (st, tier) => tier === 0 || ownedInSet(st, tier - 1) >= UNLOCK_OWNED;
export const packCost = (st, tier) => Math.max(1, Math.round(SETS[tier].cost * mods(st).cost));

/** Rarity chances for the current luck (rare and better are boosted, the rest renormalised). */
export function odds(st) {
  const luck = mods(st).luck, w = RARITIES.map((r, i) => r.w * (i >= 2 ? luck : 1)), sum = w.reduce((a, b) => a + b, 0);
  return RARITIES.map((r, i) => ({ ...r, p: w[i] / sum }));
}
function pickRarity(o, r) { let x = r(), a = 0; for (const e of o) { a += e.p; if (x < a) return e; } return o[o.length - 1]; }
export const levelOf = (n) => { let l = 0; for (let i = 0; i < LEVELS.length; i++) if (n >= LEVELS[i]) l = i + 1; return l; };
/** Copies needed for the next level (null at the top). */
export const nextAt = (n) => LEVELS[levelOf(n)] ?? null;
/** Coins per second one owned card produces, before the global multiplier. */
export function cardRate(card, d) {
  if (!d || !d.n) return 0; const r = RARITIES.find((x) => x.id === card.rarity);
  return r.v * SET_VALUE[card.set] * LEVEL_MUL[Math.max(0, levelOf(d.n) - 1)] * (1 + (d.foil ? VARIANT_BONUS.foil : 0) + (d.holo ? VARIANT_BONUS.holo : 0));
}
/** Total coins per second. */
export function incomeRate(st) { let t = 0; for (const c of CARDS) t += cardRate(c, st.dex[c.id]); return t * mods(st).income; }
/** Tapping the table pays a little of that, so active play always helps. */
export function tap(st) { const g = Math.max(1, incomeRate(st) * TAP_SECONDS); st.coins += g; st.run.earned += g; st.total.earned += g; return g; }

function rollCard(o, m, pool, rng) {
  const r = pickRarity(o, rng), opts = pool.filter((c) => c.rarity === r.id), card = opts[rng.int(opts.length)];
  const x = rng(), variant = x < m.holo ? "holo" : x < m.holo + m.foil ? "foil" : "normal";
  return { r, card, variant };
}
/** Open one pack. Cards go to your collection; duplicates level the card up. Returns {cards:[{id,rarity,variant,isNew,leveled,level}], cost}. */
export function openPack(st, tier, rng = rngFor(st), pay = true) {
  if (!unlocked(st, tier)) throw new Error("That pack is still locked");
  const cost = packCost(st, tier); if (pay) { if (st.coins < cost) throw new Error("Not enough coins"); st.coins -= cost; }
  const m = mods(st), o = odds(st), pool = cardsOfSet(tier), cards = [];
  for (let i = 0; i < m.cards; i++) {
    const { r, card, variant } = rollCard(o, m, pool, rng);
    const d = st.dex[card.id], isNew = !d, e = st.dex[card.id] = d || { n: 0, foil: 0, holo: 0 }, before = levelOf(e.n);
    e.n++; if (variant === "foil") e.foil++; if (variant === "holo") e.holo++;
    if (r.id === "legendary") st.total.legendaries++;
    cards.push({ id: card.id, rarity: r.id, variant, isNew, leveled: !isNew && levelOf(e.n) > before, level: levelOf(e.n) });
  }
  st.run.packs++; st.total.packs++;
  return { cards, cost };
}
export function openMany(st, tier, n) {
  const rng = rngFor(st), out = [];
  for (let i = 0; i < n && st.coins >= packCost(st, tier); i++) out.push(openPack(st, tier, rng));
  return out;
}
/** Average packs you must open to see a rarity at least once (coupon-collector maths, shown in the Odds lab). */
export const packsForRarity = (st, id) => { const p = odds(st).find((r) => r.id === id).p, m = mods(st).cards; return 1 / (1 - (1 - p) ** m); };

export const upgradeCost = (id, level) => { const u = UPGRADES.find((x) => x.id === id); return Math.round(u.base * u.growth ** level); };
export function buyUpgrade(st, id) {
  const u = UPGRADES.find((x) => x.id === id); if (!u) throw new Error("No such upgrade");
  const l = lvl(st, id); if (l >= u.max) throw new Error("Maxed out");
  const c = upgradeCost(id, l); if (st.coins < c) throw new Error("Not enough coins");
  st.coins -= c; st.up[id] = l + 1; return c;
}

/** Free gift pack: always the best pack you have unlocked. */
export const bestTier = (st) => { let t = 0; while (t + 1 < SETS.length && unlocked(st, t + 1)) t++; return t; };
export const freeReady = (st, now) => now >= st.freeAt;
export function claimFree(st, now) {
  if (!freeReady(st, now)) throw new Error("Not ready yet");
  const r = openPack(st, bestTier(st), rngFor(st), false); st.freeAt = now + mods(st).freeEvery * 1000; return r;
}

/** Passive income + Auto-Ripper. Returns the packs the Auto-Ripper opened (capped per call so the UI never stalls). */
export function tick(st, now) {
  const dt = Math.max(0, Math.min(10, (now - st.last) / 1000)); st.last = now;
  if (dt > 0) { const g = incomeRate(st) * dt; st.coins += g; st.run.earned += g; st.total.earned += g; }
  const m = mods(st), out = []; if (!m.autoEvery) { st.autoAt = now; return out; }
  const every = m.autoEvery * 1000; let guard = 0;
  while (st.autoAt + every <= now && guard++ < 40) {
    st.autoAt += every; if (st.coins < packCost(st, st.tier) || !unlocked(st, st.tier)) { st.autoAt = Math.max(st.autoAt, now - every); break; }
    out.push(openPack(st, st.tier, rngFor(st)));
  }
  if (st.autoAt + every * 40 < now) st.autoAt = now;
  return out;
}
/** Time away: income keeps flowing (capped by offline hours) and the Auto-Ripper keeps opening packs (at most OFFLINE_SIM_CAP of them). */
export function offline(st, seconds) {
  const m = mods(st), secs = Math.min(seconds, m.offlineHours * 3600); if (secs < 30) return { packs: 0, coins: 0 };
  const c0 = st.coins, credit = (g) => { st.coins += g; st.run.earned += g; st.total.earned += g; }; let packs = 0;
  if (m.autoEvery) {
    const n = Math.min(Math.floor(secs / m.autoEvery), OFFLINE_SIM_CAP), slice = secs / Math.max(1, n);
    for (let i = 0; i < n; i++) { credit(incomeRate(st) * slice); if (st.coins >= packCost(st, st.tier) && unlocked(st, st.tier)) { openPack(st, st.tier, rngFor(st)); packs++; } }
  } else credit(incomeRate(st) * secs);
  return { packs, coins: st.coins - c0 };
}

export const starsAvailable = (st) => st.stars - st.starsSpent;
export const rebootGain = (st) => Math.floor(Math.sqrt(st.run.earned / REBOOT_DIVISOR));
export function reboot(st, now = 0) {
  const g = rebootGain(st); if (g < 1) throw new Error("Earn more coins first");
  st.stars += g; st.total.reboots++; st.up = {}; st.run = { earned: 0, packs: 0 }; st.tier = 0; st.coins = mods(st).startCoins; st.freeAt = now; st.autoAt = now;
  return g;
}
export const nodeAvailable = (st, id) => { const n = TREE.find((x) => x.id === id); return !!n && n.req.every((r) => tl(st, r) > 0); };
export function buyNode(st, id) {
  const n = TREE.find((x) => x.id === id); if (!n) throw new Error("No such node");
  if (!nodeAvailable(st, id)) throw new Error("Unlock the earlier nodes first"); if (tl(st, id) >= n.max) throw new Error("Maxed out");
  if (starsAvailable(st) < n.cost) throw new Error(`Costs ${n.cost} stars`);
  st.starsSpent += n.cost; st.tree[id] = tl(st, id) + 1;
}

/** Dry-run n packs without touching state: rarity counts for the Odds lab (expected vs actual). */
export function simulate(st, tier, n, seed = 1) {
  const rng = makeRng(seed), m = mods(st), o = odds(st), pool = cardsOfSet(tier), counts = Object.fromEntries(RARITIES.map((r) => [r.id, 0]));
  for (let i = 0; i < n; i++) for (let k = 0; k < m.cards; k++) counts[rollCard(o, m, pool, rng).r.id]++;
  return { counts, cards: n * m.cards };
}
export const collectionScore = (st) => Object.keys(st.dex).length;
export { CARDS, CARD_BY_ID, SETS, RARITIES };

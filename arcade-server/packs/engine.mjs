// Pack Rush v2 engine. Pure ESM, JSON state, no clocks or Math.random: time only moves through advance(st, seconds) and randomness is seeded.
import { makeRng } from "../gridiron/rng.mjs";
import { RARITIES, VARIANTS, SETS, SET_SIZE, SET_VALUE_MUL, START_CASH, BASE_SLOTS, MAX_SLOTS, BASE_STOCK, BASE_RESTOCK, BASE_CAP, CRIT_MUL, DISCOVERY, ALBUM_BONUS, OVERFLOW_SHARE, OFFLINE_BASE_HOURS, RESCUE_SECONDS, UPGRADES, STAFF } from "./config.mjs";
import { CARDS, CARD_BY_ID, cardsOfSet } from "./cards.mjs";

const lvl = (st, id) => st.up[id] || 0, staff = (st, id) => st.staff[id] || 0;
const rngFor = (st) => makeRng(((st.seed >>> 0) + (st.ops++) * 7919 + 1) >>> 0);

export function newState(seed = 1) {
  return { v: 2, seed: seed >>> 0, ops: 0, t: 0, cash: START_CASH, tier: 0, unlocked: SETS.map((_, i) => i === 0), stock: SETS.map(() => BASE_STOCK), table: Array(MAX_SLOTS).fill(null), up: {}, staff: {}, acc: { opener: 0, seller: 0, buyer: 0, rescue: 0 }, dex: {}, dupes: {}, total: { packs: 0, cards: 0, sold: 0, earned: 0, legendaries: 0 } };
}

export function albumCount(st) { let n = 0; for (const d of Object.values(st.dex)) for (const c of d.vars) if (c > 0) n++; return n; }
export const ALBUM_TOTAL = CARDS.length * VARIANTS.length;
export const cardsOwned = (st) => Object.keys(st.dex).length;
export const ownedInSet = (st, k) => cardsOfSet(k).filter((c) => st.dex[c.id]).length;

/** Every multiplier in one place. */
export function mods(st) {
  const op = staff(st, "opener"), se = staff(st, "seller"), bu = staff(st, "buyer");
  return {
    dmg: 1 + lvl(st, "dmg"), crit: 0.04 * lvl(st, "crit"), luck: 1 + 0.08 * lvl(st, "luck"), shine: 1 + 0.1 * lvl(st, "shine"),
    sell: (1 + 0.1 * lvl(st, "sell")) * (1 + ALBUM_BONUS * albumCount(st)), album: albumCount(st),
    cap: BASE_CAP + 8 * lvl(st, "cap"), stockMax: BASE_STOCK + 2 * lvl(st, "stock"), restockEvery: BASE_RESTOCK * 0.92 ** lvl(st, "restock"),
    slots: Math.min(MAX_SLOTS, BASE_SLOTS + lvl(st, "slots")), extra: 0.1 * lvl(st, "extra"),
    openHits: op ? 0.6 * 1.3 ** (op - 1) : 0, sellEvery: se ? 8 * 0.85 ** (se - 1) : 0, buyEvery: bu ? 6 * 0.85 ** (bu - 1) : 0,
    offlineHours: OFFLINE_BASE_HOURS,
  };
}

export function rarityOdds(st) { const luck = mods(st).luck, w = RARITIES.map((r, i) => r.w * (i >= 2 ? luck : 1)), s = w.reduce((a, b) => a + b, 0); return RARITIES.map((r, i) => ({ ...r, p: w[i] / s })); }
export function variantOdds(st) { const sh = mods(st).shine, w = VARIANTS.map((v, i) => v.w * (i ? sh : 1)), s = w.reduce((a, b) => a + b, 0); return VARIANTS.map((v, i) => ({ ...v, p: w[i] / s })); }
const pick = (arr, r) => { let x = r(), a = 0; for (const e of arr) { a += e.p; if (x < a) return e; } return arr[arr.length - 1]; };

/** Cash one copy sells for. */
export const baseValue = (card, vIdx) => RARITIES.find((r) => r.id === card.rarity).v * SET_VALUE_MUL ** card.set * VARIANTS[vIdx].mult;
export const cardValue = (st, card, vIdx) => baseValue(card, vIdx) * mods(st).sell;
/** Average cash one card of this pack sells for (the number to compare with the price). */
export function expectedValue(st, tier) {
  const ro = rarityOdds(st), vo = variantOdds(st), m = mods(st); let t = 0;
  for (const r of ro) for (const v of vo) t += r.p * v.p * r.v * SET_VALUE_MUL ** tier * v.mult;
  return t * m.sell * (1 + m.extra);
}

export const dupeCount = (st) => Object.values(st.dupes).reduce((a, b) => a + b, 0);
export const packPrice = (tier) => SETS[tier].cost;
export const freeSlot = (st) => { const n = mods(st).slots; for (let i = 0; i < n; i++) if (!st.table[i]) return i; return -1; };

function award(st, n) { st.cash += n; st.total.earned += n; }

/** A pack bursts: roll its cards, file them (album, storage or overflow sale). */
function burst(st, tier, rng) {
  const m = mods(st), ro = rarityOdds(st), vo = variantOdds(st), pool = cardsOfSet(tier), cards = [];
  const n = 1 + (rng() < m.extra ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const r = pick(ro, rng), opts = pool.filter((c) => c.rarity === r.id), card = opts[rng.int(opts.length)], v = pick(vo, rng), vIdx = VARIANTS.findIndex((x) => x.id === v.id);
    const e = st.dex[card.id] || (st.dex[card.id] = { n: 0, vars: VARIANTS.map(() => 0) }), isNewCard = e.n === 0, isNewVariant = e.vars[vIdx] === 0, value = cardValue(st, card, vIdx);
    e.n++; e.vars[vIdx]++; st.total.cards++; if (r.id === "legendary") st.total.legendaries++;
    let fate; // "album" (first copy of this finish), "stored", or "overflow" (storage full: sold at half)
    if (isNewVariant) { fate = "album"; award(st, value * DISCOVERY); }
    else if (dupeCount(st) < m.cap) { fate = "stored"; const k = `${card.id}|${vIdx}`; st.dupes[k] = (st.dupes[k] || 0) + 1; }
    else { fate = "overflow"; award(st, value * OVERFLOW_SHARE); st.total.sold++; }
    cards.push({ id: card.id, rarity: r.id, variant: v.id, vIdx, isNewCard, isNewVariant, fate, value });
  }
  st.total.packs++;
  return { tier, cards };
}

/** Tap a pack on the table. Returns {burst, hp, dmg, crit, result?}. */
export function hit(st, slot, rng = rngFor(st)) {
  const p = st.table[slot]; if (!p) throw new Error("Nothing there");
  const m = mods(st), crit = rng() < m.crit, dmg = m.dmg * (crit ? CRIT_MUL : 1); p.hp -= dmg;
  if (p.hp > 0) return { burst: false, hp: p.hp, dmg, crit };
  st.table[slot] = null; return { burst: true, hp: 0, dmg, crit, result: burst(st, p.tier, rng) };
}

export function buyPack(st, tier) {
  if (!st.unlocked[tier]) throw new Error("Unlock that pack first");
  const slot = freeSlot(st); if (slot < 0) throw new Error("Your table is full. Open some packs");
  if (st.stock[tier] < 1) throw new Error("Out of stock. Wait for the delivery");
  const c = packPrice(tier); if (st.cash < c) throw new Error("Not enough cash");
  st.cash -= c; st.stock[tier] -= 1; st.table[slot] = { tier, hp: SETS[tier].hp, max: SETS[tier].hp }; return slot;
}
export function unlockTier(st, tier) {
  if (st.unlocked[tier]) throw new Error("Already unlocked"); if (tier > 0 && !st.unlocked[tier - 1]) throw new Error("Unlock the earlier pack first");
  const c = SETS[tier].unlock; if (st.cash < c) throw new Error("Not enough cash"); st.cash -= c; st.unlocked[tier] = true; st.stock[tier] = mods(st).stockMax; return c;
}

export function sellAll(st) {
  let t = 0, n = 0; for (const [k, c] of Object.entries(st.dupes)) { const [id, v] = k.split("|"); t += cardValue(st, CARD_BY_ID[id], +v) * c; n += c; }
  st.dupes = {}; award(st, t); st.total.sold += n; return { cash: t, n };
}
export function sellOne(st, key) {
  const c = st.dupes[key]; if (!c) throw new Error("None stored"); const [id, v] = key.split("|"), val = cardValue(st, CARD_BY_ID[id], +v);
  if (c === 1) delete st.dupes[key]; else st.dupes[key] = c - 1; award(st, val); st.total.sold++; return val;
}
/** Storage value, for the SELL ALL button. */
export function storedValue(st) { let t = 0; for (const [k, c] of Object.entries(st.dupes)) { const [id, v] = k.split("|"); t += cardValue(st, CARD_BY_ID[id], +v) * c; } return t; }

export const upgradeCost = (list, id, level) => { const u = list.find((x) => x.id === id); return Math.round(u.base * u.growth ** level); };
export function buyUpgrade(st, id) {
  const u = UPGRADES.find((x) => x.id === id); if (!u) throw new Error("No such upgrade"); const l = lvl(st, id); if (l >= u.max) throw new Error("Maxed out");
  const c = upgradeCost(UPGRADES, id, l); if (st.cash < c) throw new Error("Not enough cash"); st.cash -= c; st.up[id] = l + 1;
  if (id === "stock") for (let t = 0; t < SETS.length; t++) if (st.unlocked[t]) st.stock[t] += 2; return c;
}
export function hire(st, id) {
  const u = STAFF.find((x) => x.id === id); if (!u) throw new Error("No such staff"); const l = staff(st, id); if (l >= u.max) throw new Error("Maxed out");
  const c = upgradeCost(STAFF, id, l); if (st.cash < c) throw new Error("Not enough cash"); st.cash -= c; st.staff[id] = l + 1; return c;
}

/** Move time forward. Restocks the shop and runs staff. Returns the bursts staff caused (for the UI ticker). */
export function advance(st, dt) {
  const m = mods(st), out = []; st.t += dt;
  for (let t = 0; t < SETS.length; t++) if (st.unlocked[t]) st.stock[t] = Math.min(m.stockMax, st.stock[t] + dt / m.restockEvery);
  if (m.buyEvery) { st.acc.buyer += dt; while (st.acc.buyer >= m.buyEvery) { st.acc.buyer -= m.buyEvery; try { buyPack(st, st.tier); } catch { /* nothing to buy right now */ } } }
  if (m.openHits) {
    st.acc.opener += dt * m.openHits;
    while (st.acc.opener >= 1) {
      st.acc.opener -= 1; let best = -1; for (let i = 0; i < MAX_SLOTS; i++) if (st.table[i] && (best < 0 || st.table[i].hp < st.table[best].hp)) best = i;
      if (best < 0) { st.acc.opener = Math.min(st.acc.opener, 1); break; }
      const r = hit(st, best); if (r.burst) out.push(r.result);
    }
  }
  // Free sample: never leave a player stuck. If you are broke with nothing on the table or in storage, a Meadow pack turns up.
  if (!st.table.some(Boolean) && st.cash < packPrice(0) && !dupeCount(st)) { st.acc.rescue += dt; if (st.acc.rescue >= RESCUE_SECONDS) { st.acc.rescue = 0; st.table[0] = { tier: 0, hp: SETS[0].hp, max: SETS[0].hp, free: true }; } } else st.acc.rescue = 0;
  if (m.sellEvery) { st.acc.seller += dt; if (st.acc.seller >= m.sellEvery) { st.acc.seller = 0; if (dupeCount(st)) sellAll(st); } }
  return out;
}
/** Time away: staff keep working (capped). */
export function offline(st, seconds) {
  const m = mods(st), secs = Math.min(seconds, m.offlineHours * 3600); if (secs < 30 || !(m.openHits || m.sellEvery || m.buyEvery)) return { cash: 0, packs: 0 };
  const c0 = st.cash, p0 = st.total.packs, e0 = st.total.earned; for (let s = 0; s < secs; s += 1) advance(st, 1);
  return { cash: st.cash - c0, packs: st.total.packs - p0, earned: st.total.earned - e0, secs };
}

/** Dry-run n packs from a tier without touching state: rarity and finish counts for the Odds Lab. */
export function simulate(st, tier, n, seed = 1) {
  const rng = makeRng(seed), ro = rarityOdds(st), vo = variantOdds(st), r = Object.fromEntries(RARITIES.map((x) => [x.id, 0])), v = Object.fromEntries(VARIANTS.map((x) => [x.id, 0]));
  for (let i = 0; i < n; i++) { r[pick(ro, rng).id]++; v[pick(vo, rng).id]++; }
  return { rarity: r, variant: v, n };
}
/** Average packs to see an outcome with chance p per pack. */
export const packsFor = (st, p) => { const per = 1 - (1 - p) ** (1 + mods(st).extra); return 1 / per; };
export { CARDS, CARD_BY_ID, SETS, RARITIES, VARIANTS, SET_SIZE, UPGRADES, STAFF, MAX_SLOTS };

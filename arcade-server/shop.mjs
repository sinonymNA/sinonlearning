import { CHARACTERS, PACKS, PACK_IDS, SPOTLIGHT_BOOST, poolFor } from "./characters.mjs";

/** The daily shop is a pure function of the UTC date, so every server instance and every student sees the same one. */
export const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const DAILY_BONUS = 15;
const DISCOUNTS = [20, 25, 30, 40];
// Only rare+ characters are worth spotlighting, and only ones a pack can actually drop.
const SPOT_POOL = CHARACTERS.filter((c) => ["rare", "epic", "legendary"].includes(c.rarity));

export function dailyShop(date = dayKey()) {
  const r = rng(hash(`arcade-shop:${date}`));
  // Deal of the day: any pack except the cheapest (a discount on a 40-coin pack means nothing).
  const dealable = PACK_IDS.filter((id) => id !== "starter");
  const packId = dealable[Math.floor(r() * dealable.length)];
  const percent = DISCOUNTS[Math.floor(r() * DISCOUNTS.length)];
  const price = Math.max(1, Math.round((PACKS[packId].cost * (100 - percent)) / 100));
  const spot = SPOT_POOL[Math.floor(r() * SPOT_POOL.length)];
  const packIds = PACK_IDS.filter((id) => poolFor(PACKS[id]).some((c) => c.id === spot.id) && PACKS[id].rarityWeights[spot.rarity] > 0);
  return {
    date,
    deal: { packId, percent, price, was: PACKS[packId].cost },
    spotlight: { characterId: spot.id, name: spot.name, rarity: spot.rarity, boost: SPOTLIGHT_BOOST, packIds },
    bonus: DAILY_BONUS,
  };
}

/** Price + spotlight the server will actually apply when `packId` is opened on `date`. */
export function dealFor(packId, date = dayKey()) {
  const shop = dailyShop(date);
  return {
    price: shop.deal.packId === packId ? shop.deal.price : PACKS[packId].cost,
    spotlight: shop.spotlight.packIds.includes(packId) ? shop.spotlight.characterId : null,
  };
}

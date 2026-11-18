import crypto from "node:crypto";

export const RARITIES = {
  common: { label: "Common", weight: 60, color: "#7a8aa5" },
  uncommon: { label: "Uncommon", weight: 25, color: "#2fbf9b" },
  rare: { label: "Rare", weight: 11, color: "#4d8dff" },
  epic: { label: "Epic", weight: 3.5, color: "#a35cff" },
  legendary: { label: "Legendary", weight: 0.5, color: "#ffb02e" },
};

/** 12 original collectible characters (cosmetic only). */
export const CHARACTERS = [
  { id: "c-blip", name: "Blip", rarity: "common", tagline: "A bouncy blob who loves a good echo." },
  { id: "c-mossy", name: "Mossy", rarity: "common", tagline: "Part rock, part garden, all chill." },
  { id: "c-pepper", name: "Pepper", rarity: "common", tagline: "Spicy opinions, tiny ears." },
  { id: "c-boop", name: "Boop", rarity: "common", tagline: "Will boop your nose. Won't apologize." },
  { id: "c-fizz", name: "Fizz", rarity: "common", tagline: "Bubbles up whenever the room gets loud." },
  { id: "c-wisp", name: "Wisp", rarity: "uncommon", tagline: "A friendly ghost who hates being scary." },
  { id: "c-biscuit", name: "Biscuit", rarity: "uncommon", tagline: "Crunchy outside, soft inside." },
  { id: "c-zap", name: "Zap", rarity: "uncommon", tagline: "Fully charged. Mostly harmless." },
  { id: "c-nova", name: "Nova", rarity: "rare", tagline: "Fell from space. Landed with style." },
  { id: "c-gizmo", name: "Gizmo", rarity: "rare", tagline: "Built from spare parts and big ideas." },
  { id: "c-pearl", name: "Pearl", rarity: "epic", tagline: "Deep-sea royalty with a shiny secret." },
  { id: "c-ember", name: "Ember", rarity: "legendary", tagline: "A tiny dragon who never lets the fire go out." },
];
export const STARTER_AVATARS = [
  { id: "rk-sun", name: "Sunny" }, { id: "rk-moon", name: "Moony" }, { id: "rk-leaf", name: "Leafy" }, { id: "rk-wave", name: "Wavy" },
];
export const PACKS = { basic: { id: "basic", name: "Basic Character Pack", cost: 150, rarityWeights: Object.fromEntries(Object.entries(RARITIES).map(([k, v]) => [k, v.weight])) } };

export function packOdds(packId = "basic") {
  const pack = PACKS[packId];
  const total = Object.values(pack.rarityWeights).reduce((a, b) => a + b, 0);
  const rarities = Object.entries(pack.rarityWeights).map(([id, w]) => ({ id, label: RARITIES[id].label, percent: Math.round((w / total) * 1000) / 10 }));
  const characters = CHARACTERS.map((c) => {
    const inRarity = CHARACTERS.filter((x) => x.rarity === c.rarity).length;
    return { id: c.id, name: c.name, rarity: c.rarity, percent: Math.round(((pack.rarityWeights[c.rarity] / total) / inRarity) * 10000) / 100 };
  });
  return { pack: { id: pack.id, name: pack.name, cost: pack.cost }, rarities, characters };
}

const rand01 = () => crypto.randomInt(0, 2 ** 30) / 2 ** 30;

export function rollPack(packId = "basic", rng = rand01) {
  const pack = PACKS[packId];
  if (!pack) throw new Error("Unknown pack.");
  const total = Object.values(pack.rarityWeights).reduce((a, b) => a + b, 0);
  let roll = rng() * total, rarity = "common";
  for (const [id, w] of Object.entries(pack.rarityWeights)) { if (roll < w) { rarity = id; break; } roll -= w; rarity = id; }
  const pool = CHARACTERS.filter((c) => c.rarity === rarity);
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

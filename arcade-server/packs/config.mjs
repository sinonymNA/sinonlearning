// Pack Rush: tunables. Everything economic lives here so the simulation tests can tune it.
export const RARITIES = [
  { id: "common", name: "Common", w: 62, v: 0.1, color: "#9aa7c7" },
  { id: "uncommon", name: "Uncommon", w: 25, v: 0.2, color: "#5ee08a" },
  { id: "rare", name: "Rare", w: 9.5, v: 0.5, color: "#4cc3ff" },
  { id: "epic", name: "Epic", w: 3, v: 1.5, color: "#c77dff" },
  { id: "legendary", name: "Legendary", w: 0.5, v: 5, color: "#ffd23f" },
];
/** Each set is a pack tier. Cards in a set: 5 common, 3 uncommon, 2 rare, 1 epic, 1 legendary. */
export const SETS = [
  { id: "meadow", name: "Meadow", hue: 110, cost: 100 },
  { id: "cave", name: "Cave", hue: 28, cost: 3000 },
  { id: "reef", name: "Reef", hue: 190, cost: 90000 },
  { id: "sky", name: "Sky", hue: 218, cost: 2.7e6 },
  { id: "void", name: "Void", hue: 280, cost: 8.1e7 },
  { id: "neon", name: "Neon", hue: 325, cost: 2.43e9 },
];
export const SET_LAYOUT = ["common", "common", "common", "common", "common", "uncommon", "uncommon", "uncommon", "rare", "rare", "epic", "legendary"];
export const SET_SIZE = SET_LAYOUT.length;
export const UNLOCK_OWNED = 12;              // complete the previous set (all 12 cards, legendary included) to unlock the next pack
export const BASE_CARDS = 3;
// Cards pay coins per second (RARITIES[].v at pack tier 1, scaled up by set). Duplicates level a card up; foil/holo copies add a bonus.
export const LEVELS = [1, 2, 4, 7, 12, 20];                     // copies needed for level 1..6
export const LEVEL_MUL = [1, 1.5, 2.2, 3.2, 4.5, 6];
export const VARIANT_BONUS = { foil: 0.5, holo: 2 };             // +50% / +200% income on that card once you own one
export const TAP_SECONDS = 0.6;                                  // tapping the table pays this many seconds of income
export const START_COINS = 300;
export const FREE_PACK_SECONDS = 25;
export const AUTO_BASE_SECONDS = 10;
export const OFFLINE_BASE_HOURS = 2;
export const OFFLINE_SIM_CAP = 250;          // packs truly simulated while away; the rest is extrapolated
export const REBOOT_DIVISOR = 5e7;           // stars = floor(sqrt(earned this run / divisor))
export const STAR_BONUS = 0.05;              // +5% income per star

/** Coin upgrades: cost = base * growth^level. */
export const UPGRADES = [
  { id: "bulk", name: "Bulk Pallets", icon: "📦", desc: "Packs cost 4% less per level.", max: 25, base: 300, growth: 1.9 },
  { id: "income", name: "Dividends", icon: "📈", desc: "+12% income from every card, per level.", max: 40, base: 400, growth: 1.7 },
  { id: "luck", name: "Lucky Charm", icon: "🍀", desc: "Rare and better cards show up 8% more often per level.", max: 25, base: 600, growth: 1.9 },
  { id: "shiny", name: "Shiny Coat", icon: "✨", desc: "+1% foil and +0.2% holo chance per level.", max: 20, base: 800, growth: 1.9 },
  { id: "cards", name: "Bigger Packs", icon: "🃏", desc: "+1 card in every pack.", max: 4, base: 4000, growth: 8 },
  { id: "auto", name: "Auto-Ripper", icon: "🤖", desc: "Opens your selected pack by itself, faster each level.", max: 15, base: 5000, growth: 2.4 },
  { id: "multi", name: "Quick Hands", icon: "⚡", desc: "Level 1 unlocks opening 5 at once. Level 2 unlocks 10.", max: 2, base: 1500, growth: 12 },
];

/** Reboot tree, bought with stars. x/y are grid positions for drawing. */
export const TREE = [
  { id: "seed", name: "Seed Money", icon: "💰", desc: "+1500 starting coins per level after every reboot.", cost: 1, max: 5, req: [], x: 1, y: 0 },
  { id: "whole", name: "Wholesale", icon: "🏷️", desc: "Packs cost 8% less per level.", cost: 2, max: 5, req: ["seed"], x: 0, y: 1 },
  { id: "sleeve", name: "Sticky Sleeves", icon: "🧤", desc: "+20% income per level.", cost: 2, max: 10, req: ["seed"], x: 2, y: 1 },
  { id: "gift", name: "Gift Shop", icon: "🎁", desc: "Free pack comes 20% sooner per level.", cost: 2, max: 4, req: ["whole"], x: 0, y: 2 },
  { id: "foot", name: "Rabbit's Foot", icon: "🐇", desc: "Rare+ odds up 4% per level.", cost: 3, max: 5, req: ["whole"], x: 1, y: 2 },
  { id: "prism", name: "Prism", icon: "🔮", desc: "+1.5% foil chance per level.", cost: 3, max: 5, req: ["sleeve"], x: 2, y: 2 },
  { id: "clock", name: "Overclock", icon: "⏱️", desc: "Auto-Ripper 10% faster per level.", cost: 4, max: 5, req: ["foot"], x: 1, y: 3 },
  { id: "night", name: "Night Shift", icon: "🌙", desc: "+2 hours of offline progress per level.", cost: 3, max: 4, req: ["clock"], x: 0, y: 4 },
  { id: "fat", name: "Fat Packs", icon: "🥩", desc: "+1 card in every pack per level.", cost: 8, max: 2, req: ["foot", "prism"], x: 2, y: 3 },
  { id: "x25", name: "Turbo Hands", icon: "🚀", desc: "Unlocks opening 25 at once.", cost: 6, max: 1, req: ["clock"], x: 2, y: 4 },
];

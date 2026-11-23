// Pack Rush v2 tunables. The loop: buy a pack from the shop -> it lands on your table -> tap it until it tears open -> a card pops out.
// New cards (and new variants) go in your album and pay a discovery bonus; duplicates go to storage and sell for cash.
export const RARITIES = [
  { id: "common", name: "Common", w: 62, v: 1, color: "#9aa7c7" },
  { id: "uncommon", name: "Uncommon", w: 25, v: 3, color: "#5ee08a" },
  { id: "rare", name: "Rare", w: 9.5, v: 10, color: "#4cc3ff" },
  { id: "epic", name: "Epic", w: 3, v: 40, color: "#c77dff" },
  { id: "legendary", name: "Legendary", w: 0.5, v: 200, color: "#ffd23f" },
];
/** Six finishes for every card. Weights are relative; Shiny Coat multiplies everything except Standard. */
export const VARIANTS = [
  { id: "standard", name: "Standard", w: 1, mult: 1 },
  { id: "chrome", name: "Chrome", w: 0.14, mult: 2.5 },
  { id: "holo", name: "Holo", w: 0.06, mult: 6 },
  { id: "gold", name: "Gold", w: 0.025, mult: 15 },
  { id: "negative", name: "Negative", w: 0.01, mult: 40 },
  { id: "glitch", name: "Glitch", w: 0.004, mult: 120 },
];
/** Each set is a pack type. cost = shop price, hp = taps (at 1 damage) to tear it open, unlock = one-time price. */
export const SETS = [
  { id: "meadow", name: "Meadow", hue: 110, cost: 5, hp: 6, unlock: 0 },
  { id: "cave", name: "Cave", hue: 28, cost: 40, hp: 16, unlock: 300 },
  { id: "reef", name: "Reef", hue: 190, cost: 320, hp: 40, unlock: 15000 },
  { id: "sky", name: "Sky", hue: 218, cost: 2600, hp: 100, unlock: 1e6 },
  { id: "void", name: "Void", hue: 280, cost: 21000, hp: 250, unlock: 6e7 },
  { id: "neon", name: "Neon", hue: 325, cost: 170000, hp: 620, unlock: 2e9 },
];
export const SET_LAYOUT = ["common", "common", "common", "common", "common", "uncommon", "uncommon", "uncommon", "rare", "rare", "epic", "legendary"];
export const SET_SIZE = SET_LAYOUT.length;
export const SET_VALUE_MUL = 7;               // card value x7 per set while pack price x8
export const START_CASH = 25;
export const BASE_SLOTS = 3, MAX_SLOTS = 8;
export const BASE_STOCK = 6, BASE_RESTOCK = 4;  // shop holds this many of each pack and restocks one every N seconds
export const BASE_CAP = 12;                      // duplicates you can store before extras sell at half price
export const CRIT_MUL = 3;
export const DISCOVERY = 2;                      // first copy of a card or a new variant pays this x its value
export const ALBUM_BONUS = 0.01;                 // +1% sell value per card/variant in the album
export const OVERFLOW_SHARE = 0.5;
export const OFFLINE_BASE_HOURS = 2;
export const RESCUE_SECONDS = 6;                // broke with nothing to open or sell: a free Meadow pack arrives after this long

/** Cash upgrades: cost = base * growth^level. */
export const UPGRADES = [
  { id: "dmg", name: "Sharper Nails", icon: "🔪", desc: "+1 tear power per tap.", max: 40, base: 15, growth: 1.62 },
  { id: "crit", name: "Lucky Rip", icon: "💥", desc: "+4% chance a tap does triple damage.", max: 15, base: 60, growth: 1.9 },
  { id: "luck", name: "Lucky Charm", icon: "🍀", desc: "Rare and better cards come up 8% more often.", max: 25, base: 100, growth: 2.0 },
  { id: "shine", name: "Shiny Coat", icon: "✨", desc: "+10% chance of every special finish.", max: 25, base: 150, growth: 2.0 },
  { id: "sell", name: "Haggler", icon: "🤝", desc: "+10% sell price.", max: 40, base: 50, growth: 1.75 },
  { id: "cap", name: "Storage Boxes", icon: "📦", desc: `+8 duplicate storage.`, max: 20, base: 40, growth: 1.7 },
  { id: "stock", name: "Bigger Shelves", icon: "🗄️", desc: "+2 packs in stock per pack type.", max: 15, base: 120, growth: 2.0 },
  { id: "restock", name: "Fast Delivery", icon: "🚚", desc: "Shop restocks 8% faster.", max: 20, base: 100, growth: 1.9 },
  { id: "slots", name: "Table Space", icon: "🪑", desc: "+1 pack slot on your table.", max: 5, base: 200, growth: 8 },
  { id: "extra", name: "Bonus Card", icon: "🃏", desc: "+10% chance of a second card in each pack.", max: 10, base: 500, growth: 3.0 },
];
/** Staff work for you, even while you are away. Level 0 = not hired. */
export const STAFF = [
  { id: "opener", name: "Card Opener", icon: "🧑‍🔧", desc: "Taps your packs for you. Faster each level.", max: 15, base: 400, growth: 2.6 },
  { id: "seller", name: "Salesperson", icon: "🧑‍💼", desc: "Sells your stored duplicates every few seconds.", max: 12, base: 600, growth: 2.4 },
  { id: "buyer", name: "Buyer", icon: "🛒", desc: "Buys your selected pack whenever there is room and stock.", max: 12, base: 900, growth: 2.4 },
];

// ---- v2.1: combo, golden packs, fusion, orders
export const COMBO_WINDOW = 0.6;                 // seconds between taps to keep a combo alive
export const COMBO_STEP = 0.04, COMBO_MAX = 25;  // +4% tap damage per combo tap, up to x2
export const GOLDEN_CHANCE = 0.04;               // chance a bought pack turns out golden (+0.4% per Lucky Charm level)
export const GOLDEN = { hp: 1.6, rarity: 3, shine: 2, extra: 1 };   // golden packs: tougher, rare+ x3, finishes x2, one extra card
export const FUSE_COST = 3;                      // 3 stored copies of a finish fuse into one copy of the next finish
export const MISSION_SLOTS = 3;
/** Orders from the shop. w = reward in "units" (the price of your best unlocked pack) per point of target. */
export const MISSION_TYPES = [
  { k: "open", text: (n) => `Tear open ${n} packs`, n: [6, 10, 15], w: 0.8 },
  { k: "rare", text: (n) => `Pull ${n} Rare or better cards`, n: [2, 3, 5], w: 4 },
  { k: "shiny", text: (n) => `Pull ${n} cards with a special finish`, n: [2, 3, 4], w: 5 },
  { k: "sell", text: (n) => `Sell ${n} cards`, n: [8, 12, 20], w: 0.5 },
  { k: "fuse", text: (n) => (n === 1 ? "Fuse cards once" : `Fuse cards ${n} times`), n: [1, 2, 3], w: 9 },
  { k: "discover", text: (n) => `Discover ${n} new card finishes`, n: [3, 5, 8], w: 3 },
];

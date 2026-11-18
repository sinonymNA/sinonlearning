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

// Procedurally drawn collectibles ("look" is rendered by components/arcade/ProcAvatar.tsx).
const L = (body, color, eyes, mouth, acc, accColor = "#ffd23d") => ({ look: { body, color, eyes, mouth, acc, accColor } });
CHARACTERS.push(
  { id: "c-pip", name: "Pip", rarity: "common", tagline: "Tiny, round, and always the first to arrive.", ...L("round", "#ffd0a8", "dots", "smile", "none") },
  { id: "c-dot", name: "Dot", rarity: "common", tagline: "Has exactly one spot and is very proud of it.", ...L("round", "#9fe3ff", "wide", "smile", "antenna", "#ff5d73") },
  { id: "c-mochi", name: "Mochi", rarity: "common", tagline: "Squishy. Do not squish. (Okay, a little.)", ...L("blob", "#ffe9f0", "happy", "smile", "none") },
  { id: "c-waffle", name: "Waffle", rarity: "common", tagline: "Crispy on the outside, syrupy on the inside.", ...L("square", "#f0c070", "dots", "grin", "none") },
  { id: "c-tater", name: "Tater", rarity: "common", tagline: "Survived Hot Potato once. Never talks about it.", ...L("bean", "#d9a066", "wide", "open", "sprout", "#59c56a") },
  { id: "c-bean", name: "Bean", rarity: "common", tagline: "A bean with big dreams and bigger socks.", ...L("bean", "#b58aff", "dots", "smile", "none") },
  { id: "c-squish", name: "Squish", rarity: "common", tagline: "Loves hugs. Has no arms. Makes it work.", ...L("blob", "#7be0c3", "happy", "grin", "bow", "#ff5d73") },
  { id: "c-pudge", name: "Pudge", rarity: "common", tagline: "Snack captain of the whole classroom.", ...L("round", "#ffb347", "sleepy", "smile", "none") },
  { id: "c-nugget", name: "Nugget", rarity: "common", tagline: "Golden, crunchy, extremely confident.", ...L("tall", "#f4c542", "dots", "grin", "none") },
  { id: "c-sprout", name: "Sprout", rarity: "common", tagline: "Grows a new leaf every time you win.", ...L("drop", "#8fe08a", "wide", "smile", "sprout", "#2c9a45") },
  { id: "c-moby", name: "Moby", rarity: "common", tagline: "Not a whale. Do not ask again.", ...L("drop", "#6aa8ff", "dots", "smile", "none") },
  { id: "c-clover", name: "Clover", rarity: "common", tagline: "Lucky on quiz days. Allegedly.", ...L("cloud", "#b9f08a", "happy", "smile", "none") },
  { id: "c-sparkle", name: "Sparkle", rarity: "uncommon", tagline: "Leaves glitter everywhere. Teachers are not thrilled.", ...L("round", "#ff9bd0", "wide", "grin", "halo") },
  { id: "c-marsh", name: "Marsh", rarity: "uncommon", tagline: "Toasty. Slightly sticky. Highly loyal.", ...L("square", "#fff4e0", "happy", "smile", "bandana", "#ff5d73") },
  { id: "c-cinder", name: "Cinder", rarity: "uncommon", tagline: "Smoulders when somebody says 'pop quiz'.", ...L("tri", "#ff7a5c", "wide", "grin", "horns", "#14163a") },
  { id: "c-gadget", name: "Gadget", rarity: "uncommon", tagline: "Has a button for everything. Do not press.", ...L("square", "#a8b8d8", "visor", "flat", "antenna", "#7dffd8") },
  { id: "c-zephyr", name: "Zephyr", rarity: "uncommon", tagline: "Floats through the room whistling.", ...L("cloud", "#cfe8ff", "sleepy", "smile", "headphones", "#4cc3ff") },
  { id: "c-tumble", name: "Tumble", rarity: "uncommon", tagline: "Rolls first, asks questions later.", ...L("round", "#c7a0ff", "dots", "open", "spikes", "#8a6bff") },
  { id: "c-frost", name: "Frost", rarity: "uncommon", tagline: "Cool under pressure. Literally.", ...L("tall", "#d6f4ff", "visor", "smile", "scarf", "#4cc3ff") },
  { id: "c-bloop", name: "Bloop", rarity: "uncommon", tagline: "Makes a noise when it wins. You know the noise.", ...L("drop", "#5de0b0", "wide", "open", "bunny", "#5de0b0") },
  { id: "c-crumb", name: "Captain Crumb", rarity: "rare", tagline: "Commands a fleet of snack-sized ships.", ...L("square", "#e8b26a", "dots", "grin", "pirate", "#14163a") },
  { id: "c-lumi", name: "Lumi", rarity: "rare", tagline: "Glows in the dark. Great for reading under blankets.", ...L("drop", "#fff59a", "happy", "smile", "halo", "#ffe066") },
  { id: "c-rocket", name: "Rocket", rarity: "rare", tagline: "Three, two, one... sit down, we haven't started.", ...L("tall", "#ff7a7a", "wide", "grin", "antenna", "#ffd23d") },
  { id: "c-mystic", name: "Mystic", rarity: "rare", tagline: "Knows your quiz answers. Won't tell you.", ...L("tri", "#8a6bff", "sleepy", "smile", "wizard", "#ffd23d") },
  { id: "c-disco", name: "Disco", rarity: "rare", tagline: "Every win is a dance party.", ...L("round", "#ff6fd8", "visor", "grin", "headphones", "#ffd23d") },
  { id: "c-glacier", name: "Glacier", rarity: "epic", tagline: "Slow, majestic, and impossible to rush.", ...L("tall", "#aee8ff", "sleepy", "smile", "crown", "#ffffff") },
  { id: "c-thunder", name: "Thunderpaws", rarity: "epic", tagline: "Storm cloud with a very soft heart.", ...L("cloud", "#6b6fb8", "wide", "grin", "spikes", "#ffd23d") },
  { id: "c-aurora", name: "Aurora", rarity: "legendary", tagline: "Appears once in a blue moon, wearing the sky.", ...L("tall", "#7be0ff", "happy", "smile", "crown", "#ff9bd0") },
);

// ---- Snack Squad: a second, specialty set. These only drop from the Snack Pack. -------------------------------
export const SETS = {
  original: { id: "original", name: "Classic Crew", blurb: "The original 40 mascots." },
  snack: { id: "snack", name: "Snack Squad", blurb: "16 food friends. Only found in the Snack Pack!" },
};
const SN = (id, name, rarity, tagline) => CHARACTERS.push({ id, name, rarity, tagline, set: "snack" });
SN("s-pickle", "Pickle Pete", "common", "Always in a pickle, never worried about it.");
SN("s-fries", "Fry Guy", "common", "Salty humour. Extra crispy.");
SN("s-toast", "Toasty", "common", "Pops up when you least expect it.");
SN("s-cheddar", "Cheddar", "common", "Sharp wit, mild temper.");
SN("s-egg", "Sunny Egg", "common", "Every morning is a good morning.");
SN("s-berry", "Berry", "common", "Sweet on the outside and the inside.");
SN("s-popper", "Popper", "common", "Cannot sit still. Will pop any second.");
SN("s-taco", "Taco Tina", "uncommon", "Every day is Taco Tuesday.");
SN("s-boba", "Boba Bean", "uncommon", "Bubbly personality, chewy answers.");
SN("s-slice", "Slice", "uncommon", "Loves hanging out with the whole pie.");
SN("s-nori", "Nori", "uncommon", "Rolls with the punches.");
SN("s-donut", "Dazzle", "rare", "Covered in sprinkles and confidence.");
SN("s-cone", "Cone-y", "rare", "Cool under pressure, melts for compliments.");
SN("s-burger", "Bruno", "rare", "Stacked with talent.");
SN("s-cupcake", "Cupcake Queen", "epic", "Rules the bake sale with a frosting fist.");
SN("s-sundae", "Sundae Supreme", "legendary", "Three scoops, one cherry, zero chill.");

// ---- Uploaded (AI-generated / hand-drawn) characters -------------------------------------------------------
// Put a transparent PNG at public/characters/<id>.png and add ONE line here. See ARCADE_ICON_GUIDE.md.
//   IMG("i-blorp", "Blorp", "rare", "Tagline shown on the card.")
const IMG = (id, name, rarity, tagline) => CHARACTERS.push({ id, name, rarity, tagline, image: `/characters/${id}.png` });
void IMG;

export const STARTER_AVATARS = [
  { id: "rk-sun", name: "Sunny" }, { id: "rk-moon", name: "Moony" }, { id: "rk-leaf", name: "Leafy" }, { id: "rk-wave", name: "Wavy" },
];
const W = (common, uncommon, rare, epic, legendary) => ({ common, uncommon, rare, epic, legendary });
/** Four packs. Higher price = better odds (Super guarantees uncommon+, Legend guarantees rare+). */
export const PACKS = {
  starter: { id: "starter", name: "Starter Pack", cost: 40, color: "#4cc3ff", blurb: "Cheap and cheerful. Mostly commons, with a small shot at something better.", rarityWeights: W(78, 18, 3.5, 0.5, 0) },
  basic: { id: "basic", name: "Classic Pack", cost: 100, color: "#ffc233", blurb: "The everyday pack with a real chance at rares.", rarityWeights: W(60, 26, 10.5, 3, 0.5) },
  super: { id: "super", name: "Super Pack", cost: 250, color: "#8a6bff", blurb: "No commons! Every card is uncommon or better.", rarityWeights: W(0, 55, 33, 10, 2) },
  snack: { id: "snack", name: "Snack Pack", cost: 120, color: "#ff8fc7", set: "snack", blurb: "Only Snack Squad food friends! 16 to collect, including a legendary sundae.", rarityWeights: W(55, 28, 12, 4, 1) },
  legend: { id: "legend", name: "Legend Pack", cost: 600, color: "#ff5d73", blurb: "Rare or better every time, with the best shot at epics and legendaries.", rarityWeights: W(0, 0, 55, 37, 8) },
};
export const PACK_IDS = Object.keys(PACKS).sort((a, b) => PACKS[a].cost - PACKS[b].cost);

/** A pack with a `set` drops only that set; every other pack drops only the original (un-setted) characters. */
export const poolFor = (pack) => CHARACTERS.filter((c) => (pack.set ? c.set === pack.set : !c.set));

export function packOdds(packId = "basic") {
  const pack = PACKS[packId];
  const total = Object.values(pack.rarityWeights).reduce((a, b) => a + b, 0);
  const rarities = Object.entries(pack.rarityWeights).filter(([, w]) => w > 0).map(([id, w]) => ({ id, label: RARITIES[id].label, percent: Math.round((w / total) * 1000) / 10 }));
  const pool = poolFor(pack);
  const characters = pool.filter((c) => pack.rarityWeights[c.rarity] > 0).map((c) => {
    const inRarity = pool.filter((x) => x.rarity === c.rarity).length;
    return { id: c.id, name: c.name, rarity: c.rarity, percent: Math.round(((pack.rarityWeights[c.rarity] / total) / inRarity) * 10000) / 100 };
  });
  return { pack: { id: pack.id, name: pack.name, cost: pack.cost, color: pack.color, blurb: pack.blurb }, rarities, characters };
}

export const allPackOdds = () => PACK_IDS.map((id) => packOdds(id));

const rand01 = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

export function rollPack(packId = "basic", rng = rand01) {
  const pack = PACKS[packId];
  if (!pack) throw new Error("Unknown pack.");
  const entries = Object.entries(pack.rarityWeights).filter(([, w]) => w > 0);
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let roll = rng() * total, rarity = entries[entries.length - 1][0];
  for (const [id, w] of entries) { if (roll < w) { rarity = id; break; } roll -= w; }
  const pool = poolFor(pack).filter((c) => c.rarity === rarity);
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

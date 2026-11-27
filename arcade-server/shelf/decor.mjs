// The Shelf Stocker closet: everything you can buy or earn to make your shop yours. Pure ESM data + rules (no drawing here; the client draws each id from the `look` data or by name).
// Items are either BOUGHT with coins (price > 0) or EARNED by playing (an unlock rule, price 0). Fake coins only: no real money, no timers, no odds, nothing random.
// Ids are "slot:value" and stay stable, so old saves keep working ("sign:wood", "pet:cat", "finish:oak"...).
export const RARITY = { common: { name: "Common", color: "#9fb3c8" }, rare: { name: "Rare", color: "#3b9cff" }, epic: { name: "Epic", color: "#a96bff" }, legendary: { name: "Legendary", color: "#ffb800" } };
/** Shop tabs, in order. */
export const SLOTS = [
  { id: "theme", name: "ROOMS", one: "room" }, { id: "finish", name: "SHELVES", one: "shelf style" }, { id: "skin", name: "ITEM LOOK", one: "item look" }, { id: "tag", name: "LABELS", one: "label style" },
  { id: "pet", name: "PETS", one: "pet" }, { id: "plant", name: "CORNERS", one: "corner piece" }, { id: "lights", name: "LIGHTS", one: "lights" }, { id: "sign", name: "SIGNS", one: "sign" },
  { id: "awning", name: "AWNINGS", one: "awning" }, { id: "rug", name: "RUGS", one: "rug" }, { id: "fx", name: "POPS", one: "finish effect" },
];
const rar = (price) => (price <= 60 ? "common" : price <= 110 ? "rare" : "epic");
const B = (slot, val, name, price, text) => ({ id: `${slot}:${val}`, slot, name, price, rarity: rar(price), text });
const E = (slot, val, name, unlock, text, rarity = "epic") => ({ id: `${slot}:${val}`, slot, name, price: 0, rarity, unlock, text });
export const DEPT_NAMES = ["Clothing Corner", "Book Nook", "Boutique", "Toy Aisle", "Pantry", "Shoe Wall", "Gift Corner", "Customer Orders", "Mixed Day"];

export const DECOR = [
  // ---- rooms: the walls and floor behind your shelves (the first is the department's own scenery)
  B("theme", "auto", "Auto Scenery", 0, "Changes with the department you are stocking."),
  B("theme", "cozy", "Cozy Boutique", 70, "Cream stripes and warm wooden boards."), B("theme", "market", "Sunny Market", 70, "Yellow walls, polka dots and terracotta tiles."), B("theme", "barn", "Autumn Barn", 80, "Red planks and hay-coloured floors."),
  B("theme", "greenhouse", "Greenhouse", 80, "Glass panes and a leafy light."), B("theme", "seaside", "Seaside Shop", 90, "Waves on the wall, sand underfoot."), B("theme", "lodge", "Forest Lodge", 90, "Dark logs and a roaring-fire mood."),
  B("theme", "candy", "Candy Shop", 90, "Pink stripes over a checkered floor."), B("theme", "sakura", "Sakura Lane", 100, "Blossom pink and bamboo flooring."), B("theme", "winter", "Snow Market", 100, "Frosty walls and snowy tiles."),
  B("theme", "diner", "Retro Diner", 110, "Mint walls, black and white checks."), B("theme", "midnight", "Midnight Mall", 130, "Deep blue, tiny stars, soft glow."), B("theme", "arcade", "Neon Arcade", 160, "Glowing grid lines on a dark wall."), B("theme", "space", "Space Station", 180, "Stars outside, steel plates inside."),
  E("theme", "studio", "Tailor's Studio", { t: "dept", n: 1 }, "Clear every Clothing Corner level.", "rare"), E("theme", "library", "Old Library", { t: "dept", n: 2 }, "Clear every Book Nook level.", "rare"), E("theme", "salon", "Fashion Salon", { t: "dept", n: 3 }, "Clear every Boutique level.", "rare"),
  E("theme", "playroom", "Playroom", { t: "dept", n: 4 }, "Clear every Toy Aisle level.", "rare"), E("theme", "kitchen", "Country Kitchen", { t: "dept", n: 5 }, "Clear every Pantry level.", "rare"), E("theme", "court", "Sneaker Court", { t: "dept", n: 6 }, "Clear every Shoe Wall level.", "rare"),
  E("theme", "holiday", "Holiday Hall", { t: "dept", n: 7 }, "Clear every Gift Corner level.", "rare"), E("theme", "post", "Post Office", { t: "dept", n: 8 }, "Clear every Customer Orders level.", "rare"), E("theme", "rooftop", "Rooftop Garden", { t: "dept", n: 9 }, "Clear every Mixed Day level.", "epic"),
  // ---- shelf styles
  B("finish", "oak", "Oak", 0, "Honey oak. Warm and classic."), B("finish", "white", "White", 55, "Clean, bright, boutique."), B("finish", "pink", "Pink", 55, "Soft pink lacquer."), B("finish", "walnut", "Walnut", 70, "Rich dark wood."),
  B("finish", "bamboo", "Bamboo", 60, "Light, green-gold bamboo."), B("finish", "steel", "Steel", 80, "Industrial brushed metal."), B("finish", "stone", "Stone", 80, "Chunky grey blocks."), B("finish", "glass", "Glass", 100, "See-through and shiny."),
  B("finish", "candy", "Candy Stripe", 90, "Peppermint pink and white."), B("finish", "marble", "Marble", 120, "Veined white marble."), B("finish", "neon", "Neon Tubes", 130, "Glowing cyan frames."), B("finish", "rainbow", "Rainbow", 150, "A stripe for every shelf."),
  E("finish", "pixel", "Pixel Blocks", { t: "solved", n: 60 }, "Stock 60 deliveries.", "rare"), E("finish", "chrome", "Chrome", { t: "perfect", n: 10 }, "Get 10 perfect levels.", "epic"), E("finish", "gold", "Solid Gold", { t: "stars", n: 120 }, "Collect 120 stars.", "legendary"),
  // ---- how the goods themselves look
  B("skin", "classic", "Classic", 0, "The original smooth look."), B("skin", "sticker", "Sticker", 60, "A thick white sticker outline."), B("skin", "pastel", "Pastel", 50, "Softer, lighter colours."),
  B("skin", "film", "Old Film", 60, "Warm and faded like a photo album."), B("skin", "midnight", "Midnight", 80, "Cool and moody blues."), B("skin", "pixel", "Pixel Goods", 90, "Chunky retro pixels."), B("skin", "glow", "Glow Edge", 110, "A soft light around every item."),
  E("skin", "gold", "Golden Goods", { t: "stars", n: 200 }, "Collect 200 stars. Everything gleams.", "legendary"),
  // ---- shelf labels
  B("tag", "classic", "Classic", 0, "A clean white label."), B("tag", "chalk", "Chalkboard", 40, "Scribbled in chalk."), B("tag", "sticker", "Sticker", 40, "A bright round-cornered sticker."), B("tag", "price", "Price Tag", 50, "A tag on a string."),
  B("tag", "plank", "Wooden Plank", 50, "Burned into a board."), B("tag", "ribbon", "Ribbon", 60, "A ribbon banner."), B("tag", "neon", "Neon", 70, "Glowing letters."), E("tag", "gold", "Gold Plate", { t: "stars", n: 80 }, "Collect 80 stars.", "rare"),
  // ---- shop pets
  B("pet", "none", "No pet", 0, "A quiet shop."), B("pet", "cat", "Shop Cat", 90, "Naps on the counter."), B("pet", "dog", "Shop Dog", 90, "Greets every customer."), B("pet", "bunny", "Bunny", 100, "Hops between the shelves."),
  B("pet", "hamster", "Hamster", 100, "Stuffed cheeks, tiny feet."), B("pet", "bear", "Teddy Bear", 120, "Soft and a little sleepy."), B("pet", "fox", "Fox", 120, "Clever and fluffy-tailed."), B("pet", "panda", "Panda", 140, "Chews bamboo, stocks shelves."),
  B("pet", "penguin", "Penguin", 140, "Waddles in a tiny tuxedo."), B("pet", "owl", "Owl", 140, "Watches the night shift."), B("pet", "robot", "Stock Bot", 170, "Beeps when a shelf is full."),
  E("pet", "unicorn", "Unicorn", { t: "perfect", n: 15 }, "Get 15 perfect levels.", "legendary"), E("pet", "dragon", "Baby Dragon", { t: "stars", n: 250 }, "Collect 250 stars.", "legendary"),
  // ---- corner pieces
  B("plant", "none", "Nothing", 0, "An empty corner."), B("plant", "fern", "Little Fern", 40, "A tidy green fern."), B("plant", "cactus", "Cactus", 45, "Prickly, but cute."), B("plant", "monstera", "Big Monstera", 75, "Giant leaves."),
  B("plant", "palm", "Palm Tree", 80, "A tropical touch."), B("plant", "flowers", "Flower Vase", 60, "Fresh flowers daily."), B("plant", "balloons", "Balloons", 70, "A bunch of party balloons."), B("plant", "lamp", "Floor Lamp", 80, "A warm reading lamp."),
  B("plant", "globe", "Globe", 90, "Spin it. Pick a country."), B("plant", "statue", "Cat Statue", 110, "A very dignified statue."), B("plant", "snowman", "Snowman", 90, "Never melts, somehow."), B("plant", "vending", "Vending Machine", 140, "Cold drinks, warm lights."),
  E("plant", "trophy", "Golden Trophy", { t: "stars", n: 100 }, "Collect 100 stars.", "rare"), E("plant", "crystal", "Crystal", { t: "perfect", n: 25 }, "Get 25 perfect levels.", "epic"),
  // ---- lights along the top
  B("lights", "scene", "Room's own", 0, "Whatever the room already has."), B("lights", "none", "No lights", 0, "Plain and simple."), B("lights", "bunting", "Bunting", 40, "A string of little flags."), B("lights", "party", "Party Lights", 50, "Twinkling coloured bulbs."),
  B("lights", "fairy", "Fairy Lights", 60, "Warm tiny stars."), B("lights", "lanterns", "Paper Lanterns", 70, "Round and glowing."), B("lights", "pendant", "Pendant Lamps", 90, "Cozy hanging lamps."), B("lights", "disco", "Disco Ball", 120, "Sparkles everywhere."),
  E("lights", "stars", "Starlight", { t: "stars", n: 150 }, "Collect 150 stars.", "epic"),
  // ---- shop signs (home screen)
  B("sign", "wood", "Wooden", 0, "A hand-painted board."), B("sign", "neon", "Neon", 60, "Glowing pink tubes."), B("sign", "tin", "Vintage Tin", 70, "Rusty-edged and retro."), B("sign", "chalk", "Chalkboard", 80, "Green slate in a frame."),
  B("sign", "brass", "Brass Plaque", 80, "Polished with rivets."), B("sign", "candy", "Candy", 90, "Pink stripes."), B("sign", "stone", "Stone", 90, "Carved into a slab."), B("sign", "marquee", "Marquee", 100, "Ringed with light bulbs."),
  B("sign", "gold", "Golden", 120, "Shiny and proud."), B("sign", "holo", "Hologram", 160, "A shimmering rainbow sheen."), E("sign", "royal", "Royal Banner", { t: "stars", n: 180 }, "Collect 180 stars.", "legendary"),
  // ---- awnings (home screen)
  B("awning", "none", "None", 0, "Open to the sky."), B("awning", "red", "Red Stripes", 50, "Classic red and cream."), B("awning", "blue", "Blue Stripes", 50, "Cool blue and white."), B("awning", "green", "Mint Stripes", 50, "Fresh and minty."),
  B("awning", "sunny", "Sunny", 60, "Yellow and white."), B("awning", "navy", "Navy", 70, "Smart and nautical."), B("awning", "polka", "Polka Dots", 70, "Dots on dots."), B("awning", "candy", "Candy", 80, "Pink, white and sweet."), B("awning", "rainbow", "Rainbow", 80, "All the colours."),
  // ---- rugs (home screen)
  B("rug", "none", "None", 0, "Bare floorboards."), B("rug", "round", "Round Rug", 45, "A cozy red circle."), B("rug", "checker", "Checkered", 60, "Black and cream squares."), B("rug", "stripe", "Striped Rug", 65, "Blue and cream stripes."),
  B("rug", "star", "Star Rug", 70, "A big yellow star."), B("rug", "heart", "Heart Rug", 70, "Pink and lovely."), B("rug", "paw", "Paw Print", 80, "For the pets."), B("rug", "persian", "Persian Rug", 110, "Rich red and gold."),
  E("rug", "welcome", "Welcome Mat", { t: "solved", n: 40 }, "Stock 40 deliveries.", "rare"),
  // ---- what pops when a shelf is finished
  B("fx", "stamp", "Gold Sparks", 0, "The original sparkle."), B("fx", "bubbles", "Bubbles", 50, "Pop pop pop."), B("fx", "hearts", "Hearts", 60, "Pure love."), B("fx", "stars", "Stars", 60, "Shooting stars."),
  B("fx", "petals", "Petals", 60, "A flurry of blossom."), B("fx", "snow", "Snowflakes", 60, "A tiny blizzard."), B("fx", "confetti", "Confetti", 70, "Party time."), B("fx", "coins", "Coin Shower", 80, "Cha-ching."), B("fx", "fireworks", "Fireworks", 120, "Big bright bangs."),
  E("fx", "goldrain", "Golden Rain", { t: "daily", n: 7 }, "Reach a 7-day Daily Delivery streak.", "legendary"),
];
export const decorById = (id) => DECOR.find((d) => d.id === id) || null;
export const itemsIn = (slot) => DECOR.filter((d) => d.slot === slot);
export const DEFAULTS = { theme: "auto", finish: "oak", skin: "classic", tag: "classic", pet: "none", plant: "none", lights: "scene", sign: "wood", awning: "none", rug: "none", fx: "stamp" };
/** The free items every shop starts with (ids). */
export const FREE_IDS = Object.entries(DEFAULTS).map(([s, v]) => `${s}:${v}`);
export const newDecor = () => ({ owned: [...FREE_IDS], equipped: { ...DEFAULTS }, fresh: [] });
/** Old saves keep working: unknown ids are dropped, missing slots get their free default, you can only wear what you own. */
export function normalizeDecor(d) {
  const ids = new Set(DECOR.map((x) => x.id)), owned = [...new Set([...FREE_IDS, ...(d?.owned || []).filter((i) => ids.has(i))])], equipped = { ...DEFAULTS };
  for (const s of Object.keys(DEFAULTS)) { const v = d?.equipped?.[s]; if (v && owned.includes(`${s}:${v}`)) equipped[s] = v; }
  return { owned, equipped, fresh: (d?.fresh || []).filter((i) => ids.has(i) && owned.includes(i)).slice(0, 80) };
}
export const owns = (p, id) => !!p.decor?.owned?.includes(id);
export const isEquipped = (p, id) => { const d = decorById(id); return !!d && p.decor.equipped[d.slot] === id.split(":")[1]; };

const starsOf = (p) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
/** How far along an unlock rule is: { met, have, need, text }. A department counts as cleared when its 10 levels in the first round (1-90) all have at least one star. */
export function progressOf(p, rule) {
  const n = rule.n;
  if (rule.t === "dept") { let have = 0; for (let l = (n - 1) * 10 + 1; l <= n * 10; l++) if ((p.stars?.[l] || 0) > 0) have++; return { met: have === 10, have, need: 10, text: `Clear all ten ${DEPT_NAMES[n - 1]} levels` }; }
  const have = rule.t === "stars" ? starsOf(p) : rule.t === "solved" ? p.solved || 0 : rule.t === "perfect" ? Object.keys(p.perfect || {}).length : p.daily?.best || 0;
  const text = rule.t === "stars" ? `Collect ${n} stars` : rule.t === "solved" ? `Stock ${n} deliveries` : rule.t === "perfect" ? `Get ${n} perfect levels` : `Reach a ${n}-day Daily streak`;
  return { met: have >= n, have: Math.min(have, n), need: n, text };
}
/** Hand out every earned item whose rule is now met. Returns the items granted (also remembered in `decor.fresh` for the NEW badges). */
export function grantUnlocks(p) {
  p.decor = normalizeDecor(p.decor); const out = [];
  for (const it of DECOR) if (it.unlock && !p.decor.owned.includes(it.id) && progressOf(p, it.unlock).met) { p.decor.owned.push(it.id); p.decor.fresh.push(it.id); out.push(it); }
  return out;
}
/** Buy a decoration with coins (it is worn straight away). Earned items cannot be bought. */
export function buyDecor(p, id) {
  const d = decorById(id); if (!d) return { ok: false, reason: "unknown" }; p.decor = normalizeDecor(p.decor); if (p.decor.owned.includes(id)) return { ok: false, reason: "owned" }; if (d.unlock) return { ok: false, reason: "earned" }; if (p.coins < d.price) return { ok: false, reason: "poor" };
  p.coins -= d.price; p.decor.owned.push(id); p.decor.equipped[d.slot] = id.split(":")[1]; return { ok: true, price: d.price, item: d };
}
/** Put an owned decoration on display (replacing whatever was in that slot). */
export function equipDecor(p, id) { const d = decorById(id); p.decor = normalizeDecor(p.decor); if (!d || !p.decor.owned.includes(id)) return { ok: false }; p.decor.equipped[d.slot] = id.split(":")[1]; p.decor.fresh = p.decor.fresh.filter((x) => x !== id); return { ok: true }; }
export const clearFresh = (p, slot) => { p.decor = normalizeDecor(p.decor); p.decor.fresh = p.decor.fresh.filter((i) => !i.startsWith(`${slot}:`)); };
export const closetCount = (p, slot) => { const list = slot ? itemsIn(slot) : DECOR; return { owned: list.filter((d) => p.decor?.owned?.includes(d.id)).length, total: list.length }; };
export const freshIn = (p, slot) => (p.decor?.fresh || []).filter((i) => i.startsWith(`${slot}:`)).length;

// ---------------------------------------------------------------- how rooms look (the client turns this into CSS)
/** wall [top, bottom], pattern kind + colour, floor [a, b] + pattern kind, trim colour, optional glow. */
export const THEME_LOOK = {
  cozy: { wall: ["#f6e8d4", "#ecd5b4"], pat: ["stripes", "rgba(180,130,90,.16)"], floor: ["#c89a6a", "#b8885a"], fp: "planks", trim: "#a9744a" },
  market: { wall: ["#fff4c2", "#ffe08a"], pat: ["dots", "rgba(255,150,40,.28)"], floor: ["#e0b27a", "#cf9d62"], fp: "tiles", trim: "#c98a3a" },
  barn: { wall: ["#c97b4a", "#a85f33"], pat: ["planks", "rgba(60,25,10,.28)"], floor: ["#8a6038", "#6f4a28"], fp: "planks", trim: "#5a3a1a" },
  greenhouse: { wall: ["#d8f0e0", "#b5e0c8"], pat: ["panes", "rgba(255,255,255,.7)"], floor: ["#b9a07a", "#a89068"], fp: "tiles", trim: "#5f9a78" },
  seaside: { wall: ["#bfe8ff", "#8fd0f5"], pat: ["waves", "rgba(255,255,255,.45)"], floor: ["#f3dfa8", "#e8cf8e"], fp: "sand", trim: "#f6efe0" },
  lodge: { wall: ["#6a4a2a", "#4e3519"], pat: ["planks", "rgba(0,0,0,.3)"], floor: ["#3d2a14", "#2e1f0e"], fp: "planks", trim: "#2a1a0a", dark: true },
  candy: { wall: ["#ffd0e4", "#ffb3d4"], pat: ["stripes", "rgba(255,255,255,.55)"], floor: ["#ffffff", "#ffc2dc"], fp: "checker", trim: "#ff7fb0" },
  sakura: { wall: ["#ffe1ea", "#ffc2d6"], pat: ["petals", "rgba(255,255,255,.7)"], floor: ["#d6b48a", "#c8a578"], fp: "planks", trim: "#b8895a" },
  winter: { wall: ["#dbeaff", "#b9d4f2"], pat: ["snow", "rgba(255,255,255,.9)"], floor: ["#f4f8ff", "#dfe8f5"], fp: "tiles", trim: "#9fb8d8" },
  diner: { wall: ["#b8f0e0", "#8fe0cc"], pat: ["stripes", "rgba(255,255,255,.35)"], floor: ["#ffffff", "#2b2342"], fp: "checker", trim: "#e5484d" },
  midnight: { wall: ["#2a2260", "#14103a"], pat: ["stars", "rgba(255,240,200,.8)"], floor: ["#1c1640", "#120e2c"], fp: "tiles", trim: "#4a3a9a", dark: true, glow: "#8a6aff" },
  arcade: { wall: ["#240a4a", "#0c0222"], pat: ["grid", "rgba(0,229,255,.28)"], floor: ["#1a0a3a", "#12062a"], fp: "grid", trim: "#ff2fd4", dark: true, glow: "#00e5ff" },
  space: { wall: ["#0a0830", "#02010f"], pat: ["stars", "rgba(255,255,255,.9)"], floor: ["#2a2a50", "#1a1a3a"], fp: "tiles", trim: "#4cc3ff", dark: true, glow: "#4cc3ff" },
  studio: { wall: ["#f3e2ff", "#dfc2f5"], pat: ["stripes", "rgba(150,90,200,.14)"], floor: ["#e8d4b8", "#d8c0a0"], fp: "planks", trim: "#a070d0" },
  library: { wall: ["#7a3a3a", "#5a2424"], pat: ["diamonds", "rgba(255,210,150,.14)"], floor: ["#5a3a24", "#3f2814"], fp: "planks", trim: "#3a1a1a", dark: true },
  salon: { wall: ["#fff0f7", "#ffd9ea"], pat: ["diamonds", "rgba(255,150,190,.2)"], floor: ["#f2e6ee", "#e0cfdc"], fp: "tiles", trim: "#e89ac0" },
  playroom: { wall: ["#fff0b3", "#ffd966"], pat: ["dots", "rgba(255,120,90,.3)"], floor: ["#5ac8fa", "#3aa8e0"], fp: "checker", trim: "#ff7a5a" },
  kitchen: { wall: ["#fff6e0", "#ffe8bb"], pat: ["panes", "rgba(190,140,80,.22)"], floor: ["#efe0c8", "#cfb590"], fp: "checker", trim: "#c4743a" },
  court: { wall: ["#ffb36b", "#ff9040"], pat: ["stripes", "rgba(255,255,255,.25)"], floor: ["#d9803a", "#c46d28"], fp: "planks", trim: "#8a4a14" },
  holiday: { wall: ["#2f6a4a", "#1f4a34"], pat: ["dots", "rgba(255,210,90,.5)"], floor: ["#a02a2a", "#8a1f1f"], fp: "carpet", trim: "#ffd23f", dark: true },
  post: { wall: ["#cfe0ee", "#aac4dc"], pat: ["bricks", "rgba(60,90,120,.22)"], floor: ["#8a8a98", "#767686"], fp: "tiles", trim: "#4a6a8a" },
  rooftop: { wall: ["#ffd9a8", "#ffb77a"], pat: ["none", "transparent"], floor: ["#6f6a78", "#5a5666"], fp: "tiles", trim: "#4a4658" },
};

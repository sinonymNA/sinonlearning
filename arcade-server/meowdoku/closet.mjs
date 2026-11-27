// The Meowdoku closet: everything you can collect and wear. Pure ESM data + rules (no drawing here: the client draws each id; `look` objects describe how).
// Items are either BOUGHT with yarn (price > 0) or EARNED by playing (unlock rule, price 0). No loot boxes, no odds, no real money: you always see exactly what you get.
import { AREAS } from "./areas.mjs";

export const RARITY = { common: { name: "Common", color: "#9fb3c8" }, rare: { name: "Rare", color: "#4cc3ff" }, epic: { name: "Epic", color: "#c07bff" }, legendary: { name: "Legendary", color: "#ffd23f" } };
/** Shop tabs, in order. `slot` is the equip slot. */
export const SLOTS = [
  { id: "breed", name: "CATS", one: "cat" }, { id: "hat", name: "HATS", one: "hat" }, { id: "glasses", name: "SPECS", one: "glasses" }, { id: "palette", name: "COLORS", one: "color set" },
  { id: "backdrop", name: "SCENES", one: "scene" }, { id: "fish", name: "FISH", one: "fish" }, { id: "fx", name: "POOFS", one: "effect" }, { id: "mark", name: "MARKS", one: "mark" }, { id: "frame", name: "FRAMES", one: "frame" },
];
const I = (slot, id, name, rarity, price, extra = {}) => ({ slot, id, name, rarity, price, ...extra });
const E = (slot, id, name, rarity, unlock, extra = {}) => ({ slot, id, name, rarity, price: 0, unlock, ...extra });
const L = (fur, fur2, white, white2, ear, eye, pattern, more = {}) => ({ fur, fur2, white, white2, ear, eye, pattern, ...more });

// ---- cats: a `look` per breed (fur colours, eye colour, and a pattern the client paints)
export const BREEDS = [
  I("breed", "tuxedo", "Tuxedo", "common", 0, { look: L("#25253a", "#3b3b58", "#fff8f0", "#e8dccf", "#ff9fb5", "#fff8f0", "tuxedo"), text: "The classic. Dapper by default." }),
  I("breed", "tabby", "Orange Tabby", "common", 60, { look: L("#e8903a", "#f4b86a", "#fff4e2", "#f0dcc0", "#ffb3a0", "#fff8f0", "tabby", { stripe: "#b8611c" }), text: "Stripes, appetite and opinions." }),
  I("breed", "silver", "Silver Tabby", "common", 60, { look: L("#7c8196", "#a4a9bd", "#f1f1f8", "#d8d8e6", "#ffb3c8", "#fff8f0", "tabby", { stripe: "#4a4f66" }), text: "Cool grey stripes, warm heart." }),
  I("breed", "midnight", "Midnight", "common", 60, { look: L("#16161f", "#262633", "#2c2c3a", "#1c1c28", "#6a5a78", "#ffd23f", "solid", { eyeGlow: true }), text: "A black cat. Lucky, whatever they say." }),
  I("breed", "snowball", "Snowball", "common", 70, { look: L("#f2f2f8", "#d8d8e8", "#ffffff", "#e6e6f2", "#ffc0d0", "#8fd0ff", "solid"), text: "Fluffy, white, and unbothered." }),
  I("breed", "cream", "Cream", "common", 70, { look: L("#e8d3a8", "#f6e8c8", "#fff8ea", "#efe0c4", "#ffb8a8", "#fff8f0", "solid"), text: "Soft as a biscuit." }),
  I("breed", "mocha", "Mocha", "common", 80, { look: L("#8a5a3a", "#aa7a56", "#f0e0cc", "#ddc8aa", "#e8a090", "#fff8f0", "solid"), text: "Hot chocolate in cat form." }),
  I("breed", "siamese", "Siamese", "rare", 120, { look: L("#efe0c8", "#f8ecd8", "#fffaf0", "#efe0c8", "#8a6a58", "#9ad7ff", "points", { point: "#5a3a2a" }), text: "Chatty, elegant, blue-eyed." }),
  I("breed", "calico", "Calico", "rare", 140, { look: L("#fff6ea", "#ece0cf", "#fffaf2", "#f0e4d4", "#ffb8a8", "#fff8f0", "calico", { patch1: "#e8903a", patch2: "#2a2a36" }), text: "A patchwork good-luck charm." }),
  I("breed", "tortie", "Tortoiseshell", "rare", 140, { look: L("#2e2a30", "#463c3a", "#4a423c", "#352f30", "#8a6a60", "#ffb02e", "calico", { patch1: "#d9742a", patch2: "#2a2428", whiteless: true }), text: "Mottled, fiery, full of attitude." }),
  I("breed", "ragdoll", "Ragdoll", "rare", 160, { look: L("#f4eee6", "#e2d6c8", "#ffffff", "#f0e8de", "#a08a7a", "#7ac0ff", "mask", { point: "#8a7766" }), text: "Goes limp when you pick it up." }),
  I("breed", "fold", "Scottish Fold", "rare", 180, { look: L("#a8a8b8", "#c8c8d6", "#f6f6fa", "#dcdce8", "#d8a0b0", "#ffc43a", "fold"), text: "Tiny folded ears. Round, curious eyes." }),
  I("breed", "bengal", "Bengal", "rare", 200, { look: L("#e0a050", "#f0c078", "#fff0d8", "#ecd4b0", "#e0a090", "#9ad76a", "spots", { stripe: "#5a3410" }), text: "Wild spots, wilder zoomies." }),
  I("breed", "sphynx", "Sphynx", "rare", 200, { look: L("#f0b8a8", "#f8d0c4", "#f8d8cc", "#e8bcae", "#e89898", "#9ad7ff", "sphynx"), text: "No fur, all personality." }),
  I("breed", "coon", "Maine Coon", "epic", 300, { look: L("#7a5a3a", "#9a7650", "#f2e6d2", "#dcc9aa", "#c89080", "#ffc43a", "coon", { stripe: "#3f2a14" }), text: "Huge, fluffy, tufted ears. A gentle giant." }),
  I("breed", "cyber", "Cyber Cat", "epic", 400, { look: L("#1a2038", "#2a3358", "#202a48", "#161c34", "#00e5ff", "#00e5ff", "cyber", { neon: "#00e5ff", eyeGlow: true }), text: "Glowing circuits. Purrs in binary." }),
  I("breed", "galaxy", "Galaxy Cat", "epic", 450, { look: L("#3a1f7a", "#5a35a8", "#6a4ac0", "#4a2a94", "#ff9fd0", "#ffe08a", "galaxy", { neon: "#ffe08a", eyeGlow: true }), text: "Made of stars. Mostly asleep." }),
  E("breed", "royal", "Royal Persian", "legendary", { t: "world", n: 10 }, { look: L("#f6ead2", "#ffffff", "#fffaf0", "#f0e0c0", "#ffc0b0", "#7ac0ff", "royal", { neon: "#ffd23f" }), text: "Clear World 10. Fit for a crown." }),
  E("breed", "lynx", "Frost Lynx", "epic", { t: "world", n: 8 }, { look: L("#cfe0f0", "#e8f2fb", "#ffffff", "#dbe8f5", "#9ab8d8", "#8fd0ff", "coon", { stripe: "#7a98b8" }), text: "Clear World 8. Tufted ears, icy stare." }),
  E("breed", "pumpkin", "Pumpkin Cat", "epic", { t: "world", n: 11 }, { look: L("#f08a2a", "#ffb04a", "#ffe9c0", "#f4cf90", "#ffb090", "#ffe94a", "tabby", { stripe: "#8a4a10" }), text: "Clear World 11. Perfectly in season." }),
  E("breed", "sakura", "Sakura Cat", "epic", { t: "world", n: 14 }, { look: L("#ffd0e0", "#ffe6f0", "#fff6fa", "#ffdce8", "#ff9ec4", "#ff7aa8", "solid"), text: "Clear World 14. Smells like spring." }),
  E("breed", "ghost", "Ghost Cat", "epic", { t: "world", n: 16 }, { look: L("#dfe8ff", "#f4f8ff", "#ffffff", "#e8eeff", "#c0ccff", "#7a5cff", "ghost", { eyeGlow: true }), text: "Clear World 16. Friendly. Mostly see-through." }),
  E("breed", "candy", "Candy Cat", "epic", { t: "world", n: 17 }, { look: L("#ff9ec4", "#ffc0d8", "#ffffff", "#ffe0ec", "#ffffff", "#6af0c8", "tabby", { stripe: "#ffffff" }), text: "Clear World 17. Sweet. Not edible." }),
  E("breed", "cosmic", "Cosmic Cat", "legendary", { t: "world", n: 20 }, { look: L("#201060", "#3a1f8a", "#ffd23f", "#e8b82a", "#ff9fd0", "#ffd23f", "galaxy", { neon: "#ffd23f", eyeGlow: true }), text: "Clear World 20. The final frontier." }),
];

// ---- hats and glasses (drawn by id on the client)
export const HATS = [
  I("hat", "none", "No hat", "common", 0, { text: "Au naturel." }),
  I("hat", "bow", "Pink Bow", "common", 40, { text: "A little bow on one ear." }), I("hat", "party", "Party Hat", "common", 50, { text: "It's always somebody's birthday." }),
  I("hat", "bandana", "Bandana", "common", 50, { text: "Tough. Yet tiny." }), I("hat", "flowers", "Flower Crown", "common", 60, { text: "Picked fresh this morning." }),
  I("hat", "beanie", "Cozy Beanie", "common", 60, { text: "Knitted with love (and yarn)." }), I("hat", "santa", "Santa Hat", "common", 70, { text: "Ho ho meow." }),
  I("hat", "chef", "Chef Hat", "common", 80, { text: "Specialty: fish. Obviously." }), I("hat", "propeller", "Propeller Cap", "common", 80, { text: "Spins when you do." }),
  I("hat", "top", "Top Hat", "rare", 90, { text: "Distinguished. Possibly a magician." }), I("hat", "shroom", "Mushroom Cap", "rare", 90, { text: "Fungi fashion." }),
  I("hat", "pirate", "Pirate Hat", "rare", 100, { text: "Arr-meow!" }), I("hat", "cowboy", "Cowboy Hat", "rare", 100, { text: "Yee-claw." }),
  I("hat", "phones", "Headphones", "rare", 110, { text: "Currently listening to purrs." }), I("hat", "wizard", "Wizard Hat", "rare", 120, { text: "Pointed, starry, magical." }),
  I("hat", "viking", "Viking Helmet", "rare", 120, { text: "Horns up for puzzle glory." }),
  E("hat", "grad", "Graduation Cap", "rare", { t: "solved", n: 50 }, { text: "Solve 50 puzzles. Top of the class." }), E("hat", "halo", "Halo", "epic", { t: "daily", n: 7 }, { text: "A 7-day Daily streak. Pure angel." }),
  E("hat", "crown", "Golden Crown", "legendary", { t: "stars", n: 150 }, { text: "Collect 150 stars. Long may you reign." }), E("hat", "helmet", "Space Helmet", "legendary", { t: "world", n: 20 }, { text: "Clear World 20. Cat in a bubble." }),
];
export const GLASSES = [
  I("glasses", "none", "No specs", "common", 0, { text: "Perfect vision." }), I("glasses", "round", "Round Glasses", "common", 60, { text: "Bookish and bright." }),
  I("glasses", "shades", "Sunglasses", "common", 70, { text: "Too cool to blink." }), I("glasses", "3d", "3D Glasses", "common", 70, { text: "Red and blue, popcorn included." }),
  I("glasses", "heart", "Heart Glasses", "rare", 80, { text: "Everything looks lovely." }), I("glasses", "monocle", "Monocle", "rare", 90, { text: "Quite posh." }),
  I("glasses", "goggles", "Aviator Goggles", "rare", 100, { text: "Ready for takeoff." }), I("glasses", "star", "Star Shades", "epic", 110, { text: "Celebrity cat, incognito." }),
];

// ---- colour sets for the squares (10 colours, so 10x10 boards work). Shapes can still be switched on for everyone.
const P = (id, name, rarity, price, colors, text, extra = {}) => ({ slot: "palette", id, name, rarity, price, colors, text, ...extra });
export const PALETTES = [
  P("classic", "Classic", "common", 0, ["#9ed36a", "#e8706f", "#f6b3d2", "#ffab5e", "#9b7fdc", "#ecc84a", "#8fb4e0", "#5fcab8", "#c9a27a", "#d8d8e0"], "The original. Friendly and bright."),
  P("pastel", "Pastel Dream", "common", 40, ["#cdeac0", "#ffc8c8", "#ffe5f1", "#ffe0b8", "#d8cdf5", "#fff2b8", "#cfe3f7", "#bdeee3", "#e6d3bd", "#e4e4ee"], "Soft and calm."),
  P("candy", "Candy Pop", "common", 50, ["#ff4d8d", "#ffb000", "#7bd957", "#2ec4f1", "#a463f2", "#ff6f3c", "#00c9a7", "#ffd93b", "#ef476f", "#8338ec"], "Loud, juicy and sweet."),
  P("ocean", "Ocean Deep", "common", 50, ["#0b6e99", "#4cc9f0", "#90e0ef", "#00b4a6", "#ffd6a5", "#fcbf49", "#caf0f8", "#2a9d8f", "#ff8c69", "#7b9acc"], "Waves, sand and coral."),
  P("forest", "Forest Floor", "common", 50, ["#2d6a4f", "#74c69d", "#95d5b2", "#b08968", "#d4a373", "#a3b18a", "#588157", "#dda15e", "#bc6c25", "#e9edc9"], "Moss, bark and mushrooms."),
  P("sunset", "Sunset Glow", "rare", 70, ["#ff6b6b", "#ffa94d", "#ffd43b", "#f06595", "#cc5de8", "#845ef7", "#ff8787", "#ffc078", "#fab005", "#e64980"], "Every colour of dusk."),
  P("berry", "Berry Patch", "rare", 70, ["#6a0572", "#ab83a1", "#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#f78c6b", "#9d4edd", "#ff99c8", "#bde0fe"], "Jammy and juicy."),
  P("autumn", "Autumn Leaves", "rare", 70, ["#9c3d11", "#e07a1f", "#f2b134", "#7a8b34", "#b5523b", "#d9a066", "#5b3a29", "#c8553d", "#f4d58d", "#8a9a5b"], "Crunchy, warm and golden."),
  P("spring", "Spring Fling", "rare", 80, ["#b7e4c7", "#ffafcc", "#ffd6a5", "#bde0fe", "#cdb4db", "#fdffb6", "#a0c4ff", "#caffbf", "#ffc6ff", "#ffadad"], "Fresh blossoms and ice-cream shades."),
  P("retro", "Retro 80s", "rare", 90, ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff", "#fffb96", "#ff9a8b", "#7df9ff", "#f6a6ff", "#ffd1a9", "#a0ffe6"], "Neon pastel nostalgia."),
  P("neon", "Neon Night", "epic", 140, ["#39ff14", "#ff073a", "#ff61f6", "#ffae00", "#00f0ff", "#fffb00", "#9d4dff", "#00ff9f", "#ff6a00", "#c0c0ff"], "Maximum glow."),
  P("galaxy", "Galaxy", "epic", 140, ["#7c3aed", "#ec4899", "#38bdf8", "#facc15", "#34d399", "#fb7185", "#a78bfa", "#f97316", "#22d3ee", "#c084fc"], "Stardust and nebulae."),
  P("clear", "Clear View", "common", 50, ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#999999", "#FFFFFF", "#332288"], "A colour-blind-friendly set with very distinct hues."),
  E("palette", "royal", "Royal Jewels", "legendary", { t: "world", n: 10 }, { colors: ["#7a1fa2", "#ffd23f", "#e53950", "#1e88e5", "#2ecc71", "#ff9800", "#00bcd4", "#f8bbd0", "#8d6e63", "#eceff1"], text: "Clear World 10. Rubies, sapphires, emeralds." }),
  E("palette", "rainbow", "Rainbow Road", "legendary", { t: "solved", n: 100 }, { colors: ["#ff595e", "#ff924c", "#ffca3a", "#c5ca30", "#8ac926", "#36949d", "#1982c4", "#4267ac", "#6a4c93", "#b5179e"], text: "Solve 100 puzzles. A full spectrum." }),
];

// ---- scenes (the screen behind the board). Every world you clear gives you its scene; the rest are in the shop.
const B = (id, name, rarity, price, css, text, extra = {}) => ({ slot: "backdrop", id, name, rarity, price, css, text, ...extra });
const STARS = "radial-gradient(circle at 20% 30%, #fff 0 1px, transparent 2px) 0 0/90px 90px, radial-gradient(circle at 70% 70%, #fff 0 1px, transparent 2px) 0 0/130px 130px, radial-gradient(circle at 45% 55%, #ffe9a8 0 1px, transparent 2px) 0 0/170px 170px";
export const BACKDROPS = [
  B("world", "Follow the world", "common", 0, "", "Changes with the world you are in."),
  B("night", "Starry Night", "common", 50, `${STARS}, linear-gradient(#0b1038, #2a2060)`, "Twinkling dots over deep blue."),
  B("meadow", "Sunny Meadow", "common", 50, "radial-gradient(circle at 80% 18%, #fff7c2 0 6%, transparent 7%), linear-gradient(#9fd8ff 0 58%, #8fd06a 58% 80%, #4f9a3a 80%)", "Blue sky, green grass."),
  B("cafe", "Cozy Cafe", "common", 60, "repeating-conic-gradient(#4a2f1c 0 25%, #5a3a24 0 50%) 0 0/48px 48px", "Checkered floors and warm lamps."),
  B("deepsea", "Deep Sea", "common", 60, "radial-gradient(circle at 30% 80%, #ffffff44 0 3px, transparent 4px) 0 0/80px 90px, radial-gradient(circle at 70% 40%, #ffffff33 0 2px, transparent 3px) 0 0/110px 120px, linear-gradient(#0d7aa0, #041a2a)", "Bubbles drifting up."),
  B("sakura", "Cherry Blossom", "common", 60, "radial-gradient(circle at 25% 35%, #fff 0 4px, transparent 5px) 0 0/100px 90px, radial-gradient(circle at 75% 70%, #ffe0ec 0 3px, transparent 4px) 0 0/130px 110px, linear-gradient(#ffc0d8, #c86a9a)", "Petals everywhere."),
  B("clouds", "Candy Clouds", "common", 60, "radial-gradient(ellipse at 20% 30%, #ffffffcc 0 12%, transparent 13%), radial-gradient(ellipse at 75% 65%, #ffffffaa 0 14%, transparent 15%), linear-gradient(#ffb3d6, #b3d9ff)", "Cotton-candy sky."),
  B("rain", "Rainy Window", "rare", 80, "repeating-linear-gradient(105deg, #ffffff14 0 2px, transparent 2px 16px), linear-gradient(#34455e, #121a2a)", "Pitter-patter, snug indoors."),
  B("library", "Old Library", "rare", 80, "repeating-linear-gradient(90deg, #00000033 0 3px, transparent 3px 36px), repeating-linear-gradient(0deg, #00000022 0 2px, transparent 2px 60px), linear-gradient(#6b4423, #2e1c0c)", "Shelves of old books."),
  B("beach", "Sunset Beach", "rare", 90, "radial-gradient(circle at 50% 44%, #fff3c2 0 8%, transparent 9%), linear-gradient(#ff7e5f, #feb47b 44%, #2a7fa8 45% 62%, #f5d36a 63%)", "The sun dips into the sea."),
  B("cabin", "Snowy Cabin", "rare", 90, "radial-gradient(circle at 15% 25%, #fff 0 2px, transparent 3px) 0 0/70px 70px, radial-gradient(circle at 65% 65%, #fff 0 2px, transparent 3px) 0 0/90px 90px, linear-gradient(#2a4a7a, #0c1830 70%, #e8f2ff 70%)", "Warm inside, snow outside."),
  B("paper", "Graph Paper", "common", 40, "linear-gradient(#5aa0ff33 1px, transparent 1px) 0 0/28px 28px, linear-gradient(90deg, #5aa0ff33 1px, transparent 1px) 0 0/28px 28px, #fbf6e6", "For serious puzzlers."),
  B("neon", "Neon City", "epic", 140, "linear-gradient(#ff2fd433 1px, transparent 1px) 0 0/32px 32px, linear-gradient(90deg, #00e5ff33 1px, transparent 1px) 0 0/32px 32px, linear-gradient(#1a0a3a, #05010f)", "Grid lines and glow."),
  B("leaves", "Autumn Leaves", "rare", 80, "radial-gradient(circle at 30% 30%, #ffb02e 0 4px, transparent 5px) 0 0/90px 80px, radial-gradient(circle at 70% 70%, #e0603a 0 4px, transparent 5px) 0 0/120px 100px, linear-gradient(#a8501c, #5a2410)", "Crunchy and warm."),
  B("stripes", "Bubblegum", "common", 40, "repeating-linear-gradient(45deg, #ff9ec4 0 22px, #ffd0e4 22px 44px)", "Pink candy stripes."),
  B("aurora", "Aurora", "epic", 150, "radial-gradient(ellipse at 30% 20%, #3dffb280 0 20%, transparent 40%), radial-gradient(ellipse at 70% 30%, #b57bff80 0 20%, transparent 45%), linear-gradient(#050a28, #0b1a3a)", "Northern lights over the ice."),
];
/** One scene per world (20), earned by clearing that world's finale. */
export const WORLD_BACKDROPS = AREAS.map((a, i) => E("backdrop", `world-${i + 1}`, a.name, i === 9 || i === 19 ? "epic" : "rare", { t: "world", n: i + 1 }, { css: `radial-gradient(circle at 50% 0%, ${a.accent}33 0 30%, transparent 60%), linear-gradient(${a.bgA}, ${a.bgB})`, text: `Clear World ${i + 1}: ${a.name}.` }));

// ---- fish skins (the lives), poofs (when a cat lands), marks (the X), frames (around the board): the client draws or styles each id
export const FISH = [
  I("fish", "gold", "Goldfish", "common", 0, { text: "The original." }), I("fish", "koi", "Koi", "common", 60, { text: "Orange and white, very serene." }), I("fish", "tang", "Blue Tang", "common", 60, { text: "Just keep swimming." }),
  I("fish", "tetra", "Neon Tetra", "common", 70, { text: "A glowing stripe." }), I("fish", "sardine", "Sardine", "common", 60, { text: "Silver and shy." }), I("fish", "puffer", "Pufferfish", "rare", 90, { text: "Round and prickly." }),
  I("fish", "nigiri", "Nigiri", "rare", 100, { text: "A fish on a pillow of rice." }), I("fish", "trout", "Rainbow Trout", "rare", 120, { text: "A stripe for every mood." }),
  I("fish", "jelly", "Jellyfish", "rare", 140, { text: "Wobbly and see-through." }), I("fish", "angler", "Anglerfish", "epic", 160, { text: "Brings its own lamp." }),
  E("fish", "heart", "Heart Fish", "rare", { t: "stars", n: 60 }, { text: "Collect 60 stars. A fish full of love." }), E("fish", "goldkoi", "Golden Koi", "legendary", { t: "stars", n: 300 }, { text: "Collect 300 stars. Said to bring luck." }),
];
export const FX = [
  I("fx", "puff", "Puff", "common", 0, { text: "A tidy little cloud." }), I("fx", "bubbles", "Bubbles", "common", 50, { text: "Pop pop pop." }), I("fx", "hearts", "Hearts", "common", 60, { text: "Love at first placement." }),
  I("fx", "sparkle", "Sparkles", "common", 60, { text: "Glitter, everywhere." }), I("fx", "petals", "Petals", "common", 70, { text: "A breeze of blossom." }), I("fx", "paws", "Paw Prints", "rare", 70, { text: "Tiny pawprints scatter." }),
  I("fx", "stars", "Stars", "rare", 80, { text: "Shooting stars out of nowhere." }), I("fx", "confetti", "Confetti", "rare", 90, { text: "Every cat is a party." }), I("fx", "bolt", "Lightning", "epic", 120, { text: "Zap! Crackle!" }),
  E("fx", "fireworks", "Fireworks", "legendary", { t: "endless", n: 20 }, { text: "Win 20 Endless puzzles. Boom!" }),
];
export const MARKS = [
  I("mark", "x", "Classic X", "common", 0, { text: "Crossed out." }), I("mark", "paw", "Paw", "common", 40, { text: "A tiny paw instead." }), I("mark", "heart", "Heart", "common", 40, { text: "A little love note." }),
  I("mark", "star", "Star", "common", 50, { text: "A gold star for ruling it out." }), I("mark", "bone", "Fishbone", "common", 50, { text: "Eaten, thoroughly." }), I("mark", "stitch", "Stitch", "rare", 60, { text: "Cross-stitched, naturally." }),
  E("mark", "goldpaw", "Golden Paw", "legendary", { t: "stars", n: 90 }, { text: "Collect 90 stars. Fancy." }),
];
export const FRAMES = [
  I("frame", "plain", "Plain", "common", 0, { text: "Clean and simple." }), I("frame", "wood", "Wooden", "common", 50, { text: "Solid oak." }), I("frame", "candy", "Candy Stripe", "common", 60, { text: "Peppermint border." }),
  I("frame", "stone", "Pixel Stone", "common", 60, { text: "Chunky castle blocks." }), I("frame", "vines", "Leafy Vines", "rare", 70, { text: "Garden-grown." }), I("frame", "ice", "Ice", "rare", 70, { text: "Frosty and sparkling." }),
  I("frame", "neon", "Neon Tubes", "rare", 80, { text: "Glowing border." }), I("frame", "rainbow", "Rainbow", "epic", 120, { text: "Colours chasing round." }),
  E("frame", "gold", "Solid Gold", "legendary", { t: "stars", n: 100 }, { text: "Collect 100 stars. Shiny." }), E("frame", "diamond", "Diamond", "legendary", { t: "stars", n: 250 }, { text: "Collect 250 stars. Sparkles." }),
];

export const CATALOG = [...BREEDS, ...HATS, ...GLASSES, ...PALETTES, ...BACKDROPS, ...WORLD_BACKDROPS, ...FISH, ...FX, ...MARKS, ...FRAMES];
export const BY_ID = new Map(CATALOG.map((it) => [`${it.slot}:${it.id}`, it]));
/** Look an item up by slot + id. */
export const itemOf = (slot, id) => BY_ID.get(`${slot}:${id}`) || null;
export const itemsIn = (slot) => CATALOG.filter((it) => it.slot === slot);
export const DEFAULTS = { breed: "tuxedo", hat: "none", glasses: "none", palette: "classic", backdrop: "world", fish: "gold", fx: "puff", mark: "x", frame: "plain" };
const key = (slot, id) => `${slot}:${id}`;

// ---------------------------------------------------------------- profile
export const newCloset = () => ({ owned: Object.fromEntries(Object.entries(DEFAULTS).map(([s, id]) => [key(s, id), 1])), equip: { ...DEFAULTS }, fresh: [] });
export function normalizeCloset(c) {
  const d = newCloset(), owned = { ...d.owned }; for (const k of Object.keys(c?.owned || {})) if (BY_ID.has(k)) owned[k] = 1;
  const equip = { ...d.equip }; for (const s of Object.keys(DEFAULTS)) { const id = c?.equip?.[s]; if (id && owned[key(s, id)]) equip[s] = id; }
  return { owned, equip, fresh: (c?.fresh || []).filter((k) => BY_ID.has(k) && owned[k]).slice(0, 60) };
}
export const owns = (p, slot, id) => !!p.closet?.owned?.[key(slot, id)];
export const equipped = (p, slot) => itemOf(slot, p.closet?.equip?.[slot] || DEFAULTS[slot]) || itemOf(slot, DEFAULTS[slot]);

const starsOf = (p) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
const fastOf = (p) => Object.keys(p.fast || {}).filter((k) => p.fast[k]).length;
/** How far along an unlock rule is: { met, have, need, text }. */
export function progressOf(p, rule) {
  const need = rule.n; let have = 0, text = "";
  if (rule.t === "world") { have = p.stars?.[rule.n * 10] > 0 ? 1 : 0; return { met: have === 1, have, need: 1, text: `Clear World ${rule.n}` }; }
  if (rule.t === "stars") { have = starsOf(p); text = `Collect ${need} stars`; } else if (rule.t === "solved") { have = p.solved || 0; text = `Solve ${need} puzzles`; }
  else if (rule.t === "daily") { have = p.daily?.best || 0; text = `Reach a ${need}-day Daily streak`; } else if (rule.t === "endless") { have = p.endless?.wins || 0; text = `Win ${need} Endless puzzles`; }
  else if (rule.t === "fast") { have = fastOf(p); text = `Earn ${need} speed bolts`; }
  return { met: have >= need, have: Math.min(have, need), need, text };
}
/** Hand out every earned item whose rule is now met. Returns the items granted (also remembered in `closet.fresh` for the NEW badges). */
export function grantUnlocks(p) {
  p.closet = normalizeCloset(p.closet); const out = [];
  for (const it of CATALOG) if (it.unlock && !p.closet.owned[key(it.slot, it.id)] && progressOf(p, it.unlock).met) { p.closet.owned[key(it.slot, it.id)] = 1; p.closet.fresh.push(key(it.slot, it.id)); out.push(it); }
  return out;
}
/** Buy a shop item with yarn. Earned items cannot be bought. */
export function buyItem(p, slot, id) {
  const it = itemOf(slot, id); if (!it) return { ok: false, reason: "unknown" }; p.closet = normalizeCloset(p.closet);
  if (p.closet.owned[key(slot, id)]) return { ok: false, reason: "owned" }; if (it.unlock) return { ok: false, reason: "earned" }; if (p.yarn < it.price) return { ok: false, reason: "poor" };
  p.yarn -= it.price; p.closet.owned[key(slot, id)] = 1; return { ok: true, item: it };
}
/** Wear an owned item (one per slot). */
export function equipItem(p, slot, id) {
  p.closet = normalizeCloset(p.closet); if (!itemOf(slot, id) || !p.closet.owned[key(slot, id)]) return { ok: false, reason: "not owned" };
  p.closet.equip[slot] = id; p.closet.fresh = p.closet.fresh.filter((k) => k !== key(slot, id)); return { ok: true };
}
export const clearFresh = (p, slot) => { p.closet = normalizeCloset(p.closet); p.closet.fresh = p.closet.fresh.filter((k) => !k.startsWith(`${slot}:`)); };
export const closetCount = (p, slot) => { const list = slot ? itemsIn(slot) : CATALOG; return { owned: list.filter((it) => p.closet?.owned?.[key(it.slot, it.id)]).length, total: list.length }; };
export const freshIn = (p, slot) => (p.closet?.fresh || []).filter((k) => k.startsWith(`${slot}:`)).length;
/** Colours for the board: the equipped set, cut to the board size. */
export const colorsFor = (p) => (equipped(p, "palette").colors || PALETTES[0].colors);

// ---------------------------------------------------------------- colour names (so a hint says "the blue area" for whatever colour set you wear)
function hsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, s, l];
}
function baseName(hex) {
  const [h, s, l] = hsl(hex);
  if (l > 0.94) return "white"; if (l < 0.13) return "black"; if (s < 0.14) return l > 0.68 ? "silver" : l > 0.38 ? "grey" : "charcoal";
  if (h < 14 || h >= 346) return l > 0.74 ? "pink" : "red"; if (h < 48 && s < 0.5 && l > 0.4 && l < 0.82) return "tan"; if (h < 40) return l < 0.42 ? "brown" : l > 0.8 ? "peach" : "orange"; if (h < 68) return l < 0.45 ? "olive" : l > 0.82 ? "cream" : "yellow";
  if (h < 84) return l > 0.78 ? "mint" : "lime"; if (h < 150) return l > 0.78 ? "mint" : "green"; if (h < 178) return "teal"; if (h < 205) return l > 0.78 ? "sky" : "cyan"; if (h < 250) return l < 0.3 ? "navy" : "blue";
  if (h < 290) return l > 0.76 ? "lavender" : "purple"; return l > 0.76 ? "pink" : "magenta";
}
/** One short, unique colour word per colour in a set ("light blue" and "dark blue" if two blues). */
export function colorNames(colors) {
  const base = colors.map(baseName), out = base.slice();
  for (const nm of new Set(base)) {
    const at = base.map((b, i) => (b === nm ? i : -1)).filter((i) => i >= 0); if (at.length < 2) continue;
    at.sort((a, b) => hsl(colors[a])[2] - hsl(colors[b])[2]); at.forEach((i, k) => { out[i] = at.length === 2 ? (k === 0 ? `dark ${nm}` : `light ${nm}`) : k === 0 ? `dark ${nm}` : k === at.length - 1 ? `light ${nm}` : `${nm} ${k + 1}`; });
  }
  return out;
}

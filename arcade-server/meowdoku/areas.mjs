// The Meowdoku world: 200 levels in 20 cat-themed areas of 10 levels each, shown as a candy-style map.
// sky/ground/accent colour the map scenery and the level nodes; bgA/bgB tint the play screen while you are in that area.
export const LEVEL_COUNT = 200;
export const AREA_SIZE = 10;
export const AREAS = [
  { id: "whisker-village", name: "Whisker Village", blurb: "Cosy cottages, cobblestone paths, flower gardens and cats lounging on windowsills.", sky: "#bfe3ff", ground: "#a8dc7a", accent: "#ff8f6b", bgA: "#2b4a6f", bgB: "#10213a" },
  { id: "yarn-meadows", name: "Yarn Meadows", blurb: "Rolling green hills dotted with giant yarn balls, knitted bridges and wildflowers.", sky: "#cfe8ff", ground: "#8fd06a", accent: "#ff7ab5", bgA: "#2e5a3a", bgB: "#10261a" },
  { id: "milkshake-falls", name: "Milkshake Falls", blurb: "Pastel waterfalls of milk, creamy rivers, strawberry cliffs and fluffy clouds.", sky: "#ffd7ea", ground: "#fff0f6", accent: "#ff6fa5", bgA: "#5a2f55", bgB: "#241028" },
  { id: "catnip-forest", name: "Catnip Forest", blurb: "An enchanted wood of giant catnip, glowing mushrooms and hollow trees.", sky: "#1f4a3a", ground: "#2f7d52", accent: "#b57bff", bgA: "#123d2e", bgB: "#06150f" },
  { id: "biscuit-bakery", name: "Biscuit Bakery", blurb: "Gingerbread buildings, towering pastries and little cats kneading dough.", sky: "#ffe3b5", ground: "#e8b373", accent: "#c4743a", bgA: "#5c3a1c", bgB: "#241408" },
  { id: "sardine-shores", name: "Sardine Shores", blurb: "Turquoise water, sandy beaches, fishing boats and fish-shaped islands.", sky: "#8fe0ff", ground: "#ffe6a8", accent: "#1fb5c9", bgA: "#0d5a7a", bgB: "#06202e" },
  { id: "cardboard-canyon", name: "Cardboard Canyon", blurb: "A desert of cardboard boxes, paper tunnels and towering scratching posts.", sky: "#f3d9a8", ground: "#c9975a", accent: "#8a5a2b", bgA: "#5a3d1d", bgB: "#221609" },
  { id: "purrmafrost-peaks", name: "Purrmafrost Peaks", blurb: "Snowy mountains, wooden cabins, frozen lakes and cats in knitted scarves.", sky: "#cfe8ff", ground: "#f4faff", accent: "#4a90e2", bgA: "#2a4a7a", bgB: "#0c1830" },
  { id: "midnight-rooftops", name: "Midnight Rooftops", blurb: "A glowing night city of lanterns, rooftop gardens and a sky full of stars.", sky: "#0b1038", ground: "#2a2060", accent: "#ffd23f", bgA: "#1a1650", bgB: "#05061a" },
  { id: "royal-catdom", name: "The Royal Catdom", blurb: "Golden castles, velvet cushions, grand fountains and cats in tiny crowns.", sky: "#7a3fd0", ground: "#f5d36a", accent: "#ffd23f", bgA: "#4a1f8a", bgB: "#150a2e" },
  { id: "pumpkin-patch", name: "Pumpkin Patch Lane", blurb: "Hay bales, lopsided scarecrows and pumpkins the size of cottages.", sky: "#ffcf8a", ground: "#e09a3a", accent: "#ff7a1a", bgA: "#6a3a12", bgB: "#241006" },
  { id: "cloud-heights", name: "Cloud Kitty Heights", blurb: "Fluffy islands in the sky, rainbow bridges and cats napping on cumulus.", sky: "#b5e0ff", ground: "#ffffff", accent: "#7ab8ff", bgA: "#3a6aa8", bgB: "#14284a" },
  { id: "mouse-metropolis", name: "Mouse Hole Metropolis", blurb: "A tiny bustling city of cheese shops, thimble taxis and very small doors.", sky: "#ffe6a8", ground: "#d8b878", accent: "#e8a020", bgA: "#6a4a1a", bgB: "#241808" },
  { id: "blossom-temple", name: "Blossom Temple Gardens", blurb: "Cherry trees, stone lanterns, koi ponds and quiet red bridges.", sky: "#ffd6e6", ground: "#9ed89a", accent: "#ff6fa5", bgA: "#6a2a4a", bgB: "#250c1c" },
  { id: "fish-bazaar", name: "Fishmarket Bazaar", blurb: "Striped awnings, silver piles of sardines and merchants shouting prices.", sky: "#9ad8ff", ground: "#e8c9a0", accent: "#e5484d", bgA: "#1d5a8a", bgB: "#0a2036" },
  { id: "hairball-manor", name: "Haunted Hairball Manor", blurb: "A creaky mansion of friendly ghosts, cobwebs and suspiciously loud hairballs.", sky: "#3a2a5a", ground: "#5a4a7a", accent: "#9aff7a", bgA: "#2a1a4a", bgB: "#0c0618" },
  { id: "candy-cove", name: "Candy Cane Cove", blurb: "Peppermint harbors, gumdrop hills and gingerbread lighthouses.", sky: "#ffd0dc", ground: "#ffffff", accent: "#e5352f", bgA: "#7a2a3a", bgB: "#2a0c14" },
  { id: "neon-arcade", name: "Neon Alley Arcade", blurb: "Glowing signs, pixel cabinets and a high score nobody can beat.", sky: "#1a0a3a", ground: "#2a1a5a", accent: "#00e5ff", bgA: "#2a0a5a", bgB: "#080214" },
  { id: "dino-dunes", name: "Purrassic Dunes", blurb: "Fossil beds, giant ferns, and cats riding very patient dinosaurs.", sky: "#ffe0a0", ground: "#d4a860", accent: "#4a9a3a", bgA: "#5a4a1a", bgB: "#1e1808" },
  { id: "cosmic-catnap", name: "Cosmic Catnap", blurb: "Drifting planets, comet trails and a very large, very sleepy moon.", sky: "#0a0830", ground: "#3a2a7a", accent: "#ff9fd0", bgA: "#1a0a4a", bgB: "#04020e" },
];
export const areaIndex = (level) => Math.min(AREAS.length - 1, Math.max(0, Math.floor((level - 1) / AREA_SIZE)));
export const areaOf = (level) => AREAS[areaIndex(level)];
/** Level inside its area, 1..10. The 10th is the area finale. */
export const levelInArea = (level) => ((level - 1) % AREA_SIZE) + 1;
export const isFinale = (level) => level % AREA_SIZE === 0;
/** True when finishing `level` carries the player into a new area. */
export const entersNewArea = (level) => level < LEVEL_COUNT && isFinale(level);

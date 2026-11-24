// The Meowdoku world: 100 levels in 10 cat-themed areas of 10 levels each, shown as a candy-style map.
// sky/ground/accent colour the map scenery and the level nodes; bgA/bgB tint the play screen while you are in that area.
export const LEVEL_COUNT = 100;
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
];
export const areaIndex = (level) => Math.min(AREAS.length - 1, Math.max(0, Math.floor((level - 1) / AREA_SIZE)));
export const areaOf = (level) => AREAS[areaIndex(level)];
/** Level inside its area, 1..10. The 10th is the area finale. */
export const levelInArea = (level) => ((level - 1) % AREA_SIZE) + 1;
export const isFinale = (level) => level % AREA_SIZE === 0;
/** True when finishing `level` carries the player into a new area. */
export const entersNewArea = (level) => level < LEVEL_COUNT && isFinale(level);

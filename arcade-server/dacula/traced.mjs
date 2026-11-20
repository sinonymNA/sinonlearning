// DACULA DASH - board geography, HAND-TRACED from two user-supplied Apple Maps reference screenshots.
//
// HONESTY NOTES (read before trusting any number here)
//  * The build environment could not reach OpenStreetMap/Overpass/Gwinnett GIS (all hosts refused), so this is NOT surveyed data.
//    It is an approximate hand trace of roads, parks and landmarks visible in the reference screenshots. Relative placement and
//    connectivity are faithful to what is visible; exact positions are good to roughly +/-40 m and some road names are unknown.
//  * Run `node scripts/dacula-geo-import.mjs` (with network access) to replace this file's data with real OSM geometry in the
//    same schema. The game reads only the schema below, so nothing else changes.
//  * Coordinates: local planar METRES, x = east, y = SOUTH (screen-style), origin at the north-west corner of the traced area.
//    Scale was calibrated from the Dacula Falcons Stadium track (about 1 m per screenshot pixel).
//  * `inferred: true` marks connections that are plausible but NOT visible in the references (kept few and flagged).
//  * Connectivity is explicit: roads connect ONLY where they share a named junction id, never because two lines happen to cross.
export const SOURCE = {
  kind: "hand-traced",
  provenance: "Two Apple Maps reference screenshots supplied by the game owner (2025). Not survey data. Apple Maps data is not redistributed: only a coarse hand trace is stored.",
  accuracy: "approximate (about +/-40 m); some names unknown; Broad Street, Fence Rd, Auburn Ave, Harbins Rd and Winder Hwy lie outside the traced area",
  replaceWith: "node scripts/dacula-geo-import.mjs (OpenStreetMap via Overpass, ODbL)",
  attribution: "Hand trace by the project; final data should carry (c) OpenStreetMap contributors (ODbL) once imported.",
};

export const BOUNDS = { w: 1100, h: 1720 };

/** Named junctions: the only places where roads connect. */
export const JUNCTIONS = {
  DR_N: [40, 60], DR_PK: [560, 760], DR_SA: [700, 985], DR_WIL: [790, 1110], DR_HC: [935, 1535], DR_S: [985, 1700],
  HC_W: [0, 1085], HC_WW: [150, 1135], HC_CAMP: [255, 1208], HC_SA: [525, 1340], HC_WIL: [690, 1412], HC_E: [1100, 1600],
  WW_N: [20, 700], CD_J: [615, 1028], ST_W: [0, 1525], ST_J: [415, 1522], ST_E: [700, 1562], PK_E: [800, 700],
};

/** Playable roads. A vertex is either [x, y] or a junction id. */
export const ROADS = [
  { id: "dacula-rd", name: "Dacula Rd", cls: "primary", pts: ["DR_N", [330, 470], [420, 590], [505, 695], "DR_PK", [610, 830], "DR_SA", "DR_WIL", [860, 1250], [905, 1390], "DR_HC", "DR_S"] },
  { id: "hebron-church-rd", name: "Hebron Church Rd", cls: "secondary", pts: ["HC_W", "HC_WW", "HC_CAMP", [380, 1280], "HC_SA", "HC_WIL", [830, 1500], "DR_HC", "HC_E"] },
  { id: "whisper-way", name: "Whisper Way", cls: "residential", pts: ["WW_N", [55, 880], [100, 1000], "HC_WW"] },
  { id: "wilson-st", name: "Wilson St", cls: "residential", pts: ["HC_WIL", [718, 1290], [748, 1205], "DR_WIL"] },
  { id: "school-access", name: "(school access road)", cls: "residential", pts: ["DR_SA", [660, 1005], "CD_J", [585, 1110], [548, 1230], "HC_SA"], inferred: true },
  { id: "campus-dr", name: "(campus drive)", cls: "service", pts: ["HC_CAMP", [330, 1150], [420, 1085], [520, 1045], "CD_J"], inferred: true },
  { id: "park-drive", name: "(park drive)", cls: "service", pts: ["DR_PK", [650, 725], [740, 705], "PK_E"], inferred: true },
  { id: "connector", name: "(unnamed connector)", cls: "residential", pts: ["HC_SA", [480, 1430], "ST_J"] },
  { id: "stanley-rd", name: "Stanley Rd", cls: "residential", pts: ["ST_W", "ST_J", "ST_E"] },
];

/** Scenery roads (drawn, never playable). */
export const DECOR_ROADS = [
  { name: "Whisper Ct", pts: [[55, 850], [140, 790], [170, 770]] },
  { name: "Freemans Walk Dr", pts: [[120, 300], [200, 330], [300, 380], [330, 470]] },
  { name: "Walking Path Ln", pts: [[200, 330], [260, 250], [340, 230]] },
  { name: "(subdivision street)", pts: [[860, 1150], [960, 1190], [1040, 1230], [1100, 1280]] },
  { name: "(subdivision street)", pts: [[880, 1260], [1000, 1300], [1090, 1340]] },
];

export const AREAS = {
  park: { name: "Dacula Park", poly: [[770, 610], [1010, 600], [1030, 800], [790, 810]] },
  oldeMill: { name: "Olde Mill Park", poly: [[735, 1425], [850, 1400], [870, 1480], [760, 1475]] },
  stadium: { name: "Dacula Falcons Stadium", c: [480, 960], rx: 80, ry: 52, rot: 0.5 },
  school: { name: "Dacula High School campus", rect: [190, 1020, 300, 130] },
  residential: [[0, 120, 330, 780], [700, 1130, 400, 330], [0, 1150, 120, 340]],
};

/** Landmarks / points of interest. `entrance` is derived by snapping to the nearest playable road. */
export const LANDMARKS = [
  { id: "school", name: "Dacula High School", kind: "school", at: [300, 1075], note: "Start and finish. Position inferred as the large campus building beside the stadium; address (123 Broad Street) NOT verified and Broad Street is outside the traced area." },
  { id: "park", name: "Dacula Park", kind: "park", at: [880, 705] },
  { id: "library", name: "Gwinnett County Public Library (Dacula)", short: "Dacula Library", kind: "library", at: [555, 662] },
  { id: "oldemill", name: "Olde Mill Park", kind: "park", at: [792, 1448], note: "Substitute for Little Mulberry Park, which is outside the traced area." },
  { id: "stadium", name: "Dacula Falcons Stadium", short: "Falcons Stadium", kind: "stadium", at: [480, 960] },
  { id: "firestation", name: "Gwinnett County Fire Station #16", short: "Fire Station #16", kind: "fire", at: [672, 872], note: "Substitute for Dacula City Hall, which is outside the traced area." },
  { id: "familysports", name: "Dacula Family Sports", kind: "sports", at: [600, 1110], note: "Substitute for Rabbit Hill Park, which is outside the traced area." },
];

/** The six checkpoints: category -> landmark. (`requested` records what the brief asked for and why it changed.) */
export const CHECKPOINTS = [
  { cat: "geo", landmark: "park", requested: "Dacula Park", status: "as requested" },
  { cat: "history", landmark: "library", requested: "Dacula Public Library", status: "as requested" },
  { cat: "science", landmark: "oldemill", requested: "Little Mulberry Park", status: "substituted (outside traced area)" },
  { cat: "ent", landmark: "stadium", requested: "Dacula High School Stadium", status: "as requested" },
  { cat: "arts", landmark: "firestation", requested: "Dacula City Hall", status: "substituted (outside traced area)" },
  { cat: "sports", landmark: "familysports", requested: "Rabbit Hill Park", status: "substituted (outside traced area)" },
];

export const CATEGORIES = [
  { id: "geo", name: "Geography", color: "#3b82f6", icon: "🌎", shape: "circle" },
  { id: "history", name: "History", color: "#facc15", icon: "📜", shape: "square" },
  { id: "science", name: "Science & Nature", color: "#22c55e", icon: "🧪", shape: "triangle" },
  { id: "ent", name: "Entertainment", color: "#ec4899", icon: "🎬", shape: "diamond" },
  { id: "arts", name: "Arts & Literature", color: "#a855f7", icon: "🎨", shape: "star" },
  { id: "sports", name: "Sports & Leisure", color: "#f97316", icon: "🏅", shape: "hex" },
];
export const CAT_IDS = CATEGORIES.map((c) => c.id);

/** Everything the game needs, in one object (the importer writes the same shape). */
export const BOARD = { source: SOURCE, bounds: BOUNDS, junctions: JUNCTIONS, roads: ROADS, decorRoads: DECOR_ROADS, areas: AREAS, landmarks: LANDMARKS, checkpoints: CHECKPOINTS, categories: CATEGORIES };

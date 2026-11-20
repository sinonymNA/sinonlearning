#!/usr/bin/env node
// Dacula Dash geographic importer (OpenStreetMap via the Overpass API, ODbL).
//   node scripts/dacula-geo-import.mjs                 fetch + process + write arcade-server/dacula/data/board-osm.mjs
//   node scripts/dacula-geo-import.mjs --activate      ...and make it the active board (rewrites arcade-server/dacula/board.mjs)
//   node scripts/dacula-geo-import.mjs --from raw.json process a previously saved Overpass response (no network)
//   options: --bbox S,W,N,E   --spacing 85   --retries 4   --school-lat LAT --school-lon LON
// It NEVER invents data: if the network or a landmark is missing it says so and exits non-zero, leaving the current board untouched.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../arcade-server/dacula");
export const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
// Approximate search window around Dacula, GA. It is deliberately generous; tighten it with --bbox once the real school position is known.
export const DEFAULT_BBOX = [33.965, -83.925, 34.01, -83.865];
const PLAYABLE = new Set(["primary", "secondary", "tertiary", "residential", "unclassified", "living_street", "service", "primary_link", "secondary_link", "tertiary_link"]);
const DECOR = new Set(["footway", "path", "cycleway", "track", "pedestrian", "steps"]);
const CLS = { primary: "primary", primary_link: "primary", secondary: "secondary", secondary_link: "secondary", tertiary: "secondary", tertiary_link: "secondary", residential: "residential", unclassified: "residential", living_street: "residential", service: "service" };

export const overpassQuery = (bbox) => {
  const b = bbox.join(",");
  return `[out:json][timeout:90];(way["highway"](${b});nwr["amenity"~"^(school|library|townhall|fire_station)$"](${b});nwr["leisure"~"^(park|stadium|pitch|sports_centre|track)$"](${b});nwr["name"~"Dacula|Little Mulberry|Rabbit Hill",i](${b}););out geom tags;`;
};

/** Equirectangular projection to local metres around (lat0, lon0): x east, y SOUTH (screen style), good to centimetres over a few km. */
export function makeProjector(lat0, lon0) {
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574;
  return (lat, lon) => [Math.round((lon - lon0) * kx * 10) / 10 + 0, Math.round(-(lat - lat0) * ky * 10) / 10 + 0];   // + 0 turns -0 into 0
}

const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const geomOf = (el, proj) => (el.geometry ? el.geometry.map((g) => proj(g.lat, g.lon)) : el.lat !== undefined ? [proj(el.lat, el.lon)] : el.bounds ? [proj(el.bounds.minlat, el.bounds.minlon), proj(el.bounds.maxlat, el.bounds.maxlon)] : []);
const find = (els, test) => els.find((e) => e.tags && test(e.tags, e));

/**
 * Turn an Overpass JSON response into a Dacula Dash board (same schema as traced.mjs). Pure: no network, no files.
 * Connectivity uses SHARED OSM NODE IDS, so bridges/overpasses (which share no node) stay disconnected.
 * @returns {{ board: object, report: { missing: string[], warnings: string[], roads: number } }}
 */
export function buildBoardFromOverpass(osm, { retrieved = new Date().toISOString().slice(0, 10), bbox = DEFAULT_BBOX, spacing = 85, school } = {}) {
  const els = osm.elements ?? [], report = { missing: [], warnings: [], roads: 0 };
  const schoolEl = find(els, (t) => t.amenity === "school" && /dacula high/i.test(t.name ?? "")) ?? find(els, (t) => /dacula high school/i.test(t.name ?? ""));
  const sg = schoolEl ? geomOf(schoolEl, (a, o) => [o, a]) : null;
  const lat0 = school?.lat ?? (sg ? sg.reduce((s, p) => s + p[1], 0) / sg.length : (bbox[0] + bbox[2]) / 2), lon0 = school?.lon ?? (sg ? sg.reduce((s, p) => s + p[0], 0) / sg.length : (bbox[1] + bbox[3]) / 2);
  const proj = makeProjector(lat0, lon0);
  // ---- roads: split ways at junction nodes (a node used by 2+ ways, or a way end)
  const ways = els.filter((e) => e.type === "way" && e.tags?.highway && e.geometry && e.nodes);
  const use = new Map(); for (const w of ways.filter((w) => PLAYABLE.has(w.tags.highway))) for (const n of w.nodes) use.set(n, (use.get(n) ?? 0) + 1);
  const junctions = {}, roads = [], decor = [];
  for (const w of ways) {
    const pts = w.geometry.map((g) => proj(g.lat, g.lon));
    if (DECOR.has(w.tags.highway)) { decor.push({ name: w.tags.name ?? "(path)", pts }); continue; }
    if (!PLAYABLE.has(w.tags.highway)) continue;
    let piece = [], startId = null;
    w.nodes.forEach((nid, i) => {
      const isJ = i === 0 || i === w.nodes.length - 1 || use.get(nid) > 1;
      if (isJ) {
        const id = `n${nid}`; junctions[id] = pts[i];
        if (startId !== null) { roads.push({ id: `w${w.id}-${roads.length}`, name: w.tags.name ?? "(unnamed road)", cls: CLS[w.tags.highway] ?? "residential", pts: [startId, ...piece, id], osmWay: w.id }); }
        startId = id; piece = [];
      } else piece.push(pts[i]);
    });
  }
  report.roads = roads.length; if (!roads.length) report.warnings.push("no playable roads in the response");
  // ---- landmarks and parks by name/type (a missing one is REPORTED, never invented)
  const want = [
    ["school", "Dacula High School", (t) => /dacula high/i.test(t.name ?? ""), "school"],
    ["park", "Dacula Park", (t) => /^dacula park$/i.test(t.name ?? "") && t.leisure === "park", "park"],
    ["library", "Dacula Library", (t) => t.amenity === "library" && /dacula/i.test(t.name ?? ""), "library"],
    ["littlemulberry", "Little Mulberry Park", (t) => /little mulberry/i.test(t.name ?? ""), "park"],
    ["stadium", "Dacula High School Stadium", (t) => /(stadium|falcon)/i.test(t.name ?? "") && /dacula|falcon/i.test(t.name ?? ""), "stadium"],
    ["citihall", "Dacula City Hall", (t) => t.amenity === "townhall" && /dacula/i.test(t.name ?? ""), "cityhall"],
    ["rabbithill", "Rabbit Hill Park", (t) => /rabbit hill/i.test(t.name ?? ""), "park"],
  ];
  const landmarks = [], areas = { residential: [] };
  for (const [id, label, test, kind] of want) {
    const el = find(els, (t) => test(t)); if (!el) { report.missing.push(label); continue; }
    const g = geomOf(el, proj); if (!g.length) { report.missing.push(label + " (no geometry)"); continue; }
    landmarks.push({ id, name: el.tags.name ?? label, kind, at: centroid(g).map((v) => Math.round(v * 10) / 10), osm: `${el.type}/${el.id}` });
    if (kind === "park" && g.length > 2) areas[id] = { name: el.tags.name ?? label, poly: g };
  }
  const stadium = landmarks.find((l) => l.id === "stadium"); if (stadium) areas.stadium = { name: stadium.name, c: stadium.at, rx: 80, ry: 52, rot: 0 };
  const sch = landmarks.find((l) => l.id === "school"); if (sch) areas.school = { name: "Dacula High School campus", rect: [sch.at[0] - 110, sch.at[1] - 60, 220, 120] };
  areas.park = areas.park ?? areas.littlemulberry ?? { name: "park", poly: [[0, 0], [1, 0], [1, 1]] }; areas.oldeMill = areas.oldeMill ?? areas.rabbithill ?? { name: "park", poly: [[0, 0], [1, 0], [1, 1]] };
  const cats = [["geo", "park"], ["history", "library"], ["science", "littlemulberry"], ["ent", "stadium"], ["arts", "citihall"], ["sports", "rabbithill"]];
  const have = new Set(landmarks.map((l) => l.id));
  const checkpoints = cats.filter(([, lm]) => have.has(lm)).map(([cat, landmark]) => ({ cat, landmark, requested: landmark, status: "as requested (OpenStreetMap)" }));
  if (checkpoints.length < 6) report.warnings.push(`only ${checkpoints.length} of 6 checkpoints found: add the missing landmarks to the bbox or propose substitutes`);
  const all = [...Object.values(junctions), ...decor.flatMap((d) => d.pts)]; const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const minX = Math.min(...xs, 0), minY = Math.min(...ys, 0);
  const shift = ([x, y]) => [Math.round((x - minX + 40) * 10) / 10, Math.round((y - minY + 40) * 10) / 10];     // keep everything positive
  for (const k of Object.keys(junctions)) junctions[k] = shift(junctions[k]);
  for (const r of roads) r.pts = r.pts.map((p) => (typeof p === "string" ? p : shift(p)));
  for (const d of decor) d.pts = d.pts.map(shift);
  for (const l of landmarks) l.at = shift(l.at);
  for (const a of Object.values(areas)) { if (a.poly) a.poly = a.poly.map(shift); if (a.c) a.c = shift(a.c); if (a.rect) { const [x, y] = shift([a.rect[0], a.rect[1]]); a.rect = [x, y, a.rect[2], a.rect[3]]; } }
  const w = Math.ceil(Math.max(...all.map((p) => p[0])) - minX + 80), h = Math.ceil(Math.max(...all.map((p) => p[1])) - minY + 80);
  const board = {
    source: { kind: "osm", provenance: `OpenStreetMap via Overpass API, retrieved ${retrieved}, bbox ${bbox.join(",")}`, accuracy: "as good as OpenStreetMap (typically a few metres)", replaceWith: "re-run scripts/dacula-geo-import.mjs", attribution: "(c) OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright)", retrieved },
    meta: { spacing, snapMax: 220, origin: { lat: lat0, lon: lon0 } },
    bounds: { w, h }, junctions, roads, decorRoads: decor, areas: { ...areas, residential: [] }, landmarks, checkpoints, categories: null,
  };
  return { board, report };
}

const emit = (board, categories) => `// GENERATED by scripts/dacula-geo-import.mjs on ${board.source.retrieved}. DO NOT EDIT BY HAND. ${board.source.attribution}\nconst categories = ${JSON.stringify(categories)};\nexport const BOARD = { ...${JSON.stringify(board)}, categories };\nexport const SOURCE = BOARD.source, BOUNDS = BOARD.bounds, JUNCTIONS = BOARD.junctions, ROADS = BOARD.roads, DECOR_ROADS = BOARD.decorRoads, AREAS = BOARD.areas, LANDMARKS = BOARD.landmarks, CHECKPOINTS = BOARD.checkpoints, CATEGORIES = categories;\nexport const CAT_IDS = categories.map((c) => c.id);\n`;

async function fetchOverpass(query, retries) {
  let lastErr = null;
  for (let attempt = 0; attempt < retries; attempt++) for (const url of ENDPOINTS) {
    try { const r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(query), headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "dacula-dash-importer/1.0" }, signal: AbortSignal.timeout(120000) }); if (r.ok) return await r.json(); lastErr = new Error(`${url} answered ${r.status}`); }
    catch (e) { lastErr = e; }
    await new Promise((res) => setTimeout(res, 2000 * 2 ** attempt));
  }
  throw lastErr ?? new Error("no endpoint reachable");
}

async function main() {
  const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
  const bbox = (arg("bbox", "") ? arg("bbox").split(",").map(Number) : DEFAULT_BBOX), spacing = Number(arg("spacing", 85)), retries = Number(arg("retries", 4));
  const day = new Date().toISOString().slice(0, 10);
  let osm;
  if (arg("from")) osm = JSON.parse(fs.readFileSync(arg("from"), "utf8"));
  else {
    console.log(`Fetching OpenStreetMap data for bbox ${bbox.join(",")} (retries: ${retries})...`);
    try { osm = await fetchOverpass(overpassQuery(bbox), retries); }
    catch (e) { console.error(`\nCould not reach an Overpass server: ${e.message}\nNothing was changed. The game keeps using the current board (${path.join(OUT, "board.mjs")}).\nRetry later, run from a machine with internet access, or save a response manually and use --from raw.json.`); process.exit(2); }
    fs.mkdirSync(path.join(OUT, "data/raw"), { recursive: true }); fs.writeFileSync(path.join(OUT, `data/raw/overpass-${day}.json`), JSON.stringify(osm));
  }
  const school = arg("school-lat") ? { lat: Number(arg("school-lat")), lon: Number(arg("school-lon")) } : undefined;
  const { board, report } = buildBoardFromOverpass(osm, { retrieved: day, bbox, spacing, school });
  const { CATEGORIES } = await import("../arcade-server/dacula/traced.mjs");
  if (report.missing.length) console.warn("Missing landmarks (NOT invented):", report.missing.join(", "));
  for (const w of report.warnings) console.warn("Warning:", w);
  fs.writeFileSync(path.join(OUT, "data/provenance.json"), JSON.stringify({ ...board.source, report, endpoints: ENDPOINTS }, null, 2));
  fs.writeFileSync(path.join(OUT, "data/dacula.geojson"), JSON.stringify({ type: "FeatureCollection", features: [...board.roads.map((r) => ({ type: "Feature", properties: { name: r.name, class: r.cls, osmWay: r.osmWay }, geometry: { type: "LineString", coordinates: r.pts.map((p) => (typeof p === "string" ? board.junctions[p] : p)) } })), ...board.landmarks.map((l) => ({ type: "Feature", properties: { name: l.name, id: l.id }, geometry: { type: "Point", coordinates: l.at } }))] }));
  fs.writeFileSync(path.join(OUT, "data/board-osm.mjs"), emit(board, CATEGORIES));
  console.log(`Wrote board-osm.mjs (${report.roads} road pieces, ${board.landmarks.length} landmarks), provenance.json and dacula.geojson (local metres).`);
  if (process.argv.includes("--activate")) {
    if (board.checkpoints.length < 6) { console.error("Not activating: fewer than six checkpoints were found."); process.exit(3); }
    fs.writeFileSync(path.join(OUT, "board.mjs"), `// ACTIVE board: imported OpenStreetMap data (${day}). Restore the hand-traced board by pointing this at ./traced.mjs.\nexport * from "./data/board-osm.mjs";\n`);
    console.log("Activated. Run `npm run arcade:test` to validate reachability and re-tune with `node scripts/dacula-sim.mjs`.");
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });

// The ACTIVE board data. Everything (graph, engine, client) imports from here.
// Default: the hand-traced board. `node scripts/dacula-geo-import.mjs --activate` rewrites this file to point at imported OSM data.
export * from "./traced.mjs";

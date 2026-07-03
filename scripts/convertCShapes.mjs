/**
 * Convert CShapes 2.0 GeoJSON to the HistoricalFeatureProps schema.
 *
 * Download the source file from:
 *   https://icr.ethz.ch/data/cshapes/
 *   → CShapes 2.0 → GeoJSON download
 *
 * Usage:
 *   node scripts/convertCShapes.mjs
 *
 * Expects:  public/data/historical/cshapes-raw.geojson
 * Produces: public/data/historical/cshapes-2-0.geojson
 */

import { readFileSync, writeFileSync } from "fs";

const STATUS_MAP = {
  1: "independent",
  2: "colonial",
  3: "colonial",
  4: "disputed",
  5: "occupied",
};

const raw = JSON.parse(readFileSync("public/data/historical/cshapes-raw.geojson", "utf8"));

let kept = 0, skipped = 0;
const features = raw.features.flatMap((f) => {
  const p = f.properties;

  const name = p.CNTRY_NAME || p.cntry_name || p.NAME;
  const start = p.GWSDATE || p.gwsdate || p.START;
  const end   = p.GWLDATE || p.gwldate || p.END;
  if (!name || !start || !end) { skipped++; return []; }

  const statusCode = p.STATUS ?? p.status ?? 1;
  const status = STATUS_MAP[statusCode] ?? "independent";

  const fromYear = parseInt(start.slice(0, 4), 10);
  const toYear   = parseInt(end.slice(0, 4),   10);

  kept++;
  return [{
    type: "Feature",
    geometry: f.geometry,
    properties: {
      id:          (name + "_" + fromYear).toLowerCase().replace(/\s+/g, "_"),
      name,
      type:        status === "independent" ? "state" : "territory",
      valid_from:  start,
      valid_to:    end,
      year_from:   fromYear,
      year_to:     toYear >= 9999 ? 9999 : toYear,
      status,
      certainty:   "high",
      capital:     p.CAPNAME || p.capname || undefined,
      source:      "CShapes 2.0 (Weidmann et al., ETH Zurich)",
    },
  }];
});

writeFileSync(
  "public/data/historical/cshapes-2-0.geojson",
  JSON.stringify({ type: "FeatureCollection", features })
);

console.log(`Done: ${kept} features written, ${skipped} skipped.`);

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

// Deterministic color palette — each entity gets a distinct hue from this list.
const PALETTE = [
  "#c0392b", "#2471a3", "#1e8449", "#7d3c98", "#ca6f1e",
  "#148f77", "#c9a227", "#943126", "#1a5276", "#1d6a39",
  "#6c3483", "#d35400", "#0e6655", "#784212", "#c0174d",
  "#1f618d", "#28b463", "#e74c3c", "#2e86c1", "#a93226",
];

function entityColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (((h << 5) - h) + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
}

// CShapes 2.0 date format: "DD.MM.YYYY HH:MM:SS" → "YYYY-MM-DD"
function parseDate(s) {
  if (!s) return null;
  const datePart = s.split(" ")[0];
  const parts = datePart.split(".");
  if (parts.length < 3) return null;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
}

const raw = JSON.parse(readFileSync("public/data/historical/cshapes-raw.geojson", "utf8"));

let kept = 0, skipped = 0;
const features = raw.features.flatMap((f) => {
  const p = f.properties;

  const name = p.cntry_name || p.CNTRY_NAME;
  const fromYear = p.gwsyear ?? p.GWSYEAR;
  const toYear   = p.gweyear ?? p.GWEYEAR;

  if (!name || !fromYear) { skipped++; return []; }

  const validFrom = parseDate(p.gwsdate || p.GWSDATE) ?? `${fromYear}-01-01`;
  const validTo   = parseDate(p.gwedate || p.GWEDATE) ?? `${toYear}-12-31`;

  const id = (name + "_" + fromYear)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  kept++;
  return [{
    type: "Feature",
    geometry: f.geometry,
    properties: {
      id,
      name,
      type:       "state",
      valid_from: validFrom,
      valid_to:   validTo,
      year_from:  fromYear,
      year_to:    toYear,
      status:     "independent",
      certainty:  "high",
      capital:    p.capname || p.CAPNAME || undefined,
      color:      entityColor(name),
      source:     "CShapes 2.0 (Weidmann et al., ETH Zurich)",
    },
  }];
});

writeFileSync(
  "public/data/historical/cshapes-2-0.geojson",
  JSON.stringify({ type: "FeatureCollection", features })
);

console.log(`Done: ${kept} features written, ${skipped} skipped.`);

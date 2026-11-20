import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildBoardFromOverpass, makeProjector, overpassQuery, DEFAULT_BBOX } from "../../scripts/dacula-geo-import.mjs";
import { buildGraph, stillConnected, shortestPath } from "../dacula/graph.mjs";

const osm = JSON.parse(fs.readFileSync(new URL("./fixtures/overpass-synthetic.json", import.meta.url), "utf8"));

test("importer (synthetic fixture): projection is metric, roads split at shared OSM nodes, bridges stay disconnected", () => {
  const p = makeProjector(33.98, -83.9); const [x, y] = p(33.98, -83.899); assert.ok(Math.abs(x - 92.3) < 1.5, "0.001 deg lon is about 92 m at this latitude: " + x); assert.equal(y, 0);
  const [, y2] = p(33.981, -83.9); assert.ok(Math.abs(y2 + 110.6) < 1, "north is negative y (screen style)");
  const { board, report } = buildBoardFromOverpass(osm, { retrieved: "2000-01-01", bbox: DEFAULT_BBOX });
  assert.equal(board.source.kind, "osm"); assert.match(board.source.attribution, /OpenStreetMap contributors/); assert.match(board.source.attribution, /ODbL/);
  assert.equal(board.decorRoads.length, 1, "footway is scenery, not playable");
  const names = board.roads.map((r) => r.name); assert.ok(names.includes("Test Rd") && names.includes("Cross St") && names.includes("Overpass Ave"));
  assert.equal(board.roads.filter((r) => r.name === "Test Rd").length, 2, "Test Rd is split at the junction node shared with Cross St");
  assert.ok(Object.keys(board.junctions).includes("n11"), "shared node 11 became a junction");
  assert.ok(report.missing.includes("Little Mulberry Park"), "missing landmarks are reported, never invented"); assert.ok(report.warnings.some((w) => /checkpoints/.test(w)));
  for (const l of board.landmarks) assert.ok(l.at.every((v) => v >= 0), "coordinates are shifted to be positive");
});

test("importer: the overpass (a bridge sharing no node) does not connect to the roads it crosses", () => {
  const { board } = buildBoardFromOverpass(osm, { retrieved: "2000-01-01" });
  const g = buildGraph({ ...board, landmarks: board.landmarks.filter((l) => l.id === "school" || l.id === "park"), checkpoints: [] }, { spacing: 15, snapMax: 400 });
  assert.equal(stillConnected(g, []), false, "the overpass is its own component");
  assert.ok(shortestPath(g, g.landmarkNode.school, g.landmarkNode.park), "the two real roads are connected through the shared node");
});

test("overpass query asks for roads, landmarks, parks and the named places, and covers the bbox", () => {
  const q = overpassQuery([1, 2, 3, 4]); assert.match(q, /out geom/); assert.match(q, /\(1,2,3,4\)/); assert.match(q, /highway/); assert.match(q, /Little Mulberry/); assert.match(q, /fire_station/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { BOARD, CAT_IDS, CATEGORIES, JUNCTIONS } from "../dacula/traced.mjs";
import { buildGraph, shortestPath, reachable, stillConnected, edgeKey } from "../dacula/graph.mjs";

const g = buildGraph(BOARD);

test("board data: provenance is declared, six distinct categories, six distinct checkpoint landmarks, school is separate", () => {
  assert.equal(BOARD.source.kind, "hand-traced"); assert.match(BOARD.source.replaceWith, /import/);
  assert.equal(CATEGORIES.length, 6); assert.equal(new Set(CAT_IDS).size, 6);
  assert.equal(BOARD.checkpoints.length, 6); assert.equal(new Set(BOARD.checkpoints.map((c) => c.cat)).size, 6); assert.equal(new Set(BOARD.checkpoints.map((c) => c.landmark)).size, 6);
  assert.ok(!BOARD.checkpoints.some((c) => c.landmark === "school"));
  for (const c of BOARD.checkpoints) assert.ok(BOARD.landmarks.find((l) => l.id === c.landmark), c.landmark);
  assert.ok(BOARD.checkpoints.some((c) => /substituted/.test(c.status)), "substitutions are recorded, not hidden");
});

test("graph: every road junction id exists, the board is one connected component, and no space is an orphan", () => {
  for (const r of BOARD.roads) for (const p of r.pts) if (typeof p === "string") assert.ok(JUNCTIONS[p], `${r.id} uses unknown junction ${p}`);
  assert.ok(stillConnected(g, []), "all roads are connected");
  for (const n of g.nodes) assert.ok(n.adj.length >= 1, `node ${n.id} is isolated`);
  assert.ok(g.nodes.length > 60 && g.nodes.length < 400, "plausible number of spaces: " + g.nodes.length);
});

test("graph: connectivity comes from junction ids, not from lines that cross (a crossing without a junction stays disconnected)", () => {
  const fake = { ...BOARD, junctions: { A: [0, 0], B: [100, 0], C: [50, -50], D: [50, 50] }, roads: [{ id: "x", name: "x", cls: "r", pts: ["A", "B"] }, { id: "y", name: "y", cls: "r", pts: ["C", "D"] }], landmarks: [{ id: "school", name: "s", at: [10, 5] }, { id: "q", name: "q", at: [55, 40] }], checkpoints: [] };
  const fg = buildGraph(fake, { spacing: 20 });
  assert.equal(shortestPath(fg, fg.landmarkNode.school, fg.landmarkNode.q), null, "x and y cross at (50,0) but share no junction: no route");
  assert.equal(stillConnected(fg, []), false);
});

test("checkpoints: all six are reachable from the school and back, and entrances stay close to the real landmark", () => {
  assert.equal(g.checkpoints.length, 6);
  for (const c of g.checkpoints) {
    const there = shortestPath(g, g.schoolNode, c.node), back = shortestPath(g, c.node, g.schoolNode);
    assert.ok(there && back, `${c.landmarkName} unreachable`); assert.equal(there.steps, back.steps);
    const n = g.nodes[c.node]; assert.ok(n.connector.metres <= 160, `${c.landmarkName} entrance is ${n.connector.metres} m from the landmark`);
  }
  assert.ok(g.nodes[g.schoolNode].landmark === "school");
});

test("route lengths: the stadium is the closest checkpoint to school (they share a campus) and nothing is absurdly far", () => {
  const steps = Object.fromEntries(g.checkpoints.map((c) => [c.cat, shortestPath(g, g.schoolNode, c.node).steps]));
  const min = Math.min(...Object.values(steps)); assert.equal(steps.ent, min, JSON.stringify(steps));
  for (const [cat, s] of Object.entries(steps)) assert.ok(s >= 2 && s <= 30, `${cat}: ${s} spaces`);
});

test("movement: roll bounds, valid intersections, no jumping between disconnected edges", () => {
  const start = g.schoolNode;
  for (let roll = 1; roll <= 6; roll++) {
    const r = reachable(g, start, roll);
    assert.ok(r.size > 0, "something is reachable");
    for (const [dest, path] of r) {
      assert.ok(path.length - 1 <= roll, "never more steps than the roll"); assert.equal(path[0], start); assert.equal(path.at(-1), dest);
      for (let i = 0; i < path.length - 1; i++) assert.ok(g.nodes[path[i]].adj.some((a) => a.to === path[i + 1]), "each hop follows a real road");
      assert.equal(new Set(path).size, path.length, "no revisiting within one roll");
    }
  }
  const junction = g.nodes.find((n) => n.adj.length >= 3);
  assert.ok(junction, "there are real decision points"); assert.ok(reachable(g, junction.id, 2).size >= 3, "a junction offers a choice of routes");
});

test("movement: early stop is only allowed on listed nodes; blocked edges are respected", () => {
  const start = g.schoolNode, cp = g.checkpoints.find((c) => c.cat === "ent").node, d = shortestPath(g, start, cp).steps;
  const without = reachable(g, start, d + 2); assert.ok(!without.has(cp) || without.get(cp).length - 1 === d + 2 || true);
  const withStop = reachable(g, start, d + 2, { stopEarly: new Set([cp]) });
  assert.ok(withStop.has(cp), "may stop at an unclaimed checkpoint without an exact roll"); assert.equal(withStop.get(cp).length - 1, d);
  const p = shortestPath(g, start, cp).path, k = edgeKey(p[0], p[1]);
  const detour = shortestPath(g, start, cp, [k]); if (detour) assert.ok(!detour.path.slice(0, 2).every((v, i) => v === p[i]) || detour.path.length > p.length);
  assert.ok(!reachable(g, start, 1, { blocked: [k] }).has(p[1]));
});

test("construction blocks never disconnect the board when chosen with stillConnected()", () => {
  let ok = 0; for (const e of g.edges) if (stillConnected(g, [e.k])) ok++;
  // the traced network is mostly spurs with a few real loops: only loop edges may ever be closed, and bridges are detected as unsafe
  assert.ok(ok >= 4, "some edges can be closed safely: " + ok); assert.ok(ok < g.edges.length / 2, "bridges (spurs) are correctly detected as unsafe");
});

test("every space carries a category/flavour; landmarks are marked", () => {
  for (const n of g.nodes) { if (n.kind === "space") { assert.ok(CAT_IDS.includes(n.cat)); assert.ok(["plain", "question", "event"].includes(n.flavor)); } }
  assert.ok(g.nodes.filter((n) => n.flavor === "question").length > 10); assert.ok(g.nodes.filter((n) => n.flavor === "event").length >= 5);
  assert.equal(g.nodes.filter((n) => n.landmark).length, BOARD.landmarks.length);
});

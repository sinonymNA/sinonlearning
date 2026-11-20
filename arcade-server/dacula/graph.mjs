// Road graph for Dacula Dash. Builds movement SPACES from road polylines and answers reachability / shortest-path questions.
// Pure functions, no I/O. Connectivity comes ONLY from shared junction ids (never from lines that merely cross).
import { CAT_IDS } from "./traced.mjs";

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Closest point on segment ab to p: { pt, t, d }. */
export function projectToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  const pt = [a[0] + dx * t, a[1] + dy * t];
  return { pt, t, d: dist(p, pt) };
}

const hashStr = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/**
 * Build the graph.
 * @param board  traced/imported board (see traced.mjs)
 * @param opts   { spacing: metres between movement spaces, snapMax: metres a landmark may be from its road }
 */
export function buildGraph(board, opts = {}) {
  const spacing = opts.spacing ?? 85, snapMax = opts.snapMax ?? 160;
  const J = board.junctions;
  // 1. resolve each road into concrete vertices: { xy, jid? }
  const roads = board.roads.map((r) => ({ ...r, v: r.pts.map((p) => (typeof p === "string" ? { xy: J[p], jid: p } : { xy: p })) }));
  for (const r of roads) for (const v of r.v) if (!v.xy) throw new Error(`road ${r.id}: unknown junction`);
  // 2. snap each landmark to its nearest playable road and insert an entrance vertex there (a true junction on that road)
  const entrances = new Map();
  for (const lm of board.landmarks) {
    let best = null;
    for (const r of roads) for (let i = 0; i < r.v.length - 1; i++) {
      const q = projectToSegment(lm.at, r.v[i].xy, r.v[i + 1].xy);
      if (!best || q.d < best.d) best = { ...q, road: r, i };
    }
    if (!best || best.d > snapMax) throw new Error(`landmark ${lm.id} is ${best ? Math.round(best.d) : "?"} m from any road (max ${snapMax})`);
    entrances.set(lm.id, best);
  }
  // insert entrance vertices (process per road/segment from the end so indices stay valid)
  const byRoad = new Map();
  for (const [id, e] of entrances) { const a = byRoad.get(e.road.id) ?? []; a.push({ id, ...e }); byRoad.set(e.road.id, a); }
  for (const r of roads) {
    const list = (byRoad.get(r.id) ?? []).sort((a, b) => b.i - a.i || b.t - a.t);
    for (const e of list) {
      const a = r.v[e.i], b = r.v[e.i + 1];
      const nearA = dist(e.pt, a.xy) < 18, nearB = dist(e.pt, b.xy) < 18;
      if (nearA) { a.jid ??= `ent:${e.id}`; a.ent = [...(a.ent ?? []), e.id]; }
      else if (nearB) { b.jid ??= `ent:${e.id}`; b.ent = [...(b.ent ?? []), e.id]; }
      else r.v.splice(e.i + 1, 0, { xy: e.pt, jid: `ent:${e.id}`, ent: [e.id] });
    }
  }
  // 3. create nodes: a node for every junction/entrance vertex, plus evenly spaced spaces between them
  const nodes = [], jnode = new Map(), edges = [];
  const mk = (xy, props) => { const n = { id: nodes.length, x: Math.round(xy[0] * 10) / 10, y: Math.round(xy[1] * 10) / 10, adj: [], ...props }; nodes.push(n); return n; };
  const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const addEdge = (a, b, road, len) => {
    if (a === b) return;
    const k = edgeKey(a, b); if (edges.some((e) => e.k === k)) return;
    edges.push({ k, a, b, road: road.id, name: road.name, cls: road.cls, len, blocked: false });
    nodes[a].adj.push({ to: b, k }); nodes[b].adj.push({ to: a, k });
  };
  for (const r of roads) {
    // consolidate consecutive vertices into "anchor" vertices (junction/entrance/endpoint) with the plain vertices between them
    const anchors = []; r.v.forEach((v, i) => { if (v.jid || i === 0 || i === r.v.length - 1) anchors.push(i); });
    let prev = null;
    anchors.forEach((ai, idx) => {
      const v = r.v[ai];
      let node;
      if (v.jid && jnode.has(v.jid)) node = jnode.get(v.jid);
      else { node = mk(v.xy, { kind: v.jid?.startsWith("ent:") ? "entrance" : v.jid ? "junction" : "end", jid: v.jid ?? null, roads: [r.id] }); if (v.jid) jnode.set(v.jid, node); }
      if (!node.roads.includes(r.id)) node.roads.push(r.id);
      if (v.ent) node.ent = [...(node.ent ?? []), ...v.ent];
      if (prev) {
        // polyline from prev anchor to this anchor
        const pts = r.v.slice(prev.i, ai + 1).map((q) => q.xy);
        const segs = []; let total = 0; for (let i = 0; i < pts.length - 1; i++) { const l = dist(pts[i], pts[i + 1]); segs.push(l); total += l; }
        const n = Math.max(1, Math.round(total / spacing));
        let last = prev.node;
        for (let s = 1; s <= n; s++) {
          let at = (s / n) * total, i = 0; while (i < segs.length - 1 && at > segs[i]) { at -= segs[i]; i++; }
          const xy = s === n ? v.xy : lerp(pts[i], pts[i + 1], segs[i] ? at / segs[i] : 0);
          const cur = s === n ? node : mk(xy, { kind: "space", roads: [r.id] });
          addEdge(last.id, cur.id, r, total / n); last = cur;
        }
      }
      prev = { i: ai, node };
      void idx;
    });
  }
  // 4. board-game flavour for spaces: category-coloured question spaces (every 3rd space) and event spaces (every 5th), deterministic
  for (const n of nodes) {
    if (n.kind !== "space") continue;
    const h = hashStr(`${n.roads[0]}:${Math.round(n.x)}:${Math.round(n.y)}`);
    n.cat = CAT_IDS[h % CAT_IDS.length];
    n.flavor = h % 7 < 3 ? "question" : h % 7 === 3 ? "event" : "plain";
  }
  // 5. checkpoint + school nodes
  const landmarkNode = {};
  for (const lm of board.landmarks) {
    const e = entrances.get(lm.id);
    const node = nodes.find((n) => n.ent?.includes(lm.id));
    if (!node) throw new Error(`landmark ${lm.id}: entrance node missing`);
    landmarkNode[lm.id] = node.id; node.landmark = lm.id; node.kind = node.kind === "space" ? "entrance" : node.kind;
    node.connector = { from: [node.x, node.y], to: lm.at, metres: Math.round(e.d) };
  }
  const checkpoints = board.checkpoints.map((c) => ({ ...c, node: landmarkNode[c.landmark], landmarkName: board.landmarks.find((l) => l.id === c.landmark).name }));
  for (const n of nodes) if (n.landmark) { n.flavor = "landmark"; delete n.cat; }
  return { nodes, edges, checkpoints, schoolNode: landmarkNode.school, landmarkNode, spacing };
}

const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const blockedSet = (g, blocked) => new Set([...(blocked ?? []), ...g.edges.filter((e) => e.blocked).map((e) => e.k)]);

/** Dijkstra by number of spaces (each edge counts 1 step) with metres as the tie-break. Returns { steps, metres, path } or null. */
export function shortestPath(g, from, to, blocked = null) {
  const bl = blockedSet(g, blocked), steps = new Map([[from, 0]]), prev = new Map(), q = [[0, from]];
  while (q.length) {
    q.sort((a, b) => a[0] - b[0]); const [d, u] = q.shift();
    if (u === to) break;
    if (d > steps.get(u)) continue;
    for (const { to: v, k } of g.nodes[u].adj) {
      if (bl.has(k)) continue;
      const nd = d + 1; if (nd < (steps.get(v) ?? Infinity)) { steps.set(v, nd); prev.set(v, u); q.push([nd, v]); }
    }
  }
  if (!steps.has(to)) return null;
  const path = [to]; while (path[0] !== from) path.unshift(prev.get(path[0]));
  let metres = 0; for (let i = 0; i < path.length - 1; i++) metres += g.edges.find((e) => e.k === key(path[i], path[i + 1])).len;
  return { steps: steps.get(to), metres: Math.round(metres), path };
}

/**
 * Every node a player may stop on after rolling `steps`. A move never revisits a node within the same roll (no pacing back and forth),
 * may stop early ONLY on an interesting node (an unclaimed checkpoint, or the school once all wedges are held) and returns for each
 * destination the shortest-first path to it.
 * @param stopEarly set of node ids where stopping before using every step is allowed
 */
export function reachable(g, from, steps, { blocked = null, stopEarly = new Set() } = {}) {
  const bl = blockedSet(g, blocked), out = new Map();
  const walk = (node, left, path) => {
    if (left === 0) { if (!out.has(node) || out.get(node).length > path.length) out.set(node, [...path]); return; }
    let moved = false;
    for (const { to, k } of g.nodes[node].adj) {
      if (bl.has(k) || path.includes(to)) continue;
      moved = true; path.push(to);
      if (stopEarly.has(to) && left - 1 > 0 && (!out.has(to) || out.get(to).length > path.length)) out.set(to, [...path]);
      walk(to, left - 1, path); path.pop();
    }
    if (!moved && path.length > 1) { if (!out.has(node)) out.set(node, [...path]); }        // dead end: you stop where the road ends
  };
  walk(from, steps, [from]);
  out.delete(from);
  return out;
}

/** True when every node can still reach every other with `blocked` removed (used to keep construction events fair). */
export function stillConnected(g, blocked) {
  const bl = blockedSet(g, blocked); const seen = new Set([0]), q = [0];
  while (q.length) { const u = q.pop(); for (const { to, k } of g.nodes[u].adj) if (!bl.has(k) && !seen.has(to)) { seen.add(to); q.push(to); } }
  return seen.size === g.nodes.length;
}

export const edgeKey = key;

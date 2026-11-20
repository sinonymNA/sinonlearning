// Dacula Dash map art. The whole board is drawn ONCE into an offscreen canvas at M metres per logical pixel and then blitted by the camera.
// All art is original and generated in code (no external sprites). Geography comes from the traced/imported board data.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BOARD } from "../../../arcade-server/dacula/board.mjs";
import { buildGraph } from "../../../arcade-server/dacula/graph.mjs";

export const M = 3;                                   // metres per logical pixel of the pre-rendered map
export const GRAPH: any = buildGraph(BOARD as any);
export const MAP_W = Math.ceil(BOARD.bounds.w / M), MAP_H = Math.ceil(BOARD.bounds.h / M);
export const toPx = (x: number, y: number): [number, number] => [x / M, y / M];
export const PLAYER_COLORS = ["#ef476f", "#4d8dff", "#2fbf9b", "#ffb02e", "#8d63ff", "#17b8d0"];
export const CAT_COLORS: Record<string, string> = Object.fromEntries((BOARD.categories as any[]).map((c) => [c.id, c.color]));

const rnd = (i: number, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
type Ctx = CanvasRenderingContext2D;
const R = (g: Ctx, c: string, x: number, y: number, w: number, h: number) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };

/** Stamp a square brush along a polyline: crisp pixel-art roads. */
function stroke(g: Ctx, pts: number[][], w: number, color: string) {
  g.fillStyle = color;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = toPx(pts[i][0], pts[i][1]), [x1, y1] = toPx(pts[i + 1][0], pts[i + 1][1]);
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let s = 0; s <= n; s++) { const t = s / n; g.fillRect(Math.round(x0 + (x1 - x0) * t - w / 2), Math.round(y0 + (y1 - y0) * t - w / 2), w, w); }
  }
}
function dashed(g: Ctx, pts: number[][], color: string, on = 5, off = 4) {
  g.fillStyle = color; let run = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = toPx(pts[i][0], pts[i][1]), [x1, y1] = toPx(pts[i + 1][0], pts[i + 1][1]);
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s <= n; s++, run++) if (run % (on + off) < on) g.fillRect(Math.round(x0 + (x1 - x0) * (s / n)), Math.round(y0 + (y1 - y0) * (s / n)), 1, 1);
  }
}

const jr = (r: any, G: any) => r.pts.map((p: any) => (typeof p === "string" ? (BOARD.junctions as any)[p] : p));
const WIDTH: Record<string, number> = { primary: 8, secondary: 7, residential: 5, service: 4 };

function segDist(px: number, py: number, a: number[], b: number[]) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l2)) : 0;
  return Math.hypot(px - (a[0] + dx * t), py - (a[1] + dy * t));
}
const inPoly = (x: number, y: number, poly: number[][]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };

function house(g: Ctx, x: number, y: number, i: number) {
  const roof = ["#8d4b3a", "#6b5b73", "#a05a3c", "#59687a", "#7a4f4f"][Math.floor(rnd(i, 3) * 5)], wall = ["#d9c9a8", "#c8d3d9", "#e0d2c0", "#cbb79a"][Math.floor(rnd(i, 4) * 4)];
  const w = 6 + Math.floor(rnd(i, 5) * 3), h = 5 + Math.floor(rnd(i, 6) * 2);
  R(g, "rgba(0,0,0,.25)", x + 1, y + 1, w, h); R(g, wall, x, y, w, h); R(g, roof, x, y, w, 3); R(g, "#2a2a3a", x + 1, y + h - 1, 2, 1);
}
function tree(g: Ctx, x: number, y: number, i: number) {
  const s = 3 + Math.floor(rnd(i, 7) * 3), c = ["#2f7d3a", "#3a8f45", "#276a33"][Math.floor(rnd(i, 8) * 3)];
  R(g, "rgba(0,0,0,.22)", x, y + s - 1, s + 1, 2); R(g, c, x, y, s, s); R(g, "rgba(255,255,255,.12)", x, y, s - 1, 1); R(g, "#1f5a2a", x + 1, y + s - 1, s - 1, 1);
}

// ---- landmark sprites -----------------------------------------------------------------------------------------
function school(g: Ctx) {
  const [x, y, w, h] = (BOARD.areas as any).school.rect, [px, py] = toPx(x, y), W = w / M, H = h / M;
  R(g, "#6e6e7a", px - 2, py + H * 0.55, W * 0.8, H * 0.5);                       // parking
  for (let i = 0; i < 12; i++) R(g, "#d8d8e0", px + 2 + i * 6, py + H * 0.62, 1, 5);
  R(g, "rgba(0,0,0,.28)", px + 2, py + 2, W, H * 0.55);
  R(g, "#b9724f", px, py, W, H * 0.5); R(g, "#7a3f33", px, py, W, 4); R(g, "#d9a27a", px, py + 4, W, 1);        // main brick block + roof
  for (let i = 0; i < Math.floor(W / 6); i++) { R(g, "#8fc3ec", px + 3 + i * 6, py + 7, 3, 3); R(g, "#8fc3ec", px + 3 + i * 6, py + 13, 3, 3); }
  R(g, "#e4e0d0", px + W / 2 - 5, py + H * 0.5 - 6, 10, 6); R(g, "#2a2a3a", px + W / 2 - 2, py + H * 0.5 - 4, 4, 4);   // entrance
  R(g, "#9aa0b0", px + W + 3, py + 2, 16, 11); R(g, "#5a6070", px + W + 3, py + 2, 16, 3);                             // gym
  R(g, "#cfd4e0", px + W / 2, py - 9, 1, 9); R(g, "#3b82f6", px + W / 2 + 1, py - 9, 6, 3); R(g, "#fff", px + W / 2 + 1, py - 6, 6, 1);   // flag
}
function stadium(g: Ctx) {
  const s = (BOARD.areas as any).stadium, [cx, cy] = toPx(s.c[0], s.c[1]), rx = s.rx / M, ry = s.ry / M;
  g.save(); g.translate(cx, cy); g.rotate(s.rot);
  const ell = (a: number, b: number, c: string) => { g.fillStyle = c; for (let yy = -b; yy <= b; yy++) { const w = Math.floor(a * Math.sqrt(1 - (yy * yy) / (b * b))); g.fillRect(-w, yy, w * 2, 1); } };
  ell(rx + 4, ry + 4, "rgba(0,0,0,.25)"); ell(rx + 3, ry + 3, "#9aa0b0"); ell(rx, ry, "#b5533c"); ell(rx - 5, ry - 5, "#3f9a4a");
  g.fillStyle = "rgba(255,255,255,.55)"; for (let i = -rx + 8; i < rx - 6; i += 5) g.fillRect(i, -ry + 6, 1, ry * 2 - 12);
  R(g, "#e8e8f0", -3, -3, 7, 7); R(g, "#3b82f6", -2, -2, 5, 5);
  g.restore();
  R(g, "#cfd4e0", cx - rx - 8, cy - ry - 6, 1, 8); R(g, "#cfd4e0", cx + rx + 6, cy + ry - 2, 1, 8);
}
function park(g: Ctx, poly: number[][], seed: number, diamond = true, pond = false) {
  const px = poly.map(([x, y]) => toPx(x, y)); const minX = Math.min(...px.map((p) => p[0])), maxX = Math.max(...px.map((p) => p[0])), minY = Math.min(...px.map((p) => p[1])), maxY = Math.max(...px.map((p) => p[1]));
  for (let y = Math.floor(minY); y < maxY; y++) for (let x = Math.floor(minX); x < maxX; x++) if (inPoly(x, y, px)) R(g, (x + y) % 7 === 0 ? "#52b05a" : "#47a352", x, y, 1, 1);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  if (pond) { for (let yy = -6; yy <= 6; yy++) { const w = Math.floor(11 * Math.sqrt(1 - (yy * yy) / 36)); R(g, "#4e8fd6", cx - w + 6, cy + yy + 4, w * 2, 1); } R(g, "#8fc3ec", cx - 2, cy + 2, 6, 1); }
  if (diamond) { R(g, "#c9a36a", minX + 10, minY + 10, 20, 20); R(g, "#47a352", minX + 14, minY + 14, 12, 12); R(g, "#fff", minX + 10, minY + 10, 20, 1); R(g, "#fff", minX + 10, minY + 10, 1, 20); }
  for (let i = 0; i < 22; i++) { const x = minX + 6 + rnd(i, seed) * (maxX - minX - 12), y = minY + 6 + rnd(i, seed + 1) * (maxY - minY - 12); if (inPoly(x, y, px)) tree(g, x, y, i + seed); }
  stroke(g, [[cx * M - 60, cy * M + 20], [cx * M, cy * M - 10], [cx * M + 60, cy * M + 30]], 2, "#d9c29a");
}
function building(g: Ctx, at: number[], w: number, h: number, wall: string, roof: string, sign?: string) {
  const [x, y] = toPx(at[0], at[1]);
  R(g, "rgba(0,0,0,.28)", x - w / 2 + 2, y - h / 2 + 2, w, h); R(g, wall, x - w / 2, y - h / 2, w, h); R(g, roof, x - w / 2, y - h / 2, w, 3);
  for (let i = 0; i < Math.floor(w / 5); i++) R(g, "#8fc3ec", x - w / 2 + 2 + i * 5, y - h / 2 + 5, 3, 2);
  R(g, "#2a2a3a", x - 2, y + h / 2 - 3, 4, 3); if (sign) R(g, sign, x - w / 2 + 1, y - h / 2 + 3, w - 2, 1);
}

export function buildMap(): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = MAP_W; cv.height = MAP_H; const g = cv.getContext("2d")!; g.imageSmoothingEnabled = false;
  const A = BOARD.areas as any;
  // grass
  for (let y = 0; y < MAP_H; y += 2) for (let x = 0; x < MAP_W; x += 2) { const r = rnd(x * 7 + y * 13); R(g, r < 0.16 ? "#3a9a47" : r < 0.3 ? "#439f4e" : "#3f9c4b", x, y, 2, 2); }
  // road polylines (for keeping scenery off the road)
  const all = [...(BOARD.roads as any[]).map((r) => jr(r, GRAPH)), ...(BOARD.decorRoads as any[]).map((r) => r.pts)];
  const nearRoad = (x: number, y: number, d: number) => all.some((pts) => pts.some((p: number[], i: number) => i < pts.length - 1 && segDist(x, y, p, pts[i + 1]) < d));
  const sch = A.school.rect, inSchool = (x: number, y: number) => x > sch[0] - 30 && x < sch[0] + sch[2] + 80 && y > sch[1] - 40 && y < sch[1] + sch[3] + 60;
  const inStadium = (x: number, y: number) => Math.hypot(x - A.stadium.c[0], y - A.stadium.c[1]) < 130;
  const landmarks = (BOARD.landmarks as any[]);
  const nearLandmark = (x: number, y: number) => landmarks.some((l) => Math.hypot(x - l.at[0], y - l.at[1]) < 60);
  // parks first
  park(g, A.park.poly, 3, true, false); park(g, A.oldeMill.poly, 9, false, true);
  // houses + trees
  let n = 0;
  for (const [rx, ry, rw, rh] of A.residential) for (let y = ry; y < ry + rh; y += 30) for (let x = rx; x < rx + rw; x += 30) {
    const jx = x + rnd(n, 1) * 12, jy = y + rnd(n, 2) * 12; n++;
    if (nearRoad(jx, jy, 26) || nearRoad(jx + 18, jy + 15, 22) || inSchool(jx, jy) || inStadium(jx, jy) || nearLandmark(jx, jy) || inPoly(jx, jy, A.park.poly) || inPoly(jx, jy, A.oldeMill.poly)) continue;
    if (rnd(n, 3) < 0.7) { const [px, py] = toPx(jx, jy); house(g, px, py, n); } else { const [px, py] = toPx(jx, jy); tree(g, px, py, n); }
  }
  for (let i = 0; i < 260; i++) { const x = rnd(i, 21) * BOARD.bounds.w, y = rnd(i, 22) * BOARD.bounds.h; if (nearRoad(x, y, 30) || inSchool(x, y) || inStadium(x, y) || nearLandmark(x, y) || inPoly(x, y, A.park.poly) || inPoly(x, y, A.oldeMill.poly)) continue; const [px, py] = toPx(x, y); tree(g, px, py, i); }
  // decorative roads, then playable roads (sidewalk -> asphalt -> markings)
  for (const r of BOARD.decorRoads as any[]) { stroke(g, r.pts, 5, "#a8a8b4"); stroke(g, r.pts, 3, "#4a4f5e"); }
  for (const r of BOARD.roads as any[]) { const w = WIDTH[r.cls] ?? 5, pts = jr(r, GRAPH); stroke(g, pts, w + 2, "#b4b4c0"); }
  for (const r of BOARD.roads as any[]) { const w = WIDTH[r.cls] ?? 5, pts = jr(r, GRAPH); stroke(g, pts, w, "#3a3f50"); if (r.cls === "primary" || r.cls === "secondary") dashed(g, pts, "#f2c94c", 6, 5); else if (r.cls === "residential") dashed(g, pts, "rgba(255,255,255,.45)", 3, 6); }
  // campus + stadium + landmarks
  school(g); stadium(g);
  const L: Record<string, any> = Object.fromEntries(landmarks.map((l) => [l.id, l]));
  building(g, L.library.at, 22, 12, "#c9b08a", "#8d3b3b", "#fff"); building(g, L.firestation.at, 22, 12, "#d94f4f", "#7a2a2a", "#fff");
  building(g, L.familysports.at, 20, 11, "#9aa0b8", "#f97316", "#ffd9a0");
  // a few shops and a church for scenery (unnamed on purpose)
  for (const [x, y, w, h, c] of [[640, 1215, 16, 9, "#c4a484"], [470, 1405, 15, 9, "#b0b8c8"], [770, 1330, 14, 8, "#d0b090"], [395, 1470, 16, 9, "#a0a8b8"], [545, 1285, 15, 10, "#8a94a8"]] as any[]) building(g, [x, y], w, h, c, "#6b6b7b");
  // entrance connectors
  g.fillStyle = "#d9c29a";
  for (const n of GRAPH.nodes) if (n.connector) { const [x0, y0] = toPx(n.connector.from[0], n.connector.from[1]), [x1, y1] = toPx(n.connector.to[0], n.connector.to[1]); const k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); for (let s = 0; s <= k; s += 2) g.fillRect(Math.round(x0 + (x1 - x0) * (s / k)), Math.round(y0 + (y1 - y0) * (s / k)), 2, 2); }
  // subtle vignette at the board edge
  g.fillStyle = "rgba(10,12,30,.35)"; g.fillRect(0, 0, MAP_W, 2); g.fillRect(0, MAP_H - 2, MAP_W, 2); g.fillRect(0, 0, 2, MAP_H); g.fillRect(MAP_W - 2, 0, 2, MAP_H);
  return cv;
}

// ---- dynamic sprites (drawn every frame) ------------------------------------------------------------------------
/** Little original pixel car, 4 facings. (x, y) = centre. */
export function drawCar(g: Ctx, x: number, y: number, color: string, dir: "h" | "v", flip: boolean, bob = 0, big = false) {
  const s = big ? 1 : 1; void s;
  g.save(); g.translate(Math.round(x), Math.round(y + bob)); if (flip) g.scale(dir === "h" ? -1 : 1, dir === "v" ? -1 : 1);
  if (dir === "h") {
    R(g, "rgba(0,0,0,.35)", -5, 2, 11, 3); R(g, "#1a1a2a", -4, 2, 3, 2); R(g, "#1a1a2a", 2, 2, 3, 2); R(g, color, -5, -3, 11, 6); R(g, "rgba(255,255,255,.3)", -5, -3, 11, 1);
    R(g, "#bfe3ff", 0, -3, 3, 4); R(g, "#fff3a0", 5, -2, 1, 1); R(g, "#ff6a6a", -5, -2, 1, 1);
  } else {
    R(g, "rgba(0,0,0,.35)", -3, -4, 7, 11); R(g, "#1a1a2a", -4, -3, 2, 3); R(g, "#1a1a2a", -4, 2, 2, 3); R(g, color, -3, -5, 6, 11); R(g, "rgba(255,255,255,.3)", -3, -5, 1, 11);
    R(g, "#bfe3ff", -3, 0, 6, 3); R(g, "#fff3a0", 2, 6, 1, 1); R(g, "#ff6a6a", -3, -5, 1, 1);
  }
  g.restore();
}
export function drawShape(g: Ctx, shape: string, x: number, y: number, r: number, fill: string, edge = "#14163a") {
  g.save(); g.translate(Math.round(x), Math.round(y)); g.fillStyle = fill; g.strokeStyle = edge; g.lineWidth = 1;
  g.beginPath();
  if (shape === "circle") g.arc(0, 0, r, 0, 7);
  else if (shape === "square") g.rect(-r, -r, r * 2, r * 2);
  else if (shape === "triangle") { g.moveTo(0, -r - 1); g.lineTo(r + 1, r); g.lineTo(-r - 1, r); g.closePath(); }
  else if (shape === "diamond") { g.moveTo(0, -r - 1); g.lineTo(r + 1, 0); g.lineTo(0, r + 1); g.lineTo(-r - 1, 0); g.closePath(); }
  else if (shape === "star") { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.5 : r + 1; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
  else { for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; g.lineTo(Math.cos(a) * (r + 1), Math.sin(a) * (r + 1)); } g.closePath(); }
  g.fill(); g.stroke(); g.restore();
}

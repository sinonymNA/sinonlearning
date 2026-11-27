"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// The Meowdoku world map: 10 cat-themed areas of 10 levels, climbing upward like a candy-style level path. World 1 is at the bottom; the map opens on your current level.
// Every world is filled with scenery that is scattered around the road (never on it), ambient weather, a landmark by the finale, and cats you can tap.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AREAS, AREA_SIZE, LEVEL_COUNT, isFinale } from "../../../arcade-server/meowdoku/index.mjs";
import { makeRng } from "../../../arcade-server/gridiron/rng.mjs";
import { propUrl, decorUrl, tileUrl, starUrl, lockUrl, crownUrl, boltUrl, flagUrl } from "./mapArt";
import { npcCatUrl } from "./sprites";
import { tone } from "../prefs";

const ROW = 88, TOP = 40, BOTTOM = 52, TRACK_H = TOP + (AREA_SIZE - 1) * ROW + BOTTOM, COL_MAX = 560;
const nodeXPct = (area: number, i: number) => 50 + 25 * Math.sin(i * 0.95 + area * 1.9);
const nodeY = (i: number) => TRACK_H - BOTTOM - i * ROW;
type Pt = [number, number];
const PROP_N = Array(20).fill(4);

/** What each world's cats say when you tap them. */
const TALK: string[][] = [
  ["Welcome to Whisker Village!", "These flowers are perfect for napping.", "Psst... swipe to draw a line of X's!"],
  ["Careful, the yarn is rolling!", "I knitted this bridge myself.", "Every colour needs exactly one cat."],
  ["Mmm, strawberry cliffs...", "Don't spill the milk waterfall!", "Cats can't touch. Not even corners."],
  ["Is that mushroom glowing?", "The catnip here is... strong.", "Try a hint if you're stuck. No shame."],
  ["I'm kneading dough. Purrfect.", "Who ate the gingerbread door?", "Sweep saves loads of X-ing."],
  ["Fish-shaped islands! Delicious.", "My boat is shaped like a sardine.", "A Sardine gives you a fish back."],
  ["I live in this box. Rent free.", "Scratch the post. Feel better.", "Boxes everywhere. Heaven."],
  ["Brrr! Anyone have a scarf?", "The lake is frozen. I slipped.", "Expert puzzles are Daily on Sundays."],
  ["Look at all the lanterns!", "The rooftops are my kingdom.", "Chain clean cats for a COMBO."],
  ["All hail the cat king!", "This crown is a bit tight.", "You made it. Meow-velous!"],
  ["That pumpkin is bigger than me.", "Scarecrow? More like scare-CAT.", "Ten by ten is a lot of squares!"],
  ["Don't look down. I'm kidding. Look!", "Napping on a cloud. Perfect.", "Hard puzzles need hard thinking."],
  ["Mind the cheese. It's a trap. Maybe.", "Everything here is mouse-sized!", "Count the squares. Then count again."],
  ["The blossoms smell wonderful.", "Shh, the koi are sleeping.", "Rule one cat out, the rest follow."],
  ["Fresh fish! Cheap fish! Fish!", "I'm just here for the sardines.", "Haggling is a puzzle too."],
  ["Boo! ...Did I scare you?", "That wasn't me. It was a hairball.", "Spooky puzzles. Cosy answers."],
  ["Is that lighthouse made of gingerbread?", "I licked the harbor. Minty.", "Sweet, sticky, solvable."],
  ["INSERT COIN. Just kidding.", "My high score is a secret.", "Glowing grids, glowing cats."],
  ["Is that dinosaur... purring?", "I found a fossil! It's a fishbone.", "Ancient puzzles, modern cats."],
  ["Zzzz... oh. Hello.", "That moon is very comfy.", "You've come so far. Meow-nificent!"],
];
const FX = ["petal", "petal", "bubble", "glow", "crumb", "bubble", "dust", "snow", "glow", "spark", "crumb", "bubble", "crumb", "petal", "bubble", "glow", "snow", "spark", "dust", "glow"];

/** Distance from a point to a polyline. */
function distToPath(x: number, y: number, pts: Pt[]) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), y - (ay + dy * t)));
  }
  return best;
}
/** A smooth road through the level nodes (Catmull-Rom turned into Bezier curves). */
function roadPath(pts: Pt[]) {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}, ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

type Item = { src: string; x: number; y: number; w: number; h: number; flip?: boolean; hero?: boolean };
type Npc = { x: number; y: number; coat: number; lines: string[]; id: string };
/** Scatter scenery around the road for one world. Deterministic per world and width. */
function layoutScene(ai: number, W: number) {
  const colW = Math.min(COL_MAX, W), colL = (W - colW) / 2, ps = W >= 640 ? 3 : 2, rng = makeRng(ai * 977 + 31);
  const pts: Pt[] = Array.from({ length: AREA_SIZE }, (_, i) => [colL + (colW * nodeXPct(ai, i)) / 100, nodeY(i)]);
  const dense: Pt[] = []; for (let i = 0; i < pts.length - 1; i++) for (let t = 0; t < 1; t += 0.1) dense.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]); dense.push(pts[pts.length - 1]);
  const rects: [number, number, number, number][] = pts.map(([x, y]) => [x - 44, y - 62, 88, 112]);   // each level node (with its cat above and stars below)
  const free = (x: number, y: number, w: number, h: number, clear: number) => {
    if (x - w / 2 < 4 || x + w / 2 > W - 4 || y - h < 4 || y > TRACK_H - 4) return false;
    if (distToPath(x, y - h / 2, dense) < clear + Math.min(w, h) / 2) return false;
    return !rects.some(([rx, ry, rw, rh]) => x - w / 2 < rx + rw + 4 && x + w / 2 > rx - 4 && y - h < ry + rh + 4 && y > ry - 4);
  };
  const items: Item[] = [], npcs: Npc[] = [];
  // a landmark by the finale, on whichever side has more room
  const [fx, fy] = pts[AREA_SIZE - 1], hero = propUrl(ai, 0), hs = ps + 2, hw = hero.w * hs, hh = hero.h * hs, side = fx < W / 2 ? 1 : -1, hx = Math.max(hw / 2 + 6, Math.min(W - hw / 2 - 6, fx + side * (hw / 2 + 70)));
  if (free(hx, fy + hh / 2, hw, hh, 24)) { items.push({ src: hero.src, x: hx, y: fy + hh / 2, w: hw, h: hh, hero: true }); rects.push([hx - hw / 2, fy + hh / 2 - hh, hw, hh]); }
  // the cats you can meet, beside the road near levels 3 and 7
  [2, 6].forEach((li, k) => {
    const [x, y] = pts[li], dir = x < W / 2 ? 1 : -1;
    for (const off of [96, 120, 78, -96]) { const cx = x + dir * off, cy = y + 16; if (cx > 34 && cx < W - 34 && free(cx, cy, 52, 48, 40)) { npcs.push({ x: cx, y: cy, coat: (ai + k * 2) % 5, lines: TALK[ai], id: `${ai}-${k}` }); rects.push([cx - 26, cy - 48, 52, 48]); break; } }
  });
  // big props, then small decor, in the gaps
  const big = Math.round((TRACK_H / 95) * (W >= 640 ? 2.4 : 1.15)), small = big * 3 + 6;
  for (let n = 0, tries = 0; n < big && tries < 260; tries++) {
    const p = propUrl(ai, rng.int(PROP_N[ai])), w = p.w * ps, h = p.h * ps, x = rng() * W, y = h + rng() * (TRACK_H - h - 6);
    if (free(x, y, w, h, 30)) { items.push({ src: p.src, x, y, w, h, flip: rng() < 0.5 }); rects.push([x - w / 2, y - h, w, h]); n++; }
  }
  for (let n = 0, tries = 0; n < small && tries < 700; tries++) {
    const p = decorUrl(ai, rng.int(6)), w = p.w * (ps === 3 ? 3 : 2), h = p.h * (ps === 3 ? 3 : 2), x = rng() * W, y = h + rng() * (TRACK_H - h - 6);
    if (free(x, y, w, h, 22)) { items.push({ src: p.src, x, y, w, h, flip: rng() < 0.5 }); rects.push([x - w / 2, y - h, w, h]); n++; }
  }
  items.sort((a, b) => a.y - b.y);
  return { pts, items, npcs, colL, colW };
}

export default function LevelMap({ profile, onPlay, arrived = 0, meUrl }: { profile: any; onPlay: (level: number) => void; arrived?: number; meUrl: string }) {
  const cur = useRef<HTMLButtonElement>(null), wrap = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(390), [talk, setTalk] = useState<{ id: string; text: string } | null>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null), nextLine = useRef(0);
  const frontier = Math.min(profile.level, LEVEL_COUNT), stars: Record<number, number> = profile.stars || {};
  useLayoutEffect(() => { const el = wrap.current; if (!el) return; setW(Math.max(280, Math.round(el.clientWidth))); const ro = new ResizeObserver(() => setW(Math.max(280, Math.round(el.clientWidth)))); ro.observe(el); return () => ro.disconnect(); }, []);
  useEffect(() => { cur.current?.scrollIntoView({ block: "center" }); }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const scenes = useMemo(() => AREAS.map((_: any, ai: number) => layoutScene(ai, W)), [W]);
  const say = (id: string, lines: string[], x: number) => { const text = lines[nextLine.current++ % lines.length]; setTalk({ id, text }); tone(640 + (x % 5) * 40, 0.06, "triangle", 0.1); window.setTimeout(() => tone(820 + (x % 3) * 50, 0.09, "triangle", 0.1), 90); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setTalk(null), 2600); };
  return (
    <div className="mp-scroll">
      <div className="mp" ref={wrap} role="list" aria-label="Meowdoku world map">
        {AREAS.map((a: any, ai: number) => ({ a, ai })).reverse().map(({ a, ai }: { a: any; ai: number }) => {
          const sc = scenes[ai], open = frontier >= ai * AREA_SIZE + 1;
          return (
            <section key={a.id} className={`mp-area ${open ? "" : "far"}`} style={{ ["--sky" as any]: a.sky, ["--ground" as any]: a.ground, ["--accent" as any]: a.accent, ["--tile" as any]: `url(${tileUrl(ai)})` }} aria-label={`${a.name}, levels ${ai * AREA_SIZE + 1} to ${ai * AREA_SIZE + AREA_SIZE}`}>
              <div className="mp-track" style={{ height: TRACK_H }}>
                <div className={`mp-fx fx-${FX[ai]}`} aria-hidden>{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + ai * 11) % 100}%`, top: `${(i * 53 + ai * 7) % 100}%`, ["--d" as any]: `${-((i * 1.7) % 9)}s`, ["--t" as any]: `${7 + ((i * 3) % 7)}s`, ["--s" as any]: 1 + (i % 3) }} />)}</div>
                {sc.items.map((it: Item, k: number) => <img key={k} className={`mp-prop ${it.hero ? "hero" : ""}`} src={it.src} alt="" draggable={false} style={{ left: it.x - it.w / 2, top: it.y - it.h, width: it.w, transform: it.flip ? "scaleX(-1)" : undefined }} />)}
                <svg className="mp-road" width="100%" height={TRACK_H} viewBox={`0 0 ${W} ${TRACK_H}`} aria-hidden><path className="b" d={roadPath(sc.pts)} /><path className="r" d={roadPath(sc.pts)} /><path className="c" d={roadPath(sc.pts)} /></svg>
                {sc.npcs.map((n: Npc) => (
                  <button key={n.id} className={`mp-npc ${talk?.id === n.id ? "talk" : ""}`} style={{ left: n.x, top: n.y }} onClick={() => say(n.id, n.lines, n.x)} aria-label="A friendly cat. Tap to say hi.">
                    <img src={npcCatUrl(n.coat, talk?.id === n.id ? "happy" : "normal")} alt="" draggable={false} />
                    {talk?.id === n.id && <span className="mp-say" role="status">{talk.text}</span>}
                  </button>
                ))}
                {Array.from({ length: AREA_SIZE }, (_, i) => {
                  const level = ai * AREA_SIZE + i + 1, st = stars[level] || 0, locked = level > frontier, here = level === frontier, finale = isFinale(level), [px, py] = sc.pts[i];
                  return (
                    <button key={level} ref={here ? cur : undefined} data-level={level} role="listitem" disabled={locked} aria-label={locked ? `Level ${level}, locked` : `Level ${level}, ${st} of 3 stars${profile.fast?.[level] ? ", speedy" : ""}${here ? ", your next level" : ""}${finale ? ", area finale" : ""}`}
                      className={`mp-node ${locked ? "locked" : st ? "done" : "now"} ${here ? "here" : ""} ${finale ? "finale" : ""}`} style={{ left: px, top: py }} onClick={() => !locked && onPlay(level)}>
                      {here && <img className={`mp-me ${arrived === level ? "arrive" : ""}`} src={meUrl} alt="" draggable={false} />}
                      {finale && !locked && <img className="mp-crown" src={crownUrl()} alt="" draggable={false} />}
                      {i === 4 && <img className="mp-flag" src={flagUrl()} alt="" draggable={false} />}
                      {locked ? <img className="mp-lock" src={lockUrl()} alt="" draggable={false} /> : <b>{level}</b>}
                      {!locked && profile.fast?.[level] && <img className="mp-bolt" src={boltUrl()} alt="" draggable={false} />}
                      {!locked && <span className="mp-stars">{[1, 2, 3].map((k) => <img key={k} src={starUrl(k <= st)} alt="" draggable={false} />)}</span>}
                    </button>
                  );
                })}
              </div>
              <header className="mp-sign"><small>WORLD {ai + 1} · LEVELS {ai * AREA_SIZE + 1}–{ai * AREA_SIZE + AREA_SIZE}</small><h2>{a.name}</h2><p>{a.blurb}</p></header>
            </section>
          );
        })}
      </div>
    </div>
  );
}

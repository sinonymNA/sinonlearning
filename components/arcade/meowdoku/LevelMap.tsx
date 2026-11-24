"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// The Meowdoku world map: 10 cat-themed areas of 10 levels, climbing upward like a candy-style level path. World 1 is at the bottom; the map opens on your current level.
import { useEffect, useRef } from "react";
import { AREAS, AREA_SIZE, LEVEL_COUNT, isFinale } from "../../../arcade-server/meowdoku/index.mjs";
import { propUrl, starUrl, lockUrl, crownUrl } from "./mapArt";
import { catUrl } from "./sprites";

const ROW = 88, TOP = 40, BOTTOM = 52, TRACK_H = TOP + (AREA_SIZE - 1) * ROW + BOTTOM;
const nodeX = (area: number, i: number) => 50 + 25 * Math.sin(i * 0.95 + area * 1.9);
const nodeY = (i: number) => TRACK_H - BOTTOM - i * ROW;

export default function LevelMap({ profile, onPlay }: { profile: any; onPlay: (level: number) => void }) {
  const cur = useRef<HTMLButtonElement>(null);
  const frontier = Math.min(profile.level, LEVEL_COUNT), stars: Record<number, number> = profile.stars || {};
  useEffect(() => { cur.current?.scrollIntoView({ block: "center" }); }, []);
  return (
    <div className="mp-scroll">
      <div className="mp" role="list" aria-label="Meowdoku world map">
        {AREAS.map((a: any, ai: number) => ({ a, ai })).reverse().map(({ a, ai }: { a: any; ai: number }) => {
          const pts = Array.from({ length: AREA_SIZE }, (_, i) => [nodeX(ai, i), nodeY(i)]);
          const open = frontier >= ai * AREA_SIZE + 1;
          return (
            <section key={a.id} className={`mp-area ${open ? "" : "far"}`} style={{ ["--sky" as any]: a.sky, ["--ground" as any]: a.ground, ["--accent" as any]: a.accent }} aria-label={`${a.name}, levels ${ai * AREA_SIZE + 1} to ${ai * AREA_SIZE + AREA_SIZE}`}>
              <div className="mp-track" style={{ height: TRACK_H }}>
                {Array.from({ length: 12 }, (_, j) => { const p = propUrl(ai, j), left = j % 2 === 0, y = ((j + 0.5) / 12) * TRACK_H - p.h; return <img key={j} className="mp-prop" src={p.src} alt="" draggable={false} style={{ top: y, [left ? "left" : "right"]: `${2 + ((j * 5) % 7)}%`, width: `calc(${p.w}px * var(--ps))` }} />; })}
                <svg className="mp-path" viewBox={`0 0 100 ${TRACK_H}`} preserveAspectRatio="none" aria-hidden><polyline points={pts.map(([x, y]) => `${x},${y}`).join(" ")} /></svg>
                {Array.from({ length: AREA_SIZE }, (_, i) => {
                  const level = ai * AREA_SIZE + i + 1, st = stars[level] || 0, locked = level > frontier, here = level === frontier, finale = isFinale(level);
                  return (
                    <button key={level} ref={here ? cur : undefined} data-level={level} role="listitem" disabled={locked} aria-label={locked ? `Level ${level}, locked` : `Level ${level}, ${st} of 3 stars${here ? ", your next level" : ""}${finale ? ", area finale" : ""}`}
                      className={`mp-node ${locked ? "locked" : st ? "done" : "now"} ${here ? "here" : ""} ${finale ? "finale" : ""}`} style={{ left: `${nodeX(ai, i)}%`, top: nodeY(i) }} onClick={() => !locked && onPlay(level)}>
                      {here && <img className="mp-me" src={catUrl("happy")} alt="" draggable={false} />}
                      {finale && !locked && <img className="mp-crown" src={crownUrl()} alt="" draggable={false} />}
                      {locked ? <img className="mp-lock" src={lockUrl()} alt="" draggable={false} /> : <b>{level}</b>}
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

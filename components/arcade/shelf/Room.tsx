"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
// A closet room: the wall and floor behind your shelves, drawn from THEME_LOOK (data in arcade-server/shelf/decor.mjs). Static CSS only: no animation, no images.
import type { CSSProperties } from "react";
import { THEME_LOOK } from "../../../arcade-server/shelf/index.mjs";
import Scene from "./Scene";

const WALL: Record<string, (c: string) => string> = {
  stripes: (c) => `repeating-linear-gradient(90deg, ${c} 0 14px, transparent 14px 32px)`,
  dots: (c) => `radial-gradient(circle, ${c} 0 3.5px, transparent 4.5px) 0 0 / 30px 30px`,
  planks: (c) => `repeating-linear-gradient(90deg, ${c} 0 2px, transparent 2px 46px)`,
  panes: (c) => `linear-gradient(${c} 2px, transparent 2px) 0 0 / 58px 58px, linear-gradient(90deg, ${c} 2px, transparent 2px) 0 0 / 58px 58px`,
  waves: (c) => `radial-gradient(ellipse 18px 8px at 50% 100%, transparent 0 9px, ${c} 10px 12px, transparent 13px) 0 0 / 36px 18px`,
  petals: (c) => `radial-gradient(circle at 25% 30%, ${c} 0 3.5px, transparent 4.5px) 0 0 / 52px 46px, radial-gradient(circle at 70% 70%, ${c} 0 2.5px, transparent 3.5px) 0 0 / 66px 58px`,
  snow: (c) => `radial-gradient(circle at 20% 30%, ${c} 0 3px, transparent 4px) 0 0 / 48px 52px, radial-gradient(circle at 72% 68%, ${c} 0 2px, transparent 3px) 0 0 / 70px 60px, radial-gradient(circle at 45% 50%, ${c} 0 1.4px, transparent 2.4px) 0 0 / 36px 36px`,
  stars: (c) => `radial-gradient(circle at 20% 30%, ${c} 0 1px, transparent 2px) 0 0 / 90px 90px, radial-gradient(circle at 70% 70%, ${c} 0 1.4px, transparent 2.4px) 0 0 / 130px 130px, radial-gradient(circle at 45% 55%, ${c} 0 .8px, transparent 1.8px) 0 0 / 60px 60px`,
  grid: (c) => `linear-gradient(${c} 1px, transparent 1px) 0 0 / 36px 36px, linear-gradient(90deg, ${c} 1px, transparent 1px) 0 0 / 36px 36px`,
  diamonds: (c) => `repeating-linear-gradient(45deg, ${c} 0 2px, transparent 2px 24px), repeating-linear-gradient(-45deg, ${c} 0 2px, transparent 2px 24px)`,
  bricks: (c) => `linear-gradient(${c} 2px, transparent 2px) 0 0 / 64px 24px, linear-gradient(90deg, ${c} 2px, transparent 2px) 0 0 / 64px 48px`,
  none: () => "none",
};
const FLOOR: Record<string, (a: string, b: string) => string> = {
  planks: (a, b) => `repeating-linear-gradient(90deg, rgba(0,0,0,.16) 0 2px, transparent 2px 66px), linear-gradient(${a}, ${b})`,
  tiles: (a, b) => `linear-gradient(rgba(0,0,0,.1) 2px, transparent 2px) 0 0 / 60px 38px, linear-gradient(90deg, rgba(0,0,0,.1) 2px, transparent 2px) 0 0 / 60px 38px, linear-gradient(${a}, ${b})`,
  checker: (a, b) => `conic-gradient(${a} 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0) 0 0 / 64px 64px`,
  sand: (a, b) => `radial-gradient(circle, rgba(0,0,0,.09) 0 1px, transparent 2px) 0 0 / 14px 14px, linear-gradient(${a}, ${b})`,
  grid: (a, b) => `linear-gradient(rgba(0,229,255,.35) 1px, transparent 1px) 0 0 / 100% 22px, linear-gradient(90deg, rgba(0,229,255,.3) 1px, transparent 1px) 0 0 / 40px 100%, linear-gradient(${a}, ${b})`,
  carpet: (a, b) => `radial-gradient(circle, rgba(255,255,255,.12) 0 1.5px, transparent 2.5px) 0 0 / 10px 10px, linear-gradient(${a}, ${b})`,
};
const WINDOWS = new Set(["cozy", "market", "lodge", "library", "kitchen", "barn", "sakura", "salon", "studio", "rooftop", "playroom", "seaside"]);
/** CSS for the wall and floor of a room id ("cozy"...). */
export function roomCss(id: string) {
  const l = (THEME_LOOK as any)[id]; if (!l) return null;
  const wall = [WALL[l.pat[0]](l.pat[1]), `linear-gradient(180deg, ${l.wall[0]}, ${l.wall[1]})`].filter((x) => x !== "none").join(", "), floor = FLOOR[l.fp](l.floor[0], l.floor[1]);
  return { wall, floor, trim: l.trim as string, dark: !!l.dark, glow: l.glow as string | undefined, win: WINDOWS.has(id) };
}
/** The room behind everything. `auto` falls back to the department's own animated scene. */
export default function Room({ id, dept }: { id: string; dept: number }) {
  const css = id === "auto" ? null : roomCss(id);
  if (!css) return <Scene dept={dept} />;
  return (
    <div className={`rm ${css.dark ? "dark" : ""}`} style={{ background: css.wall, ["--trim" as any]: css.trim, ["--glow" as any]: css.glow } as CSSProperties} key={id} aria-hidden>
      {css.glow && <div className="rm-glow" />}
      {css.win && <><i className="rm-win l" /><i className="rm-win r" /></>}
      <div className="rm-floor" style={{ background: css.floor }} />
      <div className="rm-shade" />
    </div>
  );
}

"use client";
/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */
// Pop-up sheets for the home screen: Endless setup, and the power-up picture helper (the shop itself is Closet.tsx).
import { useState } from "react";
import { DIFFS, DIFF_KEYS, SIZES, ENDLESS_PAID_PER_DAY } from "../../../arcade-server/meowdoku/index.mjs";
import { bulbUrl, broomUrl } from "./mapArt";
import { catUrl, fishUrl } from "./sprites";

export const itemIcon = (item: string) => (item === "hint" ? bulbUrl() : item === "sweep" ? broomUrl() : item === "sardine" ? fishUrl() : catUrl("happy"));
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function EndlessSheet({ profile, last, today, onStart, onClose }: { profile: any; last: { n: number; diff: string }; today: string; onStart: (n: number, diff: string) => void; onClose: () => void }) {
  const [n, setN] = useState(last.n), [diff, setDiff] = useState(last.diff);
  const best = profile.endless.best[`${n}-${diff}`], left = profile.endless.day === today ? Math.max(0, ENDLESS_PAID_PER_DAY - profile.endless.today) : ENDLESS_PAID_PER_DAY;
  return (
    <div className="cg-modal" role="dialog" aria-label="Endless setup" onClick={onClose}>
      <div className="cg-card wide sheet" onClick={(e) => e.stopPropagation()}>
        <h2>ENDLESS</h2>
        <p className="mute">A fresh puzzle every time. Pick a size and how hard you want it.</p>
        <div className="sh-label">BOARD SIZE</div>
        <div className="sh-chips" role="group" aria-label="Board size">{SIZES.map((s) => <button key={s} className={`sh-chip ${s === n ? "on" : ""}`} aria-pressed={s === n} onClick={() => setN(s)}>{s}×{s}</button>)}</div>
        <div className="sh-label">DIFFICULTY</div>
        <div className="sh-diffs" role="group" aria-label="Difficulty">
          {DIFF_KEYS.map((k, i) => <button key={k} className={`sh-diff d${i} ${k === diff ? "on" : ""}`} aria-pressed={k === diff} onClick={() => setDiff(k)}><b>{(DIFFS as any)[k].name}</b><span>{(DIFFS as any)[k].text}</span><i aria-label={`${(DIFFS as any)[k].fish} fish`}>{Array.from({ length: (DIFFS as any)[k].fish }, (_, j) => <img key={j} src={fishUrl()} alt="" draggable={false} />)}</i></button>)}
        </div>
        <p className="mute sh-note">{best ? `Your best here: ${mmss(best)}.` : "No time set here yet."} {left > 0 ? `Yarn pays for ${left} more win${left === 1 ? "" : "s"} today.` : "Today's yarn is all earned. Play for the fun!"}</p>
        <div className="cg-row"><button className="cg-btn" onClick={onClose}>BACK</button><button className="cg-btn go big" onClick={() => onStart(n, diff)}>PLAY ▶</button></div>
      </div>
    </div>
  );
}

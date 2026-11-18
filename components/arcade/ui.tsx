"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Avatar from "./Avatar";
import { sfx, usePrefs } from "./prefs";
import { useRemaining } from "./useRoom";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function Timer({ ms, stamp, total, label }: { ms: number | null | undefined; stamp: number; total: number; label?: string }) {
  const left = useRemaining(ms, stamp);
  if (left == null) return null;
  const pct = Math.max(0, Math.min(100, (left / Math.max(1, total)) * 100));
  const secs = Math.ceil(left / 1000);
  return (
    <div role="timer" aria-label={`${label ?? "Time left"}: ${secs} seconds`}>
      <div className="flex items-center justify-between text-sm font-bold"><span>{label ?? "Time"}</span><span className="tabular-nums text-lg">{secs}s</span></div>
      <div className={`ar-timer ${left < 4000 ? "low" : ""}`}><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function BigCountdown({ ms, stamp, tickSound = true }: { ms: number | null | undefined; stamp: number; tickSound?: boolean }) {
  const left = useRemaining(ms, stamp);
  const sec = left == null ? null : Math.ceil(left / 1000);
  const last = useRef<number | null>(null);
  useEffect(() => { if (tickSound && sec !== null && sec !== last.current && sec > 0 && sec <= 3) sfx("tick"); last.current = sec; }, [sec, tickSound]);
  if (sec === null) return null;
  return <div key={sec} className="pop ar-h1 tabular-nums" aria-live="polite">{sec}</div>;
}

export function PlayerChip({ p, size = 40, me }: { p: { nickname: string; avatar?: string; connected?: boolean }; size?: number; me?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${p.connected === false ? "opacity-50" : ""}`}>
      <Avatar id={p.avatar} size={size} /><span className={me ? "underline decoration-4 decoration-[var(--sun)]" : ""}>{p.nickname}</span>
    </span>
  );
}

export function Leaderboard({ rows, meId, limit = 8, title = "Leaderboard", showPoints = false }: { rows: any[]; meId?: string; limit?: number; title?: string; showPoints?: boolean }) {
  const top = rows.slice(0, limit);
  const me = meId ? rows.findIndex((r) => r.id === meId) : -1;
  return (
    <div className="ar-panel">
      <h3 className="mb-2 font-bold">{title}</h3>
      <ol className="grid gap-2">
        {top.map((r, i) => (
          <li key={r.id} className={`lb-row ${r.id === meId ? "me" : ""}`}>
            <span className="w-6 text-center tabular-nums">{i + 1}</span><Avatar id={r.avatar} size={30} />
            <span className="min-w-0 flex-1 truncate">{r.nickname}</span>
            <span className="tabular-nums">{r.total}{showPoints && r.points ? <span className="ml-1 text-xs opacity-70">+{r.points}</span> : null}</span>
          </li>
        ))}
        {me >= limit && <li className="lb-row me"><span className="w-6 text-center">{me + 1}</span><Avatar id={rows[me].avatar} size={30} /><span className="flex-1 truncate">{rows[me].nickname}</span><span>{rows[me].total}</span></li>}
      </ol>
    </div>
  );
}

export function Podium({ rows, valueKey = "total" }: { rows: any[]; valueKey?: string }) {
  const order = [rows[1], rows[0], rows[2]];
  const heights = ["150px", "210px", "110px"], colors = ["#cfd8ff", "#ffd23d", "#f0a36b"], places = [2, 1, 3];
  const { prefs } = usePrefs();
  useEffect(() => {
    if (prefs.calm) return;
    sfx("win");
    const end = Date.now() + 1400;
    (function frame() { confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } }); confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } }); if (Date.now() < end) requestAnimationFrame(frame); })();
  }, [prefs.calm]);
  return (
    <div className="podium" aria-label="Podium">
      {order.map((r, i) => r ? (
        <div key={r.id} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ maxWidth: 170 }}>
          <div className={i === 1 ? "float" : ""}><Avatar id={r.avatar} size={i === 1 ? 92 : 70} /></div>
          <div className="max-w-full truncate font-bold">{r.nickname}</div>
          <div className="step pop" style={{ height: heights[i], background: colors[i], animationDelay: `${(2 - i) * 0.25}s` }}>
            <div className="text-3xl">{places[i]}</div><div className="tabular-nums">{r[valueKey] ?? r.points}</div>
          </div>
        </div>
      ) : <div key={i} style={{ width: "30%" }} />)}
    </div>
  );
}

export function Banner({ children }: { children: React.ReactNode }) { return <div className="ar-banner" role="status">{children}</div>; }

export function ErrorToast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div role="alert" className="shake fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border-[3px] border-[var(--ink)] bg-[var(--coral)] px-5 py-3 font-bold text-white shadow-[0_5px_0_var(--ink)]">{msg}</div>;
}

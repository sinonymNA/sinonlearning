"use client";
// The walking banner (used big in the timer-only screen and compact above the reader) and the pocket lock that stops accidental taps.
import { useRef, useState } from "react";
import type { Snap } from "../../../lib/pacer/walkSession";

export const mmss = (sec: number) => `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, "0")}`;
const HINT = { fast: "Brisk. Talking is possible but singing is not.", slow: "Easy stroll. Let your breathing settle." } as const;

export default function WalkBar({ snap, big, note, onPause, onResume, onSkip, onEnd, onLock }: { snap: Snap; big?: boolean; note?: string | null; onPause: () => void; onResume: () => void; onSkip: () => void; onEnd: () => void; onLock?: () => void }) {
  const p = snap.phase; if (!p) return null;
  const lead = p.lead, kind = p.kind === "done" ? "done" : p.kind, pct = p.total ? Math.round((100 * (p.total - p.remaining)) / p.total) : 0, paused = snap.status === "paused";
  const label = lead ? "GET READY" : kind === "fast" ? "FAST" : kind === "slow" ? "SLOW" : "DONE";
  return (
    <section className={`pw-bar ${big ? "big" : ""} ${lead ? "lead" : kind} ${paused ? "paused" : ""}`} aria-label="Interval walk" role="group">
      <div className="pw-main" aria-live="polite">
        <b className="pw-kind">{label}</b>
        <span className="pw-time" aria-label={lead ? `${p.leadLeft} seconds to start` : `${mmss(p.left)} left in this block`}>{lead ? p.leadLeft : mmss(p.left)}</span>
        <span className="pw-round">{lead ? "Starting soon" : `Round ${p.set} of ${p.sets} · ${mmss(p.remaining)} left`}</span>
      </div>
      {big && !lead && (kind === "fast" || kind === "slow") && <p className="pw-hint">{HINT[kind]}</p>}
      {note && <p className="pw-note">{note}</p>}
      <div className="pw-prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Session progress"><i style={{ width: `${pct}%` }} /></div>
      <div className="pw-ctl">
        <button className="pc-btn round" onClick={paused ? onResume : onPause} aria-label={paused ? "Resume walk" : "Pause walk"}>{paused ? "▶" : "❚❚"}</button>
        <button className="pc-btn round" onClick={onSkip} aria-label="Skip to the next block">⏭</button>
        {onLock && <button className="pc-btn round" onClick={onLock} aria-label="Lock the buttons">🔒</button>}
        <button className="pc-btn" onClick={onEnd} aria-label="End walk">End</button>
      </div>
    </section>
  );
}

/** Covers the screen so a phone in a pocket cannot press things. Hold the button for two seconds to unlock. */
export function PocketLock({ onUnlock }: { onUnlock: () => void }) {
  const [pct, setPct] = useState(0), t0 = useRef(0), raf = useRef(0);
  const stop = () => { cancelAnimationFrame(raf.current); t0.current = 0; setPct(0); };
  const down = () => { t0.current = performance.now(); const step = () => { const p = Math.min(1, (performance.now() - t0.current) / 2000); setPct(p); if (p >= 1) { t0.current = 0; onUnlock(); } else raf.current = requestAnimationFrame(step); }; raf.current = requestAnimationFrame(step); };
  return (
    <div className="pw-lock" role="dialog" aria-label="Buttons are locked">
      <p>Buttons are locked.<br />The walk keeps going.</p>
      <button className="pw-hold" onPointerDown={down} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onUnlock(); }} aria-label="Hold for two seconds to unlock"><i style={{ transform: `scaleX(${pct})` }} /><span>Hold to unlock</span></button>
    </div>
  );
}

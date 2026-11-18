"use client";

import { useCallback, useEffect, useState, createContext, useContext } from "react";

type Prefs = { muted: boolean; calm: boolean };
const KEY = "arcade:prefs";
let audio: AudioContext | null = null;
let current: Prefs = { muted: false, calm: false };

function load(): Prefs {
  try { return { ...current, ...(JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<Prefs>) }; } catch { return current; }
}

/** Tiny WebAudio synth: no audio files, honours the mute toggle. */
export function sfx(name: "pop" | "good" | "bad" | "boom" | "tick" | "whoosh" | "win" | "reveal") {
  if (typeof window === "undefined" || current.muted) return;
  try {
    audio ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const ctx = audio; if (ctx.state === "suspended") void ctx.resume();
    const notes: Record<string, [number, number, OscillatorType][]> = {
      pop: [[520, 0.06, "square"]], good: [[660, 0.08, "triangle"], [880, 0.12, "triangle"]], bad: [[220, 0.15, "sawtooth"], [160, 0.2, "sawtooth"]],
      boom: [[110, 0.1, "sawtooth"], [70, 0.35, "square"]], tick: [[900, 0.03, "square"]], whoosh: [[300, 0.05, "sine"], [600, 0.08, "sine"]],
      win: [[523, 0.1, "triangle"], [659, 0.1, "triangle"], [784, 0.1, "triangle"], [1046, 0.25, "triangle"]], reveal: [[400, 0.08, "square"], [300, 0.08, "square"], [500, 0.2, "triangle"]],
    };
    let t = ctx.currentTime;
    for (const [f, d, type] of notes[name]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.9;
    }
  } catch { /* audio is optional */ }
}

const Ctx = createContext<{ prefs: Prefs; set: (p: Partial<Prefs>) => void }>({ prefs: current, set: () => undefined });
export const usePrefs = () => useContext(Ctx);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(current);
  useEffect(() => { const p = load(); current = p; setPrefs(p); }, []);
  const set = useCallback((p: Partial<Prefs>) => {
    current = { ...current, ...p }; setPrefs(current);
    try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  }, []);
  return <Ctx.Provider value={{ prefs, set }}><div className={prefs.calm ? "calm" : ""}>{children}</div></Ctx.Provider>;
}

export function PrefsButtons() {
  const { prefs, set } = usePrefs();
  return (
    <span className="flex gap-2">
      <button className="ar-btn sm paper" aria-pressed={prefs.muted} onClick={() => set({ muted: !prefs.muted })} title={prefs.muted ? "Sound is off" : "Sound is on"}>{prefs.muted ? "🔇" : "🔊"}<span className="sr-only">Toggle sound</span></button>
      <button className="ar-btn sm paper" aria-pressed={prefs.calm} onClick={() => set({ calm: !prefs.calm })} title="Reduce motion">{prefs.calm ? "🧘" : "🎢"}<span className="sr-only">Reduce motion</span></button>
    </span>
  );
}

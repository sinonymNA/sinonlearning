"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Avatar from "./Avatar";
import { sfx, usePrefs } from "./prefs";
import { RARITIES } from "@/lib/arcadeCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Result = { character: { id: string; name: string; rarity: string; tagline: string }; duplicate?: boolean };
type Stage = "idle" | "shake" | "burst" | "revealed";
const MIN_SHAKE_MS = 1900;
const CONF: Record<string, { n: number; spread: number }> = { common: { n: 0, spread: 0 }, uncommon: { n: 40, spread: 60 }, rare: { n: 90, spread: 80 }, epic: { n: 160, spread: 100 }, legendary: { n: 320, spread: 140 } };

function PackArt({ glow, color = "#ffc233", label = "CHARACTER PACK", brand = ["CLASSROOM", "ARCADE"] }: { glow: string; color?: string; label?: string; brand?: [string, string] }) {
  return (
    <svg viewBox="0 0 200 280" width="100%" role="img" aria-label="Character pack" style={{ filter: `drop-shadow(0 0 ${glow === "none" ? 0 : 26}px ${glow === "none" ? "transparent" : glow})`, transition: "filter .3s" }}>
      <path d="M14 18 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8 l8 8 V262 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 l-8 8 l-8 -8 Z" fill={color} stroke="#14163a" strokeWidth="6" strokeLinejoin="round" />
      <rect x="28" y="40" width="144" height="200" rx="14" fill="#fff8ea" stroke="#14163a" strokeWidth="5" />
      <path d="M28 150 L172 90 V130 L28 190Z" fill="#fff" opacity=".22" />
      <text x="100" y="86" textAnchor="middle" fontSize="22" fontWeight="700" fill="#14163a" fontFamily="inherit">{brand[0]}</text>
      <text x="100" y="114" textAnchor="middle" fontSize="22" fontWeight="700" fill="#14163a" fontFamily="inherit">{brand[1]}</text>
      <path d="M100 138 l12 26 l28 3 l-21 19 l7 28 l-26 -15 l-26 15 l7 -28 l-21 -19 l28 -3Z" fill={color} stroke="#14163a" strokeWidth="5" strokeLinejoin="round" />
      <text x="100" y="228" textAnchor="middle" fontSize="15" fontWeight="700" fill="#14163a" fontFamily="inherit">{label.toUpperCase()}</text>
      <clipPath id="packclip"><rect x="28" y="40" width="144" height="200" rx="14" /></clipPath>
      <g clipPath="url(#packclip)"><rect className="pack-shine" x="-40" y="10" width="26" height="260" fill="#fff" opacity=".45" /></g>
    </svg>
  );
}

/** Animated pack opening: idle → shake (rarity tease) → burst → card flip with confetti. Used by the real shop and the free demo. */
export default function PackOpener({ onOpen, canOpen = true, label = "Open pack", hint, pack, brand }: { onOpen: () => Promise<Result>; canOpen?: boolean; label?: string; hint?: string; brand?: [string, string]; pack?: { name: string; color: string } }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [glow, setGlow] = useState("none");
  const { prefs, set } = usePrefs();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function open() {
    if (stage === "shake" || stage === "burst") return;
    setErr(null); setRes(null);
    if (prefs.skipPacks) {   // animation off: show the card right away
      try { const result = await onOpen(); setRes(result); setStage("revealed"); sfx(result.character.rarity === "common" ? "good" : "win"); }
      catch (e: any) { setErr(e.message ?? "Could not open the pack."); setStage("idle"); }
      return;
    }
    setStage("shake"); setGlow("none");
    sfx("whoosh");
    const started = performance.now();
    let result: Result;
    try { result = await onOpen(); } catch (e: any) { setErr(e.message ?? "Could not open the pack."); setStage("idle"); return; }
    const color = RARITIES[result.character.rarity]?.color ?? "#fff";
    const wait = Math.max(0, MIN_SHAKE_MS - (performance.now() - started));
    // the pack glows with the rarity colour just before it bursts (a tease, like real card packs)
    timers.current.push(setTimeout(() => { setGlow(result.character.rarity === "common" ? "none" : color); sfx("tick"); }, Math.max(0, wait - 700)));
    timers.current.push(setTimeout(() => {
      setRes(result); setStage("burst"); sfx("reveal");
      timers.current.push(setTimeout(() => {
        setStage("revealed"); sfx(result.character.rarity === "common" ? "good" : "win");
        const c = CONF[result.character.rarity];
        if (!prefs.calm && c.n) confetti({ particleCount: c.n, spread: c.spread, origin: { y: 0.55 }, colors: [color, "#ffd23d", "#ffffff"] });
        if (!prefs.calm && result.character.rarity === "legendary") setTimeout(() => confetti({ particleCount: 200, spread: 160, origin: { y: 0.4 } }), 450);
      }, 650));
    }, wait));
  }

  const r = res ? RARITIES[res.character.rarity] : null;
  return (
    <div className="grid justify-items-center gap-4" aria-live="polite">
      <div className="relative" style={{ width: "min(300px, 78vw)", minHeight: 330 }}>
        {(stage === "idle" || stage === "shake") && (
          <div className={stage === "shake" ? "pack-shake" : "pack-idle"} style={{ width: "100%" }}><PackArt glow={glow} brand={brand} color={pack?.color} label={(pack?.name ?? "Character pack").replace(/ pack$/i, " pack")} /></div>
        )}
        {stage === "burst" && (
          <div className="absolute inset-0 grid place-items-center"><div className="pack-burst" style={{ background: r?.color }} /></div>
        )}
        {stage === "revealed" && res && r && (
          <div className={prefs.skipPacks ? "" : "card-flip"} style={{ width: "100%" }}>
            <div className="card-face" style={{ borderColor: r.color, boxShadow: `0 0 0 5px #14163a, 0 0 40px ${r.color}` }}>
              <span className="ar-chip" style={{ background: r.color, color: "#fff", borderColor: "#14163a" }}>{r.label}</span>
              <div className={res.character.rarity === "common" ? "float" : "float pack-sparkle"}><Avatar id={res.character.id} size={170} title={res.character.name} /></div>
              <h3 className="text-3xl font-bold leading-tight">{res.character.name}</h3>
              <p className="min-h-12 text-sm font-medium">{res.character.tagline}</p>
              <span className="ar-chip" style={{ background: res.duplicate ? "#e6e8ff" : "#b7e84a" }}>{res.duplicate ? "Duplicate" : "✨ NEW!"}</span>
            </div>
          </div>
        )}
      </div>
      <button className="ar-btn coral xl" disabled={!canOpen || stage === "shake" || stage === "burst"} onClick={open}>
        {stage === "shake" ? "Opening…" : stage === "revealed" ? "Open another" : label}
      </button>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold">
        <input type="checkbox" role="switch" checked={prefs.skipPacks} onChange={(e) => set({ skipPacks: e.target.checked })} style={{ width: 20, height: 20 }} />
        ⚡ Skip pack animation
      </label>
      {hint && <p className="ar-muted text-center text-sm">{hint}</p>}
      <p role="alert" className="min-h-6 font-bold text-[var(--coral)]">{err}</p>
    </div>
  );
}

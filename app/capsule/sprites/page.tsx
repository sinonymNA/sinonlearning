"use client";

import { useState } from "react";
import CapIcon from "@/components/capsule/CapIcon";

const SPRITES = [
  { name: "mascot",       src: "/assets/capsule/mascot.png",       size: "254×316" },
  { name: "coin",         src: "/assets/capsule/coin.png",          size: "274×291" },
  { name: "cap-fox",      src: "/assets/capsule/caps/cap-fox.png",  size: "298×371" },
  { name: "pod-closed",   src: "/assets/capsule/pod-closed.png",    size: "314×176" },
  { name: "pod-top",      src: "/assets/capsule/pod-top.png",       size: "215×227" },
  { name: "pod-bottom",   src: "/assets/capsule/pod-bottom.png",    size: "219×194" },
  { name: "chest-closed", src: "/assets/capsule/chest-closed.png",  size: "276×279" },
  { name: "chest-open",   src: "/assets/capsule/chest-open.png",    size: "304×324" },
];

export default function SpritesPage() {
  const [bg, setBg] = useState<"dark" | "light" | "checker">("dark");

  const bgStyle: React.CSSProperties =
    bg === "dark"    ? { background: "#06163E" } :
    bg === "light"   ? { background: "#f1f5f9" } :
    { backgroundImage: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)", backgroundSize: "20px 20px" };

  return (
    <div className="min-h-screen" style={{ background: "#06163E", fontFamily: "var(--font-inter)" }}>
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-black text-white tracking-tight">Capsule — Sprite Preview</h1>
        <div className="flex gap-2">
          {(["dark", "light", "checker"] as const).map(b => (
            <button
              key={b}
              onClick={() => setBg(b)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors"
              style={{
                background: bg === b ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                color: bg === b ? "#fff" : "rgba(255,255,255,0.4)",
                border: `1px solid ${bg === b ? "rgba(255,255,255,0.2)" : "transparent"}`,
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-8 space-y-10">

        {/* Raw sprites */}
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">Raw sprites</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SPRITES.map(s => (
              <div
                key={s.name}
                className="rounded-2xl p-4 flex flex-col items-center gap-3"
                style={{ border: "1px solid rgba(255,255,255,0.08)", ...bgStyle }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.name} style={{ width: 120, height: 120, objectFit: "contain" }} />
                <div className="text-center">
                  <p className="text-xs font-bold text-white">{s.name}</p>
                  <p className="text-[10px] text-white/30">{s.size}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CapIcon at multiple sizes */}
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">CapIcon — fox portrait at sizes</p>
          <div className="flex flex-wrap items-end gap-6" style={{ ...bgStyle, borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            {[24, 32, 48, 64, 80, 100, 128].map(sz => (
              <div key={sz} className="flex flex-col items-center gap-2">
                <CapIcon capId="cap-fox" size={sz} />
                <span className="text-[9px] text-white/30">{sz}px</span>
              </div>
            ))}
          </div>
        </section>

        {/* CapIcon with showName */}
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">CapIcon — all caps (emoji fallback for caps without portraits)</p>
          <div className="flex flex-wrap gap-6" style={{ ...bgStyle, borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            {["cap-fox", "cap-dragon", "cap-crown", "cap-ghost", "cap-robot", "cap-wizard"].map(id => (
              <CapIcon key={id} capId={id} size={56} showName />
            ))}
          </div>
        </section>

        {/* Chest open/close toggle */}
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">Chest toggle</p>
          <ChestToggle bgStyle={bgStyle} />
        </section>

        {/* Pod states */}
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">Pod states</p>
          <div className="flex flex-wrap gap-6 items-end" style={{ ...bgStyle, borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            {["pod-closed", "pod-top", "pod-bottom"].map(name => (
              <div key={name} className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/capsule/${name}.png`} alt={name} style={{ width: 80, height: 80, objectFit: "contain" }} />
                <span className="text-[9px] text-white/30">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Coin sizes */}
        <section>
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">Coin at UI sizes</p>
          <div className="flex flex-wrap items-end gap-6" style={{ ...bgStyle, borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
            {[10, 12, 14, 18, 24, 32, 48].map(sz => (
              <div key={sz} className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/capsule/coin.png" alt="coin" style={{ width: sz, height: sz, objectFit: "contain" }} />
                <span className="text-[9px] text-white/30">{sz}px</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

function ChestToggle({ bgStyle }: { bgStyle: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...bgStyle, borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 32 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex flex-col items-center gap-3 rounded-2xl px-8 py-6 transition-transform hover:scale-105 active:scale-95"
        style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={open ? "/assets/capsule/chest-open.png" : "/assets/capsule/chest-closed.png"}
          alt={open ? "chest open" : "chest closed"}
          style={{ width: 96, height: 96, objectFit: "contain" }}
        />
        <span className="text-xs font-black uppercase tracking-widest text-white/50">
          {open ? "Open" : "Tap to open"}
        </span>
      </button>
      <div className="text-sm text-white/30">
        Click to toggle<br />closed ↔ open
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG = "#f8fafc";

const PRESETS = [
  { label: "Netflix 2021", eps: 11, pe: 60 },
  { label: "Apple today", eps: 6.4, pe: 33 },
  { label: "Value stock", eps: 8, pe: 10 },
];

interface Props {
  accent: string;
}

export default function PEExplorerHook({ accent }: Props) {
  const [eps, setEps] = useState(6.4);
  const [pe, setPe] = useState(33);

  const price = eps * pe;

  return (
    <div style={{
      background: BG, border: `1px solid ${BORDER}`,
      borderRadius: 14, padding: "clamp(14px, 4vw, 24px)",
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: accent,
        letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
      }}>
        Try It: P/E Explorer
      </p>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
        Move the sliders to see how the same earnings can produce wildly different stock prices.
      </p>

      {/* Live price display */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>Stock Price</p>
        <p style={{ fontSize: "clamp(36px, 10vw, 52px)", fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: "-0.03em" }}>
          ${price.toFixed(2)}
        </p>
        <p style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
          ${eps.toFixed(2)} EPS × {pe}× P/E
        </p>
      </div>

      {/* EPS slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: INK }}>
            Earnings Per Share (EPS)
          </label>
          <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>${eps.toFixed(2)}</span>
        </div>
        <input
          type="range" min={1} max={20} step={0.5}
          value={eps}
          onChange={e => setEps(Number(e.target.value))}
          style={{ width: "100%", accentColor: accent }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: MUTED }}>$1</span>
          <span style={{ fontSize: 11, color: MUTED }}>$20</span>
        </div>
      </div>

      {/* P/E slider */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: INK }}>
            P/E Multiple (how much investors pay per $1 of earnings)
          </label>
          <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{pe}×</span>
        </div>
        <input
          type="range" min={5} max={60} step={1}
          value={pe}
          onChange={e => setPe(Number(e.target.value))}
          style={{ width: "100%", accentColor: accent }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: MUTED }}>5× (cheap)</span>
          <span style={{ fontSize: 11, color: MUTED }}>60× (very expensive)</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => { setEps(preset.eps); setPe(preset.pe); }}
            style={{
              fontSize: 12, fontWeight: 600, color: accent,
              background: accent + "12", border: `1px solid ${accent}33`,
              borderRadius: 8, padding: "6px 14px", cursor: "pointer",
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

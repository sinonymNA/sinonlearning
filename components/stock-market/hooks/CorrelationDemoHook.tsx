"use client";

import { useState } from "react";

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG = "#f8fafc";

const SECTORS = [
  { id: "tech",       label: "Technology",         color: "#6366f1" },
  { id: "energy",     label: "Energy",              color: "#f59e0b" },
  { id: "health",     label: "Healthcare",          color: "#10b981" },
  { id: "finance",    label: "Financials",          color: "#3b82f6" },
  { id: "consumer",   label: "Consumer Staples",    color: "#ec4899" },
];

// Simulated volatility reduction: more sectors = lower relative portfolio volatility
const VOL_BY_COUNT: Record<number, number> = {
  0: 100, 1: 100, 2: 78, 3: 62, 4: 52, 5: 45,
};

interface Props {
  accent: string;
}

export default function CorrelationDemoHook({ accent }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["tech"]));

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // keep at least 1
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const count = selected.size;
  const vol = VOL_BY_COUNT[count] ?? 45;
  const benefit = 100 - vol;

  return (
    <div style={{
      background: BG, border: `1px solid ${BORDER}`,
      borderRadius: 14, padding: "24px",
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: accent,
        letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
      }}>
        Try It: Diversification Demo
      </p>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
        Select which sectors you hold. Watch how adding uncorrelated sectors reduces portfolio risk — but with diminishing returns.
      </p>

      {/* Sector toggles */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {SECTORS.map(s => {
          const on = selected.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{
                fontSize: 12, fontWeight: 600,
                color: on ? "#fff" : MUTED,
                background: on ? s.color : "#fff",
                border: `1.5px solid ${on ? s.color : BORDER}`,
                borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Volatility bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>Portfolio Volatility</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>{vol}%</span>
        </div>
        <div style={{ height: 12, background: BORDER, borderRadius: 6, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 6,
            background: vol > 75 ? "#dc2626" : vol > 55 ? "#f59e0b" : accent,
            width: `${vol}%`,
            transition: "width 0.4s ease, background 0.4s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: MUTED }}>0% (no risk)</span>
          <span style={{ fontSize: 10, color: MUTED }}>100% (concentrated)</span>
        </div>
      </div>

      {/* Diversification benefit callout */}
      <div style={{
        background: accent + "10", border: `1px solid ${accent}30`,
        borderRadius: 10, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <p style={{ fontSize: 22, fontWeight: 900, color: accent, lineHeight: 1 }}>
          {benefit}%
        </p>
        <p style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>
          <strong>Diversification benefit</strong> — holding {count} sector{count !== 1 ? "s" : ""} reduces risk by {benefit}% vs. a single sector.
          {count >= 4 && " Notice: adding sector 4→5 saves much less than 1→2 did. That's diminishing returns."}
        </p>
      </div>
    </div>
  );
}

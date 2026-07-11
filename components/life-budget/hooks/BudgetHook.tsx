"use client";

import { useState } from "react";
import BudgetNarrativeLesson from "../lessons/BudgetNarrativeLesson";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#ea580c";
const GREEN  = "#16a34a";

const HYPOTHETICAL = 3000;
const TARGETS = { needs: 50, wants: 30, savings: 20 };

interface Alloc { needs: number; wants: number; savings: number }

function rebalance(current: Alloc, changed: keyof Alloc, value: number): Alloc {
  const others = (Object.keys(current) as (keyof Alloc)[]).filter((k) => k !== changed);
  const remaining = 100 - value;
  const otherTotal = others.reduce((s, k) => s + current[k], 0);
  const next = { ...current, [changed]: value } as Alloc;
  if (otherTotal === 0) {
    const share = remaining / others.length;
    others.forEach((k) => { next[k] = share; });
  } else {
    others.forEach((k) => { next[k] = (current[k] / otherTotal) * remaining; });
  }
  return next;
}

function pct(v: number) { return Math.round(v); }

const ROWS: { key: keyof Alloc; label: string; target: number; color: string }[] = [
  { key: "needs",   label: "Needs",   target: TARGETS.needs,   color: "#2563eb" },
  { key: "wants",   label: "Wants",   target: TARGETS.wants,   color: "#7c3aed" },
  { key: "savings", label: "Savings", target: TARGETS.savings, color: GREEN },
];

export default function BudgetHook({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<"interactive" | "terms">("interactive");
  const [alloc, setAlloc] = useState<Alloc>({ needs: 50, wants: 30, savings: 20 });
  const [tried, setTried] = useState(false);

  if (step === "terms") return <BudgetNarrativeLesson onReady={onReady} />;

  const handleChange = (key: keyof Alloc, val: number) => {
    setTried(true);
    setAlloc((prev) => rebalance(prev, key, val));
  };

  const dollars = (p: number) => Math.round((p / 100) * HYPOTHETICAL);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          The 50/30/20 Sandbox
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          Drag the sliders to split $3,000 across Needs, Wants, and Savings.
          The 50/30/20 rule is a target — see what it actually feels like before you apply it to your real numbers.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "28px 28px" }}>

          {/* Income header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: MUTED }}>Hypothetical monthly take-home</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: INK }}>${HYPOTHETICAL.toLocaleString()}</span>
          </div>

          {/* Sliders */}
          {ROWS.map((row) => {
            const actual = pct(alloc[row.key]);
            const over = actual > row.target;
            return (
              <div key={row.key} style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>{row.label}</span>
                    <span style={{ fontSize: 11, color: MUTED }}>target: {row.target}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800,
                      color: over ? "#dc2626" : GREEN,
                      background: over ? "#fee2e2" : "#dcfce7",
                      borderRadius: 6, padding: "2px 8px",
                    }}>
                      {actual}% {over ? "↑" : actual === row.target ? "✓" : "↓"}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>${dollars(alloc[row.key]).toLocaleString()}</span>
                  </div>
                </div>

                {/* Progress bar with target marker */}
                <div style={{ position: "relative", height: 10, background: "#f1f5f9", borderRadius: 5, marginBottom: 8 }}>
                  <div style={{
                    height: "100%", borderRadius: 5,
                    width: `${Math.min(actual, 100)}%`,
                    background: over ? "#ef4444" : row.color,
                    transition: "width 0.2s, background 0.2s",
                  }} />
                  {/* Target marker */}
                  <div style={{
                    position: "absolute", top: -3, width: 2, height: 16,
                    background: INK + "55", borderRadius: 1,
                    left: `${row.target}%`,
                  }} />
                </div>

                <input
                  type="range" min={0} max={100} step={1}
                  value={Math.round(alloc[row.key])}
                  onChange={(e) => handleChange(row.key, Number(e.target.value))}
                  style={{ width: "100%", accentColor: row.color }}
                />
              </div>
            );
          })}

          {/* Summary */}
          <div style={{
            borderTop: `1px solid ${BORDER}`, paddingTop: 16, marginTop: 4,
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
          }}>
            {ROWS.map((row) => {
              const over = pct(alloc[row.key]) > row.target;
              return (
                <div key={row.key} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                    {row.label}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: INK }}>${dollars(alloc[row.key])}</p>
                  <p style={{ fontSize: 10, color: over ? "#dc2626" : GREEN, fontWeight: 600 }}>
                    {over ? `${pct(alloc[row.key]) - row.target}% over` : "on target"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {tried && (
          <div style={{ marginTop: 20, padding: "14px 20px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
            <strong>Notice:</strong> The sliders are linked — they always add up to 100%. In real life, your income is fixed too. Every dollar you add to wants is a dollar not going to savings.
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Now apply this framework to YOUR actual income and expenses.
          </p>
          <button
            onClick={() => setStep("terms")}
            style={{
              fontSize: 15, fontWeight: 700, color: "#fff",
              background: ACCENT, border: "none",
              borderRadius: 10, padding: "14px 36px", cursor: "pointer",
            }}
          >
            Next: Learn the Terms →
          </button>
        </div>
      </div>
    </div>
  );
}

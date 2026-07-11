"use client";

import { useState } from "react";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#059669";
const GREEN  = "#16a34a";

const GROSS = 4800;

const DEDUCTIONS = [
  { id: "federal", label: "Federal Income Tax",            amount: 528,  color: "#dc2626", pct: "~11%" },
  { id: "state",   label: "State Income Tax",              amount: 192,  color: "#ea580c", pct: "~4%"  },
  { id: "fica",    label: "FICA (Social Security + Medicare)", amount: 367, color: "#d97706", pct: "7.65%" },
  { id: "benefits",label: "Health & Benefits Deductions",  amount: 288,  color: "#7c3aed", pct: "~6%"  },
] as const;

type DeductionId = (typeof DEDUCTIONS)[number]["id"];

const TOTAL_DEDUCTIONS = DEDUCTIONS.reduce((s, d) => s + d.amount, 0);
const TAKE_HOME = GROSS - TOTAL_DEDUCTIONS;

export default function PaycheckHook({ onReady }: { onReady: () => void }) {
  const [revealed, setRevealed] = useState<Set<DeductionId>>(new Set());

  const reveal = (id: DeductionId) => {
    setRevealed((prev) => new Set([...prev, id]));
  };

  const revealedDeductions = DEDUCTIONS.filter((d) => revealed.has(d.id));
  const totalRevealed = revealedDeductions.reduce((s, d) => s + d.amount, 0);
  const currentTakeHome = GROSS - totalRevealed;
  const allRevealed = revealed.size === DEDUCTIONS.length;

  const takeHomePct = (currentTakeHome / GROSS) * 100;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          Watch $4,800 Disappear
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Someone earns $4,800/month gross. Tap each deduction to see what gets taken before they touch a dollar.
        </p>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto" }}>

        {/* Live bar */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px 24px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              $4,800 Gross Pay
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>
              ${currentTakeHome.toLocaleString()} left
            </span>
          </div>

          {/* Stacked bar */}
          <div style={{
            display: "flex", height: 40, borderRadius: 8, overflow: "hidden",
            border: `1px solid ${BORDER}`, background: "#f1f5f9",
          }}>
            {/* Take-home (green, left) */}
            <div style={{
              flex: takeHomePct, background: GREEN, minWidth: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "flex 0.4s ease",
              overflow: "hidden",
            }}>
              {takeHomePct > 20 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", padding: "0 8px" }}>
                  {Math.round(takeHomePct)}% yours
                </span>
              )}
            </div>

            {/* Deduction segments (right side) */}
            {revealedDeductions.map((d) => (
              <div
                key={d.id}
                style={{
                  flex: (d.amount / GROSS) * 100,
                  background: d.color, minWidth: 0,
                  transition: "flex 0.4s ease",
                }}
              />
            ))}
          </div>

          {/* Legend for revealed items */}
          {revealedDeductions.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 12 }}>
              {revealedDeductions.map((d) => (
                <span key={d.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MUTED }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: "inline-block", flexShrink: 0 }} />
                  {d.label}: <strong style={{ color: INK }}>${d.amount}</strong>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {DEDUCTIONS.map((d) => {
            const done = revealed.has(d.id);
            return (
              <button
                key={d.id}
                onClick={() => !done && reveal(d.id)}
                disabled={done}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", borderRadius: 10,
                  border: `2px solid ${done ? d.color + "55" : d.color + "88"}`,
                  background: done ? d.color + "12" : "#fff",
                  color: done ? MUTED : INK,
                  cursor: done ? "default" : "pointer",
                  fontWeight: 600, fontSize: 14, textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0,
                    opacity: done ? 0.5 : 1,
                  }} />
                  {done ? "✓" : "+"} {d.label}
                  <span style={{ fontSize: 12, color: MUTED, fontWeight: 400 }}>({d.pct})</span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: done ? MUTED : d.color }}>
                  −${d.amount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Final reveal */}
        {allRevealed && (
          <div style={{
            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14,
            padding: "24px", marginBottom: 28, textAlign: "center",
          }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 6 }}>
              ${TAKE_HOME.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 500, color: MUTED }}>actually reaches your account</span>
            </p>
            <p style={{ fontSize: 14, color: "#c2410c", fontWeight: 600, marginBottom: 8 }}>
              That&apos;s only {Math.round((TAKE_HOME / GROSS) * 100)}% of what you earned.
            </p>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
              ${TOTAL_DEDUCTIONS.toLocaleString()} per month — ${(TOTAL_DEDUCTIONS * 12).toLocaleString()} per year — leaves before you touch it.
              The good news: some of that is going toward <em>your future</em>.
            </p>
          </div>
        )}

        {allRevealed && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>
              Now let&apos;s calculate what actually happens with YOUR paycheck.
            </p>
            <button
              onClick={onReady}
              style={{
                fontSize: 15, fontWeight: 700, color: "#fff",
                background: ACCENT, border: "none",
                borderRadius: 10, padding: "14px 36px", cursor: "pointer",
              }}
            >
              Calculate My Paycheck →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

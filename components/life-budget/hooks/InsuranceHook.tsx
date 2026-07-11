"use client";

import { useState } from "react";
import InsuranceLesson from "../lessons/InsuranceLesson";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#be185d";
const GREEN  = "#16a34a";

interface Scenario {
  id: string;
  label: string;
  emoji: string;
  totalCost: number;
  bronze: number;
  silver: number;
  gold: number;
  insight: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "arm",
    label: "Broken Arm",
    emoji: "🦴",
    totalCost: 2800,
    bronze: 2800,
    silver: 1500,
    gold: 900,
    insight: "Bronze covers zero — you pay the full bill because you haven't hit your deductible.",
  },
  {
    id: "er",
    label: "ER Visit",
    emoji: "🏥",
    totalCost: 4200,
    bronze: 4200,
    silver: 3000,
    gold: 1200,
    insight: "An ER visit for a single bad night can cost more than a month's rent.",
  },
  {
    id: "appendix",
    label: "Appendectomy",
    emoji: "🔪",
    totalCost: 15000,
    bronze: 7500,
    silver: 5000,
    gold: 3500,
    insight: "All three plans hit their out-of-pocket maximum. At this level, the plans protect you equally — but you still owe thousands.",
  },
  {
    id: "surgery",
    label: "Major Surgery",
    emoji: "💊",
    totalCost: 45000,
    bronze: 7500,
    silver: 5000,
    gold: 3500,
    insight: "Every plan maxes out. A Bronze and Gold plan cost you the same amount — the only difference now is your monthly premium.",
  },
];

interface Plan { label: string; color: string }
const PLANS: Plan[] = [
  { label: "Bronze", color: "#b45309" },
  { label: "Silver", color: "#64748b" },
  { label: "Gold",   color: "#d97706" },
];

export default function InsuranceHook({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<"interactive" | "terms">("interactive");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (step === "terms") return <InsuranceLesson onReady={onReady} />;

  const scenario = SCENARIOS.find((s) => s.id === selectedId);

  const costs = scenario ? [scenario.bronze, scenario.silver, scenario.gold] : [0, 0, 0];
  const maxCost = scenario ? Math.max(...costs) : 1;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          What Would This Cost You?
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          Pick a medical event and see what you&apos;d actually pay out-of-pocket under each plan tier.
          The right choice isn&apos;t the cheapest premium — it&apos;s the one you can afford when something goes wrong.
        </p>
      </div>

      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Scenario cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {SCENARIOS.map((s) => {
            const isSelected = selectedId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                style={{
                  padding: "16px 18px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                  border: `2px solid ${isSelected ? ACCENT : BORDER}`,
                  background: isSelected ? ACCENT + "0c" : CARD,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.emoji}</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: 12, color: MUTED }}>Total bill: ~${s.totalCost.toLocaleString()}</p>
              </button>
            );
          })}
        </div>

        {/* Plan comparison */}
        {scenario && (
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 14, padding: "24px", marginBottom: 20,
          }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: INK, marginBottom: 16 }}>
              {scenario.emoji} {scenario.label} — what you pay under each plan
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PLANS.map((plan, i) => {
                const cost = costs[i];
                const barPct = (cost / maxCost) * 100;
                const isMax = cost === maxCost;
                return (
                  <div key={plan.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: plan.color }}>{plan.label} Plan</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: cost > 3000 ? "#dc2626" : GREEN }}>
                        ${cost.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: 20, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{
                        width: `${barPct}%`, height: "100%",
                        background: plan.color + (isMax ? "cc" : "88"),
                        borderRadius: 5, transition: "width 0.4s",
                      }} />
                    </div>
                    {isMax && i === 0 && (
                      <p style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>⚠ Full bill — deductible not yet met</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 20, padding: "12px 16px",
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 8, fontSize: 13, color: "#92400e", lineHeight: 1.6,
            }}>
              <strong>Key insight:</strong> {scenario.insight}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: selectedId ? 8 : 28 }}>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            {selectedId
              ? "Now pick the plan that fits YOUR income and risk tolerance."
              : "Pick a scenario above, then choose your plan."}
          </p>
          {selectedId && (
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
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG = "#f8fafc";

interface Scenario {
  situation: string;
  choices: string[];
  biasChoice: number;   // index of the choice that reveals a bias
  rationChoice: number; // index of the rational choice
  biasName: string;
  biasExplain: string;
  rationalExplain: string;
}

const SCENARIOS: Scenario[] = [
  {
    situation: "You bought a stock at $100. It's now worth $60 — a 40% drop. The company's business hasn't changed. What do you do?",
    choices: [
      "Hold it until it gets back to $100",
      "Sell and redeploy the money into a better opportunity",
      "Buy more to lower your average cost",
      "Wait for quarterly earnings before deciding",
    ],
    biasChoice: 0,
    rationChoice: 1,
    biasName: "Anchoring + Loss Aversion",
    biasExplain: "You're anchoring to your purchase price ($100), which is irrelevant to future performance. The market doesn't care what you paid.",
    rationalExplain: "The stock's future depends on the business, not your cost basis. If the thesis hasn't changed, you might hold — but the question is whether it's still the best use of that $60.",
  },
  {
    situation: "NVDA is up 80% in six months. Everyone on Reddit and the news is saying it will keep rising. You...",
    choices: [
      "Buy NVDA because it clearly has momentum",
      "Research the fundamentals before deciding",
      "Wait for the price to dip before buying",
      "Avoid it entirely since it's already up so much",
    ],
    biasChoice: 0,
    rationChoice: 1,
    biasName: "Herding + Recency Bias",
    biasExplain: "Buying because 'everyone says so' and recent performance is strong is herding behavior fueled by recency bias. By the time it's headline news, the easy gain is often already gone.",
    rationalExplain: "Past price moves don't predict future returns. A stock can be cheap at 2× and expensive at 0.5× — it depends on the business value relative to price.",
  },
  {
    situation: "You sold a stock at $50 after it doubled from your cost of $25. It's now at $95. You...",
    choices: [
      "Regret selling and buy back in at $95",
      "Accept the gain, review why you sold, and update your rules",
      "Refuse to buy back since you sold at $50",
      "Consider whether fundamentals justify $95 before deciding",
    ],
    biasChoice: 2,
    rationChoice: 3,
    biasName: "Anchoring + Disposition Effect",
    biasExplain: "Refusing to buy back because 'you sold at $50' is anchoring to a past transaction. Your sale price is irrelevant to whether $95 is a good price today.",
    rationalExplain: "Evaluate the stock at its current price vs. current fundamentals. If the business is worth $120 and it's trading at $95, it might still be a buy — your old cost basis is beside the point.",
  },
];

interface Props {
  accent: string;
}

export default function BiasSandboxHook({ accent }: Props) {
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [avoided, setAvoided] = useState(0);
  const [done, setDone] = useState(false);

  const scenario = SCENARIOS[current];

  const handlePick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === scenario.rationChoice) {
      setAvoided(a => a + 1);
    }
  };

  const handleNext = () => {
    if (current + 1 >= SCENARIOS.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setPicked(null);
    }
  };

  if (done) {
    const color = avoided === 3 ? "#16a34a" : avoided === 2 ? "#d97706" : "#dc2626";
    const label = avoided === 3
      ? "You think like a pro — you avoided all 3 classic traps."
      : avoided === 2
        ? "Good awareness — you caught most of the traps."
        : "These biases trip up even experienced investors. Now you know to watch for them.";
    return (
      <div style={{
        background: BG, border: `1px solid ${BORDER}`,
        borderRadius: 14, padding: "24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
          Bias Sandbox — Results
        </p>
        <p style={{ fontSize: 42, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>
          {avoided} / 3
        </p>
        <p style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 16 }}>
          traps avoided
        </p>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>{label}</p>
      </div>
    );
  }

  return (
    <div style={{
      background: BG, border: `1px solid ${BORDER}`,
      borderRadius: 14, padding: "24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: accent,
          letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          Bias Sandbox
        </p>
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>
          {current + 1} / {SCENARIOS.length}
        </span>
      </div>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
        What would you do? Pick one — then see which bias might be at play.
      </p>

      {/* Situation */}
      <div style={{
        background: "#fff", border: `1px solid ${BORDER}`,
        borderRadius: 10, padding: "16px 18px", marginBottom: 16,
        fontSize: 14, color: INK, lineHeight: 1.65, fontWeight: 500,
      }}>
        {scenario.situation}
      </div>

      {/* Choices */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {scenario.choices.map((choice, idx) => {
          const isRational = idx === scenario.rationChoice;
          const isBias = idx === scenario.biasChoice;
          let bg = "#fff";
          let border = `1px solid ${BORDER}`;
          let color = INK;
          if (picked !== null) {
            if (isRational) { bg = "#f0fdf4"; border = "2px solid #16a34a"; color = "#166534"; }
            else if (isBias && picked === idx) { bg = "#fef2f2"; border = "2px solid #dc2626"; color = "#991b1b"; }
          }
          return (
            <button
              key={idx}
              disabled={picked !== null}
              onClick={() => handlePick(idx)}
              style={{
                textAlign: "left", padding: "11px 14px",
                background: bg, border, borderRadius: 9,
                color, fontSize: 13, lineHeight: 1.5,
                fontFamily: "inherit", cursor: picked !== null ? "default" : "pointer",
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {picked !== null && (
        <div style={{ animation: "biasReveal 0.3s ease" }}>
          <style>{`@keyframes biasReveal { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
          {picked === scenario.biasChoice && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, padding: "12px 14px", marginBottom: 10,
              fontSize: 13, color: "#7f1d1d", lineHeight: 1.6,
            }}>
              <strong style={{ color: "#dc2626" }}>Bias: {scenario.biasName}</strong><br />
              {scenario.biasExplain}
            </div>
          )}
          {picked === scenario.rationChoice && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: "12px 14px", marginBottom: 10,
              fontSize: 13, color: "#14532d", lineHeight: 1.6,
            }}>
              <strong style={{ color: "#16a34a" }}>Good thinking!</strong><br />
              {scenario.rationalExplain}
            </div>
          )}
          {picked !== scenario.biasChoice && picked !== scenario.rationChoice && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 10, padding: "12px 14px", marginBottom: 10,
              fontSize: 13, color: "#78350f", lineHeight: 1.6,
            }}>
              <strong>Watch out for: {scenario.biasName}</strong><br />
              {scenario.biasExplain}
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleNext}
              style={{
                fontSize: 13, fontWeight: 700, color: "#fff",
                background: accent, border: "none",
                borderRadius: 9, padding: "10px 24px", cursor: "pointer",
              }}
            >
              {current + 1 < SCENARIOS.length ? "Next Scenario →" : "See My Results →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

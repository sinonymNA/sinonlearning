"use client";

import { useState } from "react";
import CreditLesson from "../lessons/CreditLesson";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#dc2626";
const GREEN  = "#16a34a";

const APR = 0.2499;
const MIN_PCT = 0.02;
const FIXED_PMT = 150;

function calcMinPmt(balance: number, apr: number, minPct: number) {
  const monthlyRate = apr / 12;
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  while (bal > 0.01 && months < 600) {
    const interest = bal * monthlyRate;
    const pmt = Math.max(bal * minPct, 25);
    bal = bal + interest - pmt;
    totalInterest += interest;
    months++;
    if (bal > balance * 3) break; // runaway — shouldn't happen at 2% min
  }
  return { months, totalInterest };
}

function calcFixedPmt(balance: number, apr: number, pmt: number) {
  const monthlyRate = apr / 12;
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  while (bal > 0.01 && months < 600) {
    const interest = bal * monthlyRate;
    if (pmt <= interest) break;
    bal = bal + interest - pmt;
    totalInterest += interest;
    months++;
  }
  return { months, totalInterest };
}

export default function CreditHook({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<"interactive" | "terms">("interactive");
  const [balance, setBalance] = useState(3000);

  if (step === "terms") return <CreditLesson onReady={onReady} />;

  const minResult = calcMinPmt(balance, APR, MIN_PCT);
  const fixedResult = calcFixedPmt(balance, APR, FIXED_PMT);

  const maxMonths = Math.max(minResult.months, 1);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          The Minimum Payment Trap
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          You graduate with a credit card balance at 24.99% APR. Drag the slider to change the balance,
          and watch what minimum payments actually cost you.
        </p>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Slider */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px 28px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: INK }}>Credit card balance</label>
            <span style={{ fontSize: 24, fontWeight: 800, color: ACCENT }}>${balance.toLocaleString()}</span>
          </div>
          <input
            type="range" min={500} max={5000} step={250}
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
            style={{ width: "100%", accentColor: ACCENT }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED, marginTop: 4 }}>
            <span>$500</span><span>$5,000</span>
          </div>
        </div>

        {/* Two scenarios */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>

          {/* Minimum payments */}
          <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: 14, padding: "20px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Scenario A: Minimum Only
            </p>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
              Pay 2% of balance each month (~${Math.round(balance * 0.02)}/mo to start)
            </p>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Time to pay off</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>
                {minResult.months >= 600 ? "Never" : `${minResult.months} months`}
              </p>
              {minResult.months < 600 && (
                <p style={{ fontSize: 11, color: MUTED }}>{(minResult.months / 12).toFixed(1)} years</p>
              )}
            </div>
            <div>
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Total interest paid</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>
                ${Math.round(minResult.totalInterest).toLocaleString()}
              </p>
            </div>

            {/* Timeline bar */}
            <div style={{ marginTop: 14, height: 8, background: "#fca5a5", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: ACCENT, borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>{minResult.months} months</p>
          </div>

          {/* Fixed $150 */}
          <div style={{ background: "#f0fdf4", border: "2px solid #bbf7d0", borderRadius: 14, padding: "20px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: GREEN, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Scenario B: ${FIXED_PMT}/Month Fixed
            </p>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
              Pay a flat ${FIXED_PMT} every month, no matter what
            </p>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Time to pay off</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: GREEN }}>
                {fixedResult.months} months
              </p>
              <p style={{ fontSize: 11, color: MUTED }}>{(fixedResult.months / 12).toFixed(1)} years</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Total interest paid</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: GREEN }}>
                ${Math.round(fixedResult.totalInterest).toLocaleString()}
              </p>
            </div>

            {/* Timeline bar */}
            <div style={{ marginTop: 14, height: 8, background: "#bbf7d0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min((fixedResult.months / maxMonths) * 100, 100)}%`,
                height: "100%", background: GREEN, borderRadius: 4,
                transition: "width 0.3s",
              }} />
            </div>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>{fixedResult.months} months</p>
          </div>
        </div>

        {/* The kicker */}
        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: 12, padding: "18px 20px", marginBottom: 28,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#c2410c", marginBottom: 6 }}>
            Minimum payments cost you ${Math.round(minResult.totalInterest - fixedResult.totalInterest).toLocaleString()} more
            and {Math.round((minResult.months - fixedResult.months) / 12 * 10) / 10} extra years of your life.
          </p>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
            The minimum payment isn&apos;t designed to help you get out of debt.
            It&apos;s designed to keep you in it as long as possible.
          </p>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Now let&apos;s document your actual credit picture so it never sneaks up on you.
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

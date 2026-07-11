"use client";

import { useState } from "react";
import BankingNarrativeLesson from "../lessons/BankingNarrativeLesson";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#0891b2";
const GREEN  = "#16a34a";

const YEARS = 5;
const HYSA_RATE = 0.0475;
const REGULAR_RATE = 0.0001;

function futureValue(monthly: number, rate: number, years: number) {
  const r = rate / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export default function BankingHook({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<"interactive" | "terms">("interactive");
  const [monthly, setMonthly] = useState(200);

  if (step === "terms") return <BankingNarrativeLesson onReady={onReady} />;

  const regularFV = futureValue(monthly, REGULAR_RATE, YEARS);
  const hysaFV = futureValue(monthly, HYSA_RATE, YEARS);
  const diff = hysaFV - regularFV;
  const principal = monthly * 12 * YEARS;

  const maxFV = hysaFV;
  const regularPct = (regularFV / maxFV) * 100;

  return (
    <div>
      <style>{`
        .lb-cta { transition: opacity 0.15s ease, transform 0.15s ease; }
        .lb-cta:hover { opacity: 0.87; transform: translateY(-1px); }
        .lb-cta:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
      `}</style>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          The $10,000 Experiment
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          A regular savings account earns 0.01% APY. A high-yield savings account earns 4.75%.
          Same money. Same effort. Wildly different result.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "28px" }}>

          {/* Slider */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: INK }}>Monthly savings</label>
              <span style={{ fontSize: 22, fontWeight: 800, color: ACCENT }}>${monthly}</span>
            </div>
            <input
              type="range" min={50} max={500} step={25}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              style={{ width: "100%", accentColor: ACCENT }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED, marginTop: 4 }}>
              <span>$50/mo</span>
              <span>$500/mo</span>
            </div>
          </div>

          {/* Comparison bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>

            {/* Regular savings */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>Regular Savings Account</span>
                  <span style={{ fontSize: 12, color: MUTED, marginLeft: 6 }}>0.01% APY</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>${Math.round(regularFV).toLocaleString()}</span>
              </div>
              <div style={{ height: 24, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 6,
                  background: "#94a3b8",
                  width: `${regularPct}%`,
                  transition: "width 0.3s",
                  display: "flex", alignItems: "center", paddingLeft: 8,
                }}>
                  {regularPct > 30 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>barely earns interest</span>}
                </div>
              </div>
            </div>

            {/* HYSA */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>High-Yield Savings (HYSA)</span>
                  <span style={{ fontSize: 12, color: ACCENT, marginLeft: 6, fontWeight: 600 }}>4.75% APY</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: GREEN }}>${Math.round(hysaFV).toLocaleString()}</span>
              </div>
              <div style={{ height: 24, background: "#f1f5f9", borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 6,
                  background: GREEN,
                  width: "100%",
                  display: "flex", alignItems: "center", paddingLeft: 8,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
                    ${Math.round(hysaFV - principal).toLocaleString()} in interest earned
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Difference callout */}
          <div style={{
            background: GREEN + "10", border: `1px solid ${GREEN}44`,
            borderRadius: 10, padding: "16px 18px",
          }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: GREEN, marginBottom: 4 }}>
              +${Math.round(diff).toLocaleString()} in free money over {YEARS} years
            </p>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
              Same ${monthly}/month contribution. Same {YEARS} years. The only difference is which bank holds your money.
              A HYSA takes 5 minutes to open online.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Now let&apos;s pick your actual checking and savings accounts.
          </p>
          <button
            className="lb-cta"
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

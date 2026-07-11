"use client";

import { useState } from "react";
import InvestingNarrativeLesson from "../lessons/InvestingNarrativeLesson";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#65a30d";
const GREEN  = "#16a34a";

const RATE   = 0.07;
const START_YOUNG = 22;
const START_OLD   = 32;
const END_AGE     = 65;

function compound(monthly: number, years: number, rate = RATE) {
  const r = rate / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export default function InvestingHook({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<"interactive" | "terms">("interactive");
  const [monthly, setMonthly] = useState(200);

  if (step === "terms") return <InvestingNarrativeLesson onReady={onReady} />;

  const alexYears  = END_AGE - START_YOUNG;
  const jordanYears = END_AGE - START_OLD;

  const alexTotal  = compound(monthly, alexYears);
  const jordanTotal = compound(monthly, jordanYears);
  const gap = alexTotal - jordanTotal;

  // Build SVG chart data points (every 2 years)
  const W = 500, H = 200, PL = 50, PR = 16, PT = 12, PB = 28;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;

  const alexPoints: { age: number; val: number }[] = [];
  const jordanPoints: { age: number; val: number }[] = [];

  for (let age = 22; age <= END_AGE; age += 2) {
    const a = Math.max(0, age - START_YOUNG);
    const j = Math.max(0, age - START_OLD);
    alexPoints.push({ age, val: compound(monthly, a) });
    jordanPoints.push({ age, val: j > 0 ? compound(monthly, j) : 0 });
  }

  const maxVal = alexTotal * 1.05;
  const xScale = (age: number) => PL + ((age - 22) / (END_AGE - 22)) * plotW;
  const yScale = (val: number) => PT + (1 - val / maxVal) * plotH;

  const toPoints = (pts: { age: number; val: number }[]) =>
    pts.map((p) => `${xScale(p.age)},${yScale(p.val)}`).join(" ");

  const fmtK = (n: number) => n >= 1000000
    ? `$${(n / 1000000).toFixed(2)}M`
    : `$${Math.round(n / 1000)}K`;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          The Decade Visualizer
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          Alex and Jordan invest the same amount at 7% average return. Alex starts at 22. Jordan waits until 32. Drag the slider to see how much the 10-year delay costs.
        </p>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "24px 24px 20px", marginBottom: 20 }}>

          {/* Slider */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: INK }}>Monthly contribution</label>
              <span style={{ fontSize: 22, fontWeight: 800, color: ACCENT }}>${monthly}/mo</span>
            </div>
            <input
              type="range" min={50} max={800} step={25}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              style={{ width: "100%", accentColor: ACCENT }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED, marginTop: 4 }}>
              <span>$50/mo</span><span>$800/mo</span>
            </div>
          </div>

          {/* SVG chart */}
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
            {/* Axes */}
            <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke={BORDER} strokeWidth={1} />
            <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke={BORDER} strokeWidth={1} />

            {/* Y labels */}
            <text x={PL - 4} y={PT + 6} fontSize={9} fill={MUTED} textAnchor="end">{fmtK(maxVal)}</text>
            <text x={PL - 4} y={H - PB + 1} fontSize={9} fill={MUTED} textAnchor="end">$0</text>

            {/* X labels */}
            <text x={PL} y={H - 4} fontSize={9} fill={MUTED}>22</text>
            <text x={xScale(32)} y={H - 4} fontSize={9} fill={MUTED} textAnchor="middle">32</text>
            <text x={W - PR} y={H - 4} fontSize={9} fill={MUTED} textAnchor="end">65</text>

            {/* Jordan starts at 32 — dotted marker */}
            <line x1={xScale(32)} y1={PT} x2={xScale(32)} y2={H - PB} stroke={MUTED} strokeWidth={1} strokeDasharray="3,3" />

            {/* Lines */}
            <polyline points={toPoints(alexPoints)} fill="none" stroke={GREEN} strokeWidth={2.5} />
            <polyline points={toPoints(jordanPoints)} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5,3" />

            {/* End dots */}
            <circle cx={xScale(END_AGE)} cy={yScale(alexTotal)} r={4} fill={GREEN} />
            <circle cx={xScale(END_AGE)} cy={yScale(jordanTotal)} r={4} fill="#94a3b8" />

            {/* Legend */}
            <circle cx={PL + 10} cy={PT + 8} r={3} fill={GREEN} />
            <text x={PL + 17} y={PT + 12} fontSize={9} fill={INK}>Alex (starts at 22)</text>
            <circle cx={PL + 10} cy={PT + 22} r={3} fill="#94a3b8" />
            <text x={PL + 17} y={PT + 26} fontSize={9} fill={MUTED}>Jordan (starts at 32)</text>
          </svg>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: GREEN + "0f", border: `1px solid ${GREEN}44`, borderRadius: 10, padding: "14px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Alex at 65</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: GREEN }}>{fmtK(alexTotal)}</p>
          </div>
          <div style={{ background: "#f8fafc", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Jordan at 65</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: MUTED }}>{fmtK(jordanTotal)}</p>
          </div>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>The 10-yr delay costs</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>{fmtK(gap)}</p>
          </div>
        </div>

        <div style={{ padding: "14px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, marginBottom: 28, fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
          <strong>The gap isn&apos;t bigger contributions.</strong> Both invest ${monthly}/month at 7%. The difference is 10 years of compounding. Time is the only ingredient you can&apos;t buy back.
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Now set up YOUR investing plan — starting today.
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

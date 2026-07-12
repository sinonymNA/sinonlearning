"use client";

import { useState } from "react";

const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG = "#f8fafc";

interface Props {
  accent: string;
}

function calcValue(rate: number, years: number): number {
  return 10000 * Math.pow(1 - rate / 100, years);
}

export default function InflationEroderHook({ accent }: Props) {
  const [rate, setRate] = useState(3);

  const v10 = calcValue(rate, 10);
  const v20 = calcValue(rate, 20);
  const v30 = calcValue(rate, 30);

  // SVG line: 31 points (year 0..30)
  const W = 300;
  const H = 120;
  const points = Array.from({ length: 31 }, (_, yr) => {
    const x = (yr / 30) * W;
    const y = H - (calcValue(rate, yr) / 10000) * H;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{
      background: BG, border: `1px solid ${BORDER}`,
      borderRadius: 14, padding: "24px",
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: accent,
        letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4,
      }}>
        Try It: Inflation Eroder
      </p>
      <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
        Your $10,000 today. Drag the inflation rate to see how much buying power you lose over 30 years.
      </p>

      {/* Rate slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: INK }}>
            Annual Inflation Rate
          </label>
          <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{rate}%</span>
        </div>
        <input
          type="range" min={1} max={10} step={0.5}
          value={rate}
          onChange={e => setRate(Number(e.target.value))}
          style={{ width: "100%", accentColor: accent }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: MUTED }}>1% (low)</span>
          <span style={{ fontSize: 11, color: MUTED }}>10% (very high)</span>
        </div>
      </div>

      {/* SVG chart */}
      <div style={{ marginBottom: 20, overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%", minWidth: 260 }}>
          {/* Axes */}
          <line x1={0} y1={H} x2={W} y2={H} stroke={BORDER} strokeWidth={1} />
          {/* Decay curve */}
          <polyline
            points={points}
            fill="none"
            stroke={accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Axis labels */}
          <text x={0} y={H + 16} fontSize={9} fill={MUTED}>0 yrs</text>
          <text x={W / 2 - 12} y={H + 16} fontSize={9} fill={MUTED}>15 yrs</text>
          <text x={W - 24} y={H + 16} fontSize={9} fill={MUTED}>30 yrs</text>
          <text x={2} y={10} fontSize={9} fill={MUTED}>$10,000</text>
        </svg>
      </div>

      {/* Callout boxes */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "After 10 years", value: v10 },
          { label: "After 20 years", value: v20 },
          { label: "After 30 years", value: v30 },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: "1 1 80px",
            background: "#fff", border: `1px solid ${BORDER}`,
            borderRadius: 10, padding: "12px 14px", textAlign: "center",
          }}>
            <p style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: value < 5000 ? "#dc2626" : INK, lineHeight: 1 }}>
              ${Math.round(value).toLocaleString()}
            </p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
              in today&apos;s dollars
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const MUTED = "#64748b";
const FAINT = "#94a3b8";
const BORDER = "#e2e8f0";
const BG = "#f8fafc";
const GAIN = "#16a34a";
const LOSS = "#dc2626";

const PERIODS = ["1W", "1M", "3M", "6M", "1Y"] as const;
type Period = (typeof PERIODS)[number];

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

const W = 600;
const H = 130;
const PAD = { t: 14, r: 56, b: 14, l: 6 };

export default function StockChart({ ticker }: { ticker: string }) {
  const [period, setPeriod] = useState<Period>("1M");
  const [closes, setCloses] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const load = useCallback(async (sym: string, p: Period) => {
    setLoading(true);
    setCloses([]);
    try {
      const res = await fetch(`/api/stocks/candles?ticker=${sym}&period=${p}`);
      const data = await res.json();
      setCloses(data.closes ?? []);
      setTimestamps(data.timestamps ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(ticker, period); }, [ticker, period, load]);

  const n = closes.length;
  const isUp = n > 1 && closes[n - 1] >= closes[0];
  const color = isUp ? GAIN : LOSS;
  const changePct = n > 1 ? ((closes[n - 1] - closes[0]) / closes[0]) * 100 : null;
  const hoverPrice = hoverIdx !== null ? closes[hoverIdx] : null;
  const hoverDate = hoverIdx !== null && timestamps[hoverIdx]
    ? new Date(timestamps[hoverIdx] * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const minP = n ? Math.min(...closes) : 0;
  const maxP = n ? Math.max(...closes) : 1;
  const range = maxP - minP || 1;

  const toX = (i: number) => PAD.l + (i / Math.max(n - 1, 1)) * (W - PAD.l - PAD.r);
  const toY = (p: number) => PAD.t + (1 - (p - minP) / range) * (H - PAD.t - PAD.b);

  const linePath = n > 1
    ? closes.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p).toFixed(1)}`).join(" ")
    : "";
  const fillPath = n > 1
    ? [
        `M ${toX(0).toFixed(1)} ${(H - PAD.b).toFixed(1)}`,
        ...closes.map((p, i) => `L ${toX(i).toFixed(1)} ${toY(p).toFixed(1)}`),
        `L ${toX(n - 1).toFixed(1)} ${(H - PAD.b).toFixed(1)}`,
        "Z",
      ].join(" ")
    : "";

  const gradId = `chart-fill-${ticker}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || n < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const chartW = W - PAD.l - PAD.r;
    const frac = Math.max(0, Math.min(1, (relX - PAD.l) / chartW));
    setHoverIdx(Math.round(frac * (n - 1)));
  };

  const hoverX = hoverIdx !== null ? toX(hoverIdx) : null;
  const hoverY = hoverIdx !== null ? toY(closes[hoverIdx]) : null;

  return (
    <div style={{ padding: "0 24px 20px" }}>
      {/* Period tabs + change */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: "4px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6,
              border: `1px solid ${period === p ? color : BORDER}`,
              background: period === p ? color + "12" : "transparent",
              color: period === p ? color : MUTED,
              cursor: "pointer", transition: "all 0.12s",
            }}
          >
            {p}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: changePct != null ? color : FAINT }}>
          {changePct != null
            ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`
            : ""}
        </span>
      </div>

      {/* Chart area */}
      <div style={{ position: "relative" }}>
        {loading && (
          <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 12, color: FAINT }}>Loading chart…</p>
          </div>
        )}

        {!loading && n < 2 && (
          <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", background: BG, borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: FAINT }}>No chart data for this period</p>
          </div>
        )}

        {!loading && n >= 2 && (
          <>
            {/* Hover tooltip */}
            {hoverPrice != null && hoverDate && (
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                background: "#0f172a", color: "#fff",
                fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "4px 10px",
                pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10,
              }}>
                ${fmt(hoverPrice)} · {hoverDate}
              </div>
            )}

            <svg
              ref={svgRef}
              width="100%"
              viewBox={`0 0 ${W} ${H}`}
              style={{ overflow: "visible", cursor: "crosshair", display: "block" }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Subtle baseline */}
              <line
                x1={PAD.l} y1={H - PAD.b}
                x2={W - PAD.r} y2={H - PAD.b}
                stroke={BORDER} strokeWidth={1}
              />

              {/* Fill */}
              <path d={fillPath} fill={`url(#${gradId})`} />

              {/* Line */}
              <path d={linePath} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />

              {/* Hover crosshair */}
              {hoverX != null && hoverY != null && (
                <>
                  <line x1={hoverX} y1={PAD.t} x2={hoverX} y2={H - PAD.b} stroke={MUTED} strokeWidth={1} strokeDasharray="3 3" />
                  <circle cx={hoverX} cy={hoverY} r={4} fill={color} stroke="#fff" strokeWidth={2} />
                </>
              )}

              {/* Price axis labels */}
              <text x={W - PAD.r + 6} y={toY(maxP) + 4} fontSize={9} fill={MUTED} fontFamily="system-ui, sans-serif">
                ${fmt(maxP)}
              </text>
              <text x={W - PAD.r + 6} y={toY(minP) + 4} fontSize={9} fill={MUTED} fontFamily="system-ui, sans-serif">
                ${fmt(minP)}
              </text>
            </svg>
          </>
        )}
      </div>
    </div>
  );
}

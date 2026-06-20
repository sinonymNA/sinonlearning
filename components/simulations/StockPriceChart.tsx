const W = 420;
const H = 200;
const PAD_L = 56;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 24;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export default function StockPriceChart({
  points,
}: {
  points: { timestamp: number; value: number }[];
}) {
  if (points.length < 2) {
    return (
      <div className="flex h-[160px] items-center justify-center text-center text-xs text-white/40">
        Keep playing to see your portfolio value over time.
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const minV = Math.min(...values) * 0.98;
  const maxV = Math.max(...values) * 1.02 || 1;
  const range = maxV - minV || 1;

  const xScale = (i: number) => PAD_L + (i / (points.length - 1)) * PLOT_W;
  const yScale = (v: number) => PAD_T + (1 - (v - minV) / range) * PLOT_H;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.value)}`).join(" ");
  const up = points[points.length - 1].value >= points[0].value;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      <line
        x1={PAD_L}
        y1={H - PAD_B}
        x2={W - PAD_R}
        y2={H - PAD_B}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />
      <text x={PAD_L - 6} y={PAD_T + 8} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
        ${maxV.toFixed(0)}
      </text>
      <text x={PAD_L - 6} y={H - PAD_B} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
        ${minV.toFixed(0)}
      </text>
      <path d={path} fill="none" stroke={up ? "#2dd4bf" : "#fb7185"} strokeWidth={2} />
    </svg>
  );
}

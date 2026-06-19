import type { TurnSnapshot } from "@/lib/stackedTypes";

const W = 420;
const H = 220;
const PAD_L = 60;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 28;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export default function StackedNetWorthChart({ history }: { history: TurnSnapshot[] }) {
  if (history.length === 0) return null;
  const maxNetWorth = Math.max(...history.map((h) => h.netWorth), 1) * 1.08;

  const xScale = (turn: number) => PAD_L + (turn / history.length) * PLOT_W;
  const yScale = (value: number) => PAD_T + (1 - value / maxNetWorth) * PLOT_H;

  const points = history.map((h) => `${xScale(h.turn)},${yScale(h.netWorth)}`).join(" ");

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
        ${Math.round(maxNetWorth).toLocaleString()}
      </text>
      <text x={PAD_L - 6} y={H - PAD_B} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
        $0
      </text>
      <text x={PAD_L} y={H - 6} fontSize="9" fill="rgba(255,255,255,0.4)">
        Age 22
      </text>
      <text x={W - PAD_R} y={H - 6} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
        Age {history[history.length - 1].age}
      </text>

      <polyline points={points} fill="none" stroke="#2dd4bf" strokeWidth={2} />
      {history.map((h) => (
        <circle key={h.turn} cx={xScale(h.turn)} cy={yScale(h.netWorth)} r={2.5} fill="#2dd4bf" />
      ))}
    </svg>
  );
}

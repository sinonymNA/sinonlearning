const W = 420;
const H = 260;
const PAD_L = 46;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 34;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

interface DemandCurveChartProps {
  intercept: number;
  slope: number;
  price: number;
  quantitySold: number;
  optimalPrice: number;
  optimalQuantity: number;
}

export default function DemandCurveChart({
  intercept,
  slope,
  price,
  quantitySold,
  optimalPrice,
  optimalQuantity,
}: DemandCurveChartProps) {
  const maxQ = Math.max(intercept, optimalQuantity, quantitySold) * 1.08 || 1;
  const priceIntercept = intercept / slope;
  const maxP = Math.max(priceIntercept, price, optimalPrice) * 1.08 || 1;

  const xScale = (q: number) => PAD_L + (Math.min(q, maxQ) / maxQ) * PLOT_W;
  const yScale = (p: number) => PAD_T + (1 - Math.min(p, maxP) / maxP) * PLOT_H;
  const priceAtQuantity = (q: number) => Math.max(0, (intercept - q) / slope);

  const curveStart = { x: xScale(0), y: yScale(priceIntercept) };
  const curveEnd = { x: xScale(intercept), y: yScale(0) };

  const clampedSold = Math.max(0, Math.min(quantitySold, intercept));
  const surplus = [
    { x: xScale(0), y: yScale(priceIntercept) },
    { x: xScale(clampedSold), y: yScale(priceAtQuantity(clampedSold)) },
    { x: xScale(clampedSold), y: yScale(price) },
    { x: xScale(0), y: yScale(price) },
  ];

  const playerPoint = { x: xScale(quantitySold), y: yScale(price) };
  const optimalPoint = { x: xScale(optimalQuantity), y: yScale(optimalPrice) };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line
          x1={PAD_L}
          y1={PAD_T}
          x2={PAD_L}
          y2={H - PAD_B}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <line
          x1={PAD_L}
          y1={H - PAD_B}
          x2={W - PAD_R}
          y2={H - PAD_B}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />

        <text x={PAD_L} y={H - 6} fontSize="9" fill="rgba(255,255,255,0.4)">
          0 cups
        </text>
        <text x={W - PAD_R} y={H - 6} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
          {Math.round(maxQ)} cups
        </text>
        <text
          x={PAD_L - 6}
          y={PAD_T + 8}
          fontSize="9"
          fill="rgba(255,255,255,0.4)"
          textAnchor="end"
        >
          ${maxP.toFixed(2)}
        </text>
        <text x={PAD_L - 6} y={H - PAD_B} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
          $0
        </text>

        {clampedSold > 0 && (
          <polygon
            points={surplus.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="#2dd4bf"
            opacity={0.18}
          />
        )}

        <line
          x1={curveStart.x}
          y1={curveStart.y}
          x2={curveEnd.x}
          y2={curveEnd.y}
          stroke="#2dd4bf"
          strokeWidth={2}
        />

        <line
          x1={optimalPoint.x}
          y1={PAD_T}
          x2={optimalPoint.x}
          y2={H - PAD_B}
          stroke="#c4b5fd"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.5}
        />
        <circle cx={optimalPoint.x} cy={optimalPoint.y} r={5} fill="#c4b5fd" />

        <circle cx={playerPoint.x} cy={playerPoint.y} r={5} fill="#fbbf24" stroke="#0d1b2e" strokeWidth={1.5} />
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Your price &amp; cups sold
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-300" />
          Profit-maximizing price
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal-400/40" />
          Consumer surplus
        </span>
      </div>
    </div>
  );
}

export function ProfitBarChart({ rounds }: { rounds: { round: number; profit: number }[] }) {
  if (rounds.length === 0) return null;
  const max = Math.max(1, ...rounds.map((r) => Math.abs(r.profit)));
  const barW = 100 / (rounds.length * 1.5);

  return (
    <svg viewBox="0 0 100 60" className="w-full" preserveAspectRatio="none">
      <line x1={0} y1={30} x2={100} y2={30} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {rounds.map((r, i) => {
        const height = (Math.abs(r.profit) / max) * 26;
        const x = i * (barW * 1.5) + barW * 0.25;
        const y = r.profit >= 0 ? 30 - height : 30;
        return (
          <rect
            key={r.round}
            x={x}
            y={y}
            width={barW}
            height={Math.max(height, 0.5)}
            fill={r.profit >= 0 ? "#2dd4bf" : "#fb7185"}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}

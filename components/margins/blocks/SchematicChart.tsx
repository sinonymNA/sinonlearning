interface Props {
  chartKind: "bar" | "line";
  caption: string;
  points: { label: string; value: number }[];
  illustrative: true;
}

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 24;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export default function SchematicChart({ chartKind, caption, points }: Props) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? PAD_X + i * step : PAD_X + plotWidth / 2;
    const y = PAD_TOP + plotHeight * (1 - p.value / max);
    return { ...p, x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const barWidth = Math.min(36, plotWidth / points.length - 12);

  return (
    <div className="mx-auto max-w-md rounded-xl border border-teal-100 bg-white p-4">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        <line x1={PAD_X} y1={PAD_TOP + plotHeight} x2={WIDTH - PAD_X} y2={PAD_TOP + plotHeight} stroke="#e7e5e4" strokeWidth="1" />
        {chartKind === "bar"
          ? coords.map((c, i) => (
              <rect
                key={i}
                x={c.x - barWidth / 2}
                y={c.y}
                width={barWidth}
                height={PAD_TOP + plotHeight - c.y}
                rx={3}
                fill="#14b8a6"
                opacity={0.85}
              />
            ))
          : (
              <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
        {chartKind === "line" &&
          coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={3.5} fill="#0d9488" />)}
        {coords.map((c, i) => (
          <text key={i} x={c.x} y={HEIGHT - 8} textAnchor="middle" fontSize="9" fill="#78716c">
            {c.label}
          </text>
        ))}
      </svg>
      <p className="mt-2 text-center text-[11px] italic text-stone-400">{caption}</p>
    </div>
  );
}

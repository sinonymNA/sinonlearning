interface Props {
  leftLabel: string;
  rightLabel: string;
  rows: { dimension: string; left: string; right: string }[];
}

export default function ComparisonChart({ leftLabel, rightLabel, rows }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="grid grid-cols-2 divide-x divide-stone-200 border-b border-stone-200">
        <p className="bg-teal-50 px-4 py-2.5 text-[13px] font-bold text-teal-700">{leftLabel}</p>
        <p className="bg-violet-50 px-4 py-2.5 text-[13px] font-bold text-violet-700">{rightLabel}</p>
      </div>
      {rows.map((row, i) => (
        <div key={i} className={`grid grid-cols-2 divide-x divide-stone-200 ${i > 0 ? "border-t border-stone-200" : ""}`}>
          <div className="px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">{row.dimension}</p>
            <p className="text-[13px] leading-relaxed text-stone-700">{row.left}</p>
          </div>
          <div className="px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">{row.dimension}</p>
            <p className="text-[13px] leading-relaxed text-stone-700">{row.right}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

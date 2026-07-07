"use client";

export interface ReelBuildInput {
  topic: string;
  audience: string;
  keyPoints: string;
  length: string;
  notes: string;
}

export function defaultReelBuildInput(): ReelBuildInput {
  return { topic: "", audience: "", keyPoints: "", length: "Medium (~8 beats)", notes: "" };
}

export default function ReelBuildInputForm({
  value,
  onChange,
}: {
  value: ReelBuildInput;
  onChange: (v: ReelBuildInput) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Topic</span>
        <input
          value={value.topic}
          onChange={(e) => onChange({ ...value, topic: e.target.value })}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Audience</span>
        <input
          value={value.audience}
          onChange={(e) => onChange({ ...value, audience: e.target.value })}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Key points</span>
        <textarea
          value={value.keyPoints}
          onChange={(e) => onChange({ ...value, keyPoints: e.target.value })}
          rows={3}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Length</span>
        <select
          value={value.length}
          onChange={(e) => onChange({ ...value, length: e.target.value })}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        >
          <option>Short (~5 beats)</option>
          <option>Medium (~8 beats)</option>
          <option>Long (~12 beats)</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Notes (optional)</span>
        <input
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
    </div>
  );
}

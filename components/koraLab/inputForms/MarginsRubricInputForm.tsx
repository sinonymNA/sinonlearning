"use client";

export interface MarginsRubricInput {
  essayType: "DBQ" | "LEQ" | "SAQ";
  topic: string;
}

export function defaultMarginsRubricInput(): MarginsRubricInput {
  return { essayType: "LEQ", topic: "" };
}

export default function MarginsRubricInputForm({
  value,
  onChange,
}: {
  value: MarginsRubricInput;
  onChange: (v: MarginsRubricInput) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Essay type</span>
        <select
          value={value.essayType}
          onChange={(e) => onChange({ ...value, essayType: e.target.value as MarginsRubricInput["essayType"] })}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        >
          <option value="DBQ">DBQ</option>
          <option value="LEQ">LEQ</option>
          <option value="SAQ">SAQ</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Topic / unit</span>
        <input
          value={value.topic}
          onChange={(e) => onChange({ ...value, topic: e.target.value })}
          placeholder="e.g. The Columbian Exchange"
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
    </div>
  );
}

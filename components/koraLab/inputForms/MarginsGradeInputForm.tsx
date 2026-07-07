"use client";

import { useState } from "react";

export interface MarginsGradeInput {
  essayType: string;
  promptText: string;
  rubric: { category: string; points_possible: number; description: string }[];
  essayText: string;
}

export function defaultMarginsGradeInput(): MarginsGradeInput {
  return {
    essayType: "LEQ",
    promptText: "",
    rubric: [{ category: "Thesis", points_possible: 1, description: "" }],
    essayText: "",
  };
}

// Rubric is JSON-edited (a power-user affordance) rather than a bespoke
// repeating-row editor — this is an internal admin tool used by one person
// who already knows the shape, so the tradeoff favors shipping speed here.
export default function MarginsGradeInputForm({
  value,
  onChange,
}: {
  value: MarginsGradeInput;
  onChange: (v: MarginsGradeInput) => void;
}) {
  const [rubricText, setRubricText] = useState(() => JSON.stringify(value.rubric, null, 2));
  const [rubricError, setRubricError] = useState<string | null>(null);

  function handleRubricChange(text: string) {
    setRubricText(text);
    try {
      const parsed = JSON.parse(text);
      setRubricError(null);
      onChange({ ...value, rubric: parsed });
    } catch {
      setRubricError("Invalid JSON");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Essay type</span>
        <input
          value={value.essayType}
          onChange={(e) => onChange({ ...value, essayType: e.target.value })}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Prompt</span>
        <textarea
          value={value.promptText}
          onChange={(e) => onChange({ ...value, promptText: e.target.value })}
          rows={2}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">
          Rubric (JSON array of category/points_possible/description)
        </span>
        <textarea
          value={rubricText}
          onChange={(e) => handleRubricChange(e.target.value)}
          rows={6}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 font-mono text-xs text-navy-900 outline-none focus:border-teal-500/50"
        />
        {rubricError && <span className="text-xs text-rose-600">{rubricError}</span>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Student essay text</span>
        <textarea
          value={value.essayText}
          onChange={(e) => onChange({ ...value, essayText: e.target.value })}
          rows={8}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
    </div>
  );
}

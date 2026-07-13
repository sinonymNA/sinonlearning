"use client";

import { Plus, Trash2 } from "lucide-react";
import type { WheelPayload } from "@/lib/gameShowTypes";

const INPUT = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-50";
const TRASH = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500";
const ADD_ROW = "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600";

export default function WheelEditor({
  data,
  onChange,
}: {
  data: WheelPayload;
  onChange: (data: WheelPayload) => void;
}) {
  const addRound = () => {
    onChange({ rounds: [...data.rounds, { category: "Category", phrase: "", hint: "" }] });
  };

  const removeRound = (ri: number) => {
    onChange({ rounds: data.rounds.filter((_, i) => i !== ri) });
  };

  const updateRound = (ri: number, field: "category" | "phrase" | "hint", value: string) => {
    onChange({
      rounds: data.rounds.map((r, i) => (i === ri ? { ...r, [field]: value } : r)),
    });
  };

  return (
    <div className="space-y-4">
      {data.rounds.map((round, ri) => (
        <div key={ri} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <input
              value={round.category}
              onChange={(e) => updateRound(ri, "category", e.target.value)}
              placeholder="Category (e.g. Vocabulary Word)"
              className={`flex-1 font-semibold ${INPUT}`}
            />
            <button onClick={() => removeRound(ri)} aria-label="Remove round" className={TRASH}>
              <Trash2 size={14} />
            </button>
          </div>
          <input
            value={round.phrase}
            onChange={(e) => updateRound(ri, "phrase", e.target.value.toUpperCase())}
            placeholder="Phrase to guess letter by letter"
            className={`mt-3 w-full uppercase tracking-wide ${INPUT}`}
          />
          <input
            value={round.hint ?? ""}
            onChange={(e) => updateRound(ri, "hint", e.target.value)}
            placeholder="Optional hint shown alongside the puzzle"
            className={`mt-3 w-full ${INPUT}`}
          />
        </div>
      ))}

      <button onClick={addRound} className={ADD_ROW}>
        <Plus size={14} />
        Add round
      </button>
    </div>
  );
}

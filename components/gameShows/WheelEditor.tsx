"use client";

import { Plus, Trash2 } from "lucide-react";
import type { WheelPayload } from "@/lib/gameShowTypes";

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
        <div key={ri} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <input
              value={round.category}
              onChange={(e) => updateRound(ri, "category", e.target.value)}
              placeholder="Category (e.g. Vocabulary Word)"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white placeholder:text-white/30 focus:border-purple-300/50 focus:outline-none"
            />
            <button
              onClick={() => removeRound(ri)}
              aria-label="Remove round"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-rose-300"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <input
            value={round.phrase}
            onChange={(e) => updateRound(ri, "phrase", e.target.value.toUpperCase())}
            placeholder="Phrase to guess letter by letter"
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm uppercase tracking-wide text-white placeholder:text-white/30 placeholder:normal-case focus:border-purple-300/50 focus:outline-none"
          />
          <input
            value={round.hint ?? ""}
            onChange={(e) => updateRound(ri, "hint", e.target.value)}
            placeholder="Optional hint shown alongside the puzzle"
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-300/50 focus:outline-none"
          />
        </div>
      ))}

      <button
        onClick={addRound}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Plus size={14} />
        Add round
      </button>
    </div>
  );
}

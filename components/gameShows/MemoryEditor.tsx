"use client";

import { Plus, Trash2 } from "lucide-react";
import type { MemoryPayload } from "@/lib/gameShowTypes";

export default function MemoryEditor({
  data,
  onChange,
}: {
  data: MemoryPayload;
  onChange: (data: MemoryPayload) => void;
}) {
  const addPair = () => {
    onChange({ pairs: [...data.pairs, { term: "", definition: "" }] });
  };

  const removePair = (pi: number) => {
    onChange({ pairs: data.pairs.filter((_, i) => i !== pi) });
  };

  const updatePair = (pi: number, field: "term" | "definition", value: string) => {
    onChange({
      pairs: data.pairs.map((p, i) => (i === pi ? { ...p, [field]: value } : p)),
    });
  };

  return (
    <div className="space-y-3">
      {data.pairs.map((pair, pi) => (
        <div key={pi} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
          <input
            value={pair.term}
            onChange={(e) => updatePair(pi, "term", e.target.value)}
            placeholder="Term"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-300/50 focus:outline-none"
          />
          <input
            value={pair.definition}
            onChange={(e) => updatePair(pi, "definition", e.target.value)}
            placeholder="Definition"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-300/50 focus:outline-none"
          />
          <button
            onClick={() => removePair(pi)}
            aria-label="Remove pair"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-rose-300"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        onClick={addPair}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Plus size={14} />
        Add pair
      </button>
    </div>
  );
}

"use client";

import { Plus, Trash2 } from "lucide-react";
import type { MemoryPayload } from "@/lib/gameShowTypes";

const INPUT = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-50";
const TRASH = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500";
const ADD_ROW = "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600";

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
            className={INPUT}
          />
          <input
            value={pair.definition}
            onChange={(e) => updatePair(pi, "definition", e.target.value)}
            placeholder="Definition"
            className={INPUT}
          />
          <button onClick={() => removePair(pi)} aria-label="Remove pair" className={TRASH}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button onClick={addPair} className={ADD_ROW}>
        <Plus size={14} />
        Add pair
      </button>
    </div>
  );
}

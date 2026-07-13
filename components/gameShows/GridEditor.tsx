"use client";

import { Plus, Trash2 } from "lucide-react";
import type { GridPayload } from "@/lib/gameShowTypes";

const INPUT = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-50";
const TRASH = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500";
const ADD_INLINE = "mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800";
const ADD_ROW = "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600";

export default function GridEditor({
  data,
  onChange,
}: {
  data: GridPayload;
  onChange: (data: GridPayload) => void;
}) {
  const addCategory = () => {
    onChange({
      categories: [
        ...data.categories,
        { name: `Category ${data.categories.length + 1}`, clues: [{ value: 100, question: "", answer: "" }] },
      ],
    });
  };

  const removeCategory = (ci: number) => {
    onChange({ categories: data.categories.filter((_, i) => i !== ci) });
  };

  const renameCategory = (ci: number, name: string) => {
    onChange({
      categories: data.categories.map((c, i) => (i === ci ? { ...c, name } : c)),
    });
  };

  const addClue = (ci: number) => {
    onChange({
      categories: data.categories.map((c, i) => {
        if (i !== ci) return c;
        const nextValue = (c.clues[c.clues.length - 1]?.value ?? 0) + 100;
        return { ...c, clues: [...c.clues, { value: nextValue, question: "", answer: "" }] };
      }),
    });
  };

  const removeClue = (ci: number, qi: number) => {
    onChange({
      categories: data.categories.map((c, i) =>
        i === ci ? { ...c, clues: c.clues.filter((_, j) => j !== qi) } : c
      ),
    });
  };

  const updateClue = (ci: number, qi: number, field: "value" | "question" | "answer", value: string) => {
    onChange({
      categories: data.categories.map((c, i) => {
        if (i !== ci) return c;
        return {
          ...c,
          clues: c.clues.map((clue, j) =>
            j === qi ? { ...clue, [field]: field === "value" ? Number(value) || 0 : value } : clue
          ),
        };
      }),
    });
  };

  return (
    <div className="space-y-5">
      {data.categories.map((category, ci) => (
        <div key={ci} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <input
              value={category.name}
              onChange={(e) => renameCategory(ci, e.target.value)}
              placeholder="Category name"
              className={`flex-1 font-semibold ${INPUT}`}
            />
            <button onClick={() => removeCategory(ci)} aria-label="Remove category" className={TRASH}>
              <Trash2 size={14} />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {category.clues.map((clue, qi) => (
              <div key={qi} className="grid grid-cols-[80px_1fr_1fr_auto] items-start gap-2">
                <input
                  type="number"
                  value={clue.value}
                  onChange={(e) => updateClue(ci, qi, "value", e.target.value)}
                  className={INPUT}
                />
                <textarea
                  value={clue.question}
                  onChange={(e) => updateClue(ci, qi, "question", e.target.value)}
                  placeholder="Question shown first"
                  rows={2}
                  className={INPUT}
                />
                <textarea
                  value={clue.answer}
                  onChange={(e) => updateClue(ci, qi, "answer", e.target.value)}
                  placeholder="Answer revealed after"
                  rows={2}
                  className={INPUT}
                />
                <button onClick={() => removeClue(ci, qi)} aria-label="Remove clue" className={TRASH}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => addClue(ci)} className={ADD_INLINE}>
            <Plus size={13} />
            Add clue
          </button>
        </div>
      ))}

      <button onClick={addCategory} className={ADD_ROW}>
        <Plus size={14} />
        Add category
      </button>
    </div>
  );
}

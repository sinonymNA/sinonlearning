"use client";

import { Plus, Trash2 } from "lucide-react";
import type { FeudPayload } from "@/lib/gameShowTypes";

const INPUT = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-50";
const TRASH = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500";
const ADD_INLINE = "mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800";
const ADD_ROW = "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600";

export default function FeudEditor({
  data,
  onChange,
}: {
  data: FeudPayload;
  onChange: (data: FeudPayload) => void;
}) {
  const addRound = () => {
    onChange({ rounds: [...data.rounds, { prompt: "", answers: [{ text: "", points: 10 }] }] });
  };

  const removeRound = (ri: number) => {
    onChange({ rounds: data.rounds.filter((_, i) => i !== ri) });
  };

  const updatePrompt = (ri: number, prompt: string) => {
    onChange({ rounds: data.rounds.map((r, i) => (i === ri ? { ...r, prompt } : r)) });
  };

  const addAnswer = (ri: number) => {
    onChange({
      rounds: data.rounds.map((r, i) =>
        i === ri ? { ...r, answers: [...r.answers, { text: "", points: 10 }] } : r
      ),
    });
  };

  const removeAnswer = (ri: number, ai: number) => {
    onChange({
      rounds: data.rounds.map((r, i) =>
        i === ri ? { ...r, answers: r.answers.filter((_, j) => j !== ai) } : r
      ),
    });
  };

  const updateAnswer = (ri: number, ai: number, field: "text" | "points", value: string) => {
    onChange({
      rounds: data.rounds.map((r, i) => {
        if (i !== ri) return r;
        return {
          ...r,
          answers: r.answers.map((a, j) =>
            j === ai ? { ...a, [field]: field === "points" ? Number(value) || 0 : value } : a
          ),
        };
      }),
    });
  };

  return (
    <div className="space-y-5">
      {data.rounds.map((round, ri) => (
        <div key={ri} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <input
              value={round.prompt}
              onChange={(e) => updatePrompt(ri, e.target.value)}
              placeholder="Prompt (e.g. Name something you'd find in a science lab)"
              className={`flex-1 font-semibold ${INPUT}`}
            />
            <button onClick={() => removeRound(ri)} aria-label="Remove round" className={TRASH}>
              <Trash2 size={14} />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {round.answers.map((answer, ai) => (
              <div key={ai} className="grid grid-cols-[1fr_90px_auto] items-center gap-2">
                <input
                  value={answer.text}
                  onChange={(e) => updateAnswer(ri, ai, "text", e.target.value)}
                  placeholder={`Answer ${ai + 1}`}
                  className={INPUT}
                />
                <input
                  type="number"
                  value={answer.points}
                  onChange={(e) => updateAnswer(ri, ai, "points", e.target.value)}
                  className={INPUT}
                />
                <button onClick={() => removeAnswer(ri, ai)} aria-label="Remove answer" className={TRASH}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => addAnswer(ri)} className={ADD_INLINE}>
            <Plus size={13} />
            Add answer
          </button>
        </div>
      ))}

      <button onClick={addRound} className={ADD_ROW}>
        <Plus size={14} />
        Add round
      </button>
    </div>
  );
}

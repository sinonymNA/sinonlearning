"use client";

import { Plus, Trash2 } from "lucide-react";
import type { FeudPayload } from "@/lib/gameShowTypes";

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
    <div className="space-y-6">
      {data.rounds.map((round, ri) => (
        <div key={ri} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <input
              value={round.prompt}
              onChange={(e) => updatePrompt(ri, e.target.value)}
              placeholder="Prompt (e.g. Name something you'd find in a science lab)"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white placeholder:text-white/30 focus:border-amber-300/50 focus:outline-none"
            />
            <button
              onClick={() => removeRound(ri)}
              aria-label="Remove round"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-rose-300"
            >
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
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-300/50 focus:outline-none"
                />
                <input
                  type="number"
                  value={answer.points}
                  onChange={(e) => updateAnswer(ri, ai, "points", e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white focus:border-amber-300/50 focus:outline-none"
                />
                <button
                  onClick={() => removeAnswer(ri, ai)}
                  aria-label="Remove answer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-rose-300"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addAnswer(ri)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-300 transition-colors hover:text-amber-200"
          >
            <Plus size={13} />
            Add answer
          </button>
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

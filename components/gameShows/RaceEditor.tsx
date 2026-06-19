"use client";

import { Plus, Trash2 } from "lucide-react";
import type { RacePayload } from "@/lib/gameShowTypes";

export default function RaceEditor({
  data,
  onChange,
}: {
  data: RacePayload;
  onChange: (data: RacePayload) => void;
}) {
  const addQuestion = () => {
    onChange({
      questions: [
        ...data.questions,
        { question: "", choices: ["", "", "", ""], correctIndex: 0, points: 100 },
      ],
    });
  };

  const removeQuestion = (qi: number) => {
    onChange({ questions: data.questions.filter((_, i) => i !== qi) });
  };

  const updateQuestion = (qi: number, question: string) => {
    onChange({ questions: data.questions.map((q, i) => (i === qi ? { ...q, question } : q)) });
  };

  const updateChoice = (qi: number, ci: number, value: string) => {
    onChange({
      questions: data.questions.map((q, i) =>
        i === qi ? { ...q, choices: q.choices.map((c, j) => (j === ci ? value : c)) } : q
      ),
    });
  };

  const setCorrect = (qi: number, ci: number) => {
    onChange({
      questions: data.questions.map((q, i) => (i === qi ? { ...q, correctIndex: ci } : q)),
    });
  };

  const updatePoints = (qi: number, value: string) => {
    onChange({
      questions: data.questions.map((q, i) =>
        i === qi ? { ...q, points: Number(value) || 0 } : q
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.questions.map((q, qi) => (
        <div key={qi} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <input
              value={q.question}
              onChange={(e) => updateQuestion(qi, e.target.value)}
              placeholder={`Question ${qi + 1}`}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white placeholder:text-white/30 focus:border-rose-300/50 focus:outline-none"
            />
            <input
              type="number"
              value={q.points ?? 100}
              onChange={(e) => updatePoints(qi, e.target.value)}
              className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white focus:border-rose-300/50 focus:outline-none"
            />
            <button
              onClick={() => removeQuestion(qi)}
              aria-label="Remove question"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-rose-300"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {q.choices.map((choice, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <button
                  onClick={() => setCorrect(qi, ci)}
                  aria-label="Mark as correct answer"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                    q.correctIndex === ci
                      ? "border-rose-300/60 bg-rose-400/20 text-rose-200"
                      : "border-white/10 bg-white/5 text-white/40 hover:text-white/70"
                  }`}
                >
                  {String.fromCharCode(65 + ci)}
                </button>
                <input
                  value={choice}
                  onChange={(e) => updateChoice(qi, ci, e.target.value)}
                  placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-rose-300/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-white/40">Click the letter to mark the correct choice.</p>
        </div>
      ))}

      <button
        onClick={addQuestion}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Plus size={14} />
        Add question
      </button>
    </div>
  );
}

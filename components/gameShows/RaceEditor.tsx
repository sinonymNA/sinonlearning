"use client";

import { Plus, Trash2 } from "lucide-react";
import type { RacePayload } from "@/lib/gameShowTypes";

const INPUT = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-50";
const TRASH = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500";
const ADD_ROW = "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600";

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
        <div key={qi} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <input
              value={q.question}
              onChange={(e) => updateQuestion(qi, e.target.value)}
              placeholder={`Question ${qi + 1}`}
              className={`flex-1 font-semibold ${INPUT}`}
            />
            <input
              type="number"
              value={q.points ?? 100}
              onChange={(e) => updatePoints(qi, e.target.value)}
              className={`w-20 ${INPUT}`}
            />
            <button onClick={() => removeQuestion(qi)} aria-label="Remove question" className={TRASH}>
              <Trash2 size={14} />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {q.choices.map((choice, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <button
                  onClick={() => setCorrect(qi, ci)}
                  aria-label="Mark as correct answer"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-colors ${
                    q.correctIndex === ci
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {String.fromCharCode(65 + ci)}
                </button>
                <input
                  value={choice}
                  onChange={(e) => updateChoice(qi, ci, e.target.value)}
                  placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                  className={`flex-1 ${INPUT}`}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Click the letter to mark the correct choice.</p>
        </div>
      ))}

      <button onClick={addQuestion} className={ADD_ROW}>
        <Plus size={14} />
        Add question
      </button>
    </div>
  );
}

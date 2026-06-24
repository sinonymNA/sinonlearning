"use client";

import { Plus, Trash2 } from "lucide-react";
import { createWorksheetQuestion } from "@/lib/studioDefaults";
import type {
  PreviewAudience,
  WorksheetDifficulty,
  WorksheetQuestion,
  WorksheetQuestionType,
  WorksheetSection,
} from "@/lib/studioTypes";

interface WorksheetPreviewProps {
  section: WorksheetSection;
  audience: PreviewAudience;
  onChange: (patch: Partial<WorksheetSection>) => void;
}

const QUESTION_TYPES: { value: WorksheetQuestionType; label: string }[] = [
  { value: "shortAnswer", label: "Short answer" },
  { value: "multipleChoice", label: "Multiple choice" },
  { value: "trueFalse", label: "True / False" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "constructedResponse", label: "Constructed response" },
];

export default function WorksheetPreview({ section, audience, onChange }: WorksheetPreviewProps) {
  const updateQuestion = (questionId: string, patch: Partial<WorksheetQuestion>) => {
    onChange({
      questions: section.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
    });
  };

  const setAnswer = (questionId: string, answer: string) => {
    onChange({ answerKey: { ...section.answerKey, [questionId]: answer } });
  };

  const addQuestion = () => {
    onChange({ questions: [...section.questions, createWorksheetQuestion()] });
  };

  const removeQuestion = (questionId: string) => {
    const answerKey = { ...section.answerKey };
    delete answerKey[questionId];
    onChange({
      questions: section.questions.filter((q) => q.id !== questionId),
      answerKey,
    });
  };

  return (
    <div className="glass-panel rounded-3xl border border-navy-900/8 p-6 sm:p-8">
      <input
        value={section.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Section title"
        className="w-full bg-transparent font-display text-2xl text-navy-900 focus-visible:outline-none"
      />
      <textarea
        value={section.directions}
        onChange={(e) => onChange({ directions: e.target.value })}
        placeholder="Directions for students"
        rows={2}
        className="mt-2 w-full resize-none bg-transparent text-sm text-navy-700/70 focus-visible:outline-none"
      />

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5 text-navy-700/60">
          Difficulty
          <select
            value={section.difficulty}
            onChange={(e) => onChange({ difficulty: e.target.value as WorksheetDifficulty })}
            className="rounded-lg border border-navy-900/10 bg-white px-2 py-1"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-navy-700/60">
          Response lines
          <input
            type="number"
            min={0}
            max={20}
            value={section.responseSpaceLines}
            onChange={(e) => onChange({ responseSpaceLines: Number(e.target.value) || 0 })}
            className="w-14 rounded-lg border border-navy-900/10 bg-white px-2 py-1"
          />
        </label>
      </div>

      <div className="mt-5 space-y-4">
        {section.questions.map((question, index) => (
          <div key={question.id} className="rounded-2xl border border-navy-900/8 bg-white/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-navy-700/50">Question {index + 1}</span>
              <div className="flex items-center gap-2">
                <select
                  value={question.type}
                  onChange={(e) =>
                    updateQuestion(question.id, { type: e.target.value as WorksheetQuestionType })
                  }
                  className="rounded-lg border border-navy-900/10 bg-white px-2 py-1 text-xs"
                >
                  {QUESTION_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  aria-label="Remove question"
                  className="text-navy-700/40 hover:text-rose-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <textarea
              value={question.prompt}
              onChange={(e) => updateQuestion(question.id, { prompt: e.target.value })}
              rows={2}
              placeholder="Question prompt"
              className="w-full resize-none rounded-lg border border-navy-900/10 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
            {question.type === "multipleChoice" && (
              <div className="mt-2 space-y-1">
                {(question.choices ?? ["", "", "", ""]).map((choice, ci) => (
                  <input
                    key={ci}
                    value={choice}
                    onChange={(e) => {
                      const choices = [...(question.choices ?? ["", "", "", ""])];
                      choices[ci] = e.target.value;
                      updateQuestion(question.id, { choices });
                    }}
                    placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                    className="w-full rounded-lg border border-navy-900/10 bg-white px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  />
                ))}
              </div>
            )}
            {audience === "teacher" && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs font-medium text-navy-700/50">Correct answer / key</label>
                <input
                  value={section.answerKey[question.id] ?? question.correctAnswer ?? ""}
                  onChange={(e) => {
                    updateQuestion(question.id, { correctAnswer: e.target.value });
                    setAnswer(question.id, e.target.value);
                  }}
                  className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900 focus-visible:outline-none"
                />
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
        >
          <Plus size={12} /> Add question
        </button>
      </div>
    </div>
  );
}

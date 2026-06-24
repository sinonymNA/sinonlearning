"use client";

import { Plus, Trash2 } from "lucide-react";
import { createWorksheetQuestion } from "@/lib/studioDefaults";
import RichTextEditor from "./RichTextEditor";
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
    <div>
      <input
        value={section.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Section title"
        className="w-full bg-transparent font-display text-3xl text-navy-900 placeholder:text-navy-900/25 focus-visible:outline-none"
      />
      <RichTextEditor
        value={section.directions}
        onChange={(html) => onChange({ directions: html })}
        placeholder="Directions for students"
        className="mt-2"
        minHeightClassName="min-h-[1.5rem] text-sm italic text-navy-700/70"
      />

      <div className="mt-3 flex flex-wrap gap-4 border-b border-navy-900/8 pb-5 text-xs text-navy-700/50">
        <label className="flex items-center gap-1.5">
          Difficulty
          <select
            value={section.difficulty}
            onChange={(e) => onChange({ difficulty: e.target.value as WorksheetDifficulty })}
            className="rounded-md border border-navy-900/10 bg-white px-1.5 py-0.5"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          Response lines
          <input
            type="number"
            min={0}
            max={20}
            value={section.responseSpaceLines}
            onChange={(e) => onChange({ responseSpaceLines: Number(e.target.value) || 0 })}
            className="w-12 rounded-md border border-navy-900/10 bg-white px-1.5 py-0.5"
          />
        </label>
      </div>

      <div className="mt-6 space-y-6">
        {section.questions.map((question, index) => (
          <div key={question.id} className="group border-b border-navy-900/6 pb-5 last:border-0">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 text-sm font-medium text-navy-700/50">{index + 1}.</span>
              <div className="min-w-0 flex-1">
                <RichTextEditor
                  value={question.prompt}
                  onChange={(html) => updateQuestion(question.id, { prompt: html })}
                  placeholder="Question prompt"
                  minHeightClassName="min-h-[1.5rem] text-base text-navy-900"
                />

                {question.type === "multipleChoice" ? (
                  <div className="mt-2 space-y-1 pl-1">
                    {(question.choices ?? ["", "", "", ""]).map((choice, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <span className="text-sm text-navy-700/50">{String.fromCharCode(65 + ci)}.</span>
                        <input
                          value={choice}
                          onChange={(e) => {
                            const choices = [...(question.choices ?? ["", "", "", ""])];
                            choices[ci] = e.target.value;
                            updateQuestion(question.id, { choices });
                          }}
                          placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                          className="w-full bg-transparent text-sm text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 space-y-3 pl-1">
                    {Array.from({ length: Math.max(1, Math.min(section.responseSpaceLines, 4)) }).map((_, li) => (
                      <div key={li} className="h-px w-full bg-navy-900/10" />
                    ))}
                  </div>
                )}

                {audience === "teacher" && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="flex-shrink-0 font-medium text-amber-700/70">Answer key:</span>
                    <input
                      value={section.answerKey[question.id] ?? question.correctAnswer ?? ""}
                      onChange={(e) => {
                        updateQuestion(question.id, { correctAnswer: e.target.value });
                        setAnswer(question.id, e.target.value);
                      }}
                      placeholder="…"
                      className="flex-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-900 placeholder:text-amber-700/30 focus-visible:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-shrink-0 items-center gap-2 opacity-0 transition group-hover:opacity-100">
                <select
                  value={question.type}
                  onChange={(e) => updateQuestion(question.id, { type: e.target.value as WorksheetQuestionType })}
                  className="rounded-md border border-navy-900/10 bg-white px-1.5 py-0.5 text-[11px]"
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

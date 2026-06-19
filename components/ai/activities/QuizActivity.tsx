"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AILessonActivity } from "@/data/aiCourses";
import { useAILessonProgress } from "@/hooks/useAILessonProgress";

interface QuizState {
  answers: (number | null)[];
  submitted: boolean;
  score: number;
}

export default function QuizActivity({
  courseSlug,
  lessonSlug,
  activity,
}: {
  courseSlug: string;
  lessonSlug: string;
  activity: AILessonActivity;
}) {
  const { progress, saveActivityState, markComplete } = useAILessonProgress(courseSlug, lessonSlug);
  const questions = activity.quiz ?? [];
  const stored = progress.activityState as QuizState | undefined;

  const [state, setState] = useState<QuizState>(
    stored ?? { answers: questions.map(() => null), submitted: false, score: 0 }
  );

  const selectAnswer = (qIndex: number, choiceIndex: number) => {
    if (state.submitted) return;
    const answers = [...state.answers];
    answers[qIndex] = choiceIndex;
    setState({ ...state, answers });
  };

  const submit = () => {
    const score = questions.reduce(
      (acc, q, i) => acc + (state.answers[i] === q.correctIndex ? 1 : 0),
      0
    );
    const next: QuizState = { ...state, submitted: true, score };
    setState(next);
    saveActivityState(next);
    markComplete(true);
  };

  const allAnswered = state.answers.every((a) => a !== null);

  return (
    <div className="space-y-5">
      {questions.map((q, qIndex) => (
        <div key={q.question} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-medium leading-relaxed text-white/90">
            {qIndex + 1}. {q.question}
          </p>
          <div className="mt-3 space-y-2">
            {q.choices.map((choice, cIndex) => {
              const isSelected = state.answers[qIndex] === cIndex;
              const isCorrect = q.correctIndex === cIndex;
              let style = "border-white/10 bg-white/[0.02] hover:border-white/25 text-white/75";
              if (state.submitted) {
                if (isCorrect) style = "border-teal-300/40 bg-teal-300/10 text-teal-100";
                else if (isSelected) style = "border-rose-300/40 bg-rose-300/10 text-rose-100";
                else style = "border-white/10 bg-white/[0.02] text-white/40";
              } else if (isSelected) {
                style = "border-purple-300/40 bg-purple-300/10 text-white";
              }
              return (
                <button
                  key={choice}
                  onClick={() => selectAnswer(qIndex, cIndex)}
                  disabled={state.submitted}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${style}`}
                >
                  <span>{choice}</span>
                  {state.submitted && isCorrect && <CheckCircle2 size={15} className="shrink-0 text-teal-300" />}
                  {state.submitted && isSelected && !isCorrect && (
                    <XCircle size={15} className="shrink-0 text-rose-300" />
                  )}
                </button>
              );
            })}
          </div>
          {state.submitted && (
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              <span className="font-semibold text-purple-200">Why: </span>
              {q.explanation}
            </p>
          )}
        </div>
      ))}

      {!state.submitted ? (
        <button
          onClick={submit}
          disabled={!allAnswered}
          className="rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Check Answers
        </button>
      ) : (
        <p className="text-sm font-medium text-white/80">
          You scored {state.score} / {questions.length}.
        </p>
      )}
    </div>
  );
}

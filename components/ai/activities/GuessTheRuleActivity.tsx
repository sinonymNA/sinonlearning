"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { AILessonActivity } from "@/data/aiCourses";
import { useAILessonProgress } from "@/hooks/useAILessonProgress";

interface GuessTheRuleState {
  guess: string;
  revealed: boolean;
}

export default function GuessTheRuleActivity({
  courseSlug,
  lessonSlug,
  activity,
}: {
  courseSlug: string;
  lessonSlug: string;
  activity: AILessonActivity;
}) {
  const { progress, saveActivityState, markComplete } = useAILessonProgress(courseSlug, lessonSlug);
  const stored = progress.activityState as GuessTheRuleState | undefined;
  const data = activity.guessTheRule;
  const [guess, setGuess] = useState(stored?.guess ?? "");
  const [revealed, setRevealed] = useState(stored?.revealed ?? false);

  if (!data) return null;

  const reveal = () => {
    setRevealed(true);
    saveActivityState({ guess, revealed: true });
    markComplete(true);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {data.examples.map((example) => (
          <div
            key={example.label}
            className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
          >
            <span className="text-sm text-white/80">{example.label}</span>
            {revealed ? (
              example.matches ? (
                <Check size={15} className="shrink-0 text-teal-300" />
              ) : (
                <X size={15} className="shrink-0 text-rose-300" />
              )
            ) : (
              <span className="text-xs text-white/30">?</span>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-300/80">
          Your guess at the rule
        </label>
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={revealed}
          placeholder="What pattern separates the checkmarks from the X's?"
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:border-teal-300/40 focus:outline-none disabled:opacity-60"
        />
      </div>

      {!revealed ? (
        <button
          onClick={reveal}
          className="rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          Reveal the Rule
        </button>
      ) : (
        <p className="rounded-xl border border-teal-300/15 bg-teal-300/5 p-4 text-sm leading-relaxed text-white/80">
          <span className="font-semibold text-teal-200">The actual rule: </span>
          {data.rule}
        </p>
      )}
    </div>
  );
}

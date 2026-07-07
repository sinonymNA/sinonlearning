"use client";

import { useRef } from "react";
import { useMountReveal } from "@/lib/marginsMotion";
import type { MasteryLevel } from "@/lib/marginsDb";

interface Props {
  passed: boolean;
  feedback: string;
  hint?: string;
  scoreLabel: MasteryLevel;
  skillLabel: string;
}

const SCORE_LABEL_TEXT: Record<MasteryLevel, string> = {
  not_yet_shown: "Not yet shown",
  emerging: "Emerging",
  solid: "Solid",
  strong: "Strong",
};

export default function PracticeFeedbackCard({ passed, feedback, hint, scoreLabel, skillLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  useMountReveal(containerRef, ".feedback-block", { stagger: 100, translateY: 14, duration: 380 });

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border p-5 ${passed ? "border-teal-100 bg-teal-50/60" : "border-amber-100 bg-amber-50/60"}`}
    >
      <div className="feedback-block flex items-center gap-2 mb-2" style={{ opacity: 0 }}>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
            passed ? "bg-teal-600/10 text-teal-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {SCORE_LABEL_TEXT[scoreLabel]}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{skillLabel}</span>
      </div>
      <p className="feedback-block text-[14px] text-stone-700 leading-relaxed" style={{ opacity: 0 }}>
        {feedback}
      </p>
      {!passed && hint && (
        <p className="feedback-block mt-2 text-[13px] text-amber-700 leading-relaxed" style={{ opacity: 0 }}>
          <span className="font-semibold">Hint: </span>
          {hint}
        </p>
      )}
    </div>
  );
}

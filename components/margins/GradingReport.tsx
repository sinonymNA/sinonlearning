"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { animateNumber, revealStagger } from "@/lib/marginsMotion";
import { handwriting } from "@/lib/marginsFonts";

interface RubricRow {
  category: string;
  points_earned: number;
  points_possible: number;
  justification: string;
}

interface NextStep {
  issue: string;
  why_it_matters: string;
  how_to_fix: string;
  skill: string;
}

interface Props {
  overallScore: number;
  maxScore: number;
  rubricBreakdown: RubricRow[];
  overallFeedback: string;
  strengths: string[];
  // Gradings created before next_steps became structured objects still have
  // plain strings in the database — accept both shapes rather than crash.
  nextSteps: (NextStep | string)[];
  teacherOverrideScore?: number | null;
  teacherNotes?: string | null;
  essayType?: string;
}

// Small alternating tilt per row so the handwritten marks don't look
// mechanically identical, like a reader's pen naturally varies stroke to stroke.
const ROW_TILTS = [-4, 3, -3, 4, -5, 2];

// Reveal starts after the essay's own paint-in sequence (~450ms base delay +
// ~160ms per highlight there) so the score/rubric section visibly follows
// the highlighted essay rather than racing it.
const BASE_DELAY = 850;

export default function GradingReport({
  overallScore,
  maxScore,
  rubricBreakdown,
  overallFeedback,
  strengths,
  nextSteps,
  teacherOverrideScore,
  teacherNotes,
  essayType,
}: Props) {
  const displayScore = teacherOverrideScore ?? overallScore;
  const scoreCardRef = useRef<HTMLDivElement>(null);
  const scoreNumRef = useRef<HTMLSpanElement>(null);
  const rubricRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const listsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scoreCardRef.current) {
      animate(scoreCardRef.current, {
        opacity: [0, 1],
        scale: [0.96, 1],
        translateY: [10, 0],
        duration: 480,
        delay: BASE_DELAY,
        easing: "outQuart",
      });
    }
    if (scoreNumRef.current) {
      const el = scoreNumRef.current;
      const timer = setTimeout(() => animateNumber(el, 0, displayScore, 900), BASE_DELAY + 150);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rubricRef.current) {
      revealStagger(rubricRef.current, ".rubric-row", { delay: BASE_DELAY + 250, stagger: 90, duration: 420 });
      // Handwritten marks pop in right after each row's printed text settles,
      // like a reader's pen landing on the page.
      const marks = rubricRef.current.querySelectorAll<HTMLElement>(".rubric-ink");
      marks.forEach((mark, i) => {
        animate(mark, {
          opacity: [0, 1],
          scale: [0.6, 1],
          duration: 340,
          delay: BASE_DELAY + 480 + i * 90,
          easing: "outBack",
        });
      });
    }
    if (feedbackRef.current) {
      animate(feedbackRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 420,
        delay: BASE_DELAY + 500,
        easing: "outQuart",
      });
    }
    if (listsRef.current) {
      revealStagger(listsRef.current, ".insight-list", { delay: BASE_DELAY + 650, stagger: 100, duration: 420 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div
        ref={scoreCardRef}
        style={{ opacity: 0 }}
        className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 flex items-center justify-between"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-1">
            {teacherOverrideScore != null ? "Teacher score" : "KORA draft score"}
          </p>
          <p className="text-3xl font-bold text-stone-900">
            <span ref={scoreNumRef}>0</span>
            <span className="text-lg text-stone-400 font-medium">/{maxScore}</span>
          </p>
        </div>
        {teacherOverrideScore == null && (
          <span className="rounded-full bg-white border border-violet-200 px-3 py-1 text-[11px] font-semibold text-violet-600">
            Draft — awaiting teacher review
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-stone-300 bg-white overflow-hidden shadow-sm">
        <div className="h-1.5 bg-stone-900" />
        <div className="px-5 pt-3">
          <p className="text-[10px] uppercase tracking-widest text-stone-400">
            {essayType ? `${essayType} Scoring Guide` : "Scoring Guide"}
          </p>
        </div>
        <div className="mx-5 mt-2 mb-1 flex items-center justify-between rounded bg-sky-50 border border-sky-100 px-4 py-2">
          <p className="text-sm font-bold text-stone-800">Rubric Breakdown</p>
          <p className="text-sm font-bold text-stone-800">{maxScore} points</p>
        </div>
        <div ref={rubricRef} className="px-5 pb-5">
          {rubricBreakdown.map((row, i) => {
            const full = row.points_earned >= row.points_possible;
            const tilt = ROW_TILTS[i % ROW_TILTS.length];
            return (
              <div
                key={row.category}
                className="rubric-row relative border-t border-stone-200 first:border-t-0 py-4 pr-20"
                style={{ opacity: 0 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex-none w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center text-[11px] font-bold text-stone-500">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <p className="text-sm font-semibold text-stone-800 leading-6">{row.category}</p>
                  </div>
                  <span className="flex-none text-xs text-stone-400 leading-6">
                    {row.points_possible} point{row.points_possible === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1.5 ml-9 text-[13px] text-stone-500 leading-relaxed">{row.justification}</p>

                {/* Handwritten "reader's pen" mark: circled score in red ink. */}
                <div
                  className={`rubric-ink ${handwriting.className} absolute top-3 right-4 flex items-center gap-1 text-red-600`}
                  style={{ opacity: 0, transform: `rotate(${tilt}deg)` }}
                >
                  <span className="relative inline-flex items-center justify-center w-8 h-8 text-xl">
                    <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full">
                      <ellipse cx="20" cy="20" rx="17" ry="15" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span className="relative">{row.points_earned}</span>
                  </span>
                  {full && <span className="text-2xl leading-none">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-1.5 bg-stone-900" />
      </div>

      <div ref={feedbackRef} style={{ opacity: 0 }} className="rounded-2xl border border-stone-100 bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Overall feedback</p>
        <p className="text-[14px] text-stone-700 leading-relaxed">{overallFeedback}</p>
      </div>

      <div ref={listsRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="insight-list rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5" style={{ opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Strengths</p>
          <ul className="text-[13px] text-stone-700 leading-relaxed list-disc list-inside space-y-1">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="insight-list rounded-2xl border border-sky-100 bg-sky-50/50 p-5" style={{ opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600 mb-2">Next steps</p>
          <div className="flex flex-col gap-3">
            {nextSteps.map((step, i) =>
              typeof step === "string" ? (
                <div key={i} className="rounded-xl bg-white/60 p-3">
                  <p className="text-[13px] text-stone-700 leading-relaxed">{step}</p>
                </div>
              ) : (
                <div key={i} className="rounded-xl bg-white/60 p-3">
                  <p className="text-[13px] font-semibold text-stone-800">{step.issue}</p>
                  <p className="text-[12px] text-stone-500 mt-1">{step.why_it_matters}</p>
                  <p className="text-[13px] text-sky-700 font-medium mt-1.5">Try this: {step.how_to_fix}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-500 bg-sky-100 rounded-full px-2 py-0.5">
                    {step.skill}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {teacherNotes && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-2">Note from your teacher</p>
          <p className="text-[14px] text-stone-700 leading-relaxed">{teacherNotes}</p>
        </div>
      )}
    </div>
  );
}

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
  // Null until a teacher has actively chosen every rubric row — this is what
  // makes a grade official, never KORA's own numbers on their own.
  teacherScore?: number | null;
  teacherRubricBreakdown?: RubricRow[] | null;
  teacherNotes?: string | null;
  essayType?: string;
  // Copy and disclaimers differ by audience: a student must never read this
  // as their real grade; a teacher must never read it as a completed task.
  viewerRole: "student" | "teacher";
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
  teacherScore,
  teacherRubricBreakdown,
  teacherNotes,
  essayType,
  viewerRole,
}: Props) {
  const isFinalized = teacherScore != null && !!teacherRubricBreakdown;
  const displayScore = isFinalized ? teacherScore! : overallScore;
  const teacherByCategory = new Map((teacherRubricBreakdown ?? []).map((r) => [r.category, r]));

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
      {/* Status card: an official grade and a KORA draft must never look alike. */}
      <div
        ref={scoreCardRef}
        style={{ opacity: 0 }}
        className={
          isFinalized
            ? "rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6"
            : "rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6"
        }
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={
                isFinalized
                  ? "text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-1"
                  : "text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-1"
              }
            >
              {isFinalized ? "Official grade" : "KORA Evaluation — draft"}
            </p>
            <p className="text-3xl font-bold text-stone-900">
              <span ref={scoreNumRef}>0</span>
              <span className="text-lg text-stone-400 font-medium">/{maxScore}</span>
            </p>
          </div>
          {!isFinalized && (
            <span className="rounded-full bg-white border border-violet-200 px-3 py-1 text-[11px] font-semibold text-violet-600">
              {viewerRole === "teacher" ? "Not yet finalized" : "Not your official grade"}
            </span>
          )}
          {isFinalized && (
            <span className="rounded-full bg-white border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-600">
              Assigned by your teacher
            </span>
          )}
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-stone-500 border-t border-stone-200/70 pt-3">
          {isFinalized
            ? viewerRole === "student"
              ? "This score was reviewed and assigned by your teacher. KORA's own draft evaluation is shown below for reference."
              : "You finalized this grade. KORA's original suggestions are shown below for reference."
            : viewerRole === "student"
              ? "This is an AI-generated practice evaluation and is NOT your official grade. Your teacher determines all official rubric scores."
              : "These are KORA's suggested rubric points, for reference only. Nothing here is official until you choose a score for every row and finalize it below."}
        </p>

        {isFinalized && teacherNotes && (
          <div className="mt-3 rounded-xl bg-white/70 border border-emerald-100 p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Note from your teacher</p>
            <p className="text-[13px] text-stone-700 leading-relaxed">{teacherNotes}</p>
          </div>
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
            const teacherRow = teacherByCategory.get(row.category);
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
                <p className="mt-1.5 ml-9 text-[13px] text-stone-500 leading-relaxed">
                  <span className="font-semibold text-violet-500">KORA:</span> {row.justification}
                </p>
                {teacherRow && (
                  <p className="mt-1 ml-9 text-[12px] text-emerald-600">
                    <span className="font-semibold">KORA suggested {row.points_earned}</span> — your teacher chose {teacherRow.points_earned}.
                  </p>
                )}

                {teacherRow ? (
                  // The real reader's-pen mark — only ever a teacher's own choice.
                  <div
                    className={`rubric-ink ${handwriting.className} absolute top-3 right-4 flex items-center gap-1 text-red-600`}
                    style={{ opacity: 0, transform: `rotate(${tilt}deg)` }}
                  >
                    <span className="relative inline-flex items-center justify-center w-8 h-8 text-xl">
                      <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full">
                        <ellipse cx="20" cy="20" rx="17" ry="15" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <span className="relative">{teacherRow.points_earned}</span>
                    </span>
                    {teacherRow.points_earned >= teacherRow.points_possible && <span className="text-2xl leading-none">✓</span>}
                  </div>
                ) : (
                  // KORA's suggestion — deliberately not the red teacher's-pen
                  // mark, so it never reads as an official score at a glance.
                  <div
                    className="rubric-ink absolute top-3 right-4 flex items-center justify-center w-8 h-8 text-sm font-bold text-violet-500"
                    style={{ opacity: 0 }}
                  >
                    <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full">
                      <ellipse
                        cx="20"
                        cy="20"
                        rx="17"
                        ry="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    </svg>
                    <span className="relative">{row.points_earned}</span>
                  </div>
                )}
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
    </div>
  );
}

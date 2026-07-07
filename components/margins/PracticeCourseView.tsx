"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import confetti from "canvas-confetti";
import { ArrowRight, Sparkles } from "lucide-react";
import { revealStagger } from "@/lib/marginsMotion";
import { AP_SKILL_LABELS, type PracticeCourse, type PracticeModule } from "@/lib/marginsPracticeCourses";
import type { MasteryLevel } from "@/lib/marginsDb";
import PracticeFeedbackCard from "./PracticeFeedbackCard";
import GradingReport from "./GradingReport";

interface Props {
  courseId: string;
  course: PracticeCourse;
  initialCurrentModule: number;
}

interface CheckMastery {
  skill: string;
  level: MasteryLevel;
}

interface PracticeCheckResult {
  passed: boolean;
  score_label: MasteryLevel;
  feedback: string;
  hint?: string;
}

interface FullSaqResult {
  overall_score: number;
  max_score: number;
  rubric_breakdown: { category: string; points_earned: number; points_possible: number; justification: string }[];
  overall_feedback: string;
  strengths: string[];
  next_steps: { issue: string; why_it_matters: string; how_to_fix: string; skill: string }[];
}

interface CheckResponse {
  result: PracticeCheckResult | FullSaqResult;
  passed: boolean;
  newMastery: CheckMastery[];
}

const LEVEL_ORDER: Record<MasteryLevel, number> = { not_yet_shown: 0, emerging: 1, solid: 2, strong: 3 };

function isFullSaqResult(result: PracticeCheckResult | FullSaqResult): result is FullSaqResult {
  return "overall_score" in result;
}

export default function PracticeCourseView({ courseId, course, initialCurrentModule }: Props) {
  const [moduleIndex, setModuleIndex] = useState(Math.min(initialCurrentModule, course.modules.length));
  const [promptIndex, setPromptIndex] = useState(0);
  const [responseText, setResponseText] = useState("");
  const [partResponses, setPartResponses] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResponse | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stepCardRef = useRef<HTMLDivElement>(null);
  const masteryRef = useRef<Record<string, MasteryLevel>>({});

  const isDone = moduleIndex >= course.modules.length;
  const module_: PracticeModule | null = !isDone ? course.modules[moduleIndex] : null;

  useEffect(() => {
    if (wrapperRef.current) {
      revealStagger(wrapperRef.current, ".course-panel", { stagger: 90, translateY: 16, duration: 420 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  useEffect(() => {
    if (stepCardRef.current) {
      animate(stepCardRef.current, { opacity: [0, 1], translateY: [12, 0], duration: 360, easing: "outQuart" });
    }
  }, [moduleIndex]);

  function fireConfetti(newMastery: CheckMastery[]) {
    const leveledUp = newMastery.some(
      (m) => LEVEL_ORDER[m.level] > (LEVEL_ORDER[masteryRef.current[m.skill] ?? "not_yet_shown"])
    );
    confetti({
      particleCount: leveledUp ? 200 : 120,
      spread: leveledUp ? 90 : 70,
      startVelocity: leveledUp ? 40 : 30,
      origin: { y: 0.65 },
      colors: ["#0d9488", "#2dd4bf", "#99f6e4", "#f0fdfa", "#ffffff"],
    });
    newMastery.forEach((m) => {
      masteryRef.current[m.skill] = m.level;
    });
  }

  async function handleCheck() {
    if (!module_) return;
    setError(null);
    const isFullSaq = module_.kind === "full_saq";

    let promptId: string;
    let text: string;
    if (module_.kind === "full_saq") {
      const prompt = module_.fullSaqPrompts![promptIndex % module_.fullSaqPrompts!.length];
      promptId = prompt.id;
      text = prompt.parts.map((p, i) => `Part ${p.label}: ${partResponses[i]}`).join("\n\n");
    } else {
      const prompt = module_.prompts![promptIndex % module_.prompts!.length];
      promptId = prompt.id;
      text = responseText;
    }

    if (!text.trim() || (isFullSaq && partResponses.some((r) => !r.trim()))) {
      setError("Fill in every part before checking with Scout.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/margins/practice/${courseId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: module_.id, promptId, responseText: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scout couldn't check that one.");
        setSubmitting(false);
        return;
      }
      setCheckResult(data);
      if (data.passed) fireConfetti(data.newMastery);
      else data.newMastery.forEach((m: CheckMastery) => { masteryRef.current[m.skill] = m.level; });
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  function handleContinue() {
    setCheckResult(null);
    setResponseText("");
    setPartResponses(["", "", ""]);
    setPromptIndex(0);
    setModuleIndex((i) => i + 1);
  }

  function handleRetry() {
    if (!module_) return;
    const count = module_.kind === "full_saq" ? module_.fullSaqPrompts!.length : module_.prompts!.length;
    setCheckResult(null);
    setResponseText("");
    setPartResponses(["", "", ""]);
    setPromptIndex((i) => (i + 1) % count);
  }

  if (isDone) {
    return (
      <div ref={wrapperRef} className="flex flex-col gap-5">
        <div className="course-panel rounded-2xl border border-teal-100 bg-teal-50/50 p-6 text-center" style={{ opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 mb-2">Course complete</p>
          <p className="text-lg font-semibold text-stone-800">You made it through {course.title} 🎉</p>
          <p className="text-sm text-stone-500 mt-1">Scout's proud of you. Keep an eye on your skill mastery — it only goes up from here.</p>
        </div>
      </div>
    );
  }

  const isFullSaq = module_!.kind === "full_saq";
  const prompt = isFullSaq
    ? module_!.fullSaqPrompts![promptIndex % module_!.fullSaqPrompts!.length]
    : module_!.prompts![promptIndex % module_!.prompts!.length];

  return (
    <div ref={wrapperRef} className="flex flex-col gap-5">
      <div className="course-panel flex items-center gap-2" style={{ opacity: 0 }}>
        {course.modules.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= moduleIndex ? "bg-teal-500" : "bg-stone-200"}`}
          />
        ))}
      </div>
      <p className="course-panel text-xs text-stone-400" style={{ opacity: 0 }}>
        Module {moduleIndex + 1} of {course.modules.length}
      </p>

      <div ref={stepCardRef} className="rounded-2xl border border-teal-100 bg-white p-6" style={{ opacity: 0 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-teal-500 mb-1">{module_!.title}</p>
        <p className="text-[13px] text-stone-500 mb-4">{module_!.tagline}</p>

        {!checkResult && isFullSaq && (
          <>
            <p className="text-[14px] text-stone-700 leading-relaxed mb-4 whitespace-pre-wrap">
              {(prompt as { stimulus: string }).stimulus}
            </p>
            <div className="flex flex-col gap-3">
              {(prompt as { parts: { label: string; skill: string; prompt: string }[] }).parts.map((part, i) => (
                <div key={part.label}>
                  <p className="text-[13px] font-semibold text-stone-800 mb-1.5">
                    Part {part.label}: {part.prompt}
                  </p>
                  <textarea
                    value={partResponses[i]}
                    onChange={(e) => {
                      const next = [...partResponses];
                      next[i] = e.target.value;
                      setPartResponses(next);
                    }}
                    rows={3}
                    placeholder="Your answer…"
                    className="w-full rounded-xl border border-stone-200 bg-white p-3 text-[14px] leading-relaxed text-stone-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {!checkResult && !isFullSaq && (
          <>
            <p className="text-[14px] text-stone-700 leading-relaxed mb-3">{(prompt as { prompt: string }).prompt}</p>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={3}
              placeholder="One sentence — go."
              className="w-full rounded-xl border border-stone-200 bg-white p-3.5 text-[14px] leading-relaxed text-stone-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none"
            />
          </>
        )}

        {checkResult &&
          (isFullSaqResult(checkResult.result) ? (
            <GradingReport
              overallScore={checkResult.result.overall_score}
              maxScore={checkResult.result.max_score}
              rubricBreakdown={checkResult.result.rubric_breakdown}
              overallFeedback={checkResult.result.overall_feedback}
              strengths={checkResult.result.strengths}
              nextSteps={checkResult.result.next_steps}
              essayType="SAQ"
            />
          ) : (
            <PracticeFeedbackCard
              passed={checkResult.result.passed}
              feedback={checkResult.result.feedback}
              hint={checkResult.result.hint}
              scoreLabel={checkResult.result.score_label}
              skillLabel={
                isFullSaq
                  ? "Full SAQ"
                  : AP_SKILL_LABELS[module_!.skill!]
              }
            />
          ))}

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-[13px] text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="course-panel flex items-center justify-end" style={{ opacity: 0 }}>
        {!checkResult && (
          <button
            onClick={handleCheck}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 hover:shadow-md transition-all disabled:opacity-60"
          >
            {submitting && <Sparkles size={14} className="animate-pulse" />}
            {submitting ? "Scout's checking…" : "Check with Scout"}
            {!submitting && <ArrowRight size={15} />}
          </button>
        )}
        {checkResult && checkResult.passed && (
          <button
            onClick={handleContinue}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 hover:shadow-md transition-all"
          >
            {moduleIndex === course.modules.length - 1 ? "Finish course" : "Next module"}
            <ArrowRight size={15} />
          </button>
        )}
        {checkResult && !checkResult.passed && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-teal-200 px-6 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-all"
          >
            Try a new one
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import confetti from "canvas-confetti";
import { ArrowRight, Sparkles } from "lucide-react";
import { revealStagger } from "@/lib/marginsMotion";
import { getLastRequiredModule, skillTagLabel, type PracticeCourse, type PracticeModule } from "@/lib/marginsPracticeCourses";
import type { MasteryLevel } from "@/lib/marginsDb";
import PracticeFeedbackCard from "./PracticeFeedbackCard";
import GradingReport from "./GradingReport";
import CapstoneTimer from "./CapstoneTimer";

interface Props {
  courseId: string;
  course: PracticeCourse;
  initialCurrentModule: number;
  initialCurrentPage: number;
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
  attemptId?: string | null;
  alreadyAttempted?: boolean;
}

const LEVEL_ORDER: Record<MasteryLevel, number> = { not_yet_shown: 0, emerging: 1, solid: 2, strong: 3 };
const CAPSTONE_MINUTES = 15;

function isFullSaqResult(result: PracticeCheckResult | FullSaqResult): result is FullSaqResult {
  return "overall_score" in result;
}

function clampPage(module_: PracticeModule, page: number): number {
  return Math.min(Math.max(page, 0), module_.pages.length - 1);
}

export default function PracticeCourseView({ courseId, course, initialCurrentModule, initialCurrentPage }: Props) {
  const [moduleIndex, setModuleIndex] = useState(Math.min(initialCurrentModule, course.modules.length));
  const [pageIndex, setPageIndex] = useState(() => {
    const mod = course.modules[Math.min(initialCurrentModule, course.modules.length - 1)];
    return mod ? clampPage(mod, initialCurrentPage) : 0;
  });
  const [promptIndex, setPromptIndex] = useState(0);
  const [responseText, setResponseText] = useState("");
  const [partResponses, setPartResponses] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResponse | null>(null);
  const [pendingCheckResult, setPendingCheckResult] = useState<CheckResponse | null>(null);
  const [selfDiagnosisText, setSelfDiagnosisText] = useState("");
  const [atCapstoneChoice, setAtCapstoneChoice] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCardRef = useRef<HTMLDivElement>(null);
  const masteryRef = useRef<Record<string, MasteryLevel>>({});

  const isDone = moduleIndex >= course.modules.length;
  const module_: PracticeModule | null = !isDone ? course.modules[moduleIndex] : null;
  const page = module_ ? module_.pages[pageIndex] : null;

  const lastRequiredModule = getLastRequiredModule(course);
  const hasOptionalCapstone = course.modules.some((m) => m.optional);
  const isAtLastRequiredModule = module_ ? module_.order === lastRequiredModule.order : false;

  useEffect(() => {
    if (wrapperRef.current) {
      revealStagger(wrapperRef.current, ".course-panel", { stagger: 90, translateY: 16, duration: 420 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, atCapstoneChoice]);

  useEffect(() => {
    if (pageCardRef.current) {
      animate(pageCardRef.current, { opacity: [0, 1], translateY: [12, 0], duration: 360, easing: "outQuart" });
    }
  }, [moduleIndex, pageIndex]);

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

  function revealFeedback(data: CheckResponse) {
    setCheckResult(data);
    if (data.passed) fireConfetti(data.newMastery);
    else data.newMastery.forEach((m) => { masteryRef.current[m.skill] = m.level; });
  }

  async function handleLessonContinue() {
    if (!module_) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/margins/practice/${courseId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: module_.id, fromPage: pageIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't move to the next page.");
        setSubmitting(false);
        return;
      }
      setPageIndex((i) => i + 1);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  async function handleCheck() {
    if (!module_ || !page || (page.kind !== "check" && page.kind !== "full_saq_check")) return;
    setError(null);
    const isFullSaq = page.kind === "full_saq_check";

    let promptId: string;
    let text: string;
    if (page.kind === "full_saq_check") {
      const prompt = page.prompts[promptIndex % page.prompts.length];
      promptId = prompt.id;
      text = prompt.parts.map((p, i) => `Part ${p.label}: ${partResponses[i]}`).join("\n\n");
    } else {
      const prompt = page.prompts[promptIndex % page.prompts.length];
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
      const data: CheckResponse = await res.json();
      if (!res.ok) {
        setError((data as unknown as { error?: string }).error ?? "Scout couldn't check that one.");
        setSubmitting(false);
        return;
      }
      if (data.alreadyAttempted) {
        setCheckResult(data);
      } else if (page.selfDiagnosis) {
        setSelfDiagnosisText("");
        setPendingCheckResult(data);
      } else {
        revealFeedback(data);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  async function proceedFromSelfDiagnosis() {
    if (!pendingCheckResult) return;
    const text = selfDiagnosisText.trim();
    if (text && pendingCheckResult.attemptId) {
      fetch(`/api/margins/practice/${courseId}/self-diagnosis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: pendingCheckResult.attemptId, selfDiagnosisText: text }),
      }).catch(() => {
        // fire-and-forget — never blocks feedback reveal
      });
    }
    const data = pendingCheckResult;
    setPendingCheckResult(null);
    revealFeedback(data);
  }

  function handleContinueAfterPass() {
    setCheckResult(null);
    setPendingCheckResult(null);
    setResponseText("");
    setPartResponses(["", "", ""]);
    setPromptIndex(0);
    if (isAtLastRequiredModule && hasOptionalCapstone) {
      setAtCapstoneChoice(true);
      return;
    }
    setPageIndex(0);
    setModuleIndex((i) => i + 1);
  }

  function handleRetry() {
    if (!page || (page.kind !== "check" && page.kind !== "full_saq_check")) return;
    setCheckResult(null);
    setResponseText("");
    setPartResponses(["", "", ""]);
    setPromptIndex((i) => (i + 1) % page.prompts.length);
  }

  function finishWithoutCapstone() {
    setAtCapstoneChoice(false);
    setModuleIndex(course.modules.length);
  }

  function continueToCapstone() {
    setAtCapstoneChoice(false);
    const capstoneIndex = course.modules.findIndex((m) => m.optional);
    setPageIndex(0);
    setModuleIndex(capstoneIndex);
  }

  if (atCapstoneChoice) {
    return (
      <div ref={wrapperRef} className="flex flex-col gap-5">
        <div className="course-panel rounded-2xl border border-teal-100 bg-teal-50/50 p-6 text-center" style={{ opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 mb-2">Course complete</p>
          <p className="text-lg font-semibold text-stone-800">You made it through {course.title} 🎉</p>
          <p className="text-sm text-stone-500 mt-1 mb-5">
            Scout&rsquo;s proud of you. Want one more, just for fun — a second full SAQ under a real clock?
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={finishWithoutCapstone}
              className="rounded-xl border border-teal-200 bg-white px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-all"
            >
              You&rsquo;re done!
            </button>
            <button
              onClick={continueToCapstone}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 hover:shadow-md transition-all"
            >
              Try the timed capstone
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div ref={wrapperRef} className="flex flex-col gap-5">
        <div className="course-panel rounded-2xl border border-teal-100 bg-teal-50/50 p-6 text-center" style={{ opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 mb-2">Course complete</p>
          <p className="text-lg font-semibold text-stone-800">You made it through {course.title} 🎉</p>
          <p className="text-sm text-stone-500 mt-1">Scout&rsquo;s proud of you. Keep an eye on your skill mastery — it only goes up from here.</p>
        </div>
      </div>
    );
  }

  const isCheckPage = page!.kind === "check" || page!.kind === "full_saq_check";
  const isFullSaqCheck = page!.kind === "full_saq_check";
  const isSingleAttemptPage = isCheckPage && Boolean((page as { singleAttempt?: boolean }).singleAttempt);
  const currentPrompt = page!.kind === "check" ? page!.prompts[promptIndex % page!.prompts.length] : null;

  return (
    <div ref={wrapperRef} className="flex flex-col gap-5">
      <div className="course-panel flex items-center gap-2" style={{ opacity: 0 }}>
        {course.modules.map((m, i) => {
          const fraction = i < moduleIndex ? 1 : i > moduleIndex ? 0 : pageIndex / m.pages.length;
          return (
            <span
              key={m.id}
              className={`relative h-1.5 flex-1 rounded-full bg-stone-200 overflow-hidden ${m.optional ? "opacity-50" : ""}`}
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-teal-500 transition-all"
                style={{ width: `${Math.round(fraction * 100)}%` }}
              />
            </span>
          );
        })}
      </div>
      <p className="course-panel text-xs text-stone-400" style={{ opacity: 0 }}>
        {module_!.optional ? "Bonus" : `Module ${moduleIndex + 1} of ${course.modules.length}`} · Page {pageIndex + 1} of{" "}
        {module_!.pages.length}
      </p>

      <div ref={pageCardRef} className="rounded-2xl border border-teal-100 bg-white p-6" style={{ opacity: 0 }}>
        {pageIndex === 0 && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-500 mb-1">{module_!.title}</p>
            <p className="text-[13px] text-stone-500 mb-4">{module_!.tagline}</p>
          </>
        )}

        {page!.kind === "lesson" && (
          <>
            <p className="text-[17px] font-semibold text-stone-800 mb-3">{page!.title}</p>
            <div className="flex flex-col gap-3">
              {page!.body.map((paragraph, i) => (
                <p key={i} className="text-[14px] text-stone-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </>
        )}

        {isCheckPage && !checkResult && !pendingCheckResult && (
          <>
            <p className="text-[17px] font-semibold text-stone-800 mb-1">{page!.title}</p>
            <p className="text-[13px] text-stone-500 mb-4">{(page as { intro: string }).intro}</p>
            {module_!.optional && page!.kind === "full_saq_check" && (
              <div className="mb-4 flex justify-center">
                <CapstoneTimer initialMinutes={CAPSTONE_MINUTES} />
              </div>
            )}
          </>
        )}

        {!checkResult && !pendingCheckResult && isFullSaqCheck && page!.kind === "full_saq_check" && (
          <>
            <p className="text-[14px] text-stone-700 leading-relaxed mb-4 whitespace-pre-wrap">
              {page!.prompts[promptIndex % page!.prompts.length].stimulus}
            </p>
            <div className="flex flex-col gap-3">
              {page!.prompts[promptIndex % page!.prompts.length].parts.map((part, i) => (
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

        {!checkResult && !pendingCheckResult && isCheckPage && !isFullSaqCheck && page!.kind === "check" && currentPrompt && (
          <>
            {currentPrompt.stimulus && (
              <p className="text-[13px] text-stone-600 leading-relaxed mb-3 rounded-lg bg-stone-50 border border-stone-100 p-3 whitespace-pre-wrap">
                {currentPrompt.stimulus}
              </p>
            )}
            <p className="text-[14px] text-stone-700 leading-relaxed mb-3">{currentPrompt.prompt}</p>
            {currentPrompt.givenContext && (
              <p className="text-[13px] text-stone-600 leading-relaxed mb-3 rounded-lg bg-teal-50/50 border border-teal-100 p-3">
                <span className="font-semibold text-teal-700">Already given: </span>
                {currentPrompt.givenContext}
              </p>
            )}
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={3}
              placeholder={currentPrompt.givenContext ? "Your reasoning sentence — go." : "One sentence — go."}
              className="w-full rounded-xl border border-stone-200 bg-white p-3.5 text-[14px] leading-relaxed text-stone-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none"
            />
          </>
        )}

        {pendingCheckResult && !checkResult && (
          <div>
            <p className="text-[15px] font-semibold text-stone-800 mb-1.5">
              Before I tell you what I think — what&rsquo;s the weakest part of what you just wrote?
            </p>
            <p className="text-[13px] text-stone-500 mb-3">
              Take a real second with it if you can — this one&rsquo;s optional, but it&rsquo;s genuinely worth doing.
            </p>
            <textarea
              value={selfDiagnosisText}
              onChange={(e) => setSelfDiagnosisText(e.target.value)}
              rows={2}
              placeholder="I think the weakest part is…"
              className="w-full rounded-xl border border-stone-200 bg-white p-3 text-[14px] leading-relaxed text-stone-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none"
            />
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={proceedFromSelfDiagnosis}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 hover:shadow-md transition-all"
              >
                Reveal feedback
                <ArrowRight size={15} />
              </button>
              <button onClick={proceedFromSelfDiagnosis} className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
                Just show me
              </button>
            </div>
          </div>
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
              skillLabel={isFullSaqCheck || page!.kind !== "check" ? "Full SAQ" : skillTagLabel(page!.skill)}
            />
          ))}

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-[13px] text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="course-panel flex items-center justify-end" style={{ opacity: 0 }}>
        {page!.kind === "lesson" && (
          <button
            onClick={handleLessonContinue}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 hover:shadow-md transition-all disabled:opacity-60"
          >
            {submitting ? "One sec…" : "Continue"}
            {!submitting && <ArrowRight size={15} />}
          </button>
        )}
        {isCheckPage && !checkResult && !pendingCheckResult && (
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
        {checkResult && (checkResult.passed || isSingleAttemptPage) && (
          <button
            onClick={handleContinueAfterPass}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 hover:shadow-md transition-all"
          >
            {moduleIndex === course.modules.length - 1 ? "Finish course" : "Next module"}
            <ArrowRight size={15} />
          </button>
        )}
        {checkResult && !checkResult.passed && !isSingleAttemptPage && (
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

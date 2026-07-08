"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import confetti from "canvas-confetti";
import { ArrowRight, Sparkles, Map as MapIcon, CheckCircle2 } from "lucide-react";
import { revealStagger } from "@/lib/marginsMotion";
import { getLastRequiredModule, skillTagLabel, type PracticeCourse, type PracticeModule } from "@/lib/marginsPracticeCourses";
import type { MasteryLevel } from "@/lib/marginsDb";
import PracticeFeedbackCard from "./PracticeFeedbackCard";
import GradingReport from "./GradingReport";
import CapstoneTimer from "./CapstoneTimer";
import CourseMapDrawer from "./CourseMapDrawer";
import { getModuleTheme } from "./moduleThemes";
import PracticeContentBlockView from "./blocks/PracticeContentBlockView";
import EvidenceExhibitCard from "./blocks/EvidenceExhibitCard";
import ComparisonChart from "./blocks/ComparisonChart";
import AnatomyDiagram from "./blocks/AnatomyDiagram";

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

interface ProgressPointer {
  current_module: number;
  current_page: number;
}

interface CheckResponse {
  result: PracticeCheckResult | FullSaqResult;
  passed: boolean;
  newMastery: CheckMastery[];
  attemptId?: string | null;
  alreadyAttempted?: boolean;
  progress?: ProgressPointer;
}

interface AttemptResponse {
  found: boolean;
  feedback?: PracticeCheckResult | FullSaqResult;
}

const LEVEL_ORDER: Record<MasteryLevel, number> = { not_yet_shown: 0, emerging: 1, solid: 2, strong: 3 };
const CAPSTONE_MINUTES = 15;

function isFullSaqResult(result: PracticeCheckResult | FullSaqResult): result is FullSaqResult {
  return "overall_score" in result;
}

function clampPage(module_: PracticeModule, page: number): number {
  return Math.min(Math.max(page, 0), module_.pages.length - 1);
}

// Mirrors the server's page-aware advance logic (app/api/margins/practice/
// [courseId]/check/route.ts) for *local-only* review navigation — moving the
// viewing pointer forward through already-completed pages never calls the
// write endpoints, so it has to independently know when a check page is the
// last page of its module (only then does the next module start).
function nextPageAfter(course: PracticeCourse, moduleOrder: number, pageIdx: number): { moduleOrder: number; pageIdx: number } {
  const mod = course.modules.find((m) => m.order === moduleOrder);
  if (!mod) return { moduleOrder, pageIdx };
  const isLastPageInModule = pageIdx === mod.pages.length - 1;
  return isLastPageInModule ? { moduleOrder: moduleOrder + 1, pageIdx: 0 } : { moduleOrder, pageIdx: pageIdx + 1 };
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
  // The "furthest reached" pointer — distinct from moduleIndex/pageIndex
  // (what's currently displayed) so the course map can let a student look
  // back at earlier pages without disturbing their real progress. Only ever
  // moves forward, and only from a server-confirmed advance/check response.
  const [furthestModule, setFurthestModule] = useState(Math.min(initialCurrentModule, course.modules.length));
  const [furthestPage, setFurthestPage] = useState(() => {
    const mod = course.modules[Math.min(initialCurrentModule, course.modules.length - 1)];
    return mod ? clampPage(mod, initialCurrentPage) : 0;
  });
  const [isCourseMapOpen, setIsCourseMapOpen] = useState(false);
  const [reviewAttempt, setReviewAttempt] = useState<AttemptResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCardRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<HTMLDivElement>(null);
  const masteryRef = useRef<Record<string, MasteryLevel>>({});

  const isDone = moduleIndex >= course.modules.length;
  const module_: PracticeModule | null = !isDone ? course.modules[moduleIndex] : null;
  const page = module_ ? module_.pages[pageIndex] : null;

  const lastRequiredModule = getLastRequiredModule(course);
  const hasOptionalCapstone = course.modules.some((m) => m.optional);
  const isAtLastRequiredModule = module_ ? module_.order === lastRequiredModule.order : false;
  const isReviewing = moduleIndex < furthestModule || (moduleIndex === furthestModule && pageIndex < furthestPage);

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
    if (blocksRef.current) {
      revealStagger(blocksRef.current, ".content-block", { delay: 150, stagger: 80, duration: 420 });
    }
  }, [moduleIndex, pageIndex]);

  useEffect(() => {
    if (!isReviewing || !module_ || !page || (page.kind !== "check" && page.kind !== "full_saq_check")) {
      setReviewAttempt(null);
      return;
    }
    let cancelled = false;
    setReviewLoading(true);
    setReviewAttempt(null);
    fetch(`/api/margins/practice/${courseId}/attempt?moduleId=${module_.id}`)
      .then((res) => res.json() as Promise<AttemptResponse>)
      .then((data) => {
        if (!cancelled) setReviewAttempt(data);
      })
      .catch(() => {
        if (!cancelled) setReviewAttempt({ found: false });
      })
      .finally(() => {
        if (!cancelled) setReviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleIndex, pageIndex, isReviewing]);

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
    // Reviewing an already-passed page — just step the viewing pointer
    // forward, no network call (this page was already recorded as reached).
    if (isReviewing) {
      setPageIndex((i) => i + 1);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/margins/practice/${courseId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: module_.id, fromPage: pageIndex }),
      });
      const data: { progress?: ProgressPointer; error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't move to the next page.");
        setSubmitting(false);
        return;
      }
      if (data.progress) {
        setModuleIndex(data.progress.current_module);
        setPageIndex(data.progress.current_page);
        setFurthestModule(data.progress.current_module);
        setFurthestPage(data.progress.current_page);
      } else {
        setPageIndex((i) => i + 1);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  function handleReviewContinue() {
    if (!module_) return;
    const next = nextPageAfter(course, module_.order, pageIndex);
    setModuleIndex(next.moduleOrder);
    setPageIndex(next.pageIdx);
  }

  function handleNavigate(moduleOrder: number, pageIdx: number) {
    setModuleIndex(moduleOrder);
    setPageIndex(pageIdx);
    setIsCourseMapOpen(false);
    setCheckResult(null);
    setPendingCheckResult(null);
    setResponseText("");
    setPartResponses(["", "", ""]);
    setPromptIndex(0);
    setError(null);
  }

  async function handleCheck() {
    if (!module_ || !page || (page.kind !== "check" && page.kind !== "full_saq_check") || isReviewing) return;
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
    const finishedModuleOrder = module_?.order;
    // The capstone singleAttempt-replay path never re-advances server
    // progress (see check/route.ts) — blindly stepping forward is what
    // correctly finishes the course in that narrow recovery case, exactly as
    // it did before the furthest/review-mode split below existed.
    const wasReplay = checkResult?.alreadyAttempted === true;
    const serverProgress = checkResult?.progress;

    setCheckResult(null);
    setPendingCheckResult(null);
    setResponseText("");
    setPartResponses(["", "", ""]);
    setPromptIndex(0);

    if (wasReplay || !serverProgress) {
      if (isAtLastRequiredModule && hasOptionalCapstone) {
        setAtCapstoneChoice(true);
        return;
      }
      setPageIndex(0);
      setModuleIndex((i) => i + 1);
      return;
    }

    const crossedModuleBoundary = finishedModuleOrder !== undefined && serverProgress.current_module > finishedModuleOrder;
    if (crossedModuleBoundary && isAtLastRequiredModule && hasOptionalCapstone) {
      setAtCapstoneChoice(true);
      return;
    }
    setModuleIndex(serverProgress.current_module);
    setPageIndex(serverProgress.current_page);
    setFurthestModule(serverProgress.current_module);
    setFurthestPage(serverProgress.current_page);
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
          <button
            onClick={() => setIsCourseMapOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors"
          >
            <MapIcon size={13} /> Review the course
          </button>
        </div>
        {isCourseMapOpen && (
          <CourseMapDrawer
            course={course}
            moduleOrder={-1}
            pageIndex={-1}
            furthestModule={course.modules.length - 1}
            furthestPage={Number.MAX_SAFE_INTEGER}
            onNavigate={handleNavigate}
            onClose={() => setIsCourseMapOpen(false)}
          />
        )}
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
          <button
            onClick={() => setIsCourseMapOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors"
          >
            <MapIcon size={13} /> Review the course
          </button>
        </div>
        {isCourseMapOpen && (
          <CourseMapDrawer
            course={course}
            moduleOrder={-1}
            pageIndex={-1}
            furthestModule={course.modules.length - 1}
            furthestPage={Number.MAX_SAFE_INTEGER}
            onNavigate={handleNavigate}
            onClose={() => setIsCourseMapOpen(false)}
          />
        )}
      </div>
    );
  }

  const isCheckPage = page!.kind === "check" || page!.kind === "full_saq_check";
  const isFullSaqCheck = page!.kind === "full_saq_check";
  const isSingleAttemptPage = isCheckPage && Boolean((page as { singleAttempt?: boolean }).singleAttempt);
  const currentPrompt = page!.kind === "check" ? page!.prompts[promptIndex % page!.prompts.length] : null;

  const currentTheme = getModuleTheme(module_!.id);
  const CurrentModuleIcon = currentTheme.icon;

  return (
    <div ref={wrapperRef} className="flex flex-col gap-5">
      <div className="course-panel flex items-center gap-2" style={{ opacity: 0 }}>
        {course.modules.map((m, i) => {
          const theme = getModuleTheme(m.id);
          const fraction = i < furthestModule ? 1 : i > furthestModule ? 0 : furthestPage / m.pages.length;
          return (
            <span
              key={m.id}
              className={`relative h-1.5 flex-1 rounded-full bg-stone-200 overflow-hidden ${m.optional ? "opacity-50" : ""}`}
            >
              <span
                className={`absolute inset-y-0 left-0 rounded-full ${theme.pill} transition-all`}
                style={{ width: `${Math.round(fraction * 100)}%` }}
              />
            </span>
          );
        })}
      </div>
      <div className="course-panel flex items-center justify-between" style={{ opacity: 0 }}>
        <p className="text-xs text-stone-400 flex items-center gap-2">
          {module_!.optional ? "Bonus" : `Module ${moduleIndex + 1} of ${course.modules.length}`} · Page {pageIndex + 1} of{" "}
          {module_!.pages.length}
          {isReviewing && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Reviewing
            </span>
          )}
        </p>
        <button
          onClick={() => setIsCourseMapOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors"
        >
          <MapIcon size={13} /> Course map
        </button>
      </div>

      <div ref={pageCardRef} className={`rounded-2xl border ${currentTheme.cardBorder} bg-white p-6`} style={{ opacity: 0 }}>
        <div className="mb-1 flex items-center gap-1.5">
          <CurrentModuleIcon size={12} className={currentTheme.iconText} />
          <p className={`text-[11px] font-bold uppercase tracking-widest ${currentTheme.labelText}`}>{module_!.title}</p>
        </div>
        {pageIndex === 0 ? (
          <p className="text-[13px] italic text-stone-500 mb-4">{module_!.tagline}</p>
        ) : (
          <div className="mb-3" />
        )}

        {page!.kind === "lesson" && (
          <>
            <p className="text-[19px] font-bold tracking-tight text-stone-900 mb-3">{page!.title}</p>
            <div ref={blocksRef} className="flex flex-col gap-4">
              {page!.body.map((block, i) => (
                <div key={i} className="content-block" style={{ opacity: 0 }}>
                  <PracticeContentBlockView block={block} />
                </div>
              ))}
            </div>
          </>
        )}

        {isCheckPage && !isReviewing && !checkResult && !pendingCheckResult && (
          <>
            <p className="text-[19px] font-bold tracking-tight text-stone-900 mb-1">{page!.title}</p>
            <p className="text-[13px] text-stone-500 mb-4">{(page as { intro: string }).intro}</p>
            {module_!.optional && page!.kind === "full_saq_check" && (
              <div className="mb-4 flex justify-center">
                <CapstoneTimer initialMinutes={CAPSTONE_MINUTES} />
              </div>
            )}
          </>
        )}

        {isCheckPage && isReviewing && (
          <>
            <p className="text-[19px] font-bold tracking-tight text-stone-900 mb-1">{page!.title}</p>
            <p className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
              <CheckCircle2 size={12} /> Reviewing your completed answer
            </p>
            {reviewLoading && <p className="text-[13px] text-stone-400">Loading your results…</p>}
            {!reviewLoading && reviewAttempt?.found === false && (
              <p className="text-[13px] text-stone-400">No record found for this page.</p>
            )}
            {!reviewLoading &&
              reviewAttempt?.found &&
              reviewAttempt.feedback &&
              (isFullSaqResult(reviewAttempt.feedback) ? (
                <GradingReport
                  overallScore={reviewAttempt.feedback.overall_score}
                  maxScore={reviewAttempt.feedback.max_score}
                  rubricBreakdown={reviewAttempt.feedback.rubric_breakdown}
                  overallFeedback={reviewAttempt.feedback.overall_feedback}
                  strengths={reviewAttempt.feedback.strengths}
                  nextSteps={reviewAttempt.feedback.next_steps}
                  essayType="SAQ"
                />
              ) : (
                <PracticeFeedbackCard
                  passed={reviewAttempt.feedback.passed}
                  feedback={reviewAttempt.feedback.feedback}
                  hint={reviewAttempt.feedback.hint}
                  scoreLabel={reviewAttempt.feedback.score_label}
                  skillLabel={isFullSaqCheck || page!.kind !== "check" ? "Full SAQ" : skillTagLabel(page!.skill)}
                />
              ))}
          </>
        )}

        {!isReviewing && !checkResult && !pendingCheckResult && isFullSaqCheck && page!.kind === "full_saq_check" && (
          <>
            {(() => {
              const fullSaqPrompt = page!.prompts[promptIndex % page!.prompts.length];
              if (fullSaqPrompt.stimulusVisual?.kind === "comparisonChart") {
                return (
                  <div className="mb-4">
                    <ComparisonChart
                      leftLabel={fullSaqPrompt.stimulusVisual.leftLabel}
                      rightLabel={fullSaqPrompt.stimulusVisual.rightLabel}
                      rows={fullSaqPrompt.stimulusVisual.rows}
                    />
                  </div>
                );
              }
              if (fullSaqPrompt.stimulusVisual?.kind === "document") {
                return (
                  <div className="mb-4">
                    <EvidenceExhibitCard label={fullSaqPrompt.stimulusVisual.label} content={fullSaqPrompt.stimulus} />
                  </div>
                );
              }
              return (
                <p className="text-[14px] text-stone-700 leading-relaxed mb-4 whitespace-pre-wrap">
                  {fullSaqPrompt.stimulus}
                </p>
              );
            })()}
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

        {!isReviewing && !checkResult && !pendingCheckResult && isCheckPage && !isFullSaqCheck && page!.kind === "check" && currentPrompt && (
          <>
            {currentPrompt.stimulus && currentPrompt.stimulusVisual?.kind === "comparisonChart" ? (
              <div className="mb-3">
                <ComparisonChart
                  leftLabel={currentPrompt.stimulusVisual.leftLabel}
                  rightLabel={currentPrompt.stimulusVisual.rightLabel}
                  rows={currentPrompt.stimulusVisual.rows}
                />
              </div>
            ) : currentPrompt.stimulus && currentPrompt.stimulusVisual?.kind === "document" ? (
              <div className="mb-3">
                <EvidenceExhibitCard label={currentPrompt.stimulusVisual.label} content={currentPrompt.stimulus} />
              </div>
            ) : (
              currentPrompt.stimulus && (
                <p className="text-[13px] text-stone-600 leading-relaxed mb-3 rounded-lg bg-stone-50 border border-stone-100 p-3 whitespace-pre-wrap">
                  {currentPrompt.stimulus}
                </p>
              )
            )}
            <p className="text-[14px] text-stone-700 leading-relaxed mb-3">{currentPrompt.prompt}</p>
            {currentPrompt.givenContextAnatomy ? (
              <div className="mb-3">
                <AnatomyDiagram
                  claim={currentPrompt.givenContextAnatomy.claim}
                  evidence={currentPrompt.givenContextAnatomy.evidence}
                  reasoning="Your turn — write it below."
                  highlight="reasoning"
                />
              </div>
            ) : (
              currentPrompt.givenContext && (
                <p className="text-[13px] text-stone-600 leading-relaxed mb-3 rounded-lg bg-teal-50/50 border border-teal-100 p-3">
                  <span className="font-semibold text-teal-700">Already given: </span>
                  {currentPrompt.givenContext}
                </p>
              )
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
        {isCheckPage && isReviewing && (
          <button
            onClick={handleReviewContinue}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-200 hover:shadow-md transition-all"
          >
            Continue
            <ArrowRight size={15} />
          </button>
        )}
        {isCheckPage && !isReviewing && !checkResult && !pendingCheckResult && (
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

      {isCourseMapOpen && (
        <CourseMapDrawer
          course={course}
          moduleOrder={module_!.order}
          pageIndex={pageIndex}
          furthestModule={furthestModule}
          furthestPage={furthestPage}
          onNavigate={handleNavigate}
          onClose={() => setIsCourseMapOpen(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { revealStagger } from "@/lib/marginsMotion";

interface RevisionStep {
  based_on_issue: string;
  restatement: string;
  guiding_question: string;
  scaffold: string;
  hint: string;
}

interface Props {
  gradedSubmissionId: string;
  steps: RevisionStep[];
  initialCurrentStep: number;
  initialResponses: string[];
  returnBase?: string;
}

const MIN_RESPONSE_LENGTH = 10;

export default function RevisionWizard({
  gradedSubmissionId,
  steps,
  initialCurrentStep,
  initialResponses,
  returnBase = "/margins/student",
}: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(Math.min(initialCurrentStep, steps.length));
  const [responses, setResponses] = useState<string[]>(() => {
    const padded = [...initialResponses];
    while (padded.length < steps.length) padded.push("");
    return padded;
  });
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepCardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isDone = currentStep >= steps.length;

  // Re-triggered on the isDone transition (not just once on mount): the
  // in-progress and "ready to revise" views are different JSX shapes, and a
  // mount-once reveal can miss the second view's elements entirely depending
  // on how React happens to reconcile the DOM across the swap.
  useEffect(() => {
    if (wrapperRef.current) {
      revealStagger(wrapperRef.current, ".wizard-panel", { stagger: 90, translateY: 16, duration: 420 });
    }
  }, [isDone]);

  const step = !isDone ? steps[currentStep] : null;
  const response = responses[currentStep] ?? "";
  const canAdvance = response.trim().length >= MIN_RESPONSE_LENGTH;

  useEffect(() => {
    if (stepCardRef.current) {
      animate(stepCardRef.current, { opacity: [0, 1], translateY: [12, 0], duration: 360, easing: "outQuart" });
    }
  }, [currentStep]);

  function persistProgress(step: number, resp: string[], completed = false) {
    fetch(`/api/margins/revision-plans/${gradedSubmissionId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStep: step, studentResponses: resp, completed }),
    }).catch(() => {});
  }

  function handleResponseChange(value: string) {
    const next = [...responses];
    next[currentStep] = value;
    setResponses(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistProgress(currentStep, next), 900);
  }

  function handleNext() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const nextStep = currentStep + 1;
    setHintLevel(0);
    setCurrentStep(nextStep);
    persistProgress(nextStep, responses, nextStep >= steps.length);
  }

  function handleBack() {
    if (currentStep === 0) return;
    const prevStep = currentStep - 1;
    setHintLevel(0);
    setCurrentStep(prevStep);
    persistProgress(prevStep, responses);
  }

  async function handleStartRevising() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch(`/api/margins/submissions/${gradedSubmissionId}/revise`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start your revision.");
        setStarting(false);
        return;
      }
      router.push(`${returnBase}/submissions/${data.submission.id}/edit`);
    } catch {
      setError("Network error. Please try again.");
      setStarting(false);
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (isDone) {
    return (
      <div ref={wrapperRef} className="flex flex-col gap-5">
        <div className="wizard-panel rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6" style={{ opacity: 0 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-3">Your revision plan</p>
          <div className="flex flex-col gap-3">
            {steps.map((s, i) => (
              <div key={i} className="rounded-xl bg-white/70 p-3.5">
                <p className="text-[13px] font-semibold text-stone-800">{s.restatement}</p>
                {responses[i] && <p className="text-[12px] text-stone-500 mt-1.5 italic">Your plan: {responses[i]}</p>}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleStartRevising}
          disabled={starting}
          className="wizard-panel self-end inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-60"
          style={{ opacity: 0 }}
        >
          {starting && <Sparkles size={14} className="animate-pulse" />}
          {starting ? "Getting your essay ready…" : "Start revising"}
          {!starting && <ArrowRight size={15} />}
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-5">
      <div className="wizard-panel flex items-center gap-2" style={{ opacity: 0 }}>
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= currentStep ? "bg-violet-500" : "bg-stone-200"}`}
          />
        ))}
      </div>
      <p className="wizard-panel text-xs text-stone-400" style={{ opacity: 0 }}>
        Step {currentStep + 1} of {steps.length}
      </p>

      <div ref={stepCardRef} className="rounded-2xl border border-violet-100 bg-white p-6" style={{ opacity: 0 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-2">What to work on</p>
        <p className="text-[15px] text-stone-800 leading-relaxed mb-4">{step!.restatement}</p>

        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Think it through</p>
        <p className="text-[14px] text-stone-700 leading-relaxed mb-4">{step!.guiding_question}</p>

        {hintLevel >= 1 && (
          <div className="rounded-xl bg-sky-50 border border-sky-100 p-3.5 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600 mb-1">Sentence frame</p>
            <p className="text-[13px] text-stone-700 leading-relaxed">{step!.scaffold}</p>
          </div>
        )}
        {hintLevel >= 2 && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-1">Hint</p>
            <p className="text-[13px] text-stone-700 leading-relaxed">{step!.hint}</p>
          </div>
        )}
        {hintLevel < 2 && (
          <button
            onClick={() => setHintLevel((h) => (h < 2 ? ((h + 1) as 1 | 2) : h))}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-600 hover:text-amber-700 transition-colors mb-4"
          >
            <Lightbulb size={13} />
            {hintLevel === 0 ? "Need a hint?" : "Need another hint?"}
          </button>
        )}

        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mt-2 mb-2">Your plan</p>
        <textarea
          value={response}
          onChange={(e) => handleResponseChange(e.target.value)}
          rows={4}
          placeholder="Jot down how you'll fix this — you'll write the actual sentences in your essay next."
          className="w-full rounded-xl border border-stone-200 bg-white p-3.5 text-[14px] leading-relaxed text-stone-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
        />
        {!canAdvance && response.length > 0 && (
          <p className="text-[12px] text-stone-400 mt-1.5">Say a little more about your plan to continue.</p>
        )}
      </div>

      <div className="wizard-panel flex items-center justify-between" style={{ opacity: 0 }}>
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors disabled:opacity-0"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-40"
        >
          {currentStep === steps.length - 1 ? "Finish plan" : "Next"}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

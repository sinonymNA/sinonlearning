"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { animate } from "animejs";
import NotesheetUpload from "@/components/notesheet/NotesheetUpload";
import NotesheetConfirm from "@/components/notesheet/NotesheetConfirm";
import NotesheetPreview from "@/components/notesheet/NotesheetPreview";
import type { NotesheetPlan } from "@/lib/notesheetTypes";

type Step = "upload" | "confirm" | "preview";

interface UploadResult {
  slides: string[];
  slideCount: number;
  rawText: string;
}

const STEP_PROGRESS: Record<Step, number> = {
  upload: 6,
  confirm: 46,
  preview: 100,
};

export function ScaffoldLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-extrabold tracking-tight select-none ${className}`}
      style={{
        background: "linear-gradient(90deg, #9061F9 0%, #5B21B6 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      [scaffold]
    </span>
  );
}

export default function ScaffoldPage() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [plan, setPlan] = useState<NotesheetPlan | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  function goToStep(newStep: Step) {
    const el = contentRef.current;
    const prog = progressRef.current;

    function commit() {
      setStep(newStep);
      if (prog) {
        animate(prog, {
          width: `${STEP_PROGRESS[newStep]}%`,
          duration: 700,
          easing: "outQuart",
        });
      }
      // Double rAF ensures React has committed the new step's DOM
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (contentRef.current) {
            animate(contentRef.current, {
              opacity: [0, 1],
              translateY: [18, 0],
              duration: 420,
              easing: "outQuart",
            });
          }
        });
      });
    }

    if (el) {
      animate(el, {
        opacity: [1, 0],
        translateY: [0, -12],
        duration: 190,
        easing: "inQuart",
        onComplete: commit,
      });
    } else {
      commit();
    }
  }

  function handleUpload(result: UploadResult) {
    setUploadResult(result);
    goToStep("confirm");
  }

  function handleGenerate(generatedPlan: NotesheetPlan) {
    setPlan(generatedPlan);
    goToStep("preview");
  }

  function reset() {
    setUploadResult(null);
    setPlan(null);
    goToStep("upload");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Thin gradient progress bar */}
      <div className="h-[3px] w-full bg-stone-100 shrink-0">
        <div
          ref={progressRef}
          className="h-full rounded-r-full"
          style={{
            width: `${STEP_PROGRESS[step]}%`,
            background: "linear-gradient(90deg, #9061F9, #5B21B6)",
          }}
        />
      </div>

      {/* Minimal header */}
      <header className="shrink-0 px-6 h-14 flex items-center justify-between">
        <ScaffoldLogo className="text-[18px]" />
        <div className="flex items-center gap-5">
          {step === "confirm" && (
            <button
              onClick={() => goToStep("upload")}
              className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              ← Back
            </button>
          )}
          {uploadResult && step !== "upload" && (
            <span className="text-xs text-stone-300">
              {uploadResult.slideCount} slides
            </span>
          )}
          <Link
            href="/"
            className="text-xs text-stone-300 hover:text-stone-500 transition-colors"
          >
            Sinon Learning ↗
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-16">
        <div ref={contentRef} className="w-full max-w-[520px]">

          {step === "upload" && (
            <div className="flex flex-col gap-9">
              <div className="text-center">
                <h1 className="text-[28px] font-bold text-stone-900 leading-tight tracking-tight">
                  Upload a lesson.{" "}
                  <span
                    style={{
                      background: "linear-gradient(90deg, #9061F9, #5B21B6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Get a notesheet.
                  </span>
                </h1>
                <p className="mt-2.5 text-[14px] text-stone-400 leading-relaxed max-w-sm mx-auto">
                  KORA reads your slides, decides what students should write, and builds a print-ready PDF in seconds.
                </p>
              </div>
              <NotesheetUpload onUpload={handleUpload} />
            </div>
          )}

          {step === "confirm" && uploadResult && (
            <NotesheetConfirm
              slideCount={uploadResult.slideCount}
              rawText={uploadResult.rawText}
              onGenerate={handleGenerate}
              onBack={() => goToStep("upload")}
            />
          )}

          {step === "preview" && plan && (
            <NotesheetPreview
              plan={plan}
              onPlanChange={setPlan}
              onReset={reset}
            />
          )}

        </div>
      </main>
    </div>
  );
}

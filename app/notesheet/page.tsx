"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

const STEPS = ["Upload", "Configure", "Download"];

export default function ScaffoldPage() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [plan, setPlan] = useState<NotesheetPlan | null>(null);

  function handleUpload(result: UploadResult) {
    setUploadResult(result);
    setStep("confirm");
  }

  function handleGenerate(generatedPlan: NotesheetPlan) {
    setPlan(generatedPlan);
    setStep("preview");
  }

  function reset() {
    setStep("upload");
    setUploadResult(null);
    setPlan(null);
  }

  const stepIndex = { upload: 0, confirm: 1, preview: 2 }[step];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Scaffold wordmark */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-violet-600">
                <div className="w-3 h-[2px] bg-white rounded-full" />
              </div>
              <span className="text-[15px] font-semibold text-stone-900 tracking-tight">scaffold</span>
            </div>
            <span className="text-stone-300 text-sm">·</span>
            <span className="text-xs text-stone-400">by Sinon Learning</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            Sinon Learning
            <ArrowUpRight size={11} />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10 lg:py-14">
        {/* Hero — only shown on upload step */}
        {step === "upload" && (
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-stone-900 leading-tight sm:text-4xl">
              Upload a lesson.<br />
              <span className="text-violet-600">Get a student notesheet.</span>
            </h1>
            <p className="mt-3 text-base text-stone-500 leading-relaxed max-w-sm">
              KORA reads your slideshow, decides what students should write and how, and builds a structured notesheet you can download instantly.
            </p>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    i < stepIndex
                      ? "bg-violet-600 text-white"
                      : i === stepIndex
                      ? "bg-violet-600 text-white ring-4 ring-violet-100"
                      : "bg-stone-200 text-stone-400",
                  ].join(" ")}
                >
                  {i < stepIndex ? (
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={[
                    "text-xs font-medium",
                    i <= stepIndex ? "text-stone-700" : "text-stone-400",
                  ].join(" ")}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={["mx-3 h-px w-8 transition-colors", i < stepIndex ? "bg-violet-300" : "bg-stone-200"].join(" ")} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === "upload" && <NotesheetUpload onUpload={handleUpload} />}

        {step === "confirm" && uploadResult && (
          <NotesheetConfirm
            slideCount={uploadResult.slideCount}
            rawText={uploadResult.rawText}
            onGenerate={handleGenerate}
            onBack={() => setStep("upload")}
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
    </div>
  );
}

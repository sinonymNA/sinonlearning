"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

export default function NotesheetPage() {
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
    <div className="min-h-screen bg-navy-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300/70 mb-3">
            Notesheet Engine
          </p>
          <h1 className="font-display text-3xl font-medium text-white sm:text-4xl leading-tight">
            Upload a slideshow.<br />Get a student notesheet.
          </h1>
          <p className="mt-4 text-base text-white/55 max-w-md leading-relaxed">
            KORA reads the lesson, decides what students should write and how, then your download is ready.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {["Upload", "Confirm", "Download"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  i <= stepIndex ? "bg-teal-300 text-navy-950" : "bg-white/10 text-white/30",
                ].join(" ")}
              >
                {i + 1}
              </div>
              <span
                className={[
                  "text-xs font-medium",
                  i <= stepIndex ? "text-white/70" : "text-white/30",
                ].join(" ")}
              >
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

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

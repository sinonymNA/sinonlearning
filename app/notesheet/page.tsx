"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { animate } from "animejs";
import { Upload, Sparkles, Printer, ArrowRight } from "lucide-react";
import NotesheetUpload from "@/components/notesheet/NotesheetUpload";
import NotesheetConfirm from "@/components/notesheet/NotesheetConfirm";
import NotesheetPreview from "@/components/notesheet/NotesheetPreview";
import WorksheetDescribe from "@/components/notesheet/WorksheetDescribe";
import type { NotesheetPlan, WorksheetDesignBrief } from "@/lib/notesheetTypes";

type Step = "intro" | "upload" | "confirm" | "preview";
/** Which input the teacher is building from on the "upload" step. */
type Mode = "slides" | "describe";

interface UploadResult {
  slides: string[];
  slideCount: number;
  rawText: string;
}

const STEP_PROGRESS: Record<Step, number> = {
  intro: 2,
  upload: 20,
  confirm: 55,
  preview: 100,
};

const introSteps = [
  { icon: Upload, title: "Upload or describe", description: "Drop in your lesson slides — or just say what you want students to do." },
  { icon: Sparkles, title: "KORA designs it", description: "KORA picks the format and decides what students write, section by section." },
  { icon: Printer, title: "Print & teach", description: "Download a student PDF and a teacher answer key, ready to go." },
];

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
  const [step, setStep] = useState<Step>("intro");
  const [mode, setMode] = useState<Mode>("slides");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [plan, setPlan] = useState<NotesheetPlan | null>(null);
  const [designBrief, setDesignBrief] = useState<WorksheetDesignBrief | null>(null);
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
    setDesignBrief(null);
    goToStep("preview");
  }

  function handleDescribeGenerate(generatedPlan: NotesheetPlan, brief: WorksheetDesignBrief) {
    setPlan(generatedPlan);
    setDesignBrief(brief);
    goToStep("preview");
  }

  function reset() {
    setUploadResult(null);
    setPlan(null);
    setDesignBrief(null);
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
          {step === "upload" && (
            <button
              onClick={() => goToStep("intro")}
              className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              ← What is this?
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

          {step === "intro" && (
            <div className="flex flex-col gap-9">
              <div className="text-center">
                <ScaffoldLogo className="text-3xl" />
                <h1 className="mt-4 text-[28px] font-bold text-stone-900 leading-tight tracking-tight">
                  Any lesson into a{" "}
                  <span
                    style={{
                      background: "linear-gradient(90deg, #9061F9, #5B21B6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    ready-to-teach worksheet.
                  </span>
                </h1>
                <p className="mt-2.5 text-[14px] text-stone-400 leading-relaxed max-w-sm mx-auto">
                  Upload your slides, or just describe what you want students to do. KORA picks
                  the right format — guided notes, practice set, lab, station activity — and
                  builds it with a teacher answer key.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {introSteps.map((s, i) => (
                  <div key={s.title} className="flex items-center gap-3.5 rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-3">
                    <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-[12px] font-bold">
                      {i + 1}
                    </span>
                    <s.icon size={16} className="shrink-0 text-violet-500" strokeWidth={1.75} />
                    <div>
                      <p className="text-[13px] font-semibold text-stone-800">{s.title}</p>
                      <p className="text-[12px] text-stone-400">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => goToStep("upload")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Get started
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === "upload" && (
            <div className="flex flex-col gap-7">
              <div className="text-center">
                <h1 className="text-[28px] font-bold text-stone-900 leading-tight tracking-tight">
                  {mode === "slides" ? "Upload a lesson. " : "Describe it. "}
                  <span
                    style={{
                      background: "linear-gradient(90deg, #9061F9, #5B21B6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {mode === "slides" ? "Get a notesheet." : "Get a worksheet."}
                  </span>
                </h1>
                <p className="mt-2.5 text-[14px] text-stone-400 leading-relaxed max-w-sm mx-auto">
                  {mode === "slides"
                    ? "KORA reads your slides, decides what students should write, and builds a print-ready PDF in seconds."
                    : "No slideshow needed. Tell KORA what students should do and it designs the worksheet around it."}
                </p>
              </div>

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-stone-100 p-1.5">
                {([
                  { id: "slides" as Mode, label: "From a slideshow", sub: "Upload .pptx" },
                  { id: "describe" as Mode, label: "From a description", sub: "Notes or activity" },
                ]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMode(t.id)}
                    className={[
                      "rounded-xl px-3 py-2.5 text-center transition-all",
                      mode === t.id
                        ? "bg-white shadow-sm"
                        : "hover:bg-white/50",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "block text-[13px] font-semibold",
                        mode === t.id ? "text-violet-700" : "text-stone-500",
                      ].join(" ")}
                    >
                      {t.label}
                    </span>
                    <span
                      className={[
                        "block text-[11px] mt-0.5",
                        mode === t.id ? "text-violet-400" : "text-stone-400",
                      ].join(" ")}
                    >
                      {t.sub}
                    </span>
                  </button>
                ))}
              </div>

              {mode === "slides" ? (
                <NotesheetUpload onUpload={handleUpload} />
              ) : (
                <WorksheetDescribe onGenerate={handleDescribeGenerate} />
              )}
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
              designBrief={designBrief}
            />
          )}

        </div>
      </main>
    </div>
  );
}

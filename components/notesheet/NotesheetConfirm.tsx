"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import type { NotesheetPlan } from "@/lib/notesheetTypes";

interface Props {
  slideCount: number;
  rawText: string;
  onGenerate: (plan: NotesheetPlan) => void;
  onBack: () => void;
}

const PAGE_HINTS: Record<number, string> = {
  1: "Very focused · 3–4 sections",
  2: "Standard · 5–6 sections",
  3: "Comprehensive · 7–9 sections",
  4: "Deep dive · 10–12 sections",
};

export default function NotesheetConfirm({ slideCount, rawText, onGenerate, onBack }: Props) {
  const [concept, setConcept] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeBand, setGradeBand] = useState("");
  const [targetPages, setTargetPages] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Stagger fields in on mount
  useEffect(() => {
    if (!fieldsRef.current) return;
    const items = fieldsRef.current.querySelectorAll(".field-item");
    animate(items, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 380,
      delay: stagger(70),
      easing: "outQuart",
    });
  }, []);

  async function handleGenerate() {
    setError(null);
    setLoading(true);

    // Button tap animation
    if (btnRef.current) {
      animate(btnRef.current, {
        scale: [1, 0.96, 1],
        duration: 200,
        easing: "outQuart",
      });
    }

    try {
      const res = await fetch("/api/notesheet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          concept: concept.trim() || "",
          subject: subject.trim() || "",
          gradeBand: gradeBand.trim() || "",
          targetPages,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed."); return; }
      onGenerate(data.plan as NotesheetPlan);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Slide count badge */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="text-[12px] text-stone-500 font-medium">{slideCount} slides extracted</span>
        </div>
      </div>

      {/* Heading */}
      <div>
        <h2 className="text-[22px] font-bold text-stone-900 tracking-tight">Refine your notesheet</h2>
        <p className="text-[13px] text-stone-400 mt-1 leading-relaxed">
          All fields are optional — KORA will infer from your slides.
        </p>
      </div>

      {/* Fields */}
      <div ref={fieldsRef} className="flex flex-col gap-3.5">
        {[
          { label: "Concept or topic", value: concept, set: setConcept, placeholder: "e.g. The Agricultural Revolution" },
          { label: "Subject", value: subject, set: setSubject, placeholder: "e.g. AP World History" },
          { label: "Grade band", value: gradeBand, set: setGradeBand, placeholder: "e.g. Grades 9–10" },
        ].map(({ label, value, set, placeholder }) => (
          <label key={label} className="field-item flex flex-col gap-1.5" style={{ opacity: 0 }}>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">{label}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[14px] text-stone-800 placeholder-stone-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </label>
        ))}

        {/* Page count */}
        <div className="field-item flex flex-col gap-1.5" style={{ opacity: 0 }}>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">Length</span>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTargetPages(n)}
                className={[
                  "rounded-xl border py-2.5 text-[13px] font-semibold transition-all",
                  targetPages === n
                    ? "border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-200"
                    : "border-stone-200 bg-white text-stone-500 hover:border-violet-300 hover:text-violet-600",
                ].join(" ")}
              >
                {n}p
              </button>
            ))}
          </div>
          <p className="text-[12px] text-stone-400 mt-0.5">{PAGE_HINTS[targetPages]}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        ref={btnRef}
        onClick={handleGenerate}
        disabled={loading}
        className={[
          "w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[14px] font-semibold text-white transition-all",
          "bg-gradient-to-br from-violet-500 to-violet-700 shadow-md shadow-violet-200",
          "hover:shadow-lg hover:shadow-violet-300 hover:-translate-y-0.5",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
        ].join(" ")}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            KORA is building your notesheet…
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Generate Notesheet
          </>
        )}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import type { NotesheetPlan, WorksheetDesignBrief } from "@/lib/notesheetTypes";

interface Props {
  onGenerate: (plan: NotesheetPlan, brief: WorksheetDesignBrief) => void;
}

const PAGE_HINTS: Record<number, string> = {
  1: "Very focused · 3–4 sections",
  2: "Standard · 5–6 sections",
  3: "Comprehensive · 7–9 sections",
  4: "Deep dive · 10–12 sections",
};

const EXAMPLES = [
  {
    label: "Station activity",
    text: "A four-station rotation on the causes of World War I. Each station gives students a different primary source — a political cartoon, a treaty excerpt, a casualty data table, and a soldier's letter. At each station they record what the source shows and which M.A.I.N. cause it supports. End with them ranking the four causes by importance and defending their top pick.",
  },
  {
    label: "Practice set",
    text: "A practice worksheet on solving two-step equations for Algebra 1. Start with a worked example students can reference, then 8 problems that build from 2x + 3 = 11 up to ones with negatives and fractions. Include a spot where they explain in words what 'undo the operation' means.",
  },
  {
    label: "Lab sheet",
    text: "A lab sheet for a density experiment. Students measure mass and volume of four unknown metal samples, calculate density for each, then identify the metals using a reference table. Needs a data table, the density formula, a place to show their calculation work, and a conclusion question about sources of error.",
  },
  {
    label: "Debate prep",
    text: "A debate preparation sheet for whether social media should be regulated. Students plan arguments for both sides before being assigned one, list the strongest evidence for each claim, then anticipate two counterarguments and prepare rebuttals.",
  },
];

export default function WorksheetDescribe({ onGenerate }: Props) {
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeBand, setGradeBand] = useState("");
  const [targetPages, setTargetPages] = useState(2);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"design" | "build">("design");
  const [error, setError] = useState<string | null>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  // Two-pass generation takes a while; swap the status text partway through so
  // the wait reads as progress rather than a hang.
  useEffect(() => {
    if (!loading) { setPhase("design"); return; }
    const t = setTimeout(() => setPhase("build"), 6500);
    return () => clearTimeout(t);
  }, [loading]);

  const tooShort = description.trim().length > 0 && description.trim().length < 20;

  async function handleGenerate() {
    setError(null);
    setLoading(true);

    if (btnRef.current) {
      animate(btnRef.current, { scale: [1, 0.96, 1], duration: 200, easing: "outQuart" });
    }

    try {
      const res = await fetch("/api/notesheet/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          subject: subject.trim(),
          gradeBand: gradeBand.trim(),
          targetPages,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed."); return; }
      onGenerate(data.plan as NotesheetPlan, data.designBrief as WorksheetDesignBrief);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-[22px] font-bold text-stone-900 tracking-tight">Describe your worksheet</h2>
        <p className="text-[13px] text-stone-400 mt-1 leading-relaxed">
          Say what you want students to do. KORA decides the format — notes, practice set,
          lab, station rotation, debate prep — then builds it.
        </p>
      </div>

      <div ref={fieldsRef} className="flex flex-col gap-3.5">
        {/* Description */}
        <label className="field-item flex flex-col gap-1.5" style={{ opacity: 0 }}>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
            What should this worksheet do?
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={7}
            placeholder="e.g. A card-sort activity where students group 12 examples into fixed vs. variable costs, then explain the rule they used to decide. Finish with two examples of their own."
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-[14px] leading-relaxed text-stone-800 placeholder-stone-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-y min-h-[150px]"
          />
          <div className="flex items-center justify-between">
            <span className={["text-[12px]", tooShort ? "text-amber-600" : "text-stone-400"].join(" ")}>
              {tooShort
                ? "A bit more detail — what do students actually do?"
                : "The more specific you are, the closer the result."}
            </span>
            <span className="text-[11px] text-stone-300 tabular-nums">{description.trim().length}</span>
          </div>
        </label>

        {/* Example chips */}
        <div className="field-item flex flex-col gap-2" style={{ opacity: 0 }}>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
            Or start from an example
          </span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setDescription(ex.text)}
                className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-stone-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/50 transition-all"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional metadata */}
        <div className="field-item grid grid-cols-2 gap-3" style={{ opacity: 0 }}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Optional"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[14px] text-stone-800 placeholder-stone-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">Grade band</span>
            <input
              type="text"
              value={gradeBand}
              onChange={(e) => setGradeBand(e.target.value)}
              placeholder="Optional"
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[14px] text-stone-800 placeholder-stone-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </label>
        </div>

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

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <button
        ref={btnRef}
        onClick={handleGenerate}
        disabled={loading || description.trim().length < 20}
        className={[
          "w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[14px] font-semibold text-white transition-all",
          "bg-gradient-to-br from-violet-500 to-violet-700 shadow-md shadow-violet-200",
          "hover:shadow-lg hover:shadow-violet-300 hover:-translate-y-0.5",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
        ].join(" ")}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {phase === "design" ? "KORA is designing the worksheet…" : "Writing the sections…"}
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Design my worksheet
          </>
        )}
      </button>
    </div>
  );
}

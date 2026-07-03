"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { NotesheetPlan } from "@/lib/notesheetTypes";

interface Props {
  slideCount: number;
  rawText: string;
  onGenerate: (plan: NotesheetPlan) => void;
  onBack: () => void;
}

export default function NotesheetConfirm({ slideCount, rawText, onGenerate, onBack }: Props) {
  const [concept, setConcept] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeBand, setGradeBand] = useState("");
  const [targetPages, setTargetPages] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!concept.trim() || !subject.trim() || !gradeBand.trim()) {
      setError("Please fill in all three fields.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/notesheet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, concept, subject, gradeBand, targetPages }),
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
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <div className="rounded-xl border border-stone-200 bg-stone-100 px-5 py-4 text-sm text-stone-500">
        Extracted text from <span className="text-stone-800 font-medium">{slideCount} slides</span>
      </div>

      <div className="flex flex-col gap-4">
        {[
          { label: "Concept / topic", value: concept, set: setConcept, placeholder: "e.g. Opportunity Cost" },
          { label: "Subject", value: subject, set: setSubject, placeholder: "e.g. Economics" },
          { label: "Grade band", value: gradeBand, set: setGradeBand, placeholder: "e.g. Grades 9–10" },
        ].map(({ label, value, set, placeholder }) => (
          <label key={label} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">{label}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </label>
        ))}

        {/* Pages selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Target length</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTargetPages(n)}
                className={[
                  "flex-1 rounded-lg border py-2 text-sm font-medium transition-all",
                  targetPages === n
                    ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                    : "border-stone-200 bg-white text-stone-500 hover:border-violet-300 hover:text-violet-600",
                ].join(" ")}
              >
                {n}p
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            {targetPages === 1 ? "4–6 sections · very focused" :
             targetPages === 2 ? "6–9 sections · standard" :
             targetPages === 3 ? "9–13 sections · comprehensive" :
             "12–16 sections · deep dive"}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Building plan…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate Notesheet
            </>
          )}
        </button>
      </div>
    </div>
  );
}

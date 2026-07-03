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
        body: JSON.stringify({ rawText, concept, subject, gradeBand }),
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
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/60">
        Extracted text from <span className="text-white font-medium">{slideCount} slides</span>
      </div>

      <div className="flex flex-col gap-4">
        {[
          { label: "Concept / topic", value: concept, set: setConcept, placeholder: "e.g. Opportunity Cost" },
          { label: "Subject", value: subject, set: setSubject, placeholder: "e.g. Economics" },
          { label: "Grade band", value: gradeBand, set: setGradeBand, placeholder: "e.g. Grades 9–10" },
        ].map(({ label, value, set, placeholder }) => (
          <label key={label} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-teal-400/60 focus:bg-white/[0.07] transition-colors"
            />
          </label>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/60 hover:border-white/30 hover:text-white/80 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-teal-300 px-4 py-2.5 text-sm font-medium text-navy-950 hover:bg-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-navy-950/40 border-t-navy-950 rounded-full animate-spin" />
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

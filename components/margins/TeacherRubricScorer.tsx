"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import { Check } from "lucide-react";

interface AiRow {
  category: string;
  points_earned: number;
  points_possible: number;
  justification: string;
}

interface FinalRow {
  category: string;
  points_earned: number;
  points_possible: number;
  justification: string;
}

interface Props {
  submissionId: string;
  aiSuggested: AiRow[];
  existingTeacherBreakdown: FinalRow[] | null;
  existingNotes: string | null;
  isFinalized: boolean;
}

// The teacher's actual grading interface: one row per rubric category, each
// requiring an active point choice before the grade can be finalized. KORA's
// number is offered as a one-click suggestion, never pre-selected — every
// point in the official grade has to be something the teacher chose, not
// something they merely didn't uncheck.
export default function TeacherRubricScorer({
  submissionId,
  aiSuggested,
  existingTeacherBreakdown,
  existingNotes,
  isFinalized,
}: Props) {
  const router = useRouter();
  const initialChoices = new Map(
    (existingTeacherBreakdown ?? []).map((r) => [r.category, r.points_earned])
  );
  const [choices, setChoices] = useState<Map<string, number>>(initialChoices);
  const [notes, setNotes] = useState(existingNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (saved && buttonRef.current) {
      animate(buttonRef.current, { scale: [1, 1.06, 1], duration: 320, easing: "outQuart" });
    }
  }, [saved]);

  const allChosen = aiSuggested.every((row) => choices.has(row.category));
  const total = aiSuggested.reduce((sum, row) => sum + (choices.get(row.category) ?? 0), 0);
  const maxTotal = aiSuggested.reduce((sum, row) => sum + row.points_possible, 0);

  function setPoints(category: string, points: number) {
    setSaved(false);
    setChoices((prev) => {
      const next = new Map(prev);
      next.set(category, points);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allChosen) return;
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const rubricBreakdown: FinalRow[] = aiSuggested.map((row) => ({
        category: row.category,
        points_earned: choices.get(row.category) ?? 0,
        points_possible: row.points_possible,
        justification: "",
      }));
      const res = await fetch(`/api/margins/submissions/${submissionId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubricBreakdown, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
          {isFinalized ? "Official grade" : "Your grading"}
        </p>
        <p className="text-[13px] text-stone-500 mt-1">
          Choose a score for every rubric row. KORA&rsquo;s suggestion is offered below each one — you
          decide whether to take it.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {aiSuggested.map((row) => {
          const chosen = choices.get(row.category);
          const pointOptions = Array.from({ length: row.points_possible + 1 }, (_, i) => i);
          return (
            <div key={row.category} className="rounded-xl border border-stone-200 p-3">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-sm font-semibold text-stone-800">{row.category}</p>
                <span className="text-xs text-stone-400">{row.points_possible} pt{row.points_possible === 1 ? "" : "s"}</span>
              </div>
              <p className="text-[12px] text-stone-500 mb-2 leading-relaxed">
                <span className="font-semibold text-violet-500">KORA suggests:</span> {row.justification}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {pointOptions.map((points) => (
                  <button
                    key={points}
                    type="button"
                    onClick={() => setPoints(row.category, points)}
                    className={[
                      "w-9 h-9 rounded-lg text-sm font-semibold border transition-colors",
                      chosen === points
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "border-stone-200 text-stone-600 hover:border-violet-300",
                    ].join(" ")}
                  >
                    {points}
                  </button>
                ))}
                {chosen === undefined && (
                  <button
                    type="button"
                    onClick={() => setPoints(row.category, row.points_earned)}
                    className="ml-1 rounded-lg border border-dashed border-violet-300 px-2.5 h-9 text-[12px] font-semibold text-violet-600 hover:bg-violet-50"
                  >
                    Use KORA&rsquo;s {row.points_earned}
                  </button>
                )}
                {chosen !== undefined && (
                  <span className="ml-1 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
                    <Check size={13} /> Chosen
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3.5 py-2.5">
        <span className="text-sm font-semibold text-stone-700">Total</span>
        <span className="text-sm font-bold text-stone-900">
          {total} / {maxTotal}
        </span>
      </div>

      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional note to the student…"
        className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-sm outline-none focus:border-violet-400 resize-none"
      />

      {!allChosen && (
        <p className="text-[12px] text-amber-600">Choose a score for every row before finalizing.</p>
      )}
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <button
        ref={buttonRef}
        type="submit"
        disabled={loading || !allChosen}
        className="self-start rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Saving…" : saved ? "Saved ✓" : isFinalized ? "Update official grade" : "Finalize official grade"}
      </button>
    </form>
  );
}

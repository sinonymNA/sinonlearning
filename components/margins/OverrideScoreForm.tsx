"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  submissionId: string;
  currentScore: number;
  maxScore: number;
  currentNotes: string | null;
}

export default function OverrideScoreForm({ submissionId, currentScore, maxScore, currentNotes }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(currentScore);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/margins/submissions/${submissionId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideScore: score, notes }),
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 flex flex-col gap-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Teacher review</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={maxScore}
          step={0.5}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-20 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-sm text-center outline-none focus:border-rose-400"
        />
        <span className="text-sm text-stone-400">/ {maxScore} final score</span>
      </div>
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional note to the student…"
        className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-sm outline-none focus:border-rose-400 resize-none"
      />
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-60"
      >
        {loading ? "Saving…" : saved ? "Saved ✓" : "Save final score"}
      </button>
    </form>
  );
}

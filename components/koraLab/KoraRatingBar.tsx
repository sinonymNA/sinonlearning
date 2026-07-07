"use client";

import { useState } from "react";
import type { KoraLabWinner } from "@/lib/koraLabDb";

export default function KoraRatingBar({
  onRate,
  submitting,
}: {
  onRate: (winner: KoraLabWinner, reason: string) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState("");

  const buttons: { winner: KoraLabWinner; label: string; cls: string }[] = [
    { winner: "a", label: "A is better", cls: "bg-teal-600 hover:bg-teal-500" },
    { winner: "b", label: "B is better", cls: "bg-violet-600 hover:bg-violet-500" },
    { winner: "tie", label: "Tie", cls: "bg-navy-700 hover:bg-navy-600" },
    { winner: "both_bad", label: "Both bad", cls: "bg-rose-600 hover:bg-rose-500" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-navy-900/8 bg-white p-4">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Optional: why? (helps future you remember what made the difference)"
        rows={2}
        className="w-full rounded-lg border border-navy-900/12 bg-cream-50 px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
      />
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.winner}
            disabled={submitting}
            onClick={() => onRate(b.winner, reason)}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${b.cls}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

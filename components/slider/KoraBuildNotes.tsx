"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";

export default function KoraBuildNotes({ gapStatement }: { gapStatement: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="editor-panel flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[13px] text-amber-900"
      style={{ opacity: 0 }}
    >
      <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-500" />
      <div className="flex-1">
        <p className="font-semibold">KORA's build notes</p>
        <p className="mt-0.5 text-amber-800/90">{gapStatement}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-amber-400 hover:text-amber-700 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

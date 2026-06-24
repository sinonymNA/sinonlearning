"use client";

import { useState } from "react";
import CometCharacter from "./CometCharacter";
import { QUICK_ACTIONS } from "@/lib/studioTransforms";

interface CometAssistantProps {
  onApply: (actionId: string) => void;
}

export default function CometAssistant({ onApply }: CometAssistantProps) {
  const [toast, setToast] = useState<string | null>(null);

  const handleClick = (actionId: string, available: boolean) => {
    if (!available) {
      setToast("This quick action is coming soon — not wired up yet.");
      window.setTimeout(() => setToast(null), 2500);
      return;
    }
    onApply(actionId);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <CometCharacter size={32} mood="thinking" />
        <div>
          <p className="text-sm font-semibold text-navy-900">Comet&apos;s quick actions</p>
          <p className="text-xs text-navy-700/50">Local edits, applied instantly. No live AI call.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleClick(action.id, action.available)}
            title={action.description}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              action.available
                ? "border-teal-300 bg-white text-teal-800 hover:bg-teal-50"
                : "border-navy-900/10 bg-white text-navy-700/40"
            }`}
          >
            {action.label}
            {!action.available && <span className="ml-1 text-[10px] uppercase">soon</span>}
          </button>
        ))}
      </div>
      {toast && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">{toast}</p>
      )}
    </div>
  );
}

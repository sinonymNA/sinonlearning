"use client";

import { Check, CircleDashed } from "lucide-react";
import type { QualityChecklistItem } from "@/lib/studioTypes";

interface QualityChecklistProps {
  items: QualityChecklistItem[];
  onTogglePassed: (itemId: string, passed: boolean) => void;
}

export default function QualityChecklist({ items, onTogglePassed }: QualityChecklistProps) {
  const passedCount = items.filter((item) => item.passed).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-navy-700/50">
          Quality checklist
        </p>
        <span className="text-xs font-medium text-navy-700/50">
          {passedCount}/{items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onTogglePassed(item.id, !item.passed)}
              disabled={item.computed === true}
              className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                item.computed === true ? "cursor-default" : "hover:bg-navy-900/5"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                  item.passed
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-navy-900/20 text-transparent"
                }`}
              >
                {item.passed ? <Check size={10} /> : <CircleDashed size={10} className="opacity-0" />}
              </span>
              <span>
                <span className={item.passed ? "text-navy-800" : "text-navy-700/70"}>
                  {item.label}
                </span>
                {item.autoNote && (
                  <span className="mt-0.5 block text-[11px] text-navy-700/45">{item.autoNote}</span>
                )}
                {item.computed === null && (
                  <span className="mt-0.5 block text-[11px] text-navy-700/40">
                    Self-check — mark when you&apos;ve reviewed it.
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

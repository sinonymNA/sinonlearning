"use client";

import { Check } from "lucide-react";
import { ANCHORED_TEMPLATE_OPTIONS } from "@/lib/anchoredNotesTypes";
import type { AnchoredTemplateStyleId } from "@/lib/anchoredNotesTypes";

interface TemplateStyleSelectorProps {
  value: AnchoredTemplateStyleId;
  onChange: (value: AnchoredTemplateStyleId) => void;
}

export default function TemplateStyleSelector({ value, onChange }: TemplateStyleSelectorProps) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold text-navy-900">Choose a template</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ANCHORED_TEMPLATE_OPTIONS.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-teal-400/70 bg-teal-50"
                  : "border-navy-900/10 bg-white hover:border-teal-300/60"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-navy-900">{option.label}</span>
                {active && <Check size={15} className="text-teal-600" />}
              </div>
              <p className="text-xs text-navy-700/60">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

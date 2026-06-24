"use client";

import { Clock, Sparkles } from "lucide-react";
import type { StudioTemplate } from "@/lib/studioTemplates";

interface TemplateCardProps {
  template: StudioTemplate;
  onUse: (template: StudioTemplate) => void;
}

export default function TemplateCard({ template, onUse }: TemplateCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-navy-900/8 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg text-navy-900">{template.name}</h3>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            template.hasFullStarterContent
              ? "bg-teal-50 text-teal-700"
              : "bg-violet-50 text-violet-700"
          }`}
        >
          {template.hasFullStarterContent ? "Hand-built example" : (
            <>
              <Sparkles size={10} /> Generated from your details
            </>
          )}
        </span>
      </div>

      <p className="text-sm text-navy-700/70">{template.description}</p>
      <p className="text-xs text-navy-700/50">{template.recommendedUse}</p>

      <div className="flex items-center gap-3 text-xs text-navy-700/50">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {template.estimatedMinutes} min
        </span>
        <span>{template.includedMaterials.join(" · ")}</span>
      </div>

      <button
        type="button"
        onClick={() => onUse(template)}
        className="mt-1 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
      >
        Use this template
      </button>
    </div>
  );
}

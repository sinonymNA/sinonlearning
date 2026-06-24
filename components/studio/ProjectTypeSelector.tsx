"use client";

import { STUDIO_DOC_TYPES } from "@/lib/studioTypes";
import type { StudioDocType } from "@/lib/studioTypes";

interface ProjectTypeSelectorProps {
  value?: StudioDocType;
  onSelect: (type: StudioDocType) => void;
  className?: string;
}

export default function ProjectTypeSelector({ value, onSelect, className = "" }: ProjectTypeSelectorProps) {
  return (
    <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${className}`}>
      {STUDIO_DOC_TYPES.map((docType) => (
        <button
          key={docType.value}
          type="button"
          onClick={() => onSelect(docType.value)}
          className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
            value === docType.value
              ? "border-teal-500 bg-teal-50 text-teal-800"
              : "border-navy-900/10 bg-white text-navy-800 hover:border-teal-400/60 hover:bg-teal-50/40"
          }`}
        >
          {docType.label}
        </button>
      ))}
    </div>
  );
}

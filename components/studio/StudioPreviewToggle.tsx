"use client";

import type { PreviewAudience } from "@/lib/studioTypes";

interface StudioPreviewToggleProps {
  value: PreviewAudience;
  onChange: (value: PreviewAudience) => void;
}

export default function StudioPreviewToggle({ value, onChange }: StudioPreviewToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-navy-900/10 bg-white p-0.5 text-xs font-medium">
      {(["teacher", "student"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1 capitalize transition ${
            value === option ? "bg-navy-900 text-white" : "text-navy-700/60 hover:text-navy-900"
          }`}
        >
          {option} view
        </button>
      ))}
    </div>
  );
}

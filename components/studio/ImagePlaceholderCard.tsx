"use client";

import { ImageOff, Trash2 } from "lucide-react";
import type { ImagePlaceholder } from "@/lib/studioTypes";

interface ImagePlaceholderCardProps {
  placeholder: ImagePlaceholder;
  onChange: (patch: Partial<ImagePlaceholder>) => void;
  onRemove: () => void;
}

export default function ImagePlaceholderCard({
  placeholder,
  onChange,
  onRemove,
}: ImagePlaceholderCardProps) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-900/15 bg-navy-900/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-navy-700/60">
          <ImageOff size={14} />
          Image placeholder — upload coming soon
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove image placeholder"
          className="text-navy-700/40 hover:text-rose-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="space-y-2">
        <input
          value={placeholder.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What should this image show?"
          className="w-full rounded-lg border border-navy-900/10 bg-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        />
        <input
          value={placeholder.suggestedSearch}
          onChange={(e) => onChange({ suggestedSearch: e.target.value })}
          placeholder="Suggested search terms"
          className="w-full rounded-lg border border-navy-900/10 bg-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        />
        <input
          value={placeholder.link ?? ""}
          onChange={(e) => onChange({ link: e.target.value || null })}
          placeholder="Paste an image link (optional)"
          className="w-full rounded-lg border border-navy-900/10 bg-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        />
      </div>
    </div>
  );
}

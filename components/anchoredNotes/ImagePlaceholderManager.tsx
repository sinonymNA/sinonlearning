"use client";

import { ImageOff, Plus, Trash2 } from "lucide-react";
import type { AnchoredImageNeed, AnchoredImagePlacement } from "@/lib/anchoredNotesTypes";

interface ImagePlaceholderManagerProps {
  imageNeeds: AnchoredImageNeed[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<AnchoredImageNeed>) => void;
  onRemove: (id: string) => void;
}

const PLACEMENTS: { value: AnchoredImagePlacement; label: string }[] = [
  { value: "inline", label: "Inline" },
  { value: "fullWidth", label: "Full width" },
  { value: "sideBySide", label: "Side by side" },
];

export default function ImagePlaceholderManager({ imageNeeds, onAdd, onUpdate, onRemove }: ImagePlaceholderManagerProps) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-900">Images</p>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-full border border-navy-900/10 bg-white px-2.5 py-1 text-xs font-medium text-navy-800 transition hover:border-teal-400/60"
        >
          <Plus size={13} /> Add image
        </button>
      </div>
      <p className="mb-3 text-xs text-navy-700/60">
        Paste a direct image link if you have one — Teacher Studio never generates or searches for images automatically.
      </p>

      {imageNeeds.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-navy-900/15 p-3 text-xs text-navy-700/50">
          <ImageOff size={14} /> No images yet.
        </div>
      ) : (
        <div className="space-y-2">
          {imageNeeds.map((need) => (
            <div key={need.id} className="rounded-xl border border-navy-900/10 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={need.description}
                  onChange={(e) => onUpdate(need.id, { description: e.target.value })}
                  placeholder="What is this image of?"
                  className="flex-1 rounded-lg border border-navy-900/10 px-2 py-1 text-xs text-navy-900 outline-none focus:border-teal-400/60"
                />
                <button
                  type="button"
                  onClick={() => onRemove(need.id)}
                  aria-label="Remove image"
                  className="rounded-full p-1 text-navy-700/50 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                type="url"
                value={need.url ?? ""}
                onChange={(e) => onUpdate(need.id, { url: e.target.value || null })}
                placeholder="https://... (paste a direct image link)"
                className="mb-2 w-full rounded-lg border border-navy-900/10 px-2 py-1 text-xs text-navy-900 outline-none focus:border-teal-400/60"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={need.placement}
                  onChange={(e) => onUpdate(need.id, { placement: e.target.value as AnchoredImagePlacement })}
                  className="rounded-lg border border-navy-900/10 px-2 py-1 text-xs text-navy-900 outline-none focus:border-teal-400/60"
                >
                  {PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    need.status === "provided" ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {need.status === "provided" ? "Provided" : "Needed"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

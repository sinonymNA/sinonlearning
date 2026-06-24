"use client";

import { Plus, Trash2 } from "lucide-react";
import ImagePlaceholderCard from "./ImagePlaceholderCard";
import type { ImagePlaceholder, PreviewAudience, SlideBullet, StudioSlide } from "@/lib/studioTypes";

interface SlidePreviewProps {
  slide: StudioSlide;
  audience: PreviewAudience;
  linkedPlaceholder?: ImagePlaceholder;
  onChange: (patch: Partial<StudioSlide>) => void;
  onAddImagePlaceholder: () => void;
  onUpdatePlaceholder: (patch: Partial<ImagePlaceholder>) => void;
  onRemovePlaceholder: () => void;
}

export default function SlidePreview({
  slide,
  audience,
  linkedPlaceholder,
  onChange,
  onAddImagePlaceholder,
  onUpdatePlaceholder,
  onRemovePlaceholder,
}: SlidePreviewProps) {
  const updateBullet = (bulletId: string, text: string) => {
    onChange({ bullets: slide.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b)) });
  };

  const addBullet = () => {
    const bullet: SlideBullet = { id: crypto.randomUUID(), text: "" };
    onChange({ bullets: [...slide.bullets, bullet] });
  };

  const removeBullet = (bulletId: string) => {
    onChange({ bullets: slide.bullets.filter((b) => b.id !== bulletId) });
  };

  return (
    <div className="glass-panel rounded-3xl border border-navy-900/8 p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-wide text-navy-700/40">
        <span>{slide.type} slide</span>
        {slide.timingMinutes && <span>~{slide.timingMinutes} min</span>}
      </div>
      <input
        value={slide.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Slide title"
        className="w-full bg-transparent font-display text-2xl text-navy-900 focus-visible:outline-none"
      />
      <input
        value={slide.subtitle ?? ""}
        onChange={(e) => onChange({ subtitle: e.target.value })}
        placeholder="Subtitle (optional)"
        className="mt-1 w-full bg-transparent text-sm text-navy-700/60 focus-visible:outline-none"
      />

      <div className="mt-5 space-y-2">
        {slide.bullets.map((bullet) => (
          <div key={bullet.id} className="flex items-start gap-2">
            <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
            <textarea
              value={bullet.text}
              onChange={(e) => updateBullet(bullet.id, e.target.value)}
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-navy-800 focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => removeBullet(bullet.id)}
              aria-label="Remove bullet"
              className="mt-1 text-navy-700/30 hover:text-rose-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addBullet}
          className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
        >
          <Plus size={12} /> Add bullet
        </button>
      </div>

      {slide.body !== undefined && (
        <textarea
          value={slide.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Body text"
          rows={3}
          className="mt-4 w-full resize-none rounded-xl border border-navy-900/10 bg-white/60 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        />
      )}

      <div className="mt-5">
        {linkedPlaceholder ? (
          <ImagePlaceholderCard
            placeholder={linkedPlaceholder}
            onChange={onUpdatePlaceholder}
            onRemove={onRemovePlaceholder}
          />
        ) : (
          <button
            type="button"
            onClick={onAddImagePlaceholder}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-navy-900/15 px-3 py-2 text-xs font-medium text-navy-700/60 hover:border-teal-400/60 hover:text-teal-700"
          >
            <Plus size={12} /> Add image placeholder
          </button>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-navy-900/[0.03] p-3">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-navy-700/50">
          Student instructions
        </label>
        <textarea
          value={slide.studentInstructions}
          onChange={(e) => onChange({ studentInstructions: e.target.value })}
          rows={2}
          className="w-full resize-none bg-transparent text-sm text-navy-800 focus-visible:outline-none"
        />
      </div>

      {audience === "teacher" && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-amber-700/70">
            Teacher notes (hidden in student view)
          </label>
          <textarea
            value={slide.teacherNotes}
            onChange={(e) => onChange({ teacherNotes: e.target.value })}
            rows={2}
            className="w-full resize-none bg-transparent text-sm text-amber-900 focus-visible:outline-none"
          />
        </div>
      )}
    </div>
  );
}

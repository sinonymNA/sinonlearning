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
  /** Tailwind max-width class for the slide frame. Defaults to a comfortable reading width. */
  frameMaxWidth?: string;
}

export default function SlidePreview({
  slide,
  audience,
  linkedPlaceholder,
  onChange,
  onAddImagePlaceholder,
  onUpdatePlaceholder,
  onRemovePlaceholder,
  frameMaxWidth = "max-w-3xl",
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

  const imageFocus = slide.layout === "imageFocus";
  const centered = slide.layout === "titleOnly";
  const twoColumn = slide.layout === "twoColumn";

  return (
    <div className={`mx-auto w-full ${frameMaxWidth}`}>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-navy-900/10 bg-white shadow-[0_10px_30px_rgba(13,27,46,0.12)]">
        <span className="absolute right-3 top-3 z-10 rounded-full bg-navy-900/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy-700/40">
          {slide.type}
          {slide.timingMinutes ? ` · ~${slide.timingMinutes} min` : ""}
        </span>

        <div
          className={`flex h-full flex-col overflow-y-auto p-8 sm:p-12 ${
            centered ? "items-center justify-center text-center" : "justify-start"
          } ${imageFocus ? "gap-6 sm:flex-row sm:items-center" : ""}`}
        >
          <div className={imageFocus ? "flex-1" : "w-full"}>
            <input
              value={slide.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Click to add title"
              className={`w-full bg-transparent font-display text-navy-900 placeholder:text-navy-900/25 focus-visible:outline-none ${
                centered ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
              }`}
            />
            <input
              value={slide.subtitle ?? ""}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder="Click to add subtitle"
              className={`mt-1 w-full bg-transparent text-navy-700/60 placeholder:text-navy-700/30 focus-visible:outline-none ${
                centered ? "text-center text-lg" : "text-base"
              }`}
            />

            <ul
              className={`mt-5 space-y-2 ${
                twoColumn ? "sm:grid sm:grid-cols-2 sm:gap-x-8 sm:space-y-0" : ""
              } ${centered ? "mx-auto max-w-md text-left" : ""}`}
            >
              {slide.bullets.map((bullet) => (
                <li key={bullet.id} className="group/bullet flex items-start gap-2">
                  <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                  <textarea
                    value={bullet.text}
                    onChange={(e) => updateBullet(bullet.id, e.target.value)}
                    rows={1}
                    placeholder="Click to add text"
                    className="w-full resize-none bg-transparent text-base text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(bullet.id)}
                    aria-label="Remove bullet"
                    className="mt-1.5 text-navy-700/0 transition group-hover/bullet:text-navy-700/30 hover:text-rose-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>

            {slide.body !== undefined && (
              <textarea
                value={slide.body}
                onChange={(e) => onChange({ body: e.target.value })}
                placeholder="Click to add body text"
                rows={4}
                className="mt-4 w-full resize-none bg-transparent text-base leading-relaxed text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
              />
            )}

            <button
              type="button"
              onClick={addBullet}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-navy-700/30 hover:text-teal-700"
            >
              <Plus size={12} /> Add bullet
            </button>
          </div>

          {imageFocus && (
            <div className="w-full flex-1 sm:max-w-[40%]">
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
                  className="flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-navy-900/15 text-navy-700/40 hover:border-teal-400/50 hover:text-teal-700"
                >
                  <Plus size={18} />
                  <span className="text-xs font-medium">Add image placeholder</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {!imageFocus && (
        <div className="mt-3">
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
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-navy-900/15 px-3 py-2 text-xs font-medium text-navy-700/50 hover:border-teal-400/50 hover:text-teal-700"
            >
              <Plus size={12} /> Add image placeholder
            </button>
          )}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-navy-900/8 bg-navy-900/[0.02] p-4">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-navy-700/45">
          Student instructions
        </label>
        <textarea
          value={slide.studentInstructions}
          onChange={(e) => onChange({ studentInstructions: e.target.value })}
          rows={2}
          placeholder="What should students do during this slide?"
          className="w-full resize-none bg-transparent text-sm text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
        />
      </div>

      {audience === "teacher" && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-amber-700/70">
            Speaker notes (hidden in student view)
          </label>
          <textarea
            value={slide.teacherNotes}
            onChange={(e) => onChange({ teacherNotes: e.target.value })}
            rows={2}
            placeholder="Notes for yourself while teaching this slide…"
            className="w-full resize-none bg-transparent text-sm text-amber-900 placeholder:text-amber-700/40 focus-visible:outline-none"
          />
        </div>
      )}
    </div>
  );
}

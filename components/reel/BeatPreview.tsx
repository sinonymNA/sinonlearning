"use client";

import { REEL_THEME } from "@/lib/reelTypes";
import type { Beat } from "@/lib/reelTypes";

// A rough on-canvas approximation of a beat — a guide for the teacher while
// editing. The Manim render (reel_worker/templates.py) is the source of truth
// for the actual video; this only needs to convey layout and content.
export default function BeatPreview({ beat }: { beat: Beat }) {
  const p = beat.params;
  const asText = (v: unknown) => (typeof v === "string" ? v : "");
  const asList = (v: unknown) => (Array.isArray(v) ? v.filter((x) => String(x).trim()) : []);

  return (
    <div
      className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl"
      style={{ background: REEL_THEME.background }}
    >
      {beat.templateId === "titleCard" && (
        <div className="px-8 text-center">
          <div className="text-2xl font-bold sm:text-4xl" style={{ color: REEL_THEME.heading }}>
            {asText(p.headline) || "Headline"}
          </div>
          {asText(p.subtitle) && (
            <div className="mt-3 text-sm sm:text-lg" style={{ color: REEL_THEME.body }}>
              {asText(p.subtitle)}
            </div>
          )}
        </div>
      )}

      {beat.templateId === "bulletReveal" && (
        <div className="w-full px-10">
          <div className="mb-4 text-lg font-bold sm:text-2xl" style={{ color: REEL_THEME.accent }}>
            {asText(p.heading) || "Heading"}
          </div>
          <ul className="space-y-2">
            {(asList(p.bullets).length ? asList(p.bullets) : ["Point one", "Point two"]).slice(0, 5).map((b, i) => (
              <li key={i} className="text-sm sm:text-lg" style={{ color: REEL_THEME.body }}>
                •&nbsp;&nbsp;{b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {beat.templateId === "imageCaption" && (
        <div className="flex flex-col items-center gap-3 px-8">
          {beat.imageId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/reel/images/${beat.imageId}`}
              alt={asText(p.caption)}
              className="max-h-[55%] max-w-[70%] rounded-md object-contain"
            />
          ) : (
            <div
              className="flex h-32 w-56 items-center justify-center rounded-md border border-dashed text-xs"
              style={{ borderColor: REEL_THEME.body, color: REEL_THEME.body }}
            >
              Image goes here
            </div>
          )}
          {asText(p.caption) && (
            <div className="text-center text-sm sm:text-base" style={{ color: REEL_THEME.body }}>
              {asText(p.caption)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import type { StudioSlide } from "@/lib/studioTypes";

interface SlideThumbProps {
  slide: StudioSlide;
}

/** A tiny rendered preview of a slide's content — used in filmstrips and hub cards. */
export default function SlideThumb({ slide }: SlideThumbProps) {
  return (
    <span className="flex h-full w-full flex-col overflow-hidden p-1.5">
      <span className="line-clamp-1 font-display text-[8px] font-semibold leading-tight text-navy-900">
        {slide.title || "Untitled slide"}
      </span>
      {slide.bullets.length > 0 ? (
        <span className="mt-0.5 flex-1 space-y-0.5 overflow-hidden">
          {slide.bullets.slice(0, 3).map((b) => (
            <span key={b.id} className="line-clamp-1 block text-[6.5px] leading-tight text-navy-700/50">
              · {b.text || "untitled"}
            </span>
          ))}
        </span>
      ) : slide.body ? (
        <span className="mt-0.5 line-clamp-3 flex-1 text-[6.5px] leading-tight text-navy-700/50">
          {slide.body}
        </span>
      ) : null}
    </span>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { buildAnnotatedRuns, type EssayAnnotation } from "@/lib/marginsAnnotations";
import { revealStagger } from "@/lib/marginsMotion";

// Highlights are colored by rubric category, one color per category in the
// order it first appears (wraps past PALETTE.length for essays with more
// categories than colors).
const PALETTE = [
  { hex: "#ede9fe", text: "text-violet-700", dot: "bg-violet-500", ring: "ring-violet-400", chipBg: "bg-violet-100" },
  { hex: "#ccfbf1", text: "text-teal-700", dot: "bg-teal-500", ring: "ring-teal-400", chipBg: "bg-teal-100" },
  { hex: "#fef3c7", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-400", chipBg: "bg-amber-100" },
  { hex: "#ffe4e6", text: "text-rose-700", dot: "bg-rose-500", ring: "ring-rose-400", chipBg: "bg-rose-100" },
  { hex: "#e0f2fe", text: "text-sky-700", dot: "bg-sky-500", ring: "ring-sky-400", chipBg: "bg-sky-100" },
  { hex: "#d1fae5", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-400", chipBg: "bg-emerald-100" },
];

export default function AnnotatedEssay({
  essayText,
  annotations,
}: {
  essayText: string;
  annotations: EssayAnnotation[];
}) {
  const categories = Array.from(new Set(annotations.map((a) => a.category)));
  const runs = buildAnnotatedRuns(essayText, annotations);
  const [active, setActive] = useState<EssayAnnotation | null>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const essayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function colorFor(category: string) {
    const idx = categories.indexOf(category);
    return PALETTE[(idx >= 0 ? idx : 0) % PALETTE.length];
  }

  // The centerpiece reveal: legend chips first, then the essay itself, then
  // each highlight "paints on" in essay order — like KORA is marking it up live.
  useEffect(() => {
    if (legendRef.current) {
      revealStagger(legendRef.current, ".legend-chip", { duration: 320, stagger: 50, translateY: 8 });
    }
    if (essayRef.current) {
      animate(essayRef.current, {
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 420,
        easing: "outQuart",
      });
      const marks = essayRef.current.querySelectorAll<HTMLElement>(".annotated-mark");
      marks.forEach((mark, i) => {
        const hex = mark.dataset.hex;
        if (!hex) return;
        animate(mark, {
          backgroundColor: ["rgba(0,0,0,0)", hex],
          duration: 420,
          delay: 450 + i * 160,
          easing: "outQuart",
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!active || !panelRef.current) return;
    animate(panelRef.current, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 260,
      easing: "outQuart",
    });
  }, [active]);

  return (
    <div className="flex flex-col gap-4">
      {categories.length > 0 && (
        <div ref={legendRef} className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const color = colorFor(c);
            return (
              <span
                key={c}
                className={`legend-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${color.chipBg} ${color.text}`}
                style={{ opacity: 0 }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                {c}
              </span>
            );
          })}
        </div>
      )}

      <div
        ref={essayRef}
        style={{ opacity: 0 }}
        className="rounded-2xl border border-stone-100 bg-white p-6 text-[15px] leading-[1.9] text-stone-800 whitespace-pre-wrap"
      >
        {runs.map((run, i) => {
          if (!run.annotation) return <span key={i}>{run.text}</span>;
          const color = colorFor(run.annotation.category);
          const isActive = active === run.annotation;
          return (
            <mark
              key={i}
              data-hex={color.hex}
              onClick={() => setActive(isActive ? null : run.annotation)}
              style={{ backgroundColor: "rgba(0,0,0,0)" }}
              className={[
                "annotated-mark cursor-pointer rounded px-0.5 transition-shadow",
                color.text,
                isActive ? `ring-2 ${color.ring}` : "",
              ].join(" ")}
            >
              {run.text}
            </mark>
          );
        })}
      </div>

      {active ? (
        <div ref={panelRef} className={`rounded-xl border border-transparent p-4 ${colorFor(active.category).chipBg}`} style={{ opacity: 0 }}>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${colorFor(active.category).text}`}>
            {active.category}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed">{active.comment}</p>
        </div>
      ) : (
        annotations.length > 0 && (
          <p className="text-xs text-stone-400 text-center">Click a highlighted line to see KORA's note.</p>
        )
      )}
    </div>
  );
}

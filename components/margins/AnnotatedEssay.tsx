"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { buildAnnotatedRuns, type EssayAnnotation, type AnnotationType } from "@/lib/marginsAnnotations";
import { revealStagger } from "@/lib/marginsMotion";

// Highlights are colored by praise/growth, not rubric category — the point is
// to make confidence-building praise visually jump out immediately. Reuses
// the same emerald/sky already meaningful in GradingReport's Strengths/Next
// steps cards, so the grading UI's color language stays coherent.
const TYPE_STYLES: Record<
  AnnotationType,
  { hex: string; text: string; dot: string; ring: string; chipBg: string; label: string }
> = {
  praise: {
    hex: "#d1fae5",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-400",
    chipBg: "bg-emerald-100",
    label: "Strength",
  },
  growth: {
    hex: "#e0f2fe",
    text: "text-sky-700",
    dot: "bg-sky-500",
    ring: "ring-sky-400",
    chipBg: "bg-sky-100",
    label: "Growth area",
  },
};

export default function AnnotatedEssay({
  essayText,
  annotations,
}: {
  essayText: string;
  annotations: EssayAnnotation[];
}) {
  const runs = buildAnnotatedRuns(essayText, annotations);
  const [active, setActive] = useState<EssayAnnotation | null>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const essayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function colorFor(type: AnnotationType) {
    return TYPE_STYLES[type];
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
      {annotations.length > 0 && (
        <div ref={legendRef} className="flex flex-wrap gap-2">
          {(["praise", "growth"] as const).map((type) => {
            const color = TYPE_STYLES[type];
            return (
              <span
                key={type}
                className={`legend-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${color.chipBg} ${color.text}`}
                style={{ opacity: 0 }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                {color.label}
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
          const color = colorFor(run.annotation.type);
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
        <div ref={panelRef} className={`rounded-xl border border-transparent p-4 ${colorFor(active.type).chipBg}`} style={{ opacity: 0 }}>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${colorFor(active.type).text}`}>
            {colorFor(active.type).label} <span className="font-normal normal-case tracking-normal opacity-70">· {active.category}</span>
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

"use client";

import { useState } from "react";
import { buildAnnotatedRuns, type EssayAnnotation } from "@/lib/marginsAnnotations";

const PALETTE = [
  { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500", ring: "ring-violet-400" },
  { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500", ring: "ring-teal-400" },
  { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-400" },
  { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500", ring: "ring-rose-400" },
  { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500", ring: "ring-sky-400" },
  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-400" },
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

  function colorFor(category: string) {
    const idx = categories.indexOf(category);
    return PALETTE[(idx >= 0 ? idx : 0) % PALETTE.length];
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const color = colorFor(c);
            return (
              <span
                key={c}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${color.bg} ${color.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                {c}
              </span>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-stone-100 bg-white p-6 text-[15px] leading-[1.9] text-stone-800 whitespace-pre-wrap">
        {runs.map((run, i) => {
          if (!run.annotation) return <span key={i}>{run.text}</span>;
          const color = colorFor(run.annotation.category);
          const isActive = active === run.annotation;
          return (
            <mark
              key={i}
              onClick={() => setActive(isActive ? null : run.annotation)}
              className={[
                "cursor-pointer rounded px-0.5 transition-all",
                color.bg,
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
        <div className={`rounded-xl border border-transparent p-4 ${colorFor(active.category).bg}`}>
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

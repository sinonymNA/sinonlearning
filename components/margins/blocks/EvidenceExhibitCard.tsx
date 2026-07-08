"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { handwriting } from "@/lib/marginsFonts";

interface Props {
  label: string;
  content: string;
  annotation?: string;
}

// Deterministic, stable per-instance tilt (not Math.random()) so the same
// exhibit always renders the same way across re-renders/SSR hydration.
function tiltFor(label: string): number {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) % 1000;
  return (hash % 5) - 2; // -2..2 degrees
}

export default function EvidenceExhibitCard({ label, content, annotation }: Props) {
  const inkRef = useRef<HTMLDivElement>(null);
  const tilt = tiltFor(label);

  useEffect(() => {
    if (inkRef.current) {
      animate(inkRef.current, {
        opacity: [0, 1],
        scale: [0.7, 1],
        duration: 320,
        delay: 260,
        easing: "outBack",
      });
    }
  }, []);

  return (
    <div className="relative mx-auto max-w-md" style={{ transform: `rotate(${tilt}deg)` }}>
      <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-stone-400 shadow-sm" />
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-[0_4px_14px_rgba(41,37,36,0.08)]">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-stone-800">{content}</p>
        {annotation && (
          <div
            ref={inkRef}
            className={`${handwriting.className} mt-2 text-lg leading-snug text-red-600`}
            style={{ opacity: 0 }}
          >
            {annotation}
          </div>
        )}
      </div>
    </div>
  );
}

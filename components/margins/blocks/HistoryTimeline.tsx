"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { handwriting } from "@/lib/marginsFonts";

interface TimelineEvent {
  date: string;
  label: string;
  detail: string;
}

interface Props {
  events: TimelineEvent[];
}

export default function HistoryTimeline({ events }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const marks = containerRef.current.querySelectorAll<HTMLElement>(".date-ink");
    marks.forEach((mark, i) => {
      animate(mark, { opacity: [0, 1], scale: [0.7, 1], duration: 300, delay: 200 + i * 120, easing: "outBack" });
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-6 border-stone-200 sm:flex-row sm:items-start sm:gap-3 sm:border-t sm:pt-6"
    >
      {events.map((event, i) => (
        <div key={i} className="flex flex-1 flex-col items-center text-center">
          <span className="mb-2 hidden h-3 w-3 rounded-full bg-teal-500 sm:block" />
          <div className="relative inline-flex items-center justify-center">
            <span className={`date-ink absolute inset-0 -m-1.5 text-red-600`} style={{ opacity: 0 }}>
              <svg viewBox="0 0 100 40" className="h-full w-full">
                <ellipse cx="50" cy="20" rx="47" ry="17" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <p className={`${handwriting.className} relative px-3 py-1 text-lg text-stone-800`}>{event.date}</p>
          </div>
          <p className="mt-2 text-[13px] font-semibold text-stone-800">{event.label}</p>
          <p className="mt-1 max-w-[16rem] text-[12px] leading-relaxed text-stone-500">{event.detail}</p>
        </div>
      ))}
    </div>
  );
}

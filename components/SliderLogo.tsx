"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

interface Props {
  width?: number;
  className?: string;
  light?: boolean;
}

export default function SliderLogo({ width = 130, className = "", light = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      translateY: [0, -6, 0],
      rotate: [0, -1, 0, 1, 0],
      duration: 4800,
      loop: true,
      easing: "inOutSine",
    });
  }, []);

  return (
    <div ref={ref} className={`inline-flex items-center gap-1.5 select-none ${className}`} style={{ width }}>
      <span
        className="font-extrabold tracking-tight"
        style={{
          fontSize: width * 0.19,
          ...(light
            ? { color: "#fff" }
            : {
                background: "linear-gradient(90deg, #F97316 0%, #DB2777 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }),
        }}
      >
        Slider
      </span>
      <svg
        width={width * 0.13}
        height={width * 0.13}
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
        style={{ color: light ? "#fff" : "#DB2777" }}
      >
        <rect x="2" y="4" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

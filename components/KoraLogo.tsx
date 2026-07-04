"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  light?: boolean;
}

const sizeMap = {
  sm: { cls: "text-xl", dot: 5 },
  md: { cls: "text-3xl", dot: 7 },
  lg: { cls: "text-5xl", dot: 11 },
  xl: { cls: "text-7xl", dot: 16 },
};

export default function KoraLogo({ size = "md", light = false }: Props) {
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!dotRef.current) return;
    animate(dotRef.current, {
      scale: [1, 1.5, 1],
      opacity: [0.9, 0.55, 0.9],
      duration: 2400,
      loop: true,
      easing: "inOutSine",
    });
  }, []);

  const { cls, dot } = sizeMap[size];
  const textColor = light ? "#fff" : "#7C3AED";

  return (
    <span
      className={`font-extrabold tracking-tight select-none ${cls}`}
      style={{ color: textColor, fontFamily: "inherit" }}
    >
      k
      <span className="relative inline-block">
        o
        <span
          ref={dotRef}
          style={{
            position: "absolute",
            width: dot,
            height: dot,
            borderRadius: "50%",
            background: "#FB7185",
            left: "50%",
            top: "48%",
            transform: "translate(-50%, -50%)",
            display: "block",
          }}
        />
      </span>
      ra
    </span>
  );
}

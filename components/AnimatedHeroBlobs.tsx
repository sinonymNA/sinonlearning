"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

export default function AnimatedHeroBlobs() {
  const blob1 = useRef<HTMLDivElement>(null);
  const blob2 = useRef<HTMLDivElement>(null);
  const blob3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (blob1.current) {
      animate(blob1.current, {
        scale: [1, 1.18, 1],
        opacity: [0.15, 0.25, 0.15],
        duration: 7000,
        loop: true,
        easing: "inOutSine",
      });
    }
    if (blob2.current) {
      animate(blob2.current, {
        scale: [1, 1.22, 1],
        translateX: [0, 24, 0],
        opacity: [0.1, 0.18, 0.1],
        duration: 9000,
        loop: true,
        easing: "inOutSine",
      });
    }
    if (blob3.current) {
      animate(blob3.current, {
        scale: [1, 1.15, 1],
        translateY: [0, -16, 0],
        opacity: [0.08, 0.16, 0.08],
        duration: 11000,
        loop: true,
        easing: "inOutSine",
      });
    }
  }, []);

  return (
    <>
      <div
        ref={blob1}
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-teal-400 blur-[120px]"
        style={{ opacity: 0.15 }}
      />
      <div
        ref={blob2}
        className="pointer-events-none absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full bg-amber-400 blur-[100px]"
        style={{ opacity: 0.1 }}
      />
      <div
        ref={blob3}
        className="pointer-events-none absolute -left-16 bottom-0 -z-10 h-60 w-60 rounded-full bg-violet-400 blur-[90px]"
        style={{ opacity: 0.08 }}
      />
    </>
  );
}

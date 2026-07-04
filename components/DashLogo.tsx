"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import Image from "next/image";

interface Props {
  width?: number;
  className?: string;
}

export default function DashLogo({ width = 120, className = "" }: Props) {
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

  const height = Math.round(width * (374 / 668));

  return (
    <div ref={ref} className={`inline-block ${className}`}>
      <Image
        src="/dash-logo.png"
        alt="Dash"
        width={width}
        height={height}
        priority
        style={{ width, height: "auto" }}
      />
    </div>
  );
}

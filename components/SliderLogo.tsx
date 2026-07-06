"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import Image from "next/image";

interface Props {
  width?: number;
  className?: string;
  light?: boolean;
}

const ASPECT = 375 / 666;

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

  const height = Math.round(width * ASPECT);

  return (
    <div ref={ref} className={`inline-block ${className}`}>
      <Image
        src={light ? "/slider-logo-white.png" : "/slider-logo.png"}
        alt="Slider"
        width={width}
        height={height}
        priority
        style={{ width, height: "auto" }}
      />
    </div>
  );
}

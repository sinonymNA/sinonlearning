"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import Image from "next/image";

interface Props {
  width?: number;
  className?: string;
}

export default function KoraLogo({ width = 140, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      translateY: [0, -6, 0],
      duration: 3800,
      loop: true,
      easing: "inOutSine",
    });
  }, []);

  const height = Math.round(width * (212 / 566));

  return (
    <div ref={ref} className={`inline-block ${className}`}>
      <Image
        src="/kora-logo.png"
        alt="KORA"
        width={width}
        height={height}
        priority
        style={{ width: width, height: "auto" }}
      />
    </div>
  );
}

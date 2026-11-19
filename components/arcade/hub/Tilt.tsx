"use client";

import Link from "next/link";
import { useRef } from "react";

/** A link card that tilts toward the pointer and lights up where it's hovered. Pure CSS variables; no motion on touch/reduced-motion. */
export default function TiltCard({ href, className = "", children, label }: { href: string; className?: string; children: React.ReactNode; label?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - y) * 9).toFixed(2)}deg`); el.style.setProperty("--ry", `${((x - 0.5) * 11).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`); el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  };
  const leave = () => { const el = ref.current; if (!el) return; el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
  return (
    <Link ref={ref} href={href} className={`hb-card ${className}`} onPointerMove={move} onPointerLeave={leave} aria-label={label}>
      <span className="hb-glare" aria-hidden />
      {children}
    </Link>
  );
}

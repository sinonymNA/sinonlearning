"use client";

import { useRef, type ReactNode } from "react";
import { useMountReveal, type RevealOpts } from "@/lib/marginsMotion";

interface Props extends RevealOpts {
  selector?: string;
  className?: string;
  children: ReactNode;
}

// Thin client wrapper so Server Component pages (dashboards, class detail)
// can animate already-fetched list data in without becoming client components
// themselves — mark each child with the selector class (default ".reveal-item")
// and give it `style={{ opacity: 0 }}` to avoid a flash before JS runs.
export default function RevealGroup({ selector = ".reveal-item", className, children, ...opts }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useMountReveal(ref, selector, opts);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

import type { ReactNode } from "react";

type Tone = "teal" | "amber" | "navy" | "outline";

const toneClasses: Record<Tone, string> = {
  teal: "bg-teal-50 text-teal-700 border border-teal-200",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  navy: "bg-navy-900 text-cream-100 border border-navy-900",
  outline: "bg-transparent text-navy-700 border border-navy-900/15",
};

const statusTone: Record<string, Tone> = {
  "First Build": "amber",
  Prototype: "amber",
  Planned: "teal",
  "Coming Later": "outline",
  "Free Core Library": "teal",
  "Teacher Built": "navy",
  "In Development": "outline",
};

export default function Badge({
  children,
  tone,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const resolvedTone =
    tone ?? (typeof children === "string" ? statusTone[children] : undefined) ?? "outline";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ${toneClasses[resolvedTone]} ${className}`}
    >
      {children}
    </span>
  );
}

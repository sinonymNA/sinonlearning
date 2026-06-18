import type { ReactNode } from "react";

type Tone = "teal" | "amber" | "rose" | "navy" | "outline";

const toneClasses: Record<Tone, string> = {
  teal: "bg-teal-50 text-teal-700 border border-teal-200/80",
  amber: "bg-amber-50 text-amber-700 border border-amber-200/80",
  rose: "bg-rose-50 text-rose-700 border border-rose-200/80",
  navy: "bg-navy-900 text-cream-100 border border-navy-900",
  outline: "bg-transparent text-navy-700 border border-navy-900/15",
};

const dotClasses: Record<Tone, string> = {
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  rose: "bg-rose-400",
  navy: "bg-teal-300",
  outline: "bg-navy-700/40",
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${toneClasses[resolvedTone]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[resolvedTone]}`} />
      {children}
    </span>
  );
}

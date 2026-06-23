import type { LucideIcon } from "lucide-react";
import FadeIn from "./FadeIn";

export interface ResearchFlowStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ResearchFlow({ steps }: { steps: ResearchFlowStep[] }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <FadeIn key={step.title} delay={i * 0.08} className="relative bg-navy-950 p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
            <step.icon size={18} strokeWidth={2} />
          </span>
          <p className="mt-4 text-sm font-semibold text-white">{step.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/60">{step.description}</p>
          {i < steps.length - 1 && (
            <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-white/20 lg:block">
              →
            </span>
          )}
        </FadeIn>
      ))}
    </div>
  );
}

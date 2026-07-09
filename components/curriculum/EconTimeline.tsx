import { Sailboat, Building2, Wind } from "lucide-react";
import FadeIn from "@/components/FadeIn";

const STEPS = [
  {
    label: "Yesterday",
    icon: Sailboat,
    description: "Learn how people traded, saved, and built economies in the past.",
  },
  {
    label: "Today",
    icon: Building2,
    description: "Explore the economic forces shaping your life right now.",
  },
  {
    label: "Tomorrow",
    icon: Wind,
    description: "Prepare for the future economy and the choices you'll face next.",
  },
];

export default function EconTimeline() {
  return (
    <section className="bg-circuit relative overflow-hidden bg-econ-900 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => (
            <FadeIn key={step.label} delay={i * 0.08}>
              <div className="relative text-center sm:text-left">
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-econ-800 text-econ-200">
                    <step.icon size={20} />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-300/70">
                    0{i + 1} &middot; {step.label}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/70 sm:mt-4">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

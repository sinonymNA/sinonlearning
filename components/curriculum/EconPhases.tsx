import FadeIn from "@/components/FadeIn";
import { phases } from "@/data/economicsCourse";

export default function EconPhases() {
  return (
    <section className="bg-circuit relative overflow-hidden bg-econ-900 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-300/70">
            The framework
          </span>
          <h2 className="mt-3 font-display text-2xl font-medium text-white sm:text-3xl">
            Four verbs. Every unit. Every lesson.
          </h2>
        </FadeIn>

        <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase, i) => (
            <FadeIn key={phase.name} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-econ-800 text-econ-200">
                    <phase.icon size={17} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-medium text-white">{phase.name}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-econ-300/60">
                      {phase.unitRange}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/65">{phase.question}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

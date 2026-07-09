import FadeIn from "@/components/FadeIn";
import { lessonDNA } from "@/data/economicsCourse";

export default function EconLessonDNA() {
  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-700">
            The lesson dna
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
            Every lesson. Every day. Never the same twice.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-700/70">
            Five non-negotiable steps shape every single day of the course — but the story, the
            document, and the activity are always different.
          </p>
        </FadeIn>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {lessonDNA.map((step, i) => (
            <FadeIn key={step.name} delay={i * 0.06}>
              <div className="relative h-full rounded-2xl border border-navy-900/8 bg-white p-5 shadow-[0_1px_2px_rgba(13,27,46,0.04)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-econ-100 text-xs font-semibold text-econ-700">
                  {String(step.order).padStart(2, "0")}
                </span>
                <p className="mt-4 text-sm font-semibold text-navy-900">{step.name}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-econ-600/70">
                  {step.time}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-navy-700/70">{step.description}</p>
                {i < lessonDNA.length - 1 && (
                  <span className="absolute -right-3.5 top-1/2 hidden -translate-y-1/2 text-navy-900/15 lg:block">
                    →
                  </span>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

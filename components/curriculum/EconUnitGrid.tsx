import FadeIn from "@/components/FadeIn";
import Card from "@/components/Card";
import { economicsUnits } from "@/data/courses";

export default function EconUnitGrid() {
  return (
    <section className="bg-cream-100/60 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-700">
            Explore the course
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
            8 Units. Endless &ldquo;Aha!&rdquo; Moments.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-700/70">
            Each unit blends stories from the past, real-world examples from today, and decisions
            about tomorrow.
          </p>
        </FadeIn>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {economicsUnits.map((unit, i) => (
            <FadeIn key={unit.title} delay={i * 0.05}>
              <Card className="!p-5 sm:!p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-econ-100 text-xs font-semibold text-econ-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <unit.icon size={18} className="text-econ-600" />
                </div>
                <p className="mt-4 text-sm font-semibold text-navy-900">{unit.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-700/70">{unit.blurb}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

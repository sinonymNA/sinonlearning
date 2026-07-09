import FadeIn from "@/components/FadeIn";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import { economicsUnits } from "@/data/economicsCourse";

const PHASE_TONE: Record<string, "teal" | "amber" | "rose" | "navy"> = {
  Decide: "navy",
  Earn: "amber",
  Grow: "teal",
  Protect: "rose",
};

export default function EconUnitGrid() {
  return (
    <section className="bg-cream-100/60 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-700">
            Explore the course
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
            7 Units. One Semester. Every SSEC Standard.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-700/70">
            Each unit blends stories from the past, real-world examples from today, and decisions
            about tomorrow — mapped to Georgia's AKS standards day by day.
          </p>
        </FadeIn>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {economicsUnits.map((unit, i) => (
            <FadeIn key={unit.title} delay={i * 0.05}>
              <Card className="flex h-full flex-col !p-5 sm:!p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-econ-100 text-xs font-semibold text-econ-700">
                      {String(unit.number).padStart(2, "0")}
                    </span>
                    <unit.icon size={18} className="text-econ-600" />
                  </div>
                  <Badge tone={PHASE_TONE[unit.phase]}>{unit.phase}</Badge>
                </div>
                <p className="mt-4 text-sm font-semibold text-navy-900">{unit.title}</p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-navy-700/70">
                  {unit.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-navy-900/8 pt-3 text-xs text-navy-700/50">
                  <span>{unit.dateRange}</span>
                  <span>{unit.days} days</span>
                </div>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-navy-700/40">
                  {unit.akaRange}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

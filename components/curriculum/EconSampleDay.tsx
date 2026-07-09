import FadeIn from "@/components/FadeIn";
import { sampleDay } from "@/data/economicsCourse";

export default function EconSampleDay() {
  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-700">
            {sampleDay.unitDay} &middot; A day, unpacked
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-navy-900 sm:text-4xl">
            {sampleDay.title}
          </h2>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="mt-7 rounded-2xl border border-econ-200/60 bg-econ-50 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-econ-700/70">
              The hook
            </p>
            <p className="mt-2 font-display text-xl italic leading-snug text-navy-900">
              &ldquo;{sampleDay.hook}&rdquo;
            </p>
          </div>
        </FadeIn>

        <div className="mt-6 space-y-3">
          {sampleDay.steps.map((step, i) => (
            <FadeIn key={step.name} delay={0.08 + i * 0.05}>
              <div className="flex gap-4 rounded-xl border border-navy-900/8 bg-white p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-econ-100 text-xs font-semibold text-econ-700">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{step.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-navy-700/70">{step.description}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.35}>
          <div className="mt-6 rounded-2xl border border-navy-900/8 bg-navy-900 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">Debrief</p>
            <p className="mt-2 text-base leading-relaxed text-white/80">{sampleDay.debrief}</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

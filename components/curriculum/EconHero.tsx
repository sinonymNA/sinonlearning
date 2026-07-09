import { FlaskConical } from "lucide-react";
import Button from "@/components/Button";
import FadeIn from "@/components/FadeIn";

export default function EconHero() {
  return (
    <section className="bg-grain relative overflow-hidden bg-cream-50 px-6 pt-16 pb-14 lg:px-8 lg:pt-24 lg:pb-20">
      <div className="absolute -left-24 top-10 -z-10 h-80 w-80 rounded-full bg-econ-400/15 blur-[120px]" />
      <div className="absolute -right-16 top-32 -z-10 h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <FadeIn>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-700">
              Yesterday. Today. Tomorrow.
            </span>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-navy-900 sm:text-6xl">
              Everyday Economics
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-700/80">
              Understand how people solve problems with money and the economy — then use that
              knowledge to build a better future.
            </p>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/curriculum" variant="primary" className="!bg-econ-600 !text-white hover:!bg-econ-500">
                Start Learning
              </Button>
              <Button href="/simulations" variant="secondary">
                <FlaskConical size={15} />
                Explore the Labs
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <p className="mt-6 text-sm font-medium text-navy-700/60">
              Real stories. Real choices. Real life.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.1}>
          <div className="relative rounded-3xl border border-navy-900/8 bg-white p-7 shadow-[0_20px_60px_rgba(13,27,46,0.08)]">
            <p className="font-display text-2xl italic leading-snug text-navy-900">
              &ldquo;Economics isn&apos;t about numbers. It&apos;s about people and
              choices.&rdquo;
            </p>
            <div className="mt-6 h-px bg-navy-900/8" />
            <div className="mt-6 flex items-center justify-between text-xs text-navy-700/50">
              <span>8 units</span>
              <span>Digital textbook · Slides · Activities</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

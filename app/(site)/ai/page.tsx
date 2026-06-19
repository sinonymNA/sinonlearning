import Link from "next/link";
import { ArrowRight, BrainCircuit, FlaskConical, ShieldCheck, Scale } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import FlagshipCourseCard from "@/components/ai/FlagshipCourseCard";
import { aiCourses } from "@/data/aiCourses";

const pillars = [
  {
    icon: BrainCircuit,
    title: "How it actually works",
    description: "Demystify machine learning and neural networks—no code, no jargon, no fear.",
  },
  {
    icon: Scale,
    title: "Think critically",
    description: "Interrogate bias, misinformation, privacy, and power in AI systems.",
  },
  {
    icon: ShieldCheck,
    title: "Use it responsibly",
    description: "Build the judgment to use AI tools ethically and effectively, for life.",
  },
];

export default function AIMissionPage() {
  return (
    <div className="bg-navy-950">
      <section className="bg-circuit relative overflow-hidden px-6 pt-16 pb-20 lg:px-8 lg:pt-24">
        <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[130px]" />
        <div className="absolute -right-24 top-32 -z-10 h-80 w-80 rounded-full bg-purple-500/15 blur-[120px]" />
        <div className="absolute -left-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-[110px]" />

        <div className="mx-auto max-w-5xl text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
              Mission Two
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-white sm:text-6xl">
              Learn About <span className="text-gradient-ai">AI</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
              Sinon Learning&rsquo;s second mission: classroom-ready courses on the science and
              ethical use of artificial intelligence—built so students understand AI instead of
              just using it.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.15}>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center"
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-teal-300/20 bg-teal-300/10 text-teal-200">
                  <pillar.icon size={18} />
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{pillar.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">{pillar.description}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mx-auto mt-10 max-w-3xl">
            <Link
              href="/ai/sandboxes"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-purple-300/25 bg-purple-300/5 p-5 transition-colors hover:border-purple-300/40 hover:bg-purple-300/10"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-purple-300/30 bg-purple-300/10 text-purple-200">
                  <FlaskConical size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Try the Interactive Sandboxes</p>
                  <p className="text-xs text-white/50">Train a real classifier and neural network, right in your browser.</p>
                </div>
              </div>
              <ArrowRight size={16} className="flex-shrink-0 text-purple-300 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </FadeIn>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
                Three Flagship Courses
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium text-white sm:text-4xl">
                Start with the foundations.
              </h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {aiCourses.map((course, i) => (
              <FadeIn key={course.slug} delay={i * 0.08}>
                <FlagshipCourseCard course={course} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

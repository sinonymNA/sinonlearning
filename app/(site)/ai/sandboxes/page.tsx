import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import SandboxCard from "@/components/ai/SandboxCard";
import { aiSandboxes } from "@/data/aiSandboxes";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Sandboxes — Sinon Learning",
  description:
    "Real, in-browser AI tools — a trainable classifier, a neural network, a bias-detection ranking model, and a calibration game — built to teach how AI actually works, not just describe it.",
  alternates: { canonical: `${SITE_URL}/ai/sandboxes` },
};

export default function AISandboxesPage() {
  return (
    <div className="bg-navy-950">
      <section className="bg-circuit relative overflow-hidden px-6 pt-16 pb-16 lg:px-8 lg:pt-24">
        <div className="absolute left-1/2 top-0 -z-10 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-purple-400/15 blur-[130px]" />
        <div className="absolute -right-24 top-32 -z-10 h-80 w-80 rounded-full bg-teal-400/10 blur-[120px]" />

        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-300/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-purple-200">
              <FlaskConical size={12} />
              Interactive Sandboxes
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
              Don&rsquo;t just watch AI explained. <span className="text-gradient-ai">Train one yourself.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Every tool below is a real, working AI model running in your browser — not a video,
              not an animation. Drag a boundary, train a network, audit a biased model, and test
              your own calibration against the truth.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {aiSandboxes.map((sandbox, i) => (
              <FadeIn key={sandbox.slug} delay={i * 0.08}>
                <SandboxCard sandbox={sandbox} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

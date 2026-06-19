import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import DecisionBoundarySandbox from "@/components/ai/sandboxes/DecisionBoundarySandbox";
import NeuralNetworkPlayground from "@/components/ai/sandboxes/NeuralNetworkPlayground";
import BiasDetectiveSandbox from "@/components/ai/sandboxes/BiasDetectiveSandbox";
import CalibrationSandbox from "@/components/ai/sandboxes/CalibrationSandbox";
import { getSandboxBySlug } from "@/data/aiSandboxes";
import { SITE_URL } from "@/lib/seo";

const SANDBOX_COMPONENTS: Record<string, React.ComponentType> = {
  "decision-boundary": DecisionBoundarySandbox,
  "neural-network": NeuralNetworkPlayground,
  "bias-detective": BiasDetectiveSandbox,
  calibration: CalibrationSandbox,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sandbox = getSandboxBySlug(slug);
  if (!sandbox) return {};

  return {
    title: `${sandbox.title} — Sinon Learning`,
    description: sandbox.description,
    alternates: { canonical: `${SITE_URL}/ai/sandboxes/${sandbox.slug}` },
  };
}

export default async function AISandboxPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sandbox = getSandboxBySlug(slug);
  if (!sandbox) notFound();

  const SandboxComponent = SANDBOX_COMPONENTS[sandbox.slug];
  if (!SandboxComponent) notFound();

  return (
    <div className="bg-navy-950">
      <section className="bg-circuit relative overflow-hidden px-6 pt-16 pb-12 lg:px-8 lg:pt-24">
        <div className="absolute left-1/3 top-0 -z-10 h-96 w-96 -translate-y-1/3 rounded-full bg-purple-400/15 blur-[120px]" />
        <div className="absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full bg-teal-400/10 blur-[110px]" />

        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <Link
              href="/ai/sandboxes"
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-purple-200"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              All Sandboxes
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <span className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.2em] text-purple-300/70">
              Sandbox {String(sandbox.number).padStart(2, "0")}
            </span>
            <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
              {sandbox.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65">{sandbox.description}</p>
            <Link
              href={`/ai/${sandbox.courseSlug}/lessons/${sandbox.lessonSlug}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-teal-300 hover:text-teal-200"
            >
              <BookOpen size={14} />
              See this sandbox in its lesson context
            </Link>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <SandboxComponent />
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

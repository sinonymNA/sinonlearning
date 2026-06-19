import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import LemonadeStandSim from "@/components/simulations/LemonadeStandSim";
import StackedSim from "@/components/simulations/StackedSim";
import { getSimulationBySlug, simulations } from "@/data/simulations";
import { SITE_URL } from "@/lib/seo";

const SIMULATION_COMPONENTS: Record<string, React.ComponentType> = {
  "lemonade-stand-economics": LemonadeStandSim,
  "stacked-build-wealth": StackedSim,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const simulation = getSimulationBySlug(slug);
  if (!simulation) return {};

  return {
    title: `${simulation.title} — Sinon Learning`,
    description: simulation.description,
    alternates: { canonical: `${SITE_URL}/simulations/${simulation.slug}` },
  };
}

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const simulation = getSimulationBySlug(slug);
  if (!simulation) notFound();

  const SimComponent = SIMULATION_COMPONENTS[simulation.slug];

  return (
    <div className="bg-navy-950">
      <section className="bg-circuit relative overflow-hidden px-6 pt-16 pb-16 lg:px-8 lg:pt-24">
        <div className="absolute left-1/3 top-0 -z-10 h-96 w-96 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[120px]" />
        <div className="absolute -right-20 top-40 -z-10 h-72 w-72 rounded-full bg-purple-500/15 blur-[110px]" />

        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <Link
              href="/simulations"
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-teal-200"
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              All Simulations
            </Link>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="mt-6 flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
                Simulation {String(simulation.number).padStart(2, "0")}
              </span>
              {simulation.status === "Available" && (
                <span className="flex items-center gap-1.5 rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-200">
                  <Sparkles size={11} />
                  Available Now
                </span>
              )}
            </div>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
              {simulation.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
              {simulation.description}
            </p>
          </FadeIn>
        </div>
      </section>

      {simulation.status === "Available" && SimComponent ? (
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <SimComponent />
            </FadeIn>
          </div>
        </section>
      ) : (
        <section className="px-6 pb-24 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-white/60">
              This simulation is still in development. It will follow the same depth and
              structure as the Lemonade Stand simulator once it&rsquo;s ready.
            </p>
            <Link
              href={`/simulations/${simulations[0].slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
            >
              Try the Lemonade Stand
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

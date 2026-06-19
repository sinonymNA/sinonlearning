import Link from "next/link";
import { ArrowRight, Sparkles, Lock } from "lucide-react";
import type { SimulationCatalogEntry } from "@/data/simulations";

export default function SimulationCard({ simulation }: { simulation: SimulationCatalogEntry }) {
  const available = simulation.status === "Available";

  const inner = (
    <div
      className={`group relative h-full overflow-hidden rounded-3xl border p-7 transition-all duration-300 ${
        available
          ? "border-teal-300/20 bg-white/5 hover:-translate-y-1 hover:border-teal-300/40 hover:shadow-[0_25px_60px_-15px_rgba(94,234,212,0.25)]"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {available && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
          Simulation {String(simulation.number).padStart(2, "0")}
        </span>
        {available ? (
          <span className="flex items-center gap-1.5 rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-200">
            <Sparkles size={11} />
            Available Now
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/40">
            <Lock size={11} />
            Coming Soon
          </span>
        )}
      </div>

      <h3 className={`mt-5 font-display text-2xl font-medium leading-snug ${available ? "text-white" : "text-white/50"}`}>
        {simulation.title}
      </h3>
      <p className={`mt-3 text-sm leading-relaxed ${available ? "text-white/70" : "text-white/35"}`}>
        {simulation.tagline}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
        <span className={`text-xs font-medium tracking-wide ${available ? "text-white/50" : "text-white/30"}`}>
          {simulation.subject}
        </span>
        {available && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-teal-300">
            Play Now
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (!available) {
    return <div className="h-full cursor-default">{inner}</div>;
  }

  return (
    <Link href={`/simulations/${simulation.slug}`} className="block h-full">
      {inner}
    </Link>
  );
}

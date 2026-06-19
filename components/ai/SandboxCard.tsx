import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { SandboxCatalogEntry } from "@/data/aiSandboxes";

export default function SandboxCard({ sandbox }: { sandbox: SandboxCatalogEntry }) {
  return (
    <Link href={`/ai/sandboxes/${sandbox.slug}`} className="block h-full">
      <div className="group relative h-full overflow-hidden rounded-3xl border border-purple-300/20 bg-white/5 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-purple-300/40 hover:shadow-[0_25px_60px_-15px_rgba(192,132,252,0.25)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-400/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-purple-300/70">
            Sandbox {String(sandbox.number).padStart(2, "0")}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-200">
            <Sparkles size={11} />
            Try It
          </span>
        </div>

        <h3 className="mt-5 font-display text-2xl font-medium leading-snug text-white">{sandbox.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{sandbox.tagline}</p>

        <div className="mt-6 flex items-center justify-end border-t border-white/10 pt-5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-purple-300">
            Open Sandbox
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

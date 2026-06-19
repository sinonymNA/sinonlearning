import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GameShowTypeInfo } from "@/data/gameShows";
import { ACCENT_STYLES } from "./accent";

export default function GameTypeCard({ info }: { info: GameShowTypeInfo }) {
  const accent = ACCENT_STYLES[info.accent];
  const Icon = info.icon;

  return (
    <Link href={`/game-shows/new/${info.type}`} className="block h-full">
      <div
        className={`group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 transition-all duration-300 hover:-translate-y-1 ${accent.hoverBorder}`}
      >
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full ${accent.glow} blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        />

        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full border ${accent.border} ${accent.bg} ${accent.text}`}
        >
          <Icon size={20} />
        </span>

        <h3 className="mt-5 font-display text-2xl font-medium leading-snug text-white">
          {info.label}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{info.tagline}</p>
        <p className="mt-3 text-sm leading-relaxed text-white/45">{info.description}</p>

        <div className="mt-6 flex items-center justify-end border-t border-white/10 pt-5">
          <span className={`flex items-center gap-1.5 text-sm font-medium ${accent.text}`}>
            Create a game
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

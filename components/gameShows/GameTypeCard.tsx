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
        className={`group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${accent.hoverBorder}`}
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full border ${accent.border} ${accent.bg} ${accent.text}`}
        >
          <Icon size={20} />
        </span>

        <h3 className="mt-5 font-display text-xl font-black leading-snug text-[#0d1e4a]">
          {info.label}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{info.tagline}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{info.description}</p>

        <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-5">
          <span className={`flex items-center gap-1.5 text-sm font-semibold ${accent.text}`}>
            Create a game
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

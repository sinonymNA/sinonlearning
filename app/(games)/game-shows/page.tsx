import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import GameTypeCard from "@/components/gameShows/GameTypeCard";
import SavedGamesList from "@/components/gameShows/SavedGamesList";
import { gameShowCatalog } from "@/data/gameShows";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Game Show Generator — Sinon Learning",
  description:
    "Turn any vocab list, study guide, or set of standards into a trivia grid, mystery wheel, answers showdown, and more — ready to project on your classroom whiteboard.",
  alternates: { canonical: `${SITE_URL}/game-shows` },
};

export default function GameShowsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-100 bg-white px-6 py-20 text-center lg:py-28">
        {/* Siren icon */}
        <div className="mx-auto mb-8 flex justify-center">
          <svg width="80" height="72" viewBox="0 0 80 72" fill="none" aria-hidden="true">
            {/* Rays */}
            <line x1="40" y1="4" x2="40" y2="14" stroke="#e42828" strokeWidth="4" strokeLinecap="round" />
            <line x1="16" y1="11" x2="23" y2="19" stroke="#e42828" strokeWidth="4" strokeLinecap="round" />
            <line x1="64" y1="11" x2="57" y2="19" stroke="#e42828" strokeWidth="4" strokeLinecap="round" />
            <line x1="6" y1="34" x2="16" y2="34" stroke="#e42828" strokeWidth="4" strokeLinecap="round" />
            <line x1="74" y1="34" x2="64" y2="34" stroke="#e42828" strokeWidth="4" strokeLinecap="round" />
            {/* Bell dome */}
            <path d="M16 56 C16 36 64 36 64 56" fill="#e42828" />
            {/* Shine highlight */}
            <ellipse cx="30" cy="42" rx="6" ry="4" fill="#ff9999" opacity="0.5" transform="rotate(-20 30 42)" />
            {/* Base */}
            <rect x="13" y="56" width="54" height="10" rx="5" fill="#0d1e4a" />
          </svg>
        </div>

        <h1 className="font-display font-black leading-none tracking-tight">
          <span className="block text-[clamp(3.5rem,11vw,8rem)] text-[#0d1e4a]">GAME</span>
          <span className="block text-[clamp(3.5rem,11vw,8rem)] text-[#1a52f5]">SHOWS</span>
        </h1>

        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-slate-500">
          Pick a format, paste in your content, and project it on the whiteboard. Use AI to turn
          your notes into a ready-to-play game — or build it by hand.
        </p>
      </section>

      {/* Game type cards */}
      <section className="bg-slate-50 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1a52f5]">
              Choose a format
            </p>
            <h2 className="mt-3 font-display text-3xl font-black text-[#0d1e4a] sm:text-4xl">
              Five ways to play.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gameShowCatalog.map((info) => (
              <GameTypeCard key={info.type} info={info} />
            ))}
          </div>
        </div>
      </section>

      {/* Saved games */}
      <section className="bg-white px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-[#1a52f5]" />
            <h2 className="font-display text-2xl font-black text-[#0d1e4a]">Your saved games</h2>
          </div>
          <SavedGamesList />
        </div>
      </section>
    </div>
  );
}

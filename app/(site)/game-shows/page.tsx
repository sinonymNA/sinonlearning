import type { Metadata } from "next";
import { Sparkles, Wand2 } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import GameTypeCard from "@/components/gameShows/GameTypeCard";
import SavedGamesList from "@/components/gameShows/SavedGamesList";
import { gameShowCatalog } from "@/data/gameShows";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Game Show Generator — Sinon Learning",
  description:
    "Turn any vocab list, study guide, or set of standards into a trivia grid, mystery wheel, answers showdown, and more—ready to project on your classroom whiteboard.",
  alternates: { canonical: `${SITE_URL}/game-shows` },
};

export default function GameShowsPage() {
  return (
    <div className="bg-navy-950">
      <section className="bg-circuit relative overflow-hidden px-6 pt-16 pb-16 lg:px-8 lg:pt-24">
        <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-teal-400/15 blur-[130px]" />
        <div className="absolute -right-24 top-32 -z-10 h-80 w-80 rounded-full bg-purple-500/15 blur-[120px]" />
        <div className="absolute -left-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-[110px]" />

        <div className="mx-auto max-w-5xl text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
              <Wand2 size={12} />
              Classroom Tool
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-white sm:text-6xl">
              Game Show Generator
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
              Pick a format, paste in your content, and project it on the whiteboard. Use AI to
              turn your notes into a ready-to-play game, or build it by hand—either way, it&rsquo;s free.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-300/80">
                Choose a format
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium text-white sm:text-4xl">
                Five ways to play.
              </h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gameShowCatalog.map((info, i) => (
              <FadeIn key={info.type} delay={i * 0.06}>
                <GameTypeCard info={info} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="mb-8 flex items-center gap-2 text-center sm:justify-center">
              <Sparkles size={16} className="text-teal-300" />
              <h2 className="font-display text-2xl font-medium text-white">Your saved games</h2>
            </div>
          </FadeIn>
          <SavedGamesList />
        </div>
      </section>
    </div>
  );
}

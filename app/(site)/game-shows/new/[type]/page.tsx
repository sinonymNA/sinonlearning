import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameShowTypeInfo } from "@/data/gameShows";
import GameEditorShell from "@/components/gameShows/GameEditorShell";
import { ACCENT_STYLES } from "@/components/gameShows/accent";
import type { GameShowType } from "@/lib/gameShowTypes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const info = getGameShowTypeInfo(type);
  if (!info) return {};
  return { title: `New ${info.label} — Sinon Learning` };
}

export default async function NewGameShowPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const info = getGameShowTypeInfo(type);
  if (!info) notFound();

  const accent = ACCENT_STYLES[info.accent];

  return (
    <div className="bg-circuit relative min-h-screen overflow-hidden bg-navy-950 py-20">
      <div
        className={`pointer-events-none absolute left-1/2 top-0 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full ${accent.glow} blur-[130px]`}
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <span
          className={`inline-flex items-center gap-2 rounded-full border ${accent.border} ${accent.bg} px-3 py-1 text-xs font-medium ${accent.text}`}
        >
          {info.label}
        </span>
        <h1 className="mt-4 font-display text-4xl font-medium text-white sm:text-5xl">
          Build your game
        </h1>
        <p className="mt-3 text-white/60">{info.description}</p>

        <div className="mt-10">
          <GameEditorShell type={type as GameShowType} mode="create" />
        </div>
      </div>
    </div>
  );
}

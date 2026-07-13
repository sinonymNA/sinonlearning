import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameShowTypeInfo } from "@/data/gameShows";
import GameEditorShell from "@/components/gameShows/GameEditorShell";
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

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {info.label}
        </span>
        <h1 className="mt-4 font-display text-4xl font-black text-[#0d1e4a] sm:text-5xl">
          Build your game
        </h1>
        <p className="mt-3 text-slate-500">{info.description}</p>

        <div className="mt-10">
          <GameEditorShell type={type as GameShowType} mode="create" />
        </div>
      </div>
    </div>
  );
}

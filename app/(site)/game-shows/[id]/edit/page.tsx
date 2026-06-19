import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameShowById } from "@/lib/gameShows";
import { getGameShowTypeInfo } from "@/data/gameShows";
import GameEditorShell from "@/components/gameShows/GameEditorShell";
import { ACCENT_STYLES } from "@/components/gameShows/accent";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gameShow = await getGameShowById(id);
  if (!gameShow) return {};
  return { title: `Edit ${gameShow.title} — Sinon Learning` };
}

export default async function EditGameShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gameShow = await getGameShowById(id);
  if (!gameShow) notFound();

  const info = getGameShowTypeInfo(gameShow.type);
  const accent = info ? ACCENT_STYLES[info.accent] : ACCENT_STYLES.teal;

  return (
    <div className="bg-circuit relative min-h-screen overflow-hidden bg-navy-950 py-20">
      <div
        className={`pointer-events-none absolute left-1/2 top-0 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/3 rounded-full ${accent.glow} blur-[130px]`}
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        {info && (
          <span
            className={`inline-flex items-center gap-2 rounded-full border ${accent.border} ${accent.bg} px-3 py-1 text-xs font-medium ${accent.text}`}
          >
            {info.label}
          </span>
        )}
        <h1 className="mt-4 font-display text-4xl font-medium text-white sm:text-5xl">
          Edit your game
        </h1>
        <p className="mt-3 text-white/60">Update the content, then save to publish your changes.</p>

        <div className="mt-10">
          <GameEditorShell
            type={gameShow.type}
            mode="edit"
            gameShowId={gameShow.id}
            initialTitle={gameShow.title}
            initialData={gameShow.payload.data}
          />
        </div>
      </div>
    </div>
  );
}

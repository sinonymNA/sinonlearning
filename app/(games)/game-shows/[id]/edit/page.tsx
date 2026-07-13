import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameShowById } from "@/lib/gameShows";
import { getGameShowTypeInfo } from "@/data/gameShows";
import GameEditorShell from "@/components/gameShows/GameEditorShell";

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

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {info && (
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {info.label}
          </span>
        )}
        <h1 className="mt-4 font-display text-4xl font-black text-[#0d1e4a] sm:text-5xl">
          Edit your game
        </h1>
        <p className="mt-3 text-slate-500">Update the content, then save to publish your changes.</p>

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

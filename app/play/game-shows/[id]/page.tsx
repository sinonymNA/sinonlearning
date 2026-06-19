import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGameShowById } from "@/lib/gameShows";
import PresentationShell from "@/components/gameShows/PresentationShell";
import GridPlay from "@/components/gameShows/GridPlay";
import WheelPlay from "@/components/gameShows/WheelPlay";
import FeudPlay from "@/components/gameShows/FeudPlay";
import RacePlay from "@/components/gameShows/RacePlay";
import MemoryPlay from "@/components/gameShows/MemoryPlay";
import type { GridPayload, WheelPayload, FeudPayload, RacePayload, MemoryPayload } from "@/lib/gameShowTypes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gameShow = await getGameShowById(id);
  if (!gameShow) return {};
  return { title: `${gameShow.title} — Sinon Learning` };
}

export default async function PlayGameShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gameShow = await getGameShowById(id);
  if (!gameShow) notFound();

  return (
    <PresentationShell title={gameShow.title}>
      {gameShow.type === "grid" && (
        <GridPlay gameId={gameShow.id} data={gameShow.payload.data as GridPayload} />
      )}
      {gameShow.type === "wheel" && (
        <WheelPlay gameId={gameShow.id} data={gameShow.payload.data as WheelPayload} />
      )}
      {gameShow.type === "feud" && (
        <FeudPlay gameId={gameShow.id} data={gameShow.payload.data as FeudPayload} />
      )}
      {gameShow.type === "race" && (
        <RacePlay gameId={gameShow.id} data={gameShow.payload.data as RacePayload} />
      )}
      {gameShow.type === "memory" && (
        <MemoryPlay gameId={gameShow.id} data={gameShow.payload.data as MemoryPayload} />
      )}
    </PresentationShell>
  );
}

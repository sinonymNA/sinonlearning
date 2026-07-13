"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Pencil } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { getGameShowTypeInfo } from "@/data/gameShows";

interface SavedGame {
  id: string;
  type: string;
  title: string;
}

export default function SavedGamesList() {
  const [myIds] = useLocalStorageState<string[]>("gameShows:myIds", []);
  const [games, setGames] = useState<SavedGame[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (myIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no fetch needed
      setLoaded(true);
      return;
    }
    fetch(`/api/game-shows?ids=${myIds.join(",")}`)
      .then((res) => res.json())
      .then((json) => setGames(json.gameShows ?? []))
      .finally(() => setLoaded(true));
  }, [myIds]);

  if (!loaded) return null;

  if (games.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400">
        Games you create on this device will show up here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {games.map((game) => {
        const info = getGameShowTypeInfo(game.type);
        return (
          <div
            key={game.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-[#0d1e4a]">{game.title}</p>
              <p className="mt-0.5 text-xs text-slate-400">{info?.label ?? game.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/game-shows/${game.id}/edit`}
                aria-label="Edit game"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              >
                <Pencil size={13} />
              </Link>
              <Link
                href={`/play/game-shows/${game.id}`}
                aria-label="Play game"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a52f5] text-white transition-opacity hover:opacity-85"
              >
                <Play size={13} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

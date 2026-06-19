"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { MemoryPayload } from "@/lib/gameShowTypes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import TeamScoreboard, { type ScoreboardTeam } from "./TeamScoreboard";

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 },
];

interface Card {
  key: string;
  pairId: number;
  text: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function MemoryPlay({ gameId, data }: { gameId: string; data: MemoryPayload }) {
  const [teams, setTeams] = useLocalStorageState<ScoreboardTeam[]>(
    `gameshow:${gameId}:teams`,
    DEFAULT_TEAMS
  );

  const cards = useMemo(() => {
    const all: Card[] = data.pairs.flatMap((pair, pi) => [
      { key: `${pi}-term`, pairId: pi, text: pair.term },
      { key: `${pi}-def`, pairId: pi, text: pair.definition },
    ]);
    return shuffle(all);
  }, [data]);

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [flipped, setFlipped] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);

  const flip = (card: Card) => {
    if (locked || flipped.includes(card.key) || matched.has(card.pairId)) return;
    const nextFlipped = [...flipped, card.key];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setLocked(true);
      const [firstKey, secondKey] = nextFlipped;
      const first = cards.find((c) => c.key === firstKey)!;
      const second = cards.find((c) => c.key === secondKey)!;
      if (first.pairId === second.pairId) {
        setTimeout(() => {
          setMatched((prev) => new Set(prev).add(first.pairId));
          setFlipped([]);
          setLocked(false);
        }, 600);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 1100);
      }
    }
  };

  const allMatched = matched.size === data.pairs.length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.key) || matched.has(card.pairId);
          return (
            <button
              key={card.key}
              onClick={() => flip(card)}
              className="aspect-[4/3]"
              style={{ perspective: "800px" }}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4 }}
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/10"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="font-display text-2xl text-fuchsia-300/40">?</span>
                </div>
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-xl border p-2 text-center text-xs font-medium sm:text-sm ${
                    matched.has(card.pairId)
                      ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
                      : "border-fuchsia-300/40 bg-fuchsia-400/15 text-white"
                  }`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  {card.text}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      {allMatched && (
        <p className="mt-8 text-center font-display text-2xl font-medium text-fuchsia-200">
          All matched! Nice work.
        </p>
      )}

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

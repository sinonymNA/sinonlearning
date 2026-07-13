"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  side: "term" | "def";
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
      { key: `${pi}-term`, pairId: pi, text: pair.term, side: "term" as const },
      { key: `${pi}-def`, pairId: pi, text: pair.definition, side: "def" as const },
    ]);
    return shuffle(all);
  }, [data]);

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [flipped, setFlipped] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [mismatchKeys, setMismatchKeys] = useState<string[]>([]);

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
        }, 500);
      } else {
        setMismatchKeys([firstKey, secondKey]);
        setTimeout(() => {
          setMismatchKeys([]);
          setFlipped([]);
          setLocked(false);
        }, 1000);
      }
    }
  };

  const allMatched = matched.size === data.pairs.length;

  useEffect(() => {
    if (!allMatched) return;
    import("canvas-confetti").then((mod) => {
      const fire = mod.default;
      fire({ particleCount: 80, spread: 70, origin: { y: 0.4 }, colors: ["#d946ef", "#a78bfa", "#38bdf8", "#ffffff"] });
      setTimeout(() => fire({ particleCount: 60, spread: 90, origin: { x: 0.2, y: 0.5 } }), 300);
      setTimeout(() => fire({ particleCount: 60, spread: 90, origin: { x: 0.8, y: 0.5 } }), 500);
    });
  }, [allMatched]);

  const cols = cards.length <= 12 ? 4 : cards.length <= 20 ? 5 : 6;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Match counter */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="font-display text-sm font-medium text-white/40">
          {matched.size} / {data.pairs.length} matched
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #a78bfa 0%, #d946ef 100%)" }}
            animate={{ width: `${(matched.size / data.pairs.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(card.key) || matched.has(card.pairId);
          const isMatched = matched.has(card.pairId);
          const isMismatch = mismatchKeys.includes(card.key);

          return (
            <motion.button
              key={card.key}
              onClick={() => flip(card)}
              className="aspect-[3/4]"
              style={{ perspective: "900px" }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.025, type: "spring", stiffness: 300, damping: 28 }}
              whileHover={isFlipped ? {} : { y: -4, scale: 1.04 }}
              whileTap={isFlipped ? {} : { scale: 0.96 }}
            >
              <motion.div
                animate={
                  isMismatch
                    ? { x: [-6, 6, -6, 6, -3, 3, 0], rotateY: isFlipped ? 180 : 0 }
                    : { x: 0, rotateY: isFlipped ? 180 : 0 }
                }
                transition={
                  isMismatch
                    ? { duration: 0.5, times: [0, 0.17, 0.34, 0.5, 0.67, 0.83, 1] }
                    : { duration: 0.45, ease: "easeInOut" }
                }
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front — face down */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl"
                  style={{
                    backfaceVisibility: "hidden",
                    background: "linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%)",
                    border: "1px solid rgba(167,139,250,0.18)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                  }}
                >
                  <span
                    className="font-display text-3xl font-black"
                    style={{ color: "rgba(167,139,250,0.25)" }}
                  >
                    ?
                  </span>
                </div>

                {/* Back — revealed */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl p-2 text-center"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: isMatched
                      ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
                      : card.side === "term"
                        ? "linear-gradient(135deg, #3b0764 0%, #4c1d95 100%)"
                        : "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                    border: isMatched
                      ? "1px solid rgba(52,211,153,0.4)"
                      : card.side === "term"
                        ? "1px solid rgba(192,132,252,0.35)"
                        : "1px solid rgba(129,140,248,0.35)",
                    boxShadow: isMatched ? "0 0 20px rgba(52,211,153,0.2)" : "none",
                  }}
                >
                  <span
                    className="font-display text-xs font-semibold leading-snug sm:text-sm"
                    style={{
                      color: isMatched ? "#6ee7b7" : "#e9d5ff",
                    }}
                  >
                    {card.text}
                  </span>
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {allMatched && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="mt-10 text-center"
          >
            <p
              className="font-display text-3xl font-black"
              style={{
                color: "#d946ef",
                textShadow: "0 0 40px rgba(217,70,239,0.5), 0 0 80px rgba(217,70,239,0.2)",
              }}
            >
              All matched!
            </p>
            <p className="mt-2 font-display text-base font-medium text-white/50">
              Excellent work — every pair found.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

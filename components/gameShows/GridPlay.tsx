"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { GridPayload } from "@/lib/gameShowTypes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import TeamScoreboard, { type ScoreboardTeam } from "./TeamScoreboard";

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 },
];

export default function GridPlay({ gameId, data }: { gameId: string; data: GridPayload }) {
  const [teams, setTeams] = useLocalStorageState<ScoreboardTeam[]>(
    `gameshow:${gameId}:teams`,
    DEFAULT_TEAMS
  );
  const [usedCells, setUsedCells] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<{ ci: number; qi: number } | null>(null);
  const [stage, setStage] = useState<"question" | "answer">("question");

  const openCell = (ci: number, qi: number, key: string) => {
    if (usedCells.has(key)) return;
    setOpen({ ci, qi });
    setStage("question");
  };

  const closeCell = () => {
    if (open) {
      setUsedCells((prev) => new Set(prev).add(`${open.ci}-${open.qi}`));
    }
    setOpen(null);
    setStage("question");
  };

  const clue = open ? data.categories[open.ci]?.clues[open.qi] : null;
  const maxRows = Math.max(...data.categories.map((c) => c.clues.length));

  return (
    <div className="mx-auto max-w-6xl">
      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${data.categories.length}, minmax(0, 1fr))` }}
      >
        {data.categories.map((category, ci) => (
          <div key={ci} className="flex flex-col gap-2 sm:gap-3">
            <div className="rounded-xl border border-teal-300/30 bg-teal-400/10 px-2 py-3 text-center">
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-teal-200 sm:text-base">
                {category.name}
              </p>
            </div>
            {Array.from({ length: maxRows }).map((_, qi) => {
              const clueAt = category.clues[qi];
              const key = `${ci}-${qi}`;
              const used = usedCells.has(key);
              if (!clueAt) return <div key={qi} />;
              return (
                <button
                  key={qi}
                  onClick={() => openCell(ci, qi, key)}
                  disabled={used}
                  className={`flex aspect-[4/3] items-center justify-center rounded-xl border font-display text-2xl font-semibold transition-all sm:text-4xl ${
                    used
                      ? "border-white/5 bg-white/[0.02] text-white/10"
                      : "border-white/10 bg-white/5 text-teal-200 hover:-translate-y-0.5 hover:border-teal-300/40 hover:bg-teal-400/10"
                  }`}
                >
                  {used ? "" : clueAt.value}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {open && clue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 p-6"
          >
            <button
              onClick={closeCell}
              aria-label="Close clue"
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-3xl text-center"
            >
              <p className="font-display text-sm uppercase tracking-[0.2em] text-teal-300">
                {data.categories[open.ci].name} · {clue.value}
              </p>
              <p className="mt-8 font-display text-3xl font-medium leading-tight text-white sm:text-5xl">
                {stage === "question" ? clue.question : clue.answer}
              </p>
              {stage === "question" ? (
                <button
                  onClick={() => setStage("answer")}
                  className="mt-10 rounded-full bg-teal-300 px-6 py-3 text-sm font-medium text-navy-950 transition-opacity hover:opacity-90"
                >
                  Reveal answer
                </button>
              ) : (
                <button
                  onClick={closeCell}
                  className="mt-10 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Done
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

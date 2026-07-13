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
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  const openCell = (ci: number, qi: number) => {
    if (usedCells.has(`${ci}-${qi}`)) return;
    setOpen({ ci, qi });
    setStage("question");
  };

  const closeCell = (result: "correct" | "wrong" | "neutral" = "neutral") => {
    if (open) setUsedCells((prev) => new Set(prev).add(`${open.ci}-${open.qi}`));
    setOpen(null);
    setStage("question");
    if (result !== "neutral") {
      setFlash(result);
      setTimeout(() => setFlash(null), 650);
    }
  };

  const clue = open ? data.categories[open.ci]?.clues[open.qi] : null;
  const maxRows = Math.max(...data.categories.map((c) => c.clues.length));

  return (
    <div className="mx-auto max-w-6xl">
      {/* Board */}
      <div
        className="grid gap-2 sm:gap-2.5"
        style={{ gridTemplateColumns: `repeat(${data.categories.length}, minmax(0, 1fr))` }}
      >
        {/* Category headers */}
        {data.categories.map((cat, ci) => (
          <div
            key={`h-${ci}`}
            className="flex min-h-[60px] items-center justify-center rounded-lg px-2 py-3 text-center"
            style={{
              background: "linear-gradient(180deg, #1e40af 0%, #1e3a8a 60%, #172554 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <p
              className="font-display text-[10px] font-black uppercase tracking-widest text-white sm:text-xs"
              style={{ textShadow: "0 0 20px rgba(147,197,253,0.6)" }}
            >
              {cat.name}
            </p>
          </div>
        ))}

        {/* Clue tiles row by row */}
        {Array.from({ length: maxRows }).map((_, qi) =>
          data.categories.map((cat, ci) => {
            const clueAt = cat.clues[qi];
            const key = `${ci}-${qi}`;
            const used = usedCells.has(key);
            if (!clueAt) return <div key={key} />;
            return (
              <motion.button
                key={key}
                onClick={() => openCell(ci, qi)}
                disabled={used}
                whileHover={used ? {} : { scale: 1.04, y: -3 }}
                whileTap={used ? {} : { scale: 0.96 }}
                className="flex aspect-[3/2] items-center justify-center rounded-lg"
                style={
                  used
                    ? { background: "linear-gradient(180deg, #0c1424 0%, #080d1a 100%)", boxShadow: "none" }
                    : {
                        background: "linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 50%, #1e2e6e 100%)",
                        boxShadow:
                          "0 0 0 1px rgba(147,197,253,0.2), inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,60,0.5)",
                      }
                }
              >
                {!used && (
                  <span
                    className="font-display font-black text-yellow-300"
                    style={{
                      fontSize: "clamp(1.1rem, 2.2vw, 1.9rem)",
                      textShadow: "0 0 24px rgba(253,224,71,0.7), 0 2px 4px rgba(0,0,0,0.6)",
                    }}
                  >
                    ${clueAt.value}
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Correct/wrong flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.38 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="pointer-events-none fixed inset-0 z-40"
            style={{ backgroundColor: flash === "correct" ? "#16a34a" : "#dc2626" }}
          />
        )}
      </AnimatePresence>

      {/* Clue modal */}
      <AnimatePresence>
        {open && clue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 py-10"
            style={{ background: "linear-gradient(180deg, #0c1e5c 0%, #06112e 100%)" }}
          >
            {/* Category + value */}
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 300, damping: 25 }}
              className="mb-10 text-center"
            >
              <p
                className="font-display text-xs font-black uppercase tracking-[0.3em] sm:text-sm"
                style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(251,191,36,0.5)" }}
              >
                {data.categories[open.ci].name}
              </p>
              <p
                className="font-display mt-1.5 text-3xl font-black sm:text-4xl"
                style={{ color: "#fde047", textShadow: "0 0 32px rgba(253,224,71,0.7)" }}
              >
                ${clue.value}
              </p>
            </motion.div>

            {/* Clue text */}
            <motion.p
              key={stage}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="max-w-4xl text-center font-display font-medium leading-snug text-white"
              style={{
                fontSize: "clamp(1.4rem, 3.5vw, 2.8rem)",
                textShadow: "0 0 48px rgba(147,197,253,0.25)",
              }}
            >
              {stage === "question" ? clue.question : clue.answer}
            </motion.p>

            {/* Action buttons */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-3"
            >
              {stage === "question" ? (
                <button
                  onClick={() => setStage("answer")}
                  className="rounded-full px-9 py-3.5 font-display text-sm font-black text-navy-950 transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
                    boxShadow: "0 0 32px rgba(56,189,248,0.45), 0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  Reveal Answer
                </button>
              ) : (
                <>
                  <button
                    onClick={() => closeCell("correct")}
                    className="rounded-full px-7 py-3.5 font-display text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      boxShadow: "0 0 24px rgba(22,163,74,0.5)",
                    }}
                  >
                    ✓ Correct
                  </button>
                  <button
                    onClick={() => closeCell("wrong")}
                    className="rounded-full px-7 py-3.5 font-display text-sm font-black text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                      boxShadow: "0 0 24px rgba(220,38,38,0.5)",
                    }}
                  >
                    ✗ Wrong
                  </button>
                  <button
                    onClick={() => closeCell("neutral")}
                    className="rounded-full border border-white/20 px-6 py-3.5 font-display text-sm font-medium text-white/70 transition-all hover:bg-white/10"
                  >
                    Done
                  </button>
                </>
              )}
            </motion.div>

            {/* Close */}
            <button
              onClick={() => closeCell("neutral")}
              aria-label="Close"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

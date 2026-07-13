"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { FeudPayload } from "@/lib/gameShowTypes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import TeamScoreboard, { type ScoreboardTeam } from "./TeamScoreboard";

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 },
];

export default function FeudPlay({ gameId, data }: { gameId: string; data: FeudPayload }) {
  const [teams, setTeams] = useLocalStorageState<ScoreboardTeam[]>(
    `gameshow:${gameId}:teams`,
    DEFAULT_TEAMS
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [strikes, setStrikes] = useState(0);
  const [strikeFlash, setStrikeFlash] = useState(false);
  const confettiRef = useRef<HTMLCanvasElement>(null);

  const round = data.rounds[roundIndex];
  const allRevealed = revealed.size === round.answers.length;

  const reveal = (ai: number) => {
    setRevealed((prev) => new Set(prev).add(ai));
  };

  const addStrike = () => {
    if (strikes >= 3) return;
    setStrikeFlash(true);
    setStrikes((s) => Math.min(s + 1, 3));
    setTimeout(() => setStrikeFlash(false), 700);
  };

  const nextRound = () => {
    setRoundIndex((i) => Math.min(i + 1, data.rounds.length - 1));
    setRevealed(new Set());
    setStrikes(0);
  };

  const total = round.answers.reduce(
    (sum, a, i) => (revealed.has(i) ? sum + a.points : sum),
    0
  );

  useEffect(() => {
    if (!allRevealed) return;
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#fbbf24", "#f59e0b", "#fde047", "#f97316", "#ffffff"],
      });
    });
  }, [allRevealed]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Strike flash overlay */}
      <AnimatePresence>
        {strikeFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.06 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "#dc2626" }}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex h-36 w-36 items-center justify-center rounded-full"
              style={{
                background: "rgba(0,0,0,0.35)",
                boxShadow: "0 0 80px rgba(220,38,38,0.9)",
              }}
            >
              <X size={80} strokeWidth={3} color="white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question prompt */}
      <motion.p
        key={roundIndex}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-display text-2xl font-semibold leading-tight text-[#0d1e4a] sm:text-4xl"
      >
        {round.prompt}
      </motion.p>

      {/* Answer slots */}
      <div className="mt-8 space-y-2.5">
        {round.answers.map((answer, ai) => {
          const isRevealed = revealed.has(ai);
          return (
            <motion.button
              key={`${roundIndex}-${ai}`}
              onClick={() => !isRevealed && reveal(ai)}
              disabled={isRevealed}
              whileHover={isRevealed ? {} : { scale: 1.015, x: 4 }}
              whileTap={isRevealed ? {} : { scale: 0.98 }}
              className="block w-full text-left"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ai * 0.05, type: "spring", stiffness: 300, damping: 28 }}
                className="flex items-center justify-between overflow-hidden rounded-xl"
                style={
                  isRevealed
                    ? {
                        background: "linear-gradient(135deg, #92400e 0%, #78350f 100%)",
                        boxShadow: "0 0 0 1px rgba(251,191,36,0.3), 0 4px 20px rgba(251,191,36,0.15)",
                      }
                    : {
                        background: "linear-gradient(135deg, #1e3a5f 0%, #172554 100%)",
                        boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3)",
                      }
                }
              >
                {/* Rank number badge */}
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center"
                  style={{
                    background: isRevealed
                      ? "rgba(251,191,36,0.2)"
                      : "rgba(255,255,255,0.05)",
                  }}
                >
                  {isRevealed ? (
                    <motion.span
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="font-display text-lg font-black text-amber-300"
                    >
                      {ai + 1}
                    </motion.span>
                  ) : (
                    <span className="font-display text-lg font-bold text-white/20">{ai + 1}</span>
                  )}
                </div>

                {/* Answer text */}
                <div className="flex-1 px-4">
                  {isRevealed ? (
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="font-display text-lg font-semibold text-white"
                    >
                      {answer.text}
                    </motion.span>
                  ) : (
                    <span className="font-display text-lg text-white/10">— — — — — —</span>
                  )}
                </div>

                {/* Points badge */}
                {isRevealed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
                    className="mr-4 flex h-10 w-14 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                      boxShadow: "0 0 16px rgba(251,191,36,0.5)",
                    }}
                  >
                    <span className="font-display text-base font-black text-amber-950">
                      {answer.points}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      {/* Strikes + total row */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={
                i < strikes
                  ? { scale: [1, 1.35, 1], backgroundColor: ["rgba(220,38,38,0.2)", "rgba(220,38,38,0.35)", "rgba(220,38,38,0.25)"] }
                  : {}
              }
              transition={{ duration: 0.3 }}
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={
                i < strikes
                  ? { border: "2px solid rgba(239,68,68,0.6)", background: "rgba(220,38,38,0.25)" }
                  : { border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }
              }
            >
              <X size={18} color={i < strikes ? "#fca5a5" : "rgba(255,255,255,0.15)"} strokeWidth={2.5} />
            </motion.span>
          ))}
          <motion.button
            onClick={addStrike}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-2 rounded-full px-4 py-2 text-xs font-semibold text-rose-600 transition-colors"
            style={{
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.06)",
            }}
          >
            + Strike
          </motion.button>
        </div>

        <div
          className="flex items-center gap-3 rounded-xl px-5 py-2.5"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
        >
          <span className="font-display text-sm font-medium text-slate-500">Round total</span>
          <motion.span
            key={total}
            initial={{ scale: 1.3, color: "#fde047" }}
            animate={{ scale: 1, color: "#fbbf24" }}
            transition={{ duration: 0.25 }}
            className="font-display text-2xl font-black"
          >
            {total}
          </motion.span>
        </div>
      </div>

      {/* Next round */}
      {roundIndex < data.rounds.length - 1 && (
        <div className="mt-6 flex justify-center">
          <motion.button
            onClick={nextRound}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-full px-6 py-3 text-sm font-semibold text-slate-600 transition-colors"
            style={{
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            Next Round →
          </motion.button>
        </div>
      )}

      {allRevealed && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 text-center font-display text-xl font-semibold text-amber-300"
          style={{ textShadow: "0 0 24px rgba(251,191,36,0.5)" }}
        >
          Board cleared! 🎉
        </motion.p>
      )}

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import type { RacePayload } from "@/lib/gameShowTypes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import TeamScoreboard, { type ScoreboardTeam } from "./TeamScoreboard";

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 },
];

const LETTER_LABELS = ["A", "B", "C", "D"];

const LIFELINES = ["50:50", "Phone a Friend", "Ask the Audience"];

function MoneyLadder({ current, total }: { current: number; total: number }) {
  const milestones = [
    Math.ceil(total * 0.2),
    Math.ceil(total * 0.4),
    Math.ceil(total * 0.6),
    Math.ceil(total * 0.8),
    total,
  ].filter((v, i, a) => a.indexOf(v) === i && v <= total);

  return (
    <div className="hidden flex-col items-end gap-1 lg:flex">
      {milestones.reverse().map((m) => {
        const active = current + 1 === m || (m === 1 && current === 0);
        return (
          <div
            key={m}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            style={
              current >= m
                ? { background: "rgba(251,191,36,0.15)", color: "#fde047", border: "1px solid rgba(251,191,36,0.25)" }
                : active
                  ? { background: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.15)" }
                  : { background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }
            }
          >
            {current >= m && <Check size={10} />}
            Q{m}
          </div>
        );
      })}
    </div>
  );
}

export default function RacePlay({ gameId, data }: { gameId: string; data: RacePayload }) {
  const [teams, setTeams] = useLocalStorageState<ScoreboardTeam[]>(
    `gameshow:${gameId}:teams`,
    DEFAULT_TEAMS
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [usedLifelines, setUsedLifelines] = useState<Set<string>>(new Set());
  const [eliminatedChoices, setEliminatedChoices] = useState<Set<number>>(new Set());
  const [correctFlash, setCorrectFlash] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);

  const question = data.questions[questionIndex];
  const isLast = questionIndex === data.questions.length - 1;

  const pick = (ci: number) => {
    if (revealed || eliminatedChoices.has(ci)) return;
    setPicked(ci);
    setRevealed(true);
    if (ci === question.correctIndex) {
      setCorrectFlash(true);
      setTimeout(() => setCorrectFlash(false), 700);
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 700);
    }
  };

  const next = () => {
    setQuestionIndex((i) => Math.min(i + 1, data.questions.length - 1));
    setRevealed(false);
    setPicked(null);
    setEliminatedChoices(new Set());
    setCorrectFlash(false);
    setWrongFlash(false);
  };

  const use5050 = () => {
    if (usedLifelines.has("50:50") || revealed) return;
    setUsedLifelines((prev) => new Set(prev).add("50:50"));
    const wrong = question.choices
      .map((_, ci) => ci)
      .filter((ci) => ci !== question.correctIndex);
    const toElim = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedChoices(new Set(toElim));
  };

  const progress = (questionIndex / data.questions.length) * 100;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Flash overlays */}
      <AnimatePresence>
        {correctFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="pointer-events-none fixed inset-0 z-40"
            style={{ backgroundColor: "#16a34a" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {wrongFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="pointer-events-none fixed inset-0 z-40"
            style={{ backgroundColor: "#dc2626" }}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-6">
        {/* Main column */}
        <div className="flex-1">
          {/* Progress bar */}
          <div className="mb-2 flex items-center gap-3">
            <span className="font-display text-xs font-semibold text-slate-500">
              Question {questionIndex + 1} of {data.questions.length}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "#e2e8f0" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #f43f5e 0%, #fbbf24 100%)" }}
                animate={{ width: `${progress + (1 / data.questions.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Question dots */}
          <div className="mb-8 flex flex-wrap gap-1.5">
            {data.questions.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === questionIndex ? 24 : 6,
                  background:
                    i < questionIndex
                      ? "rgba(251,191,36,0.6)"
                      : i === questionIndex
                        ? "#fbbf24"
                        : "#e2e8f0",
                }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {/* Question text */}
              <div
                className="mb-8 rounded-2xl px-7 py-6 text-center"
                style={{
                  background: "linear-gradient(180deg, #0c1e5c 0%, #06112e 100%)",
                  border: "1px solid rgba(251,191,36,0.15)",
                  boxShadow: "0 0 40px rgba(6,17,46,0.8), inset 0 1px 0 rgba(251,191,36,0.08)",
                }}
              >
                <p
                  className="font-display font-semibold leading-snug text-white"
                  style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.65rem)" }}
                >
                  {question.question}
                </p>
              </div>

              {/* Choice buttons */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {question.choices.map((choice, ci) => {
                  const isCorrect = ci === question.correctIndex;
                  const isPicked = ci === picked;
                  const isElim = eliminatedChoices.has(ci);

                  let bg = "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)";
                  let border = "rgba(255,255,255,0.1)";
                  let textColor = "rgba(255,255,255,0.85)";
                  let shadow = "none";

                  if (isElim) {
                    bg = "linear-gradient(135deg, #0a0f1e 0%, #0d1424 100%)";
                    border = "rgba(255,255,255,0.04)";
                    textColor = "rgba(255,255,255,0.1)";
                  } else if (revealed && isCorrect) {
                    bg = "linear-gradient(135deg, #14532d 0%, #166534 100%)";
                    border = "rgba(52,211,153,0.5)";
                    textColor = "#6ee7b7";
                    shadow = "0 0 20px rgba(22,163,74,0.3)";
                  } else if (revealed && isPicked && !isCorrect) {
                    bg = "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)";
                    border = "rgba(239,68,68,0.5)";
                    textColor = "#fca5a5";
                    shadow = "0 0 20px rgba(220,38,38,0.3)";
                  }

                  return (
                    <motion.button
                      key={ci}
                      onClick={() => pick(ci)}
                      disabled={revealed || isElim}
                      whileHover={revealed || isElim ? {} : { scale: 1.02, x: 3 }}
                      whileTap={revealed || isElim ? {} : { scale: 0.98 }}
                      animate={
                        revealed && isCorrect
                          ? { scale: [1, 1.04, 1], transition: { duration: 0.4 } }
                          : revealed && isPicked && !isCorrect
                            ? { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } }
                            : {}
                      }
                      className="flex items-center gap-3 rounded-xl px-5 py-4 text-left transition-all"
                      style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        boxShadow: shadow,
                      }}
                    >
                      {/* Letter label hexagon */}
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-black"
                        style={{
                          background:
                            revealed && isCorrect
                              ? "rgba(52,211,153,0.2)"
                              : revealed && isPicked && !isCorrect
                                ? "rgba(239,68,68,0.2)"
                                : "rgba(251,191,36,0.12)",
                          color:
                            revealed && isCorrect
                              ? "#6ee7b7"
                              : revealed && isPicked && !isCorrect
                                ? "#fca5a5"
                                : isElim
                                  ? "rgba(255,255,255,0.08)"
                                  : "#fbbf24",
                        }}
                      >
                        {LETTER_LABELS[ci]}
                      </span>
                      <span
                        className="flex-1 font-display text-sm font-medium leading-snug sm:text-base"
                        style={{ color: textColor }}
                      >
                        {isElim ? "—" : choice}
                      </span>
                      {revealed && isCorrect && (
                        <Check size={18} color="#6ee7b7" />
                      )}
                      {revealed && isPicked && !isCorrect && (
                        <X size={18} color="#fca5a5" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Lifelines row */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mr-1">Lifelines:</span>
            {LIFELINES.map((ll) => {
              const used = usedLifelines.has(ll);
              return (
                <motion.button
                  key={ll}
                  onClick={ll === "50:50" ? use5050 : undefined}
                  disabled={used || revealed}
                  whileHover={used || revealed ? {} : { scale: 1.05 }}
                  whileTap={used || revealed ? {} : { scale: 0.95 }}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={
                    used
                      ? { background: "#f8fafc", color: "#cbd5e1", border: "1px solid #e2e8f0", textDecoration: "line-through" }
                      : { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }
                  }
                >
                  {ll}
                </motion.button>
              );
            })}
          </div>

          {/* Next question */}
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6 flex justify-center"
            >
              {!isLast ? (
                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full px-8 py-3.5 font-display text-sm font-black text-navy-950 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    boxShadow: "0 0 24px rgba(251,191,36,0.4)",
                  }}
                >
                  Next Question →
                </motion.button>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-display text-lg font-semibold text-slate-400"
                >
                  Final question complete — check the leaderboard!
                </motion.p>
              )}
            </motion.div>
          )}
        </div>

        {/* Money ladder sidebar */}
        <MoneyLadder current={questionIndex} total={data.questions.length} />
      </div>

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

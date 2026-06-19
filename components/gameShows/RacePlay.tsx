"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import type { RacePayload } from "@/lib/gameShowTypes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import TeamScoreboard, { type ScoreboardTeam } from "./TeamScoreboard";

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 },
];

export default function RacePlay({ gameId, data }: { gameId: string; data: RacePayload }) {
  const [teams, setTeams] = useLocalStorageState<ScoreboardTeam[]>(
    `gameshow:${gameId}:teams`,
    DEFAULT_TEAMS
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  const question = data.questions[questionIndex];
  const isLast = questionIndex === data.questions.length - 1;

  const pick = (ci: number) => {
    if (revealed) return;
    setPicked(ci);
    setRevealed(true);
  };

  const next = () => {
    setQuestionIndex((i) => Math.min(i + 1, data.questions.length - 1));
    setRevealed(false);
    setPicked(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-rose-300">
        Question {questionIndex + 1} of {data.questions.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <p className="mt-4 text-center font-display text-3xl font-medium leading-tight text-white sm:text-5xl">
            {question.question}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.choices.map((choice, ci) => {
              const isCorrect = ci === question.correctIndex;
              const isPicked = ci === picked;
              return (
                <button
                  key={ci}
                  onClick={() => pick(ci)}
                  disabled={revealed}
                  className={`flex items-center justify-between rounded-xl border px-5 py-4 text-left text-base font-medium transition-all ${
                    revealed && isCorrect
                      ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-200"
                      : revealed && isPicked
                        ? "border-rose-400/50 bg-rose-400/15 text-rose-200"
                        : "border-white/10 bg-white/5 text-white hover:border-rose-300/30 hover:bg-rose-400/5"
                  }`}
                >
                  <span>
                    <span className="mr-2 text-white/40">{String.fromCharCode(65 + ci)}.</span>
                    {choice}
                  </span>
                  {revealed && isCorrect && <Check size={18} />}
                  {revealed && isPicked && !isCorrect && <X size={18} />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {revealed && (
        <div className="mt-8 flex justify-center">
          {!isLast ? (
            <button
              onClick={next}
              className="rounded-full bg-rose-300 px-6 py-3 text-sm font-medium text-navy-950 transition-opacity hover:opacity-90"
            >
              Next question
            </button>
          ) : (
            <p className="font-display text-lg font-medium text-white/60">
              That was the last question—check the leaderboard below.
            </p>
          )}
        </div>
      )}

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

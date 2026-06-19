"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

  const round = data.rounds[roundIndex];

  const reveal = (ai: number) => {
    setRevealed((prev) => new Set(prev).add(ai));
  };

  const addStrike = () => {
    setStrikes((s) => Math.min(s + 1, 3));
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

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-center font-display text-2xl font-medium leading-tight text-white sm:text-4xl">
        {round.prompt}
      </p>

      <div className="mt-8 space-y-2">
        {round.answers.map((answer, ai) => (
          <button
            key={ai}
            onClick={() => reveal(ai)}
            disabled={revealed.has(ai)}
            className="block w-full text-left"
          >
            <div
              className={`flex items-center justify-between rounded-xl border px-5 py-3.5 transition-all ${
                revealed.has(ai)
                  ? "border-amber-300/30 bg-amber-400/10"
                  : "border-white/10 bg-white/5 hover:border-amber-300/30 hover:bg-amber-400/5"
              }`}
            >
              <span className="font-display text-lg font-medium text-white">
                {revealed.has(ai) ? (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {answer.text}
                  </motion.span>
                ) : (
                  <span className="text-white/20">{ai + 1}</span>
                )}
              </span>
              {revealed.has(ai) && (
                <span className="font-display text-xl font-semibold text-amber-300">
                  {answer.points}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                i < strikes
                  ? "border-rose-400/50 bg-rose-400/20 text-rose-300"
                  : "border-white/10 bg-white/5 text-white/20"
              }`}
            >
              <X size={16} />
            </span>
          ))}
          <button
            onClick={addStrike}
            className="ml-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            Add strike
          </button>
        </div>
        <p className="font-display text-lg font-medium text-white/70">
          Round total: <span className="text-amber-300">{total}</span>
        </p>
      </div>

      {roundIndex < data.rounds.length - 1 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={nextRound}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Next round
          </button>
        </div>
      )}

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

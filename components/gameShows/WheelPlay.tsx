"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";
import type { WheelPayload } from "@/lib/gameShowTypes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import TeamScoreboard, { type ScoreboardTeam } from "./TeamScoreboard";

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 },
];

const WEDGES = [100, 200, 300, 400, 500, "Lose a Turn", 250, 350, "Free Spin", 150];

export default function WheelPlay({ gameId, data }: { gameId: string; data: WheelPayload }) {
  const [teams, setTeams] = useLocalStorageState<ScoreboardTeam[]>(
    `gameshow:${gameId}:teams`,
    DEFAULT_TEAMS
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<string | number | null>(null);

  const round = data.rounds[roundIndex];
  const letters = useMemo(() => round.phrase.toUpperCase().split(""), [round.phrase]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setLanded(null);
    const wedgeIndex = Math.floor(Math.random() * WEDGES.length);
    const wedgeAngle = 360 / WEDGES.length;
    const targetRotation = rotation + 360 * 4 + (360 - wedgeIndex * wedgeAngle);
    setRotation(targetRotation);
    setTimeout(() => {
      setSpinning(false);
      setLanded(WEDGES[wedgeIndex]);
    }, 2600);
  };

  const guessLetter = (letter: string) => {
    setGuessed((prev) => new Set(prev).add(letter));
  };

  const nextRound = () => {
    setRoundIndex((i) => Math.min(i + 1, data.rounds.length - 1));
    setGuessed(new Set());
    setSolved(false);
    setLanded(null);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-purple-300">
        {round.category}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
        {letters.map((char, i) =>
          char === " " ? (
            <div key={i} className="w-4 sm:w-6" />
          ) : (
            <div
              key={i}
              className="flex h-12 w-9 items-center justify-center rounded-md border-b-4 border-purple-300/50 bg-white/5 font-display text-2xl font-semibold text-white sm:h-16 sm:w-12 sm:text-4xl"
            >
              {solved || guessed.has(char) ? char : ""}
            </div>
          )
        )}
      </div>

      {round.hint && (
        <p className="mt-4 text-sm text-white/40">
          Hint: <span className="text-white/70">{round.hint}</span>
        </p>
      )}

      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="relative h-56 w-56 sm:h-64 sm:w-64">
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 2.6, ease: [0.22, 0.61, 0.36, 1] }}
            className="h-full w-full rounded-full border-4 border-white/10"
            style={{
              background: `conic-gradient(${WEDGES.map((w, i) => {
                const colors = [
                  "#5eead4",
                  "#c4b5fd",
                  "#fcd34d",
                  "#fda4af",
                  "#f0abfc",
                ];
                const start = (i / WEDGES.length) * 360;
                const end = ((i + 1) / WEDGES.length) * 360;
                return `${colors[i % colors.length]} ${start}deg ${end}deg`;
              }).join(", ")})`,
            }}
          >
            {WEDGES.map((w, i) => {
              const angle = (i / WEDGES.length) * 360 + 360 / WEDGES.length / 2;
              return (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-navy-950 sm:text-xs"
                  style={{
                    transform: `rotate(${angle}deg) translate(0, -80px)`,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </motion.div>
          <div className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-t-[14px] border-x-transparent border-t-white" />
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="flex items-center gap-2 rounded-full bg-purple-300 px-6 py-3 text-sm font-medium text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <RotateCw size={15} className={spinning ? "animate-spin" : ""} />
          {spinning ? "Spinning..." : "Spin the wheel"}
        </button>

        {landed !== null && (
          <p className="font-display text-2xl font-semibold text-purple-200">Landed on {landed}</p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-1.5">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
          <button
            key={letter}
            onClick={() => guessLetter(letter)}
            disabled={guessed.has(letter) || solved}
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
              guessed.has(letter)
                ? "border-white/5 bg-white/[0.02] text-white/15"
                : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {!solved && (
          <button
            onClick={() => setSolved(true)}
            className="rounded-full border border-purple-300/40 bg-purple-400/10 px-5 py-2.5 text-sm font-medium text-purple-200 transition-colors hover:bg-purple-400/20"
          >
            Reveal full phrase
          </button>
        )}
        {roundIndex < data.rounds.length - 1 && (
          <button
            onClick={nextRound}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Next round
          </button>
        )}
      </div>

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}

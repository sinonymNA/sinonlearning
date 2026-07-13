"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw } from "lucide-react";
import type { WheelPayload } from "@/lib/gameShowTypes";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import TeamScoreboard, { type ScoreboardTeam } from "./TeamScoreboard";

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { name: "Team 1", score: 0 },
  { name: "Team 2", score: 0 },
];

interface Wedge {
  label: string;
  bg: string;
  text: string;
  special?: boolean;
}

const WEDGES: Wedge[] = [
  { label: "$500", bg: "#7c3aed", text: "#e9d5ff" },
  { label: "$250", bg: "#b45309", text: "#fde68a" },
  { label: "$100", bg: "#0369a1", text: "#bae6fd" },
  { label: "BANKRUPT", bg: "#111827", text: "#6b7280", special: true },
  { label: "$400", bg: "#b91c1c", text: "#fecaca" },
  { label: "FREE SPIN", bg: "#065f46", text: "#6ee7b7", special: true },
  { label: "$300", bg: "#1d4ed8", text: "#bfdbfe" },
  { label: "$150", bg: "#6d28d9", text: "#ddd6fe" },
  { label: "$350", bg: "#0f766e", text: "#99f6e4" },
  { label: "$200", bg: "#92400e", text: "#fde68a" },
  { label: "LOSE TURN", bg: "#374151", text: "#9ca3af", special: true },
  { label: "$450", bg: "#be185d", text: "#fbcfe8" },
];

function polarToXY(deg: number, r: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)];
}

function wedgePath(startDeg: number, endDeg: number, inner = 18, outer = 94): string {
  const [x1, y1] = polarToXY(startDeg, outer);
  const [x2, y2] = polarToXY(endDeg, outer);
  const [x3, y3] = polarToXY(endDeg, inner);
  const [x4, y4] = polarToXY(startDeg, inner);
  const sweep = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${outer} ${outer} 0 ${sweep} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${inner} ${inner} 0 ${sweep} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

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
  const [landed, setLanded] = useState<Wedge | null>(null);

  const round = data.rounds[roundIndex];
  const letters = useMemo(() => round.phrase.toUpperCase().split(""), [round.phrase]);
  const degPerWedge = 360 / WEDGES.length;

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setLanded(null);
    const wedgeIndex = Math.floor(Math.random() * WEDGES.length);
    const landingOffset = degPerWedge * wedgeIndex + degPerWedge / 2;
    const newRotation = rotation + 360 * 6 + (360 - landingOffset);
    setRotation(newRotation);
    setTimeout(() => {
      setSpinning(false);
      setLanded(WEDGES[wedgeIndex]);
    }, 2800);
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

  const words = letters.reduce<string[][]>((acc, ch) => {
    if (ch === " ") acc.push([]);
    else acc[acc.length - 1].push(ch);
    return acc;
  }, [[]]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 pb-4">
      {/* Category */}
      <p
        className="font-display text-sm font-black uppercase tracking-[0.25em]"
        style={{ color: "#c4b5fd", textShadow: "0 0 20px rgba(167,139,250,0.5)" }}
      >
        {round.category}
      </p>

      {/* Letter tiles */}
      <div className="flex flex-wrap justify-center gap-y-2.5 gap-x-3">
        {words.map((word, wi) => (
          <div key={wi} className="flex gap-1.5">
            {word.map((char, ci) => {
              const show = solved || guessed.has(char);
              return (
                <motion.div
                  key={`${wi}-${ci}`}
                  style={{ perspective: "600px" }}
                >
                  <motion.div
                    animate={{ rotateX: show ? 0 : 180 }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    className="relative"
                    style={{ transformStyle: "preserve-3d", width: 40, height: 52 }}
                  >
                    {/* Front (blank / dark) */}
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-md"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateX(180deg)",
                        background: "linear-gradient(180deg, #1e3a5f 0%, #172554 100%)",
                        border: "1px solid rgba(167,139,250,0.2)",
                      }}
                    />
                    {/* Back (letter revealed) */}
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-md"
                      style={{
                        backfaceVisibility: "hidden",
                        background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)",
                        border: "1px solid rgba(251,191,36,0.4)",
                        boxShadow: show ? "0 0 12px rgba(251,191,36,0.25)" : "none",
                      }}
                    >
                      <span className="font-display text-xl font-black text-amber-900">{char}</span>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {round.hint && (
        <p className="text-sm text-slate-400">
          Hint: <span className="text-slate-600">{round.hint}</span>
        </p>
      )}

      {/* Wheel + spin */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative" style={{ width: 260, height: 260 }}>
          {/* Gold outer ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #fde047 100%)",
              padding: 4,
              boxShadow: "0 0 32px rgba(253,224,71,0.4), 0 0 64px rgba(253,224,71,0.15)",
            }}
          >
            <div className="h-full w-full rounded-full overflow-hidden" style={{ background: "#0a0f1e" }}>
              <motion.svg
                viewBox="0 0 200 200"
                width="100%"
                height="100%"
                animate={{ rotate: rotation }}
                transition={{ duration: 2.8, ease: [0.25, 0.8, 0.25, 1] }}
                style={{ display: "block" }}
              >
                {WEDGES.map((wedge, i) => {
                  const startDeg = i * degPerWedge;
                  const endDeg = (i + 1) * degPerWedge;
                  const midDeg = startDeg + degPerWedge / 2;
                  const [tx, ty] = polarToXY(midDeg, 62);
                  const path = wedgePath(startDeg, endDeg);
                  return (
                    <g key={i}>
                      <path d={path} fill={wedge.bg} stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
                      <text
                        x={tx}
                        y={ty}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={wedge.text}
                        fontFamily="system-ui, sans-serif"
                        fontSize={wedge.special ? "5.5" : "7"}
                        fontWeight="800"
                        transform={`rotate(${midDeg}, ${tx}, ${ty})`}
                      >
                        {wedge.label}
                      </text>
                    </g>
                  );
                })}
                {/* Center hub */}
                <circle cx="100" cy="100" r="18" fill="#0a0f1e" stroke="rgba(253,224,71,0.3)" strokeWidth="1" />
                <circle cx="100" cy="100" r="7" fill="#fde047" />
              </motion.svg>
            </div>
          </div>

          {/* Fixed pointer at top */}
          <div
            className="absolute left-1/2 -top-1 z-10 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "20px solid #fde047",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }}
          />
        </div>

        <motion.button
          onClick={spin}
          disabled={spinning}
          whileHover={spinning ? {} : { scale: 1.06 }}
          whileTap={spinning ? {} : { scale: 0.95 }}
          className="flex items-center gap-2 rounded-full px-7 py-3.5 font-display text-sm font-black transition-all"
          style={{
            background: spinning
              ? "#f1f5f9"
              : "linear-gradient(135deg, #c4b5fd 0%, #7c3aed 100%)",
            color: spinning ? "#94a3b8" : "#1a0040",
            boxShadow: spinning ? "none" : "0 0 24px rgba(139,92,246,0.5)",
          }}
        >
          <RotateCw size={15} className={spinning ? "animate-spin" : ""} />
          {spinning ? "Spinning…" : "Spin the Wheel"}
        </motion.button>

        {/* Landed wedge result */}
        <AnimatePresence>
          {landed && !spinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="flex items-center gap-3 rounded-2xl px-6 py-3.5"
              style={{
                background: landed.bg,
                border: `1px solid ${landed.text}40`,
                boxShadow: `0 0 32px ${landed.bg}80`,
              }}
            >
              <span
                className="font-display text-2xl font-black"
                style={{ color: landed.text, textShadow: `0 0 20px ${landed.text}80` }}
              >
                {landed.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alphabet keyboard */}
      <div className="flex flex-wrap justify-center gap-1.5 px-2">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
          const used = guessed.has(letter) || solved;
          const inPhrase = letters.includes(letter);
          const correctlyGuessed = guessed.has(letter) && inPhrase;
          return (
            <motion.button
              key={letter}
              onClick={() => !used && guessLetter(letter)}
              disabled={used}
              whileHover={used ? {} : { scale: 1.1, y: -2 }}
              whileTap={used ? {} : { scale: 0.9 }}
              className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold"
              style={
                correctlyGuessed
                  ? {
                      background: "#ede9fe",
                      border: "1px solid #a78bfa",
                      color: "#6d28d9",
                    }
                  : used
                    ? {
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        color: "#cbd5e1",
                      }
                    : {
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#334155",
                      }
              }
            >
              {letter}
            </motion.button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!solved && (
          <motion.button
            onClick={() => setSolved(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all"
            style={{
              border: "1px solid #a78bfa",
              background: "#ede9fe",
              color: "#6d28d9",
            }}
          >
            Reveal full phrase
          </motion.button>
        )}
        {roundIndex < data.rounds.length - 1 && (
          <motion.button
            onClick={nextRound}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-600 transition-all"
            style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
          >
            Next round →
          </motion.button>
        )}
      </div>

      <TeamScoreboard teams={teams} onChange={setTeams} />
    </div>
  );
}
